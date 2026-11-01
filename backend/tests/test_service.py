from datetime import timedelta
import pytest
from fastapi import BackgroundTasks

from app.config import Settings
from app.db import PlateStore, now_utc
from app.models import PlateRecord, TheftStatus
from app.providers import LicensedProvider, theft_status, trusted_url
from app.service import PlateService

class MockProvider:
    def __init__(self):
        self.calls = 0
        self.ready = True
    async def fetch(self, plate: str):
        self.calls += 1
        return PlateRecord(
            patente=plate, marca="Marca de prueba", modelo="Modelo de prueba",
            ano=2018, estado_robo=TheftStatus.unknown,
            fuente="Proveedor simulado SOLO en tests", ultima_actualizacion=now_utc()
        )

@pytest.mark.asyncio
async def test_first_request_then_cached(tmp_path):
    settings = Settings(database_path=tmp_path / "data.sqlite3")
    store = PlateStore(settings.database_path)
    await store.initialize()
    provider = MockProvider()
    service = PlateService(store, provider, settings)
    first = await service.lookup("ABCD12", BackgroundTasks())
    cached = await service.lookup("ABCD12", BackgroundTasks())
    assert first.estado_consulta == "actualizado"
    assert first.cache == "miss"
    assert cached.cache == "hit"
    assert provider.calls == 1
    assert first.ultima_actualizacion is not None
    assert first.estado_robo == TheftStatus.unknown
    assert "propietario" not in first.model_dump()

@pytest.mark.asyncio
async def test_stale_response_schedules_background_refresh(tmp_path):
    settings = Settings(database_path=tmp_path / "data.sqlite3")
    store = PlateStore(settings.database_path)
    await store.initialize()
    await store.upsert(PlateRecord(patente="ABCD12", marca="Vieja",
        estado_robo=TheftStatus.unknown,
        ultima_actualizacion=now_utc() - timedelta(hours=26)))
    provider = MockProvider()
    service = PlateService(store, provider, settings)
    tasks = BackgroundTasks()
    response = await service.lookup("ABCD12", tasks)
    assert response.cache == "stale"
    assert response.estado_consulta == "actualizando"
    assert response.marca == "Vieja"
    assert provider.calls == 0
    assert len(tasks.tasks) == 1
    await tasks()
    refreshed = await store.get("ABCD12")
    assert refreshed is not None
    assert refreshed.marca == "Marca de prueba"
    assert provider.calls == 1

@pytest.mark.asyncio
async def test_no_provider_is_honest(tmp_path):
    settings = Settings(database_path=tmp_path / "data.sqlite3")
    store = PlateStore(settings.database_path)
    await store.initialize()
    service = PlateService(store, LicensedProvider(settings), settings)
    result = await service.lookup("ABCD12", BackgroundTasks())
    assert result.estado_consulta == "sin_fuente"
    assert result.ultima_actualizacion is None
    assert result.estado_robo == TheftStatus.unknown

def test_theft_never_inferred_without_trusted_source():
    assert theft_status("sin_encargo_reportado", False) == TheftStatus.unknown
    assert theft_status("no se encontraron resultados", True) == TheftStatus.unknown
    assert theft_status("sin_encargo_reportado", True) == TheftStatus.not_reported
    assert theft_status("encargo_vigente", True) == TheftStatus.active
    assert trusted_url("https://proveedor.example/api/ABCD12")
    assert not trusted_url("http://proveedor.example")
    assert not trusted_url("file:///etc/passwd")
