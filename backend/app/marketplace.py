"""NURVO B2B marketplace API: authenticated tenant-scoped catalogue and quote requests.

NOT a public checkout or official vehicle compatibility service. Partner data is
supplier-declared. Keys are server-side, high-entropy tokens represented in the
environment by SHA-256 digests. The feature is disabled by default.
"""
from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import re
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit
from uuid import uuid4

import aiosqlite
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

ROLES = frozenset({"admin", "supplier", "buyer", "workshop", "fleet"})
BUYER_ROLES = frozenset({"buyer", "workshop", "fleet"})
CONDITIONS = frozenset({"genuino", "oes", "alternativo", "remanufacturado", "usado"})
CATEGORIES = frozenset({"frenos", "filtros", "motor", "transmision", "suspension", "electricidad", "neumaticos", "carroceria", "accesorios", "seguridad", "electromovilidad", "otros"})
SLUG = re.compile(r"^[a-z0-9][a-z0-9_-]{2,39}$")
SKU = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:/-]{1,63}$")
MAX_STALE_DAYS = 30


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_keys(raw: str) -> dict[str, tuple[str, str]]:
    """Fail closed for malformed access configuration. No token values in logs."""
    if not raw.strip():
        return {}
    try:
        loaded = json.loads(raw)
    except (ValueError, TypeError) as exc:
        raise ValueError("NURVO_MARKETPLACE_KEYS_JSON inválido") from exc
    if not isinstance(loaded, dict) or len(loaded) > 1000:
        raise ValueError("Configuración de claves no válida")
    result: dict[str, tuple[str, str]] = {}
    for digest, principal in loaded.items():
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise ValueError("La clave debe estar representada por su SHA-256 hexadecimal")
        if not isinstance(principal, dict):
            raise ValueError("Identidad de organización inválida")
        tenant, role = principal.get("tenant_id"), principal.get("role")
        if not isinstance(tenant, str) or not SLUG.fullmatch(tenant):
            raise ValueError("ID de organización inválido")
        if role not in ROLES:
            raise ValueError("Rol inválido")
        result[digest] = (tenant, role)
    return result


def safe_source(url: str) -> str:
    url = url.strip()
    if len(url) > 500:
        raise ValueError("Enlace de origen excesivamente largo")
    parsed = urlsplit(url)
    hostname = parsed.hostname or ""
    if (parsed.scheme != "https" or parsed.username or parsed.password
            or parsed.port not in (None, 443) or parsed.fragment
            or not hostname or hostname.lower() in {"localhost", "localhost.localdomain"}
            or hostname.endswith(".localhost") or "." not in hostname):
        raise ValueError("Se exige enlace HTTPS público sin credenciales ni fragmentos")
    try:
        ipaddress.ip_address(hostname)
    except ValueError:
        pass
    else:
        raise ValueError("No se aceptan enlaces a direcciones IP")
    if re.search(r"(?:api[_-]?key|access[_-]?token|bearer|password|secret)=", parsed.query, flags=re.I):
        raise ValueError("No se admiten secretos en enlaces de origen")
    return url


class ProductInput(BaseModel):
    sku: str = Field(min_length=2, max_length=64)
    title: str = Field(min_length=3, max_length=130)
    condition: str
    category: str = "otros"
    oem_reference: str | None = Field(default=None, max_length=70)
    brand: str | None = Field(default=None, max_length=70)
    fitment_note: str | None = Field(default=None, max_length=200)
    price_clp: int = Field(gt=0, le=1_000_000_000)
    stock_qty: int = Field(ge=0, le=1_000_000)
    source_url: str = Field(min_length=10, max_length=500)
    warranty_summary: str = Field(min_length=12, max_length=300)

    @field_validator("sku")
    @classmethod
    def valid_sku(cls, value: str) -> str:
        if not SKU.fullmatch(value):
            raise ValueError("SKU con formato inválido")
        return value

    @field_validator("condition")
    @classmethod
    def valid_condition(cls, value: str) -> str:
        if value not in CONDITIONS:
            raise ValueError("Condición no reconocida")
        return value

    @field_validator("category")
    @classmethod
    def valid_category(cls, value: str) -> str:
        if value not in CATEGORIES:
            raise ValueError("Categoría no reconocida")
        return value

    @field_validator("source_url")
    @classmethod
    def valid_source(cls, value: str) -> str:
        return safe_source(value)


class QuoteRequestInput(BaseModel):
    product_id: str = Field(min_length=36, max_length=36)
    quantity: int = Field(ge=1, le=1000)


