"""
Celery tasks.

NOTE: tasks use the SYNC SQLAlchemy session (SyncSessionLocal) — Celery's
default worker pool is prefork and runs blocking code. Don't try to run
async sessions inside tasks; it's a mess.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from app.core.enums import TicketStatus
from app.core.logging import get_logger
from app.db.session import SyncSessionLocal
from app.models.ticket import Ticket, TicketEvent
from app.services import email as email_svc
from app.workers.celery_app import celery_app

log = get_logger(__name__)


def _load_ticket_sync(session, ticket_id_str: str) -> Ticket | None:
    return session.execute(
        select(Ticket).where(Ticket.id == UUID(ticket_id_str))
    ).scalar_one_or_none()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_creation_emails(self, ticket_id: str) -> dict:
    """Send both the department-routing email and the user acknowledgement."""
    with SyncSessionLocal() as session:
        ticket = _load_ticket_sync(session, ticket_id)
        if ticket is None:
            log.warning("send_creation_emails: ticket %s not found", ticket_id)
            return {"ok": False, "reason": "ticket_not_found"}
        try:
            email_svc.send_department_notification(ticket)
            email_svc.send_user_acknowledgement(ticket)
            session.add(TicketEvent(
                ticket_id=ticket.id,
                event_type="notifications_sent",
                actor_email=None,
                payload={"channels": ["department", "user_ack"]},
            ))
            session.commit()
            return {"ok": True, "ticket_id": ticket_id}
        except Exception as e:
            log.exception("send_creation_emails failed")
            raise self.retry(exc=e)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_update_email_task(self, ticket_id: str, change_summary: str) -> dict:
    with SyncSessionLocal() as session:
        ticket = _load_ticket_sync(session, ticket_id)
        if ticket is None:
            log.warning("send_update_email_task: ticket %s not found", ticket_id)
            return {"ok": False, "reason": "ticket_not_found"}
        try:
            email_svc.send_update_notification(ticket, change_summary)
            return {"ok": True, "ticket_id": ticket_id}
        except Exception as e:
            log.exception("send_update_email_task failed")
            raise self.retry(exc=e)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=120)
def send_sla_breach_email_task(self, ticket_id: str) -> dict:
    with SyncSessionLocal() as session:
        ticket = _load_ticket_sync(session, ticket_id)
        if ticket is None:
            return {"ok": False, "reason": "ticket_not_found"}
        try:
            email_svc.send_sla_breach_notification(ticket)
            ticket.sla_breached = True
            ticket.sla_notified_at = datetime.now(timezone.utc)
            session.add(TicketEvent(
                ticket_id=ticket.id,
                event_type="sla_breached",
                actor_email=None,
                payload={"deadline": ticket.sla_deadline.isoformat()},
            ))
            session.commit()
            return {"ok": True, "ticket_id": ticket_id}
        except Exception as e:
            log.exception("send_sla_breach_email_task failed")
            raise self.retry(exc=e)


@celery_app.task
def scan_sla_breaches() -> dict:
    """
    Periodic: find unresolved tickets past their SLA deadline that
    haven't been notified yet, and enqueue breach emails.
    """
    now = datetime.now(timezone.utc)
    count = 0
    with SyncSessionLocal() as session:
        # Pull all unresolved & not-yet-notified
        rows = session.execute(
            select(Ticket).where(
                Ticket.status != TicketStatus.RESOLVED,
                Ticket.sla_breached.is_(False),
            )
        ).scalars().all()

        for ticket in rows:
            if now > ticket.sla_deadline:
                send_sla_breach_email_task.delay(str(ticket.id))
                count += 1
    log.info("SLA scan: enqueued %d breach notifications", count)
    return {"enqueued": count, "scanned_at": now.isoformat()}
