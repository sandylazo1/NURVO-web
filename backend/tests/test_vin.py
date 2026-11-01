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
