"""
Gemini LLM service (google-genai SDK).

Two operations:
  1. generate_clarifying_question(query) -> str
     Returns ONE follow-up question to disambiguate the user's request.

  2. extract_ticket(initiation, clar_q, clar_a) -> LLMExtraction
     Returns strict JSON with title/description/department/priority/impact.

Uses response_mime_type=application/json on extraction; falls back to
regex-extracted JSON if the model wraps the output in markdown anyway.
"""
from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from pydantic import ValidationError

from app.core.config import settings
from app.core.enums import DEPARTMENT_VALUES, PRIORITY_VALUES
from app.core.logging import get_logger
from app.schemas.ticket import LLMExtraction

log = get_logger(__name__)


# One client per process. The SDK is thread-safe.
_client = genai.Client(api_key=settings.GEMINI_API_KEY)


CLARIFY_SYSTEM_PROMPT = """You are an AI ticketing assistant for an internal helpdesk.
A user has just opened a chat with an initial request.

Your job: ask exactly ONE concise clarifying question that will help you
correctly classify and route this ticket. The question must be:
- a single sentence ending in '?'
- specific to what the user said (do not ask generic things like "can you tell me more")
- focused on the most ambiguous or missing detail (e.g. urgency, scope, affected system, when it started)

Return ONLY the question text. No preamble, no quotes, no markdown."""


EXTRACT_SYSTEM_PROMPT = f"""You are an AI ticket classifier for an internal helpdesk.

You will be given a two-turn conversation:
  - The user's initial message
  - A clarifying question you asked
  - The user's answer

Your job is to produce a structured ticket. Output ONLY a single JSON object,
no markdown fences, no commentary. Use this exact schema:

{{
  "title": "<concise ticket title, max 80 chars, no trailing punctuation>",
  "description": "<rephrased detailed description of the issue, 2-5 sentences, factual, no speculation>",
  "department": "<one of: {', '.join(DEPARTMENT_VALUES)}>",
  "priority": "<one of: {', '.join(PRIORITY_VALUES)}>",
  "impact": "<a single sentence describing the business/user impact>"
}}

Rules:
- Do NOT hallucinate details the user did not provide.
- Keep the JSON compact: title <= 80 chars, description 1-2 sentences, impact 1 sentence.
- Prefer short, factual wording over long explanations so the response fits comfortably in one pass.
- Department must be the BEST fit among the six listed. Map:
    it_support       -> hardware, software, accounts, VPN, laptops, passwords, productivity tools
    human_resources  -> hiring, payroll questions, leave, benefits, conduct, onboarding
    finance          -> invoices, expense reports, reimbursements, budgets, vendor payments
    operations       -> facilities, office, supplies, logistics, internal processes
    sales            -> CRM, leads, customer accounts (sales-facing), quotas, pipeline
    engineering      -> product bugs, infrastructure, code/deployments, technical architecture
- Priority calibration:
    critical  -> production down, security incident, many users blocked, revenue at risk now
    high      -> single user fully blocked from core work, urgent deadline
    medium    -> user impaired but has workaround, time-sensitive but not blocking
    low       -> question, request, feature ask, minor inconvenience
- Impact must be one sentence, in present tense.
"""


class LLMError(Exception):
    """Raised when the LLM call or parsing fails."""


def _friendly_genai_error(exc: Exception) -> str:
    """Map common Gemini SDK errors to actionable messages."""
    if isinstance(exc, genai_errors.ClientError):
        try:
            payload = exc.args[1] if len(exc.args) > 1 else None
        except Exception:
            payload = None
        message = str(exc)
        if payload:
            message = f"{message} | {payload}"
        lowered = message.lower()
        if "api key expired" in lowered or "api_key_invalid" in lowered:
            return (
                "Gemini API key is expired or invalid. Replace GEMINI_API_KEY in .env with a fresh key "
                "from Google AI Studio."
            )
        return f"Gemini client error: {message}"
    return f"Gemini call failed: {exc}"


