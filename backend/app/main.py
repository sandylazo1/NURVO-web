"""NURVO FastAPI: async patent lookup, SQLite cache, safe provider integrations."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from collections import defaultdict, deque
import re
import time

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings
from .db import PlateStore
from .models import HealthResponse, PlateResponse
from .providers import LicensedProvider
from .scheduler import make_scheduler
from .service import PlateService
from .vin import decode_vin

# Only common Chilean formats; format validity does not prove a plate exists.
PLATE_PATTERN = re.compile(r"^(?:[A-Z]{4}[0-9]{2}|[A-Z]{2}[0-9]{4})$")
settings = Settings()
store = PlateStore(settings.database_path)
provider = LicensedProvider(settings)
service = PlateService(store, provider, settings)

@asynccontextmanager
async def lifespan(application: FastAPI):
    await store.initialize()
    scheduler = None
    # Run exactly one backend process with scheduler enabled to prevent duplication.
    if settings.enable_daily_refresh and provider.ready:
        scheduler = make_scheduler(service, settings)
        scheduler.start()
    try:
        yield
    finally:
        if scheduler and scheduler.running:
            scheduler.shutdown(wait=False)

app = FastAPI(
    title="NURVO API", version="1.0.0",
    description="Consulta de patente con proveedor autorizado. Sin registro oficial integrado por defecto.",
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url=None, lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware, allow_origins=list(settings.cors_origins),
    allow_credentials=False, allow_methods=["GET"], allow_headers=["Content-Type"],
)

# Basic in-memory anti-abuse limit. Use a reverse proxy / shared rate limiter at scale.
_requests: dict[str, deque[float]] = defaultdict(deque)

async def rate_limit(request: Request):
    peer = request.client.host if request.client else "anonymous"
    window = _requests[peer]
    current = time.monotonic()
    while window and window[0] < current - 3600:
        window.popleft()
    if len(window) >= 60:
        raise HTTPException(status_code=429, detail="Demasiadas consultas. Vuelve más tarde.")
    window.append(current)

@app.middleware("http")
async def browser_safety_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response

@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        fuente_configurada=provider.ready,
        ultima_actualizacion=datetime.now(timezone.utc)
    )

@app.get("/api/patente/{patente}", response_model=PlateResponse, dependencies=[Depends(rate_limit)])
async def get_plate(patente: str, background_tasks: BackgroundTasks):
    plate = re.sub(r"[^A-Z0-9]", "", patente.upper())
    if plate != patente.upper().replace("-", "").replace(" ", "") or not PLATE_PATTERN.fullmatch(plate):
        raise HTTPException(status_code=422, detail="Formato de patente no reconocido (ABCD12 o AB1234).")
    return await service.lookup(plate, background_tasks)

@app.get("/api/fuentes")
async def sources():
    return {
        "fuente_automatica_disponible": provider.ready,
        "consulta_automatica": "habilitada" if provider.ready else "sin_conexion",
        "consulta_robo_oficial": "https://www.autoseguro.gob.cl/",
        "certificado_multas": "https://www.chileatiende.gob.cl/fichas/3439",
        "aviso": "El estado no_verificado NO significa ausencia de encargo ni multas.",
        "propietario": "NURVO no consulta, almacena ni expone datos personales del propietario.",
    }

@app.get("/api/vin/{vin}", dependencies=[Depends(rate_limit)])
async def get_vin(vin: str):
    """Decode an individual 17-digit VIN using NHTSA vPIC (not Chilean registration)."""
    return await decode_vin(vin)
