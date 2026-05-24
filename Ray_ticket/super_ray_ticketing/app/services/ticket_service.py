"""
Ticket business logic — the orchestration layer between API routes
and the database / LLM / email pieces.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Sequence
from uuid import UUID
from urllib.parse import urlparse
import socket

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.enums import Department, Priority, TicketStatus
from app.core.logging import get_logger
from app.models.ticket import Ticket, TicketEvent
from app.models.user import User
from app.schemas.ticket import LLMExtraction
from app.services import llm
from app.services.email import EmailError

log = get_logger(__name__)


class TicketServiceError(Exception):
    pass


def _redis_broker_available() -> bool:
    """Check whether the configured Redis broker is reachable."""
    broker_url = settings.celery_broker
    parsed = urlparse(broker_url)
    host = parsed.hostname
    port = parsed.port or 6379
    if not host:
        return False
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False


# ---------- Users ----------

async def get_or_create_user(db: AsyncSession, email: str, full_name: str | None = None) -> User:
    email = email.strip().lower()
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if user:
        return user
    user = User(email=email, full_name=full_name)
    db.add(user)
    await db.flush()
    log.info("Auto-created user %s", email)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email.strip().lower()))
    return res.scalar_one_or_none()


# ---------- Tickets ----------

async def create_ticket_from_conversation(
    db: AsyncSession,
    *,
    user_email: str,
    initiation_query: str,
    clarifying_question: str,
    clarifying_answer: str,
) -> tuple[Ticket, bool, list[dict[str, str]]]:
    """
    The main flow.
      1. Resolve / auto-create user.
      2. Call Gemini -> LLMExtraction.
      3. Persist Ticket (status=CREATED) + first event.
      4. Enqueue Celery email tasks (non-blocking).
            5. Return (ticket, notifications_enqueued, email_previews).
    """
    user = await get_or_create_user(db, user_email)

    extraction, raw = await llm.extract_ticket(
        initiation_query=initiation_query,
        clarifying_question=clarifying_question,
        clarifying_answer=clarifying_answer,
    )

    ticket = Ticket(
        title=extraction.title.strip(),
        description=extraction.description.strip(),
        department=extraction.department,
        priority=extraction.priority,
        impact=extraction.impact.strip(),
        status=TicketStatus.CREATED,
        reporter_id=user.id,
        reporter_email=user.email,
        initiation_query=initiation_query,
        clarifying_question=clarifying_question,
        clarifying_answer=clarifying_answer,
        llm_raw_response=raw,
        sla_minutes=settings.SLA_DEFAULT_MINUTES,
    )
    db.add(ticket)
    await db.flush()

    event = TicketEvent(
        ticket_id=ticket.id,
        event_type="created",
        actor_email=user.email,
        payload={
            "department": ticket.department.value,
            "priority": ticket.priority.value,
            "title": ticket.title,
        },
    )
    db.add(event)
    await db.commit()
    await db.refresh(ticket)

    from app.services import email as email_svc

    department_subject, _, department_plain = email_svc.render_department_email(ticket)
    user_subject, _, user_plain = email_svc.render_user_ack_email(ticket)
    email_previews = [
        {
            "channel": "department",
            "recipient": settings.department_email_map()[ticket.department.value],
            "subject": department_subject,
            "plain_text": department_plain,
        },
        {
            "channel": "reporter",
            "recipient": ticket.reporter_email,
            "subject": user_subject,
            "plain_text": user_plain,
        },
    ]

    # Enqueue emails. Import lazily so this module doesn't pull Celery at import time
    # (keeps tests and worker-less runs simple).
    notifications_enqueued = False
    if not _redis_broker_available():
        log.warning("Redis broker %s is unavailable; using synchronous email fallback.", settings.celery_broker)
        try:
            from app.services import email as email_svc

            email_svc.send_department_notification(ticket)
            email_svc.send_user_acknowledgement(ticket)
            notifications_enqueued = True
            log.info("Sent creation emails synchronously (Redis fallback) for ticket %s", ticket.id)
        except EmailError as ee:
            log.error("Synchronous email fallback failed: %s", ee)
        return ticket, notifications_enqueued, email_previews

    try:
        from app.workers.tasks import send_creation_emails

        send_creation_emails.delay(str(ticket.id))
        notifications_enqueued = True
        log.info("Enqueued creation emails for ticket %s", ticket.id)
    except Exception as e:
        log.warning("Could not enqueue Celery task (worker offline?): %s", e)
        # Best-effort synchronous fallback so demos still work without Celery.
        try:
            from app.services import email as email_svc
            email_svc.send_department_notification(ticket)
            email_svc.send_user_acknowledgement(ticket)
            notifications_enqueued = True
            log.info("Sent creation emails synchronously (fallback) for ticket %s", ticket.id)
        except EmailError as ee:
            log.error("Synchronous email fallback failed: %s", ee)

    return ticket, notifications_enqueued, email_previews


async def get_ticket(db: AsyncSession, ticket_id: UUID) -> Ticket | None:
    res = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    return res.scalar_one_or_none()


async def list_tickets(
    db: AsyncSession,
    *,
    reporter_email: str | None = None,
    status: TicketStatus | None = None,
    department: Department | None = None,
    limit: int = 50,
    offset: int = 0,
) -> Sequence[Ticket]:
    stmt = select(Ticket).order_by(Ticket.created_at.desc()).limit(limit).offset(offset)
    if reporter_email:
        stmt = stmt.where(Ticket.reporter_email == reporter_email.lower())
    if status:
        stmt = stmt.where(Ticket.status == status)
    if department:
        stmt = stmt.where(Ticket.department == department)
    res = await db.execute(stmt)
    return res.scalars().all()


async def update_ticket(
    db: AsyncSession,
    ticket_id: UUID,
    *,
    status: TicketStatus | None = None,
    priority: Priority | None = None,
    department: Department | None = None,
    actor_email: str | None = None,
) -> Ticket:
    ticket = await get_ticket(db, ticket_id)
    if ticket is None:
        raise TicketServiceError(f"Ticket {ticket_id} not found")

    changes: dict[str, dict] = {}

    if status is not None and status != ticket.status:
        changes["status"] = {"from": ticket.status.value, "to": status.value}
        ticket.status = status
        if status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.now(timezone.utc)

    if priority is not None and priority != ticket.priority:
        changes["priority"] = {"from": ticket.priority.value, "to": priority.value}
        ticket.priority = priority

    if department is not None and department != ticket.department:
        changes["department"] = {"from": ticket.department.value, "to": department.value}
        ticket.department = department

    if not changes:
        return ticket  # no-op

    db.add(TicketEvent(
        ticket_id=ticket.id,
        event_type="updated",
        actor_email=actor_email,
        payload=changes,
    ))
    await db.commit()
    await db.refresh(ticket)

    # Fire-and-forget update notification
    summary_parts = [f"{k}: {v['from']} → {v['to']}" for k, v in changes.items()]
    change_summary = "Ticket updated. " + "; ".join(summary_parts)
    try:
        from app.workers.tasks import send_update_email_task
        send_update_email_task.delay(str(ticket.id), change_summary)
    except Exception as e:
        log.warning("Could not enqueue update email: %s", e)
        try:
            from app.services import email as email_svc
            email_svc.send_update_notification(ticket, change_summary)
        except EmailError as ee:
            log.error("Update email fallback failed: %s", ee)

    return ticket
