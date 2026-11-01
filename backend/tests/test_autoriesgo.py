import httpx
import pytest
from app.config import Settings
from app.providers import LicensedProvider
from app.models import TheftStatus

@pytest.mark.asyncio
async def test_real_provider_response_is_mapped_without_owner(monkeypatch, tmp_path):
    settings = Settings(
        database_path=tmp_path / "data.sqlite3",
        provider_kind="autoriesgo",
        provider_token="test-secret-only",
        provider_authorized=True,
    )
    seen = []
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        assert request.headers["X-Api-Key"] == "test-secret-only"
        assert "include_owner" not in request.url.params
        return httpx.Response(200, json={
            "patente": "ABCD12",
            "found": True,
            "vehicle": {
                "make": "TOYOTA", "model": "YARIS", "year": 2018,
                "owner": {"name": "PRIVATE DO NOT STORE", "rut": "PRIVATE"},
            },
        })
    real = httpx.AsyncClient
    def intercepted(*args, **kwargs):
        return real(*args, transport=httpx.MockTransport(handler), **kwargs)
    monkeypatch.setattr(httpx, "AsyncClient", intercepted)
    record = await LicensedProvider(settings).fetch("ABCD12")
    assert record.marca == "TOYOTA"
    assert record.modelo == "YARIS"
    assert record.ano == 2018
    assert record.estado_robo == TheftStatus.unknown
    assert "owner" not in record.model_dump()
    assert "rut" not in record.model_dump()
    assert len(seen) == 1

@pytest.mark.asyncio
async def test_theft_api_never_assumes_clean_on_unknown(monkeypatch, tmp_path):
    settings = Settings(
        database_path=tmp_path / "data.sqlite3",
        provider_kind="autoriesgo", provider_token="test-secret-only",
        provider_authorized=True, verified_theft_source=True,
        autoriesgo_fetch_theft=True,
    )
    def handler(request: httpx.Request):
        if "/vehicle/" in request.url.path:
            return httpx.Response(200, json={
                "patente": "ABCD12", "found": True,
                "vehicle": {"make": "TOYOTA", "model": "YARIS", "year": 2018},
            })
        if "/stolen/" in request.url.path:
            return httpx.Response(200, json={"plate": "ABCD12", "status": "success",
                                               "data": {"status_code": "unknown"}})
        return httpx.Response(404)
    real = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient",
        lambda *a, **kw: real(*a, transport=httpx.MockTransport(handler), **kw))
    record = await LicensedProvider(settings).fetch("ABCD12")
    assert record.estado_robo == TheftStatus.unknown

def test_unlicensed_provider_disabled(tmp_path):
    settings = Settings(database_path=tmp_path / "data.sqlite3",
                        provider_kind="autoriesgo", provider_token="fake",
                        provider_authorized=False)
    assert not LicensedProvider(settings).ready
