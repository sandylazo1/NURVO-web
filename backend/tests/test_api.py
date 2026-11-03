from fastapi.testclient import TestClient
from app import main as api
from app.config import Settings
from app.db import PlateStore
from app.providers import LicensedProvider
from app.service import PlateService

def test_routes_without_provider(monkeypatch, tmp_path):
    settings = Settings(database_path=tmp_path / "api.sqlite3")
    store = PlateStore(settings.database_path)
    provider = LicensedProvider(settings)
    monkeypatch.setattr(api, "settings", settings)
    monkeypatch.setattr(api, "store", store)
    monkeypatch.setattr(api, "provider", provider)
    monkeypatch.setattr(api, "service", PlateService(store, provider, settings))
    with TestClient(api.app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["fuente_configurada"] is False
        result = client.get("/api/patente/ABCD12")
        assert result.status_code == 200
        body = result.json()
        assert body["estado_consulta"] == "sin_fuente"
        assert body["estado_robo"] == "no_verificado"
        assert body["ultima_actualizacion"] is None
        assert "propietario" not in body
        assert client.get("/api/patente/12345").status_code == 422
        sources = client.get("/api/fuentes")
        assert sources.status_code == 200
        assert "autoseguro.gob.cl" in sources.json()["consulta_robo_oficial"]
        marketplace = client.get("/api/marketplace/status")
        assert marketplace.status_code == 200
        assert marketplace.json()["enabled"] is False
        assert marketplace.json()["checkout"] == "no_disponible"
        assert client.get("/api/marketplace/products").status_code == 503
