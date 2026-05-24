"""Pydantic schemas for API I/O and LLM-extracted output."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic import model_validator

from app.core.config import settings
from app.core.enums import Department, Priority, TicketStatus


# ---------- LLM extraction shape ----------

class LLMExtraction(BaseModel):
    """Strict shape Gemini must return."""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=4000)
    department: Department
    priority: Priority
    impact: str = Field(..., min_length=3, max_length=500)


# ---------- /clarify (turn 1) ----------

class ClarifyRequest(BaseModel):
    user_email: EmailStr
    initiation_query: str = Field(..., min_length=3, max_length=4000)


class ClarifyResponse(BaseModel):
    question: str
    initiation_query: str  # echo back so frontend can pass it to webhook


# ---------- /create-webhook (turn 2: stateless, both turns in one shot) ----------

class CreateWebhookRequest(BaseModel):
    """
    Single stateless call carrying both conversation turns.

    The frontend collects:
      - user's first message (initiation_query)
      - the model's clarifying question (clarifying_question)
      - the user's answer to it (clarifying_answer)
    and POSTs all three here.
    """
    user_email: EmailStr | None = None
    initiation_query: str | None = Field(default=None, min_length=3, max_length=4000)
    message: str | None = Field(default=None, min_length=3, max_length=4000)
    clarifying_question: str | None = Field(default=None, min_length=3, max_length=1000)
    clarifying_answer: str | None = Field(default=None, min_length=1, max_length=4000)
    session_id: str | None = Field(default=None, alias="sessionId")

    @model_validator(mode="after")
    def _normalize_legacy_payload(self):
        if not self.initiation_query:
            self.initiation_query = self.message
        if not self.initiation_query:
            raise ValueError("initiation_query or message is required")
        if not self.clarifying_question:
            self.clarifying_question = "Any additional context?"
        if self.clarifying_answer is None:
            self.clarifying_answer = ""
        return self


class TicketEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_type: str
    actor_email: Optional[str] = None
    payload: Optional[dict] = None
    occurred_at: datetime


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    department: Department
    priority: Priority
    impact: str
    status: TicketStatus
    reporter_email: str
    sla_minutes: int
    sla_breached: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None


class CreateWebhookResponse(BaseModel):
    status: str = "created"
    message: str = "Ticket created successfully"
    source: str
    mail_content: str
    data: TicketOut
    ticket: TicketOut
    email_previews: list["EmailPreview"]
    notifications_dispatched: bool


class EmailPreview(BaseModel):
    channel: str
    recipient: str
    subject: str
    plain_text: str


# ---------- Ticket update ----------

class TicketUpdateRequest(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[Priority] = None
    department: Optional[Department] = None
    actor_email: Optional[EmailStr] = None  # who's making the change


# ---------- User management ----------

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime


# ---------- Health ----------

class HealthResponse(BaseModel):
    status: str
    version: str
    env: str
