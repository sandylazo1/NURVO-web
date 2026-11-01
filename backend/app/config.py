"""Configuration read only from environment variables, never from the browser."""
from dataclasses import dataclass, field
import os
from pathlib import Path

def flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}

def csv(name: str, default: str) -> tuple[str, ...]:
    return tuple(x.strip() for x in os.getenv(name, default).split(",") if x.strip())

@dataclass(frozen=True)
class Settings:
    database_path: Path = field(default_factory=lambda: Path(os.getenv("NURVO_DATABASE_PATH", "./data/nurvo.sqlite3")))
    cors_origins: tuple[str, ...] = field(default_factory=lambda: csv("NURVO_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5500,https://sandylazo1.github.io"))
    provider_kind: str = field(default_factory=lambda: os.getenv("NURVO_PROVIDER_KIND", "disabled").lower())
    provider_url: str = field(default_factory=lambda: os.getenv("NURVO_PROVIDER_URL", "").strip())
    provider_token: str = field(default_factory=lambda: os.getenv("NURVO_PROVIDER_TOKEN", "").strip())
    provider_name: str = field(default_factory=lambda: os.getenv("NURVO_PROVIDER_NAME", "Proveedor autorizado").strip())
    provider_authorized: bool = field(default_factory=lambda: flag("NURVO_PROVIDER_AUTHORIZED"))
    verified_theft_source: bool = field(default_factory=lambda: flag("NURVO_VERIFIED_THEFT_SOURCE"))
    verified_fines_source: bool = field(default_factory=lambda: flag("NURVO_VERIFIED_FINES_SOURCE"))
    plate_input_selector: str = field(default_factory=lambda: os.getenv("NURVO_PLATE_INPUT_SELECTOR", "").strip())
    plate_submit_selector: str = field(default_factory=lambda: os.getenv("NURVO_PLATE_SUBMIT_SELECTOR", "").strip())
    plate_results_selector: str = field(default_factory=lambda: os.getenv("NURVO_PLATE_RESULTS_SELECTOR", "").strip())
    playwright_theft_selector: str = field(default_factory=lambda: os.getenv("NURVO_THEFT_RESULTS_SELECTOR", "").strip())
    playwright_make_selector: str = field(default_factory=lambda: os.getenv("NURVO_MAKE_SELECTOR", "").strip())
    playwright_model_selector: str = field(default_factory=lambda: os.getenv("NURVO_MODEL_SELECTOR", "").strip())
    playwright_year_selector: str = field(default_factory=lambda: os.getenv("NURVO_YEAR_SELECTOR", "").strip())
    allow_playwright: bool = field(default_factory=lambda: flag("NURVO_ALLOW_PLAYWRIGHT"))
    enable_daily_refresh: bool = field(default_factory=lambda: flag("NURVO_ENABLE_DAILY_REFRESH"))
    scheduler_delay_seconds: float = field(default_factory=lambda: max(5.0, float(os.getenv("NURVO_REFRESH_DELAY_SECONDS", "5"))))
    cache_ttl_hours: int = 24
    request_timeout_seconds: float = 15.0
    cache_retention_days: int = 90
    enable_docs: bool = field(default_factory=lambda: flag("NURVO_ENABLE_DOCS", True))
    allowed_hosts: tuple[str, ...] = field(default_factory=lambda: csv("NURVO_ALLOWED_HOSTS", "localhost,127.0.0.1,*.onrender.com,*.railway.app,*.fly.dev"))
    def ready(self) -> bool:
        return (self.provider_authorized and self.provider_kind in {"json_api", "playwright"} and bool(self.provider_url)
                and (self.provider_kind != "playwright" or self.allow_playwright))
