"""Asynchronous SQLite cache; stores no owner identity."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import aiosqlite
from contextlib import asynccontextmanager
from .models import PlateRecord

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

class PlateStore:
    def __init__(self, path: Path):
        self.path = path

    @asynccontextmanager
    async def connect(self):
        db = await aiosqlite.connect(str(self.path), timeout=10)
        try:
            db.row_factory = aiosqlite.Row
            await db.execute("PRAGMA busy_timeout=10000")
            yield db
        finally:
            await db.close()

    async def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        async with self.connect() as db:
            await db.execute("PRAGMA journal_mode=WAL")
            await db.execute("""
                CREATE TABLE IF NOT EXISTS plates (
                    patente TEXT PRIMARY KEY,
                    marca TEXT,
                    modelo TEXT,
                    ano INTEGER,
                    estado_robo TEXT NOT NULL DEFAULT 'no_verificado',
                    multas TEXT,
                    fuente TEXT,
                    ultima_actualizacion TEXT NOT NULL
                )
            """)
            await db.execute("CREATE INDEX IF NOT EXISTS idx_plates_updated ON plates(ultima_actualizacion)")
            await db.commit()

    async def get(self, plate: str) -> PlateRecord | None:
        async with self.connect() as db:
            async with db.execute("SELECT * FROM plates WHERE patente = ?", (plate,)) as cursor:
                row = await cursor.fetchone()
        return PlateRecord.model_validate(dict(row)) if row else None

    async def upsert(self, record: PlateRecord) -> None:
        if not record.ultima_actualizacion:
            raise ValueError("No se puede almacenar un registro sin fecha verificada")
        d = record.model_dump(mode="json")
        keys = ("patente", "marca", "modelo", "ano", "estado_robo", "multas", "fuente", "ultima_actualizacion")
        values = tuple(d.get(k) for k in keys)
        async with self.connect() as db:
            await db.execute("""
                INSERT INTO plates(patente, marca, modelo, ano, estado_robo, multas, fuente, ultima_actualizacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(patente) DO UPDATE SET
                    marca=excluded.marca, modelo=excluded.modelo, ano=excluded.ano,
                    estado_robo=excluded.estado_robo, multas=excluded.multas, fuente=excluded.fuente,
                    ultima_actualizacion=excluded.ultima_actualizacion
            """, values)
            await db.commit()

    async def list_plates(self) -> list[str]:
        async with self.connect() as db:
            async with db.execute("SELECT patente FROM plates ORDER BY ultima_actualizacion ASC") as cursor:
                return [r["patente"] for r in await cursor.fetchall()]

    async def prune(self, days: int = 90) -> int:
        cutoff = (now_utc() - timedelta(days=days)).isoformat()
        async with self.connect() as db:
            cursor = await db.execute("DELETE FROM plates WHERE ultima_actualizacion < ?", (cutoff,))
            await db.commit()
            return cursor.rowcount
