"""Reusable FastAPI dependencies."""
from __future__ import annotations

from fastapi import Header, HTTPException, status
from pydantic import EmailStr, ValidationError, TypeAdapter


_email_adapter = TypeAdapter(EmailStr)


def require_user_email(x_user_email: str | None = Header(default=None)) -> str:
    """
    Simple-auth header check used by admin/listing routes.
    The webhook and clarify routes carry user_email in the body instead.
    """
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Email header required",
        )
    try:
        _email_adapter.validate_python(x_user_email)
    except ValidationError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Email value") from None
    return x_user_email.lower()
