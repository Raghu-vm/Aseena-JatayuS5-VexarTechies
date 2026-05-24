"""Schema validation tests."""
import pytest
from pydantic import ValidationError

from app.core.enums import Department, Priority
from app.schemas.ticket import CreateWebhookRequest, LLMExtraction


def test_llm_extraction_valid():
    e = LLMExtraction(
        title="VPN not connecting from home office",
        description="User cannot establish VPN connection from their home WiFi since this morning. Error: timeout after 30s.",
        department=Department.IT_SUPPORT,
        priority=Priority.HIGH,
        impact="User is fully blocked from accessing internal tools.",
    )
    assert e.department == Department.IT_SUPPORT


def test_llm_extraction_bad_department():
    with pytest.raises(ValidationError):
        LLMExtraction(
            title="x" * 5,
            description="x" * 20,
            department="not_a_dept",  # type: ignore[arg-type]
            priority=Priority.LOW,
            impact="impact text",
        )


def test_create_webhook_request_requires_email():
    with pytest.raises(ValidationError):
        CreateWebhookRequest(
            user_email="not-an-email",  # type: ignore[arg-type]
            initiation_query="hello there",
            clarifying_question="what's up?",
            clarifying_answer="not much",
        )


def test_create_webhook_request_accepts_legacy_frontend_payload():
    req = CreateWebhookRequest(message="i have issues with my salary", sessionId="session-seed-003")

    assert req.initiation_query == "i have issues with my salary"
    assert req.user_email is None
    assert req.clarifying_question == "Any additional context?"
    assert req.clarifying_answer == ""


def test_create_webhook_request_accepts_explicit_user_email():
    req = CreateWebhookRequest(
        user_email="test.user@example.com",
        message="my wifi is broken",
        sessionId="session-seed-003",
    )

    assert req.user_email == "test.user@example.com"
