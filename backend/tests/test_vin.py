import pytest
from fastapi import HTTPException
from app.vin import decode_vin, VIN_PATTERN

def test_invalid_vin_characters():
    assert VIN_PATTERN.fullmatch("1HGCM82633A004352")
    assert not VIN_PATTERN.fullmatch("ABCD12")
    assert not VIN_PATTERN.fullmatch("IIIIIIIIIIIIIIIII")

@pytest.mark.asyncio
async def test_reject_bad_vin_without_network():
    with pytest.raises(HTTPException) as err:
        await decode_vin("ABCD12")
    assert err.value.status_code == 422

@pytest.mark.asyncio
async def test_vin_decode_without_year_and_without_owner_fields(monkeypatch):
    """Mocked NHTSA response: modern VIN requires no supplied vehicle year."""
    import app.vin as vin_module
    observed = {}
    class Response:
        def raise_for_status(self):
            return None
        def json(self):
            return {"Results":[{"Make":"MARCA DE PRUEBA","Model":"MODELO DE PRUEBA","ModelYear":"2003"}]}
    class Client:
        def __init__(self, timeout, follow_redirects):
            assert follow_redirects is False
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            return None
        async def get(self,url,params,headers):
            observed["url"]=url
            observed["params"]=params
            return Response()
    monkeypatch.setattr(vin_module.httpx,"AsyncClient",Client)
    data=await decode_vin("1HGCM82633A004352")
    assert observed["url"].endswith("1HGCM82633A004352")
    assert observed["params"] == {"format":"json"}
    assert data["marca"] == "MARCA DE PRUEBA"
    assert data["estado_consulta"] == "identificado"
    assert "propietario" not in data and "rut" not in data
    assert "compatibilidad certificada" in data["observacion"]


@pytest.mark.asyncio
async def test_missing_nhtsa_fields_remain_incomplete(monkeypatch):
    """An empty result does not become verified vehicle information."""
    import app.vin as vin_module
    class Response:
        def raise_for_status(self):
            return None
        def json(self):
            return {"Results":[{"Make":"","Model":"","ModelYear":""}]}
    class Client:
        def __init__(self, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self,*args):
            return None
        async def get(self,*args,**kwargs):
            return Response()
    monkeypatch.setattr(vin_module.httpx,"AsyncClient",Client)
    data=await decode_vin("1HGCM82633A004352")
    assert data["marca"] is None
    assert data["modelo"] is None
    assert data["ano"] is None
    assert data["estado_consulta"] == "incompleto"
