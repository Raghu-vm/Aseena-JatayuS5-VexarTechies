"""
Seed the database with a demo user.

Usage:
    python -m scripts.seed_users
"""
from __future__ import annotations

import asyncio

from app.db.session import AsyncSessionLocal
from app.services.ticket_service import get_or_create_user


DEMO_USERS = [
    ("raghunath11112004@gmail.com", "Raghunath (Demo)"),
    ("test.user@example.com", "Test User"),
]


async def main() -> None:
    async with AsyncSessionLocal() as session:
        for email, name in DEMO_USERS:
            user = await get_or_create_user(session, email, name)
            print(f"  ✓ {user.email} ({user.id})")
        await session.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
