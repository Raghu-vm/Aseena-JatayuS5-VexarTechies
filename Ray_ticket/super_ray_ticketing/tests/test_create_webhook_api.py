from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

from app.db.session import get_db
from app.main import app
from app.core.enums import Department, Priority, TicketStatus
from app.services import ticket_service


def test_create_webhook_uses_header_email_and_returns_data(monkeypatch):
    async def _override_db():
        yield SimpleNamespace()

    ticket_id = uuid4()
    fake_ticket = SimpleNamespace(
        id=ticket_id,
        title="Wi-Fi issue on 5th floor",
        description="Users cannot connect to Wi-Fi on the 5th floor.",
        department=Department.IT_SUPPORT,
        priority=Priority.MEDIUM,
        impact="Users are slowed down while trying to work.",
        status=TicketStatus.CREATED,
        reporter_email="test.user@example.com",
        sla_minutes=2880,
        sla_breached=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        resolved_at=None,
    )

    app.dependency_overrides[get_db] = _override_db
    monkeypatch.setattr(
        ticket_service,
        "create_ticket_from_conversation",
        AsyncMock(
            return_value=(
                fake_ticket,
                True,
                [
                    {
                        "channel": "department",
                        "recipient": "helpdesk@example.com",
                        "subject": "[MEDIUM] New Ticket #12345678 — Wi-Fi issue on 5th floor",
                        "plain_text": "NEW TICKET",
                    },
                    {
                        "channel": "reporter",
                        "recipient": "test.user@example.com",
                        "subject": "We received your ticket — #12345678",
                        "plain_text": "Hi,",
                    },
                ],
            )
        ),
    )

    with TestClient(app) as client:
        response = client.post(
            "/create-webhook",
            json={"message": "i have issues with my wifi issues in 5th floor", "sessionId": "session-seed-003"},
            headers={"X-User-Email": "test.user@example.com"},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "created"
    assert body["message"] == "Ticket created successfully"
    assert body["source"] == "i have issues with my wifi issues in 5th floor"
    assert body["mail_content"] == "Hi,"
    assert body["notifications_dispatched"] is True
    assert body["ticket"]["reporter_email"] == "test.user@example.com"
    assert body["data"]["reporter_email"] == "test.user@example.com"
    assert len(body["email_previews"]) == 2
    assert body["email_previews"][1]["recipient"] == "test.user@example.com"
