"""Admin-only endpoints — manual SLA scan trigger, health utilities."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter()


@router.post("/admin/sla-scan")
def trigger_sla_scan():
    """
    Manually trigger the SLA breach scan (useful in demos or when Beat is offline).
    Falls back to running synchronously if Celery is unavailable.
    """
    try:
        from app.workers.tasks import scan_sla_breaches

        if settings.celery_broker.startswith("redis://localhost"):
            raise RuntimeError("Redis broker is not reachable locally")

        result = scan_sla_breaches.delay()
        return {"queued": True, "task_id": result.id}
    except Exception:
        # Synchronous fallback
        try:
            from app.workers.tasks import scan_sla_breaches
            result = scan_sla_breaches()
            return {"queued": False, "ran_inline": True, "result": result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SLA scan failed: {e}") from e
