from __future__ import annotations

import math
import os
import re
from dataclasses import dataclass, field
from typing import Any

from google.genai import types


class GeminiRateLimitError(RuntimeError):
    def __init__(self, message: str, retry_after: int | None = None) -> None:
        super().__init__(message)
        self.retry_after = retry_after


def _extract_retry_after(error: Exception) -> int | None:
    error_text = str(error)

    for pattern in (
        r"retry in ([0-9]+(?:\.[0-9]+)?)s",
        r"retryDelay': '([0-9]+(?:\.[0-9]+)?)s'",
    ):
        match = re.search(pattern, error_text, re.IGNORECASE)
        if match:
            return max(1, math.ceil(float(match.group(1))))

    return None


@dataclass
class GeminiChatClient:
    api_key: str
    model: str = "gemini-flash-lite-latest"
    _client: object = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        from google import genai

        self._client = genai.Client(api_key=self.api_key)

    @classmethod
    def from_env(cls) -> GeminiChatClient:
        api_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
        print(f"[GeminiChatClient.from_env] Retrieved API_KEY: {api_key[:30] if api_key else 'NOT FOUND'}...")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        return cls(api_key=api_key, model=model)

    @staticmethod
    def _candidate_dict(candidate: Any) -> dict[str, Any]:
        if isinstance(candidate, dict):
            return candidate
        if hasattr(candidate, "model_dump"):
            dumped = candidate.model_dump()
            if isinstance(dumped, dict):
                return dumped
        return {}

    @staticmethod
    def _extract_sources(response_payload: dict[str, Any]) -> list[dict[str, Any]]:
        sources: list[dict[str, Any]] = []
        seen: set[str] = set()

        for candidate in response_payload.get("candidates") or []:
            candidate_dict = GeminiChatClient._candidate_dict(candidate)
            grounding_metadata = candidate_dict.get("grounding_metadata") or candidate_dict.get("groundingMetadata") or {}
            if not isinstance(grounding_metadata, dict):
                continue

            for chunk in grounding_metadata.get("grounding_chunks") or grounding_metadata.get("groundingChunks") or []:
                chunk_dict = chunk if isinstance(chunk, dict) else GeminiChatClient._candidate_dict(chunk)
                if not isinstance(chunk_dict, dict):
                    continue

                web = chunk_dict.get("web") or chunk_dict.get("retrieved_context") or chunk_dict.get("retrievedContext") or {}
                if not isinstance(web, dict):
                    continue

                title = (web.get("title") or "").strip()
                url = (web.get("uri") or "").strip()
                if not title and not url:
                    continue

                key = f"{title}|{url}"
                if key in seen:
                    continue
                seen.add(key)
                sources.append({"name": title or url, "url": url or None})

        return sources

    @staticmethod
    def _extract_confidence(response_payload: dict[str, Any]) -> float | None:
        scores: list[float] = []

        for candidate in response_payload.get("candidates") or []:
            candidate_dict = GeminiChatClient._candidate_dict(candidate)
            grounding_metadata = candidate_dict.get("grounding_metadata") or candidate_dict.get("groundingMetadata") or {}
            if not isinstance(grounding_metadata, dict):
                continue

            for support in grounding_metadata.get("grounding_supports") or grounding_metadata.get("groundingSupports") or []:
                support_dict = support if isinstance(support, dict) else GeminiChatClient._candidate_dict(support)
                if not isinstance(support_dict, dict):
                    continue

                for score in support_dict.get("confidence_scores") or support_dict.get("confidenceScores") or []:
                    try:
                        scores.append(float(score))
                    except (TypeError, ValueError):
                        continue

        return max(scores) if scores else None

    def generate_reply(self, message: str, session_id: str, options: dict | None = None) -> tuple[str, dict]:
        prompt_lines = [
            "You are a concise, helpful chat agent.",
            f"Session ID: {session_id}",
            f"User message: {message}",
        ]

        if options:
            prompt_lines.append(f"Options: {options}")

        try:
            tools = [types.Tool(google_search=types.GoogleSearch())]
            if hasattr(types, "UrlContext"):
                tools.append(types.Tool(url_context=types.UrlContext()))

            config = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(include_thoughts=False),
                tools=tools,
            )

            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="\n".join(prompt_lines))],
                )
            ]

            # Prefer non-streaming API to avoid JSON decoding errors from
            # the SDK's streaming parser. Fall back to streaming if
            # the non-streaming method isn't available.
            text_chunks: list[str] = []
            final_response: Any = None
            try:
                response = self._client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )
                final_response = response

                def _extract_text_from_payload(payload: dict[str, Any]) -> str:
                    candidates = payload.get("candidates") or []
                    for cand in candidates:
                        cd = GeminiChatClient._candidate_dict(cand)
                        for key in ("output", "message", "content", "text", "outputText", "response"):
                            val = cd.get(key)
                            if isinstance(val, str):
                                return val
                            if isinstance(val, dict):
                                content = val.get("content") or val.get("parts") or val.get("text")
                                if isinstance(content, str):
                                    return content
                                if isinstance(content, list):
                                    parts = []
                                    for part in content:
                                        if isinstance(part, dict):
                                            t = part.get("text") or part.get("content")
                                            if isinstance(t, str):
                                                parts.append(t)
                                        elif isinstance(part, str):
                                            parts.append(part)
                                    if parts:
                                        return "".join(parts)
                            if isinstance(val, list):
                                parts = []
                                for item in val:
                                    if isinstance(item, dict):
                                        t = item.get("text") or item.get("content")
                                        if isinstance(t, str):
                                            parts.append(t)
                                    elif isinstance(item, str):
                                        parts.append(item)
                                if parts:
                                    return "".join(parts)
                    for key in ("text", "outputText"):
                        if isinstance(payload.get(key), str):
                            return payload.get(key)
                    return ""

                payload_dict = response.model_dump() if hasattr(response, "model_dump") else {}
                if isinstance(payload_dict, dict):
                    extracted = _extract_text_from_payload(payload_dict)
                    if extracted:
                        text_chunks.append(extracted)
            except AttributeError:
                # generate_content may not exist on older/newer SDKs; fall back
                # to the streaming API which we used previously.
                for chunk in self._client.models.generate_content_stream(
                    model=self.model,
                    contents=contents,
                    config=config,
                ):
                    if chunk_text := getattr(chunk, "text", None):
                        text_chunks.append(chunk_text)
                    final_response = chunk
        except Exception as exc:
            error_text = str(exc)
            status_code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
            if status_code == 429 or "RESOURCE_EXHAUSTED" in error_text or "quota exceeded" in error_text.lower():
                raise GeminiRateLimitError(error_text, retry_after=_extract_retry_after(exc)) from exc
            raise

        reply_text = "".join(text_chunks).strip()
        raw_payload = final_response.model_dump() if hasattr(final_response, "model_dump") else {"text": reply_text}
        raw_payload = dict(raw_payload) if isinstance(raw_payload, dict) else {"text": reply_text}

        sources = self._extract_sources(raw_payload)
        if sources:
            raw_payload["sources"] = sources

        confidence = self._extract_confidence(raw_payload)
        if confidence is not None:
            raw_payload["confidence"] = confidence

        return reply_text, raw_payload
