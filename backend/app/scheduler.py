"""Daily 03:00 America/Santiago refresh; opt-in when provider access is authorized."""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from .service import PlateService
from .config import Settings

log = logging.getLogger("nurvo.scheduler")

async def refresh_all(service: PlateService, settings: Settings):
    if not service.provider.ready:
        log.info("Actualización diaria omitida: no hay fuente autorizada.")
        return
    plates = await service.store.list_plates()
    for index, plate in enumerate(plates):
        # Sequential by design. Do not hammer a third-party or government service.
        await service.refresh(plate, force=True)
        if index < len(plates) - 1:
            await asyncio.sleep(settings.scheduler_delay_seconds)
    await service.store.prune(settings.cache_retention_days)
    log.info("Refresco diario finalizado: %d registros", len(plates))

def make_scheduler(service: PlateService, settings: Settings) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="America/Santiago")
    scheduler.add_job(
        refresh_all, CronTrigger(hour=3, minute=0, timezone="America/Santiago"),
        kwargs={"service": service, "settings": settings},
        id="nurvo_refresh", replace_existing=True, max_instances=1, coalesce=True,
        misfire_grace_time=1200,
    )
    return scheduler