def _strip_json(text: str) -> str:
    """Remove markdown code fences and find the JSON object."""
    text = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def _extract_text(response: Any) -> str:
    """Pull plaintext out of a google-genai response, defensively."""
    text = getattr(response, "text", None)
    if text:
        return text.strip()
    # Fallback: walk candidates -> content -> parts -> text
    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        content = getattr(cand, "content", None)
        if content is None:
            continue
        parts = getattr(content, "parts", None) or []
        for part in parts:
            t = getattr(part, "text", None)
            if t:
                return t.strip()
    return ""


async def generate_clarifying_question(initiation_query: str) -> str:
    """Ask Gemini for ONE follow-up question."""
    def _call() -> str:
        resp = _client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=initiation_query[: settings.MAX_INPUT_CHARS],
            config=types.GenerateContentConfig(
                system_instruction=CLARIFY_SYSTEM_PROMPT,
                temperature=settings.GEMINI_TEMPERATURE,
                max_output_tokens=200,
            ),
        )
        text = _extract_text(resp)
        if not text:
            raise LLMError("Empty response from Gemini for clarifying question.")
        # Take only the first sentence ending in '?'
        m = re.search(r".+?\?", text, re.DOTALL)
        question = m.group(0).strip() if m else text
        return question.strip("\"' \n")

    try:
        return await asyncio.to_thread(_call)
    except LLMError:
        raise
    except genai_errors.ClientError as e:
        log.exception("Gemini clarifying-question call failed")
        raise LLMError(_friendly_genai_error(e)) from e
    except Exception as e:
        log.exception("Gemini clarifying-question call failed")
        raise LLMError(_friendly_genai_error(e)) from e


async def extract_ticket(
    initiation_query: str,
    clarifying_question: str,
    clarifying_answer: str,
) -> tuple[LLMExtraction, dict[str, Any]]:
    """Return (validated extraction, raw_json_dict)."""
    combined = (
        f"USER INITIAL MESSAGE:\n{initiation_query}\n\n"
        f"AI CLARIFYING QUESTION:\n{clarifying_question}\n\n"
        f"USER ANSWER:\n{clarifying_answer}"
    )[: settings.MAX_INPUT_CHARS * 2]

    def _call() -> tuple[LLMExtraction, dict[str, Any]]:
        resp = _client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=combined,
            config=types.GenerateContentConfig(
                system_instruction=EXTRACT_SYSTEM_PROMPT,
                temperature=settings.GEMINI_TEMPERATURE,
                max_output_tokens=1200,
                response_mime_type="application/json",
            ),
        )
        raw_text = _extract_text(resp)
        if not raw_text:
            raise LLMError("Empty response from Gemini for ticket extraction.")
        json_text = _strip_json(raw_text)
        try:
            raw_dict = json.loads(json_text)
        except json.JSONDecodeError as e:
            log.error("Gemini returned non-JSON: %s", raw_text[:500])
            raise LLMError(f"Gemini did not return valid JSON: {e}") from e
        # Normalize lowercase for enums
        for key in ("department", "priority"):
            if key in raw_dict and isinstance(raw_dict[key], str):
                raw_dict[key] = raw_dict[key].strip().lower().replace(" ", "_")
        try:
            extraction = LLMExtraction(**raw_dict)
        except ValidationError as e:
            log.error("Gemini JSON failed schema validation: %s | raw=%s", e, raw_dict)
            raise LLMError(f"Gemini output failed validation: {e}") from e
        return extraction, raw_dict

    try:
        return await asyncio.to_thread(_call)
    except LLMError:
        raise
    except genai_errors.ClientError as e:
        log.exception("Gemini extraction call failed")
        raise LLMError(_friendly_genai_error(e)) from e
    except Exception as e:
        log.exception("Gemini extraction call failed")
        raise LLMError(_friendly_genai_error(e)) from e
