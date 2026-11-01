"""Cached lookups, stale-while-revalidate and duplicate-request protection."""
import asyncio
import logging
from datetime import timedelta
from fastapi import BackgroundTasks
from .config import Settings
from .db import PlateStore, now_utc
from .models import PlateRecord, PlateResponse
from .providers import LicensedProvider, SourceUnavailable

log = logging.getLogger("nurvo.vehicles")

class PlateService:
    def __init__(self, store: PlateStore, provider: LicensedProvider, settings: Settings):
        self.store, self.provider, self.settings = store, provider, settings
        self._locks: dict[str, asyncio.Lock] = {}
        self._pending: set[str] = set()

    def fresh(self, record: PlateRecord) -> bool:
        stamp = record.ultima_actualizacion
        if not stamp:
            return False
        return now_utc() - stamp <= timedelta(hours=self.settings.cache_ttl_hours)

    def response(self, record: PlateRecord | None, status: str, cache: str) -> PlateResponse:
        if record:
            return PlateResponse(**record.model_dump(), estado_consulta=status, cache=cache,
                                 mensaje=("Datos anteriores; actualización en curso. Verifique con fuentes oficiales."
                                          if status == "actualizando" else
                                          "Datos proporcionados por la fuente configurada; verifique su vigencia."))
        return PlateResponse(patente="", estado_consulta=status, cache=cache,
                             mensaje="No hay resultados verificables. Use los enlaces oficiales para comprobar el vehículo.")

    async def refresh(self, plate: str, force: bool = False) -> PlateRecord | None:
        lock = self._locks.setdefault(plate, asyncio.Lock())
        async with lock:
            previous = await self.store.get(plate)
            if not force and previous and self.fresh(previous):
                return previous
            if not self.provider.ready:
                return previous
            try:
                result = await self.provider.fetch(plate)
                await self.store.upsert(result)
                return result
            except SourceUnavailable as exc:
                log.warning("Fuente temporalmente no disponible para patente consultada: %s", type(exc).__name__)
                return previous
            except Exception:
                log.exception("Fallo de actualización de patente")
                return previous

    async def background_refresh(self, plate: str):
        try:
            await self.refresh(plate, force=True)
        finally:
            self._pending.discard(plate)

    async def lookup(self, plate: str, tasks: BackgroundTasks) -> PlateResponse:
        record = await self.store.get(plate)
        if record and self.fresh(record):
            return self.response(record, "actualizado", "hit")
        if record:
            if self.provider.ready and plate not in self._pending:
                self._pending.add(plate)
                tasks.add_task(self.background_refresh, plate)
            return self.response(record, "actualizando" if self.provider.ready else "sin_fuente", "stale")
        if not self.provider.ready:
            response = self.response(None, "sin_fuente", "miss")
            response.patente = plate
            return response
        refreshed = await self.refresh(plate)
        if refreshed:
            return self.response(refreshed, "actualizado", "miss")
        response = self.response(None, "fuente_no_disponible", "miss")
        response.patente = plate
        return response
