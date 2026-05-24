"""
SQLAlchemy engines & session factories.

We keep BOTH an async engine (for FastAPI routes) and a sync engine
(for Celery tasks and Alembic) — sharing models via a single Base.
"""
from __future__ import annotations

from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


def _normalize_asyncpg_dsn(dsn: str) -> str:
    """Translate common Postgres SSL query params into asyncpg-compatible form."""
    parts = urlsplit(dsn)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    if query.get("sslmode") == "require":
        query.pop("sslmode", None)
        query.pop("channel_binding", None)
        query["ssl"] = "require"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""
    pass


# --- Async (FastAPI) ---
async_engine = create_async_engine(
    _normalize_asyncpg_dsn(settings.POSTGRES_DSN),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# --- Sync (Celery, Alembic) ---
sync_engine = create_engine(
    settings.POSTGRES_SYNC_DSN,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)
