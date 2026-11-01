"""Public API contract. No name/RUT/address/owner is processed or returned."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

class TheftStatus(str, Enum):
    unknown = "no_verificado"
    active = "encargo_vigente"
    not_reported = "sin_encargo_reportado"

class PlateRecord(BaseModel):
    patente: str
    marca: str | None = None
    modelo: str | None = None
    ano: int | None = Field(default=None, ge=1900, le=2100)
    estado_robo: TheftStatus = TheftStatus.unknown
    multas: str | None = None
    fuente: str | None = None
    ultima_actualizacion: datetime | None = None

class PlateResponse(PlateRecord):
    estado_consulta: str
    cache: str = "miss"
    mensaje: str
    enlace_autoseguro: str = "https://www.autoseguro.gob.cl/"
    enlace_multas: str = "https://www.chileatiende.gob.cl/fichas/3439"

class HealthResponse(BaseModel):
    status: str = "ok"
    fuente_configurada: bool
    ultima_actualizacion: datetime
