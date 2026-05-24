"""
FastAPI application entry point.

The frontend posts to http://127.0.0.1:8003/create-webhook (no /api/v1 prefix),
so we mount the tickets router both at /api/v1 AND at / for backward-compat.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api import admin, tickets, users
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.schemas.ticket import HealthResponse

configure_logging()
log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 %s v%s starting on %s:%d (env=%s)",
             settings.PROJECT_NAME, __version__, settings.HOST, settings.PORT, settings.ENV)
    yield
    log.info("👋 %s shutting down", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Generic exception handler — never leak stack traces
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": exc.__class__.__name__},
    )


# --- Routers ---
# Versioned mount (preferred for new clients)
app.include_router(tickets.router, prefix=settings.API_V1_PREFIX, tags=["tickets"])
app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["users"])
app.include_router(admin.router, prefix=settings.API_V1_PREFIX, tags=["admin"])

# Root-level alias so the existing frontend's POST /create-webhook keeps working.
app.include_router(tickets.router, tags=["tickets (root alias)"])


@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health():
    return HealthResponse(status="ok", version=__version__, env=settings.ENV)


@app.get("/", tags=["meta"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": __version__,
        "docs": "/docs",
        "webhook": "/create-webhook",
    }
