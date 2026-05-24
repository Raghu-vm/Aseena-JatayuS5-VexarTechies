"""
Centralized application settings.

All env vars are validated and typed here. Everything else in the codebase
imports `settings` from this module — never reads os.environ directly.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import List

from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App ---
    ENV: str = "dev"
    PROJECT_NAME: str = "Super Ray Ticketing"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8003  # matches the frontend's webhook URL

    # --- JWT (kept for future auth expansion; not used in simple-auth mode) ---
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 43200

    # --- Database ---
    POSTGRES_DSN: str
    POSTGRES_SYNC_DSN: str
    TEST_DATABASE_URL: str | None = None

    # --- Redis / Celery ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None

    # --- Gemini ---
    GEMINI_API_KEY: str
    # NOTE: spec had "gemini-latest flash" which is invalid (space + non-existent ID).
    # Using a current valid model. Override via env if needed.
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_TEMPERATURE: float = 0.2

    # --- SMTP ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM: str  # e.g. "AI Ticketing Assistant <noreply@example.com>"

    # --- Gmail OAuth (optional, kept from .env for future use) ---
    GMAIL_CLIENT_ID: str | None = None
    GMAIL_CLIENT_SECRET: str | None = None
    GMAIL_TOKEN_ENCRYPTION_KEY: str | None = None
    GMAIL_REDIRECT_URI: str | None = None
    GMAIL_SYSTEM_REDIRECT_URI: str | None = None

    # --- CORS ---
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:8000"]
    )

    # --- Rate limits & SLA ---
    RATE_LIMIT: str = "10/minute"
    SLA_DEFAULT_MINUTES: int = 2880  # 48 hours
    MAX_INPUT_CHARS: int = 4000

    # --- Department email routing ---
    # Default: every department routes to the demo address.
    # In production, override each var individually.
    DEFAULT_DEPARTMENT_EMAIL: EmailStr = "raghunath11112004@gmail.com"
    IT_SUPPORT_EMAIL: EmailStr | None = None
    HUMAN_RESOURCES_EMAIL: EmailStr | None = None
    FINANCE_EMAIL: EmailStr | None = None
    OPERATIONS_EMAIL: EmailStr | None = None
    SALES_EMAIL: EmailStr | None = None
    ENGINEERING_EMAIL: EmailStr | None = None

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v):
        """Accept JSON list, comma-separated string, or list."""
        if v is None or v == "":
            return ["*"]
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def celery_broker(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def celery_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL

    def department_email_map(self) -> dict[str, str]:
        """Return {department_code: email} with fallbacks to DEFAULT_DEPARTMENT_EMAIL."""
        default = str(self.DEFAULT_DEPARTMENT_EMAIL)
        return {
            "it_support": str(self.IT_SUPPORT_EMAIL or default),
            "human_resources": str(self.HUMAN_RESOURCES_EMAIL or default),
            "finance": str(self.FINANCE_EMAIL or default),
            "operations": str(self.OPERATIONS_EMAIL or default),
            "sales": str(self.SALES_EMAIL or default),
            "engineering": str(self.ENGINEERING_EMAIL or default),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
