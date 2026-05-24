"""Ticket model + audit-trail TicketEvent model."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import Department, Priority, TicketStatus
from app.db.session import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # AI-extracted fields
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[Department] = mapped_column(
        SAEnum(Department, name="department_enum", native_enum=False, length=32),
        nullable=False,
        index=True,
    )
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority_enum", native_enum=False, length=16),
        nullable=False,
        index=True,
    )
    impact: Mapped[str] = mapped_column(String(500), nullable=False)

    # Status & lifecycle
    status: Mapped[TicketStatus] = mapped_column(
        SAEnum(TicketStatus, name="ticket_status_enum", native_enum=False, length=32),
        default=TicketStatus.CREATED,
        nullable=False,
        index=True,
    )

    # Reporter
    reporter_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reporter_email: Mapped[str] = mapped_column(String(320), nullable=False)  # denormalized for fast email sends

    # Source / debugging — keep the raw conversation
    initiation_query: Mapped[str] = mapped_column(Text, nullable=False)
    clarifying_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    clarifying_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # SLA tracking
    sla_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=2880)
    sla_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    sla_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="tickets", lazy="selectin")
    events = relationship(
        "TicketEvent",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketEvent.occurred_at",
        lazy="selectin",
    )

    @property
    def sla_deadline(self) -> datetime:
        return self.created_at + timedelta(minutes=self.sla_minutes)

    @property
    def is_sla_breached_now(self) -> bool:
        if self.status == TicketStatus.RESOLVED:
            return False
        return datetime.now(timezone.utc) > self.sla_deadline

    def __repr__(self) -> str:
        return f"<Ticket {self.id} [{self.status.value}] {self.title[:30]}>"


class TicketEvent(Base):
    """Append-only audit log of every change to a ticket."""

    __tablename__ = "ticket_events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    ticket_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)  # created, status_changed, sla_breached, ...
    actor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket = relationship("Ticket", back_populates="events")
