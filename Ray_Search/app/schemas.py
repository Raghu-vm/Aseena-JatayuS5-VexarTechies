from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ChatOptions(BaseModel):
    topK: int | None = Field(default=None, ge=1, description="Optional retrieval depth hint")
    filter: str | None = Field(default=None, description="Optional filter hint")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, description="User message")
    sessionId: str = Field(min_length=1, description="Conversation/session identifier")
    requestId: str | None = None
    userId: str | None = None
    timestamp: datetime | None = None
    options: ChatOptions | None = None


class SourceItem(BaseModel):
    name: str
    url: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[SourceItem] = Field(default_factory=list)
    confidence: float | None = None
    raw: dict[str, object] | None = None
