"""Ticket-related API routes."""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_user_email
from app.core.config import settings
from app.core.enums import Department, TicketStatus
from app.core.logging import get_logger
from app.db.session import get_db
from app.schemas.ticket import (
    ClarifyRequest,
    ClarifyResponse,
    CreateWebhookRequest,
    CreateWebhookResponse,
    TicketOut,
    TicketUpdateRequest,
)
from app.services import llm, ticket_service

router = APIRouter()
log = get_logger(__name__)


@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(payload: ClarifyRequest):
    """
    Turn 1: user submits initial query; we return ONE clarifying question.

    Stateless: frontend keeps both the user's initial query and our question,
    then sends everything together to /create-webhook.
    """
    try:
        question = await llm.generate_clarifying_question(payload.initiation_query)
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}") from e
    return ClarifyResponse(question=question, initiation_query=payload.initiation_query)


@router.post(
    "/create-webhook",
    response_model=CreateWebhookResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_webhook(
    payload: CreateWebhookRequest,
    db: AsyncSession = Depends(get_db),
    x_user_email: str | None = Header(default=None, alias="X-User-Email"),
):
    """
    Turn 2: receive both conversation turns, classify, persist, notify.

    This is the URL your frontend calls — matches your original
    http://127.0.0.1:8003/create-webhook contract.
    """
    try:
        reporter_email = payload.user_email or x_user_email or settings.DEFAULT_DEPARTMENT_EMAIL
        ticket, notified, email_previews = await ticket_service.create_ticket_from_conversation(
            db,
            user_email=reporter_email,
            initiation_query=payload.initiation_query,
            clarifying_question=payload.clarifying_question,
            clarifying_answer=payload.clarifying_answer,
        )
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}") from e

    ticket_out = TicketOut.model_validate(ticket)
    return CreateWebhookResponse(
        status="created",
        message="Ticket created successfully",
        source=payload.initiation_query,
        mail_content=email_previews[1]["plain_text"],
        data=ticket_out,
        ticket=ticket_out,
        email_previews=email_previews,
        notifications_dispatched=notified,
    )


@router.get("/tickets", response_model=List[TicketOut])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    user_email: str = Depends(require_user_email),
    mine_only: bool = Query(default=False, description="Only return tickets reported by me"),
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    department: Department | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    tickets = await ticket_service.list_tickets(
        db,
        reporter_email=user_email if mine_only else None,
        status=status_filter,
        department=department,
        limit=limit,
        offset=offset,
    )
    return [TicketOut.model_validate(t) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
async def get_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    ticket = await ticket_service.get_ticket(db, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketOut.model_validate(ticket)


@router.patch("/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: UUID,
    payload: TicketUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        ticket = await ticket_service.update_ticket(
            db,
            ticket_id,
            status=payload.status,
            priority=payload.priority,
            department=payload.department,
            actor_email=payload.actor_email,
        )
    except ticket_service.TicketServiceError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    return TicketOut.model_validate(ticket)
