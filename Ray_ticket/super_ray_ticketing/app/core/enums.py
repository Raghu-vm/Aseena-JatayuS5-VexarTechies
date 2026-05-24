"""Domain enums — single source of truth for departments, priorities, statuses."""
from __future__ import annotations

from enum import Enum


class Department(str, Enum):
    IT_SUPPORT = "it_support"
    HUMAN_RESOURCES = "human_resources"
    FINANCE = "finance"
    OPERATIONS = "operations"
    SALES = "sales"
    ENGINEERING = "engineering"

    @property
    def display_name(self) -> str:
        return {
            "it_support": "IT Support",
            "human_resources": "Human Resources",
            "finance": "Finance",
            "operations": "Operations",
            "sales": "Sales",
            "engineering": "Engineering",
        }[self.value]


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketStatus(str, Enum):
    """
    Lifecycle: CREATED is the initial-write marker (per spec).
    NEW = unassigned/queued; OPEN = acknowledged; IN_PROGRESS = active work; RESOLVED = done.
    """
    CREATED = "created"
    NEW = "new"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

    @property
    def is_terminal(self) -> bool:
        return self == TicketStatus.RESOLVED


DEPARTMENT_VALUES = [d.value for d in Department]
PRIORITY_VALUES = [p.value for p in Priority]
STATUS_VALUES = [s.value for s in TicketStatus]
