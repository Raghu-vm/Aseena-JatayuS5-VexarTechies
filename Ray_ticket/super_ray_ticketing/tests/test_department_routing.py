"""Department routing tests — defaults + per-department overrides."""
from app.core.config import Settings


def test_all_departments_fall_back_to_default(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("POSTGRES_DSN", "postgresql+asyncpg://u:p@h/d")
    monkeypatch.setenv("POSTGRES_SYNC_DSN", "postgresql+psycopg2://u:p@h/d")
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("SMTP_USER", "u@x.com")
    monkeypatch.setenv("SMTP_PASSWORD", "p")
    monkeypatch.setenv("SMTP_FROM", "from@x.com")
    monkeypatch.setenv("DEFAULT_DEPARTMENT_EMAIL", "demo@example.com")

    s = Settings()  # type: ignore[call-arg]
    m = s.department_email_map()
    assert set(m.keys()) == {
        "it_support",
        "human_resources",
        "finance",
        "operations",
        "sales",
        "engineering",
    }
    assert all(v == "demo@example.com" for v in m.values())


def test_per_department_override(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("POSTGRES_DSN", "postgresql+asyncpg://u:p@h/d")
    monkeypatch.setenv("POSTGRES_SYNC_DSN", "postgresql+psycopg2://u:p@h/d")
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("SMTP_USER", "u@x.com")
    monkeypatch.setenv("SMTP_PASSWORD", "p")
    monkeypatch.setenv("SMTP_FROM", "from@x.com")
    monkeypatch.setenv("DEFAULT_DEPARTMENT_EMAIL", "demo@example.com")
    monkeypatch.setenv("IT_SUPPORT_EMAIL", "it@example.com")
    monkeypatch.setenv("ENGINEERING_EMAIL", "eng@example.com")

    s = Settings()  # type: ignore[call-arg]
    m = s.department_email_map()
    assert m["it_support"] == "it@example.com"
    assert m["engineering"] == "eng@example.com"
    assert m["finance"] == "demo@example.com"  # not overridden
