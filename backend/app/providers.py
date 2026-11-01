"""Licensed API / opt-in Playwright adapters. Never infer 'clean' from missing data."""
from datetime import datetime, timezone
from urllib.parse import urlsplit
import httpx
from .config import Settings
from .models import PlateRecord, TheftStatus

class SourceUnavailable(Exception):
    """Source could not be verified (timeout, CAPTCHA, changed DOM, non-200 response)."""

def trusted_url(url: str) -> bool:
    split = urlsplit(url)
    return split.scheme == "https" and bool(split.netloc) and not split.username and not split.password

def text_value(value, limit: int = 80) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value[:limit] if value else None

def theft_status(raw, trusted: bool) -> TheftStatus:
    if not trusted:
        return TheftStatus.unknown
    normalized = str(raw or "").strip().lower().replace(" ", "_")
    if normalized in {"encargo_vigente", "vigente", "active"}:
        return TheftStatus.active
    if normalized in {"sin_encargo_reportado", "sin_encargo_vigente", "not_reported"}:
        return TheftStatus.not_reported
    return TheftStatus.unknown

class LicensedProvider:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def ready(self) -> bool:
        return self.settings.ready() and trusted_url(self.settings.provider_url.replace("{patente}", "ABCD12"))

    async def fetch(self, plate: str) -> PlateRecord:
        if not self.ready:
            raise SourceUnavailable("Fuente no configurada o autorización no confirmada")
        if self.settings.provider_kind == "json_api":
            values = await self._json_api(plate)
        elif self.settings.provider_kind == "playwright":
            values = await self._playwright(plate)
        else:
            raise SourceUnavailable("Proveedor deshabilitado")
        if not any(values.get(k) for k in ("marca", "make", "modelo", "model", "ano", "year")) and not values.get("estado_robo") and not values.get("multas"):
            raise SourceUnavailable("Fuente sin datos estructurales verificables")
        # Never persist or expose owner/RUT/address even if source supplies these.
        raw_year = values.get("ano", values.get("year"))
        try:
            year = int(raw_year)
            if not (1900 <= year <= datetime.now(timezone.utc).year + 1):
                year = None
        except (ValueError, TypeError):
            year = None
        return PlateRecord(
            patente=plate, marca=text_value(values.get("marca", values.get("make"))),
            modelo=text_value(values.get("modelo", values.get("model"))), ano=year,
            estado_robo=theft_status(values.get("estado_robo"), self.settings.verified_theft_source),
            multas=text_value(values.get("multas"), 100) if self.settings.verified_fines_source else None,
            fuente=self.settings.provider_name,
            ultima_actualizacion=datetime.now(timezone.utc),
        )

    async def _json_api(self, plate: str) -> dict:
        url = self.settings.provider_url.replace("{patente}", plate)
        headers = {"Accept": "application/json", "User-Agent": "NURVO/1.0 authorized-client"}
        if self.settings.provider_token:
            headers["Authorization"] = "Bearer " + self.settings.provider_token
        try:
            async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds,
                                         follow_redirects=False, verify=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            if not isinstance(data, dict):
                raise SourceUnavailable("Respuesta JSON inesperada")
            if "vehicle" in data and isinstance(data["vehicle"], dict):
                data = data["vehicle"]
            if data.get("patente") and "".join(c for c in str(data["patente"]).upper() if c.isalnum()) != plate:
                raise SourceUnavailable("La fuente respondió con otra patente")
            return data
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            raise SourceUnavailable("Proveedor JSON inaccesible o respuesta inválida") from exc

    async def _playwright(self, plate: str) -> dict:
        s = self.settings
        if not s.allow_playwright or not all((s.plate_input_selector, s.plate_submit_selector, s.plate_results_selector)):
            raise SourceUnavailable("Faltan selectores autorizados del proveedor Playwright")
        try:
            from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError, Error as PlaywrightError
        except ImportError as exc:
            raise SourceUnavailable("Instale el extra de Playwright para usar este adaptador") from exc
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                try:
                    page = await browser.new_page()
                    await page.goto(s.provider_url.replace("{patente}", plate),
                                    wait_until="domcontentloaded", timeout=15000)
                    # No CAPTCHA solving, bypass, login automation, or stealth measures.
                    await page.locator(s.plate_input_selector).first.fill(plate, timeout=10000)
                    await page.locator(s.plate_submit_selector).first.click(timeout=10000)
                    await page.locator(s.plate_results_selector).first.wait_for(state="visible", timeout=15000)
                    async def extract(selector: str) -> str | None:
                        if not selector:
                            return None
                        return text_value(await page.locator(selector).first.inner_text(timeout=3000))
                    raw = await extract(s.playwright_theft_selector)
                    # Only exact, unambiguous text from a licensed authoritative result can mark a car.
                    status = "no_verificado"
                    if raw:
                        text = " ".join(raw.lower().split())
                        if text in {"encargo vigente", "vehículo con encargo vigente", "vehiculo con encargo vigente"}:
                            status = "encargo_vigente"
                        elif text in {"sin encargo vigente", "no registra encargo vigente", "sin encargo por robo"}:
                            status = "sin_encargo_reportado"
                    return {"marca": await extract(s.playwright_make_selector),
                            "modelo": await extract(s.playwright_model_selector),
                            "ano": await extract(s.playwright_year_selector),
                            "estado_robo": status}
                finally:
                    await browser.close()
        except (PlaywrightTimeoutError, PlaywrightError, OSError) as exc:
            raise SourceUnavailable("Error del navegador, DOM o servicio remoto") from exc
