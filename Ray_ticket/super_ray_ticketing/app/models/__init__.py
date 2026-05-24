"""ORM models — import here so Alembic autogenerate sees them."""
from app.models.user import User  # noqa: F401
from app.models.ticket import Ticket, TicketEvent  # noqa: F401