class QuoteResponseInput(BaseModel):
    total_clp: int = Field(gt=0, le=1_000_000_000)
    valid_until: date
    warranty_summary: str = Field(min_length=12, max_length=300)

    @field_validator("valid_until")
    @classmethod
    def valid_date(cls, value: date) -> date:
        if not (date.today() <= value <= date.today() + timedelta(days=365)):
            raise ValueError("Vigencia de cotización fuera de rango")
        return value


class PublicationReview(BaseModel):
    internal_reference: str = Field(min_length=5, max_length=120)


@asynccontextmanager
async def connect(path: Path):
    db = await aiosqlite.connect(str(path), timeout=10)
    try:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys=ON")
        await db.execute("PRAGMA busy_timeout=10000")
        yield db
    finally:
        await db.close()


async def initialize_marketplace(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    async with connect(path) as db:
        await db.executescript("""
        CREATE TABLE IF NOT EXISTS marketplace_products (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            sku TEXT NOT NULL,
            title TEXT NOT NULL,
            condition TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'otros',
            oem_reference TEXT,
            brand TEXT,
            fitment_note TEXT,
            price_clp INTEGER NOT NULL,
            stock_qty INTEGER NOT NULL,
            source_url TEXT NOT NULL,
            warranty_summary TEXT NOT NULL,
            review_state TEXT NOT NULL DEFAULT 'pending',
            reviewed_at TEXT,
            reviewed_reference TEXT,
            updated_at TEXT NOT NULL,
            UNIQUE(tenant_id, sku)
        );
        CREATE INDEX IF NOT EXISTS idx_marketplace_public
            ON marketplace_products(review_state, updated_at);
        CREATE TABLE IF NOT EXISTS marketplace_quotes (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL REFERENCES marketplace_products(id),
            buyer_tenant TEXT NOT NULL,
            seller_tenant TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'requested',
            quoted_total_clp INTEGER,
            quoted_valid_until TEXT,
            warranty_summary TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_quotes_buyer ON marketplace_quotes(buyer_tenant);
        CREATE INDEX IF NOT EXISTS idx_quotes_seller ON marketplace_quotes(seller_tenant);
        CREATE TABLE IF NOT EXISTS marketplace_audit (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            object_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)
        await db.commit()


async def audit(db, tenant: str, role: str, action: str, object_id: str):
    # No tokens, VIN, name, RUT, email, IP address or customer messages.
    await db.execute(
        "INSERT INTO marketplace_audit VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid4()), tenant, role, action, object_id, utc_now())
    )


def build_marketplace_router(path: Path, enabled: bool, raw_keys: str) -> APIRouter:
    keys = load_keys(raw_keys) if enabled else {}
    router = APIRouter(prefix="/api/marketplace", tags=["Market B2B"])
    products_cols = ("id", "tenant_id", "sku", "title", "condition", "category", "oem_reference",
                     "brand", "fitment_note", "price_clp", "stock_qty", "source_url",
                     "warranty_summary", "review_state", "reviewed_at", "updated_at")

    def require_enabled():
        if not enabled or not keys:
            raise HTTPException(status_code=503, detail="Marketplace B2B deshabilitado: sin configuración autorizada")

    async def identity(x_nurvo_key: str | None = Header(default=None, alias="X-NURVO-Key")):
        require_enabled()
        if not x_nurvo_key or len(x_nurvo_key) < 32 or len(x_nurvo_key) > 512:
            raise HTTPException(status_code=401, detail="Credencial B2B requerida")
        digest = hashlib.sha256(x_nurvo_key.encode("utf-8")).hexdigest()
        for candidate, principal in keys.items():
            if hmac.compare_digest(digest, candidate):
                return principal
        raise HTTPException(status_code=401, detail="Credencial B2B inválida")

    def role_guard(principal: tuple[str, str], roles: frozenset[str]):
        if principal[1] not in roles:
            raise HTTPException(status_code=403, detail="Operación no autorizada para este rol")

    @router.get("/status")
    async def status():
        return {
            "enabled": enabled and bool(keys),
            "backend_required": True,
            "pages_hosts_api": False,
            "official_vehicle_records_connected": False,
            "product_claims": "declarados_por_proveedor_no_certificados",
            "checkout": "no_disponible",
            "message": "Catálogo B2B solo bajo acuerdo y credenciales servidor-servidor. "
                       "GitHub Pages no ejecuta FastAPI.",
        }

    @router.post("/products", status_code=201)
    async def upsert_product(payload: ProductInput, principal=Depends(identity)):
        role_guard(principal, frozenset({"supplier"}))
        tenant, role = principal
        now = utc_now()
        async with connect(path) as db:
            await db.execute("""
            INSERT INTO marketplace_products
              (id,tenant_id,sku,title,condition,category,oem_reference,brand,fitment_note,
               price_clp,stock_qty,source_url,warranty_summary,review_state,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)
            ON CONFLICT(tenant_id,sku) DO UPDATE SET
              title=excluded.title,condition=excluded.condition,category=excluded.category,
              oem_reference=excluded.oem_reference,brand=excluded.brand,
              fitment_note=excluded.fitment_note,price_clp=excluded.price_clp,
              stock_qty=excluded.stock_qty,source_url=excluded.source_url,
              warranty_summary=excluded.warranty_summary,
              review_state='pending',reviewed_at=NULL,reviewed_reference=NULL,
              updated_at=excluded.updated_at
            """, (str(uuid4()),tenant,payload.sku,payload.title,payload.condition,payload.category,
                  payload.oem_reference,payload.brand,payload.fitment_note,
                  payload.price_clp,payload.stock_qty,payload.source_url,
                  payload.warranty_summary,now))
            async with db.execute(
                "SELECT id FROM marketplace_products WHERE tenant_id=? AND sku=?",
                (tenant,payload.sku)) as cur:
                row = await cur.fetchone()
            await audit(db,tenant,role,"product_submitted",row["id"])
            await db.commit()
        return {"id":row["id"],"review_state":"pending",
                "message":"Declaración del proveedor recibida para revisión. No certifica origen, stock o compatibilidad."}

    @router.get("/products")
    async def public_products(
        condition: str | None = None,
        category: str | None = None,
        limit: int = Query(25, ge=1, le=50),
        offset: int = Query(0, ge=0, le=5000)
    ):
        require_enabled()
        if condition is not None and condition not in CONDITIONS:
            raise HTTPException(status_code=422, detail="Condición no reconocida")
        if category is not None and category not in CATEGORIES:
            raise HTTPException(status_code=422, detail="Categoría no reconocida")
        floor = (datetime.now(timezone.utc)-timedelta(days=MAX_STALE_DAYS)).isoformat()
        clauses = "review_state='published' AND updated_at>=?"
        args: list = [floor]
        if condition:
            clauses += " AND condition=?"
            args.append(condition)
        if category:
            clauses += " AND category=?"
            args.append(category)
        args.extend([limit,offset])
        async with connect(path) as db:
            async with db.execute(
                "SELECT "+",".join(products_cols)+" FROM marketplace_products WHERE "+clauses+
                " ORDER BY updated_at DESC,id LIMIT ? OFFSET ?",tuple(args)) as cur:
                rows=[dict(x) for x in await cur.fetchall()]
        for r in rows:
            r["origin_status"]="declarado_por_proveedor_sin_certificacion_fabricante"
            r["availability_status"]="stock_declarado_no_reservado"
            r["fitment_status"]="pendiente_de_verificacion_tecnica"
        return {"results":rows,"count":len(rows),"information_only":True,
                "message":"Publicación revisada internamente; datos declarados por proveedor, sujetos a actualización. Sin compra en línea."}

    @router.get("/my/products")
    async def own_products(principal=Depends(identity)):
        role_guard(principal,frozenset({"supplier"}))
        async with connect(path) as db:
            async with db.execute(
                "SELECT "+",".join(products_cols)+" FROM marketplace_products WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 100",
                (principal[0],)) as cur:
                rows=[dict(x) for x in await cur.fetchall()]
        return {"results":rows}

    @router.post("/products/{product_id}/publish")
    async def publish(product_id: str, review: PublicationReview, principal=Depends(identity)):
        role_guard(principal,frozenset({"admin"}))
        try:
            from uuid import UUID
            UUID(product_id)
        except ValueError as exc:
            raise HTTPException(422,detail="Identificador de producto inválido") from exc
        now=utc_now()
        async with connect(path) as db:
            cur=await db.execute("""
            UPDATE marketplace_products
              SET review_state='published', reviewed_at=?, reviewed_reference=?
              WHERE id=? AND review_state='pending'
            """,(now,review.internal_reference,product_id))
            if cur.rowcount!=1:
                raise HTTPException(404,detail="Producto pendiente no encontrado")
            await audit(db,principal[0],principal[1],"product_published",product_id)
            await db.commit()
        return {"id":product_id,"review_state":"published",
                "warning":"Revisión interna de publicación; no certifica originalidad, compatibilidad, stock ni garantía del fabricante."}

    @router.post("/quotes",status_code=201)
    async def create_quote_request(payload: QuoteRequestInput,principal=Depends(identity)):
        role_guard(principal,BUYER_ROLES)
        try:
            from uuid import UUID
            UUID(payload.product_id)
        except ValueError as exc:
            raise HTTPException(422,detail="Identificador de producto inválido") from exc
        floor=(datetime.now(timezone.utc)-timedelta(days=MAX_STALE_DAYS)).isoformat()
        async with connect(path) as db:
            async with db.execute(
                "SELECT tenant_id FROM marketplace_products WHERE id=? AND review_state='published' AND updated_at>=?",
                (payload.product_id,floor)) as cur:
                row=await cur.fetchone()
            if row is None:
                raise HTTPException(404,detail="Producto no disponible para solicitud")
            seller=row["tenant_id"]
            if seller==principal[0]:
                raise HTTPException(403,detail="No se puede cotizar un producto propio")
            quote_id=str(uuid4())
            now=utc_now()
            await db.execute("""
            INSERT INTO marketplace_quotes
              (id,product_id,buyer_tenant,seller_tenant,quantity,status,created_at,updated_at)
              VALUES (?,?,?,?,?,'requested',?,?)
            """,(quote_id,payload.product_id,principal[0],seller,payload.quantity,now,now))
            await audit(db,principal[0],principal[1],"quote_requested",quote_id)
            await db.commit()
        return {"id":quote_id,"status":"requested","message":"Solicitud B2B recibida. No constituye venta, reserva ni pago."}

    @router.get("/quotes")
    async def list_quotes(principal=Depends(identity)):
        role_guard(principal,BUYER_ROLES|frozenset({"supplier"}))
        side="seller_tenant" if principal[1]=="supplier" else "buyer_tenant"
        async with connect(path) as db:
            async with db.execute(
                "SELECT id,product_id,buyer_tenant,seller_tenant,quantity,status,quoted_total_clp,"
                "quoted_valid_until,warranty_summary,created_at,updated_at FROM marketplace_quotes WHERE "+
                side+"=? ORDER BY created_at DESC LIMIT 100",(principal[0],)
            ) as cur:
                rows=[dict(x) for x in await cur.fetchall()]
        return {"results":rows}

    @router.post("/quotes/{quote_id}/respond")
    async def respond_quote(quote_id: str,payload: QuoteResponseInput,principal=Depends(identity)):
        role_guard(principal,frozenset({"supplier"}))
        async with connect(path) as db:
            cur=await db.execute("""
            UPDATE marketplace_quotes SET status='quoted',quoted_total_clp=?,
              quoted_valid_until=?,warranty_summary=?,updated_at=?
            WHERE id=? AND seller_tenant=? AND status='requested'
            """,(payload.total_clp,payload.valid_until.isoformat(),payload.warranty_summary,
                 utc_now(),quote_id,principal[0]))
            if cur.rowcount!=1:
                raise HTTPException(404,detail="Solicitud pendiente no encontrada para el proveedor")
            await audit(db,principal[0],principal[1],"quote_responded",quote_id)
            await db.commit()
        return {"id":quote_id,"status":"quoted","message":"Importe declarado por proveedor. Sin aceptación, facturación ni pago."}

    @router.get("/metrics")
    async def operational_metrics(principal=Depends(identity)):
        """Only administrative aggregate counts, never personal or contract data."""
        role_guard(principal,frozenset({"admin"}))
        async with connect(path) as db:
            async with db.execute(
                "SELECT review_state, COUNT(*) AS amount FROM marketplace_products GROUP BY review_state"
            ) as cur:
                product_counts={row["review_state"]:row["amount"] for row in await cur.fetchall()}
            async with db.execute(
                "SELECT status, COUNT(*) AS amount FROM marketplace_quotes GROUP BY status"
            ) as cur:
                quote_counts={row["status"]:row["amount"] for row in await cur.fetchall()}
        return {
            "products_pending":product_counts.get("pending",0),
            "products_published":product_counts.get("published",0),
            "quotes_requested":quote_counts.get("requested",0),
            "quotes_responded":quote_counts.get("quoted",0),
            "source":"local_database_operations",
            "not_sales_or_paid_orders":True,
        }

    return router
