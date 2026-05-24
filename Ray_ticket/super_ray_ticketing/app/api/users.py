"""User management routes (minimal, for demo seeding)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.ticket import UserCreate, UserOut
from app.services.ticket_service import get_or_create_user, get_user_by_email

router = APIRouter()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")
    user = await get_or_create_user(db, payload.email, payload.full_name)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/users/{email}", response_model=UserOut)
async def get_user(email: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)
