"""Individual VIN decoding via public NHTSA vPIC API. NOT a Chilean plate lookup."""
import re
from datetime import datetime, timezone
from urllib.parse import quote
import httpx
from fastapi import HTTPException

VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")

async def decode_vin(vin: str) -> dict:
    value = vin.upper().strip()
    if not VIN_PATTERN.fullmatch(value):
        raise HTTPException(status_code=422, detail="El VIN debe tener 17 caracteres válidos (sin I, O ni Q).")
    url = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/" + quote(value, safe="")
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
            r = await client.get(url, params={"format": "json"}, headers={"Accept": "application/json"})
            r.raise_for_status()
            payload = r.json()
        rows = payload.get("Results") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            raise ValueError("Respuesta VIN inesperada")
        row = rows[0]
    except (httpx.HTTPError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="No se pudo consultar el decodificador VIN público.") from exc
    make = str(row.get("Make") or "").strip() or None
    model = str(row.get("Model") or "").strip() or None
    year_text = str(row.get("ModelYear") or "").strip()
    year = int(year_text) if year_text.isdigit() and 1900 <= int(year_text) <= 2100 else None
    status = "identificado" if make and model and year else "incompleto"
    return {
        "vin": value,
        "marca": make, "modelo": model, "ano": year,
        "estado_consulta": status,
        "fuente": "NHTSA vPIC (EE.UU.)",
        "ultima_actualizacion": datetime.now(timezone.utc).isoformat(),
        "observacion": "El VIN puede no estar completamente cubierto en vehículos destinados a Chile. No indica patente, dueño, robos, multas, fallas ni compatibilidad certificada.",
    }
