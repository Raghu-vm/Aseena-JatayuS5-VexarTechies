"""Celery application — broker, backend, and periodic beat schedule."""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "super_ray_ticketing",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=30,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)

# Periodic SLA scan every 5 minutes
celery_app.conf.beat_schedule = {
    "scan-sla-breaches-every-5-min": {
        "task": "app.workers.tasks.scan_sla_breaches",
        "schedule": crontab(minute="*/5"),
    },
}
