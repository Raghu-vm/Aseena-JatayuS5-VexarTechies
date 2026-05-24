from __future__ import annotations

# Load environment variables FIRST, before anything else
import asyncio
import json
import math
import time
from collections import deque
from hashlib import sha256
from pathlib import Path
from dotenv import load_dotenv
import os
import logging

# Use absolute path to ensure .env is found
_app_dir = Path(__file__).parent
_project_root = _app_dir.parent
_env_file = _project_root / ".env"
load_dotenv(_env_file)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.gemini_client import GeminiChatClient, GeminiRateLimitError
from app.schemas import ChatRequest, ChatResponse

# Load and store the API key at module level
_gemini_api_key = os.getenv("GEMINI_API_KEY")
_gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
_rate_limit_per_minute = max(int(os.getenv("RATE_LIMIT_PER_MINUTE", "4")), 1)
_max_concurrent_requests = max(int(os.getenv("MAX_CONCURRENT_REQUESTS", "1")), 1)
_cache_ttl_seconds = max(int(os.getenv("CACHE_TTL_SECONDS", "120")), 0)
_cooldown_seconds = max(int(os.getenv("COOLDOWN_SECONDS", "60")), 0)
if _gemini_api_key:
    print(f"[OK] GEMINI_API_KEY loaded at app startup: {_gemini_api_key[:30]}...")
else:
    print("[WARN] GEMINI_API_KEY NOT loaded at app startup")

chat_client: GeminiChatClient | None = None
_state_lock = asyncio.Lock()
_request_windows: dict[str, deque[float]] = {}
_response_cache: dict[str, tuple[float, dict[str, object]]] = {}
_inflight_requests: dict[str, asyncio.Future[dict[str, object]]] = {}
_upstream_cooldown_until = 0.0
_request_semaphore = asyncio.Semaphore(_max_concurrent_requests)


def _request_key(session_id: str, message: str, user_id: str | None, options: object | None) -> str:
    payload = {
        "sessionId": session_id,
        "userId": user_id or "",
        "message": message,
        "options": options or {},
    }
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return sha256(raw.encode("utf-8")).hexdigest()


def _rate_limit_key(session_id: str, user_id: str | None) -> str:
    return (user_id or session_id).strip()


def _cleanup_state(now: float) -> None:
    expired_cache_keys = [key for key, (expires_at, _) in _response_cache.items() if expires_at <= now]
    for key in expired_cache_keys:
        _response_cache.pop(key, None)

    empty_windows = [key for key, timestamps in _request_windows.items() if not timestamps]
    for key in empty_windows:
        _request_windows.pop(key, None)


def _rate_limit_retry_after(timestamps: deque[float], now: float) -> int:
    oldest = timestamps[0]
    return max(1, math.ceil(60.0 - (now - oldest)))


def _build_response(reply: str, raw_payload: dict[str, object]) -> dict[str, object]:
    sources = raw_payload.get("sources") if isinstance(raw_payload, dict) else None
    confidence = raw_payload.get("confidence") if isinstance(raw_payload, dict) else None
    return {
        "reply": reply,
        "sources": sources if isinstance(sources, list) else [],
        "confidence": confidence if isinstance(confidence, (int, float)) else None,
        "raw": raw_payload,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_client
    print(f"[LIFESPAN] Initializing with API key: {_gemini_api_key[:30] if _gemini_api_key else 'NOT FOUND'}...")
    if _gemini_api_key:
        try:
            chat_client = GeminiChatClient(api_key=_gemini_api_key, model=_gemini_model)
            print(f"[LIFESPAN] Chat client initialized successfully")
        except Exception as e:
            print(f"[LIFESPAN] Error creating client: {e}")
            chat_client = None
    yield
    if chat_client:
        chat_client = None


app = FastAPI(title="Ray Search Gemini Chat", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
        return """
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ray Search Chat</title>
    <style>
        :root {
            color-scheme: dark;
            --bg: #0b1020;
            --panel: #121a31;
            --panel-2: #0f172a;
            --text: #e5eefc;
            --muted: #9fb0d0;
            --accent: #42d392;
            --accent-2: #7aa2ff;
            --border: rgba(255, 255, 255, 0.08);
            --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: Inter, Segoe UI, Arial, sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at top left, rgba(66, 211, 146, 0.14), transparent 28%),
                radial-gradient(circle at top right, rgba(122, 162, 255, 0.16), transparent 24%),
                linear-gradient(160deg, #09111f 0%, #0b1020 48%, #0f172a 100%);
            display: grid;
            place-items: center;
            padding: 24px;
        }

        .card {
            width: min(920px, 100%);
            background: rgba(18, 26, 49, 0.92);
            border: 1px solid var(--border);
            border-radius: 24px;
            box-shadow: var(--shadow);
            overflow: hidden;
            backdrop-filter: blur(12px);
        }

        header {
            padding: 28px 28px 18px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent);
        }

        h1 {
            margin: 0 0 8px;
            font-size: clamp(28px, 5vw, 42px);
            letter-spacing: -0.03em;
        }

        p {
            margin: 0;
            color: var(--muted);
            line-height: 1.6;
        }

        .content {
            display: grid;
            gap: 18px;
            grid-template-columns: 1fr;
            padding: 24px 28px 28px;
        }

        .grid {
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr;
        }

        .field {
            display: grid;
            gap: 8px;
        }

        label {
            font-size: 13px;
            font-weight: 600;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        input, textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: 16px;
            background: rgba(9, 17, 31, 0.75);
            color: var(--text);
            padding: 14px 16px;
            font: inherit;
            outline: none;
            transition: border-color 160ms ease, transform 160ms ease;
        }

        textarea {
            min-height: 160px;
            resize: vertical;
        }

        input:focus, textarea:focus {
            border-color: rgba(66, 211, 146, 0.65);
            transform: translateY(-1px);
        }

        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
        }

        button {
            border: 0;
            border-radius: 999px;
            padding: 13px 18px;
            font: inherit;
            font-weight: 700;
            color: #07111e;
            background: linear-gradient(135deg, var(--accent), #9cf4cf);
            cursor: pointer;
        }

        button.secondary {
            color: var(--text);
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
        }

        .result {
            padding: 18px;
            border-radius: 18px;
            border: 1px solid var(--border);
            background: rgba(7, 12, 24, 0.78);
            white-space: pre-wrap;
            min-height: 120px;
        }

        .status {
            font-size: 14px;
            color: var(--muted);
        }

        @media (max-width: 720px) {
            .grid { grid-template-columns: 1fr; }
            header, .content { padding-left: 18px; padding-right: 18px; }
        }
    </style>
</head>
<body>
    <main class="card">
        <header>
            <h1>Ray Search Chat</h1>
            <p>Type a message, keep the session ID, and this page will POST directly to <strong>/ray-search</strong>.</p>
        </header>

        <section class="content">
            <div class="grid">
                <div class="field">
                    <label for="sessionId">Session ID</label>
                    <input id="sessionId" value="abc123" />
                </div>
                <div class="field">
                    <label for="requestId">Request ID</label>
                    <input id="requestId" placeholder="optional" />
                </div>
            </div>

            <div class="field">
                <label for="message">Message</label>
                <textarea id="message" placeholder="Ask something...">Hello, can you help me?</textarea>
            </div>

            <div class="actions">
                <button id="sendBtn">Send to webhook</button>
        <button id="debugBtn" class="secondary" type="button">Debug echo</button>
            </div>

            <div class="result" id="result">Response will appear here.</div>
        </section>
    </main>

    <script>
        const endpoint = '/ray-search';
    const debugEndpoint = '/debug/echo';
    const sendBtn = document.getElementById('sendBtn');
    const debugBtn = document.getElementById('debugBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');

    function setStatus(message) {
      status.textContent = message;
    }

    debugBtn.addEventListener('click', async () => {
      const message = document.getElementById('message').value.trim();
      const sessionId = document.getElementById('sessionId').value.trim();
      const requestId = document.getElementById('requestId').value.trim();

      const payload = {
        message: message,
        sessionId: sessionId,
      };
      if (requestId) payload.requestId = requestId;

      setStatus('Testing debug echo...');
      result.textContent = 'Request body:\n' + JSON.stringify(payload, null, 2) + '\n\nWaiting for debug response...';

      try {
        const response = await fetch(debugEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        result.textContent = 'Debug response:\n' + JSON.stringify(data, null, 2);
        setStatus('Debug echo received.');
      } catch (error) {
        result.textContent = 'Debug Error:\n' + String(error.message || error);
        setStatus('Debug request failed.');
      }
    });
      const message = document.getElementById('message').value.trim();
      const sessionId = document.getElementById('sessionId').value.trim();
      const requestId = document.getElementById('requestId').value.trim();

      if (!message) {
        setStatus('message is required');
        result.textContent = 'Error: message field is empty.';
        return;
      }
      if (!sessionId) {
        setStatus('sessionId is required');
        result.textContent = 'Error: sessionId field is empty.';
        return;
      }

      const payload = {
        message: message,
        sessionId: sessionId,
      };
      if (requestId) payload.requestId = requestId;

      setStatus('Sending request...');
      result.textContent = 'Request body:\n' + JSON.stringify(payload, null, 2) + '\n\nWaiting for response...';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error((data && data.detail) ? JSON.stringify(data.detail, null, 2) : 'Request failed');
        }

        result.textContent = JSON.stringify(data, null, 2);
        setStatus('Reply received.');
      } catch (error) {
        result.textContent = 'Error:\n' + String(error.message || error);
            }
        });

        clearBtn.addEventListener('click', () => {
            result.textContent = 'Response will appear here.';
            setStatus('Cleared.');
        });
    </script>
</body>
</html>
"""


@app.post("/ray-search")
async def ray_search(request: Request) -> dict:
    """Handle chat requests and return Gemini responses."""
    global _upstream_cooldown_until
    logger.debug(f"Received request: {request.method} {request.url}")
    logger.debug(f"Headers: {dict(request.headers)}")
    
    # Use global chat_client or create one if needed
    client = chat_client
    if client is None and _gemini_api_key:
        try:
            logger.debug("Creating chat_client on-demand...")
            client = GeminiChatClient(api_key=_gemini_api_key, model=_gemini_model)
        except Exception as e:
            logger.error(f"Failed to create client on-demand: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize chat client: {e}") from e
    
    if client is None:
        logger.error("GEMINI_API_KEY is not configured")
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    try:
        payload = await request.json()
        logger.debug(f"Parsed JSON payload: {payload}")
    except Exception as exc:
        logger.error(f"Failed to parse JSON: {exc}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(exc)}") from exc

    # Extract required fields
    message = payload.get("message", "").strip() if isinstance(payload, dict) else ""
    session_id = payload.get("sessionId", "").strip() if isinstance(payload, dict) else ""

    logger.debug(f"Extracted message: '{message}'")
    logger.debug(f"Extracted sessionId: '{session_id}'")

    if not message:
        logger.warning("message field is missing or empty")
        raise HTTPException(status_code=400, detail="message field is required and cannot be empty")
    if not session_id:
        logger.warning("sessionId field is missing or empty")
        raise HTTPException(status_code=400, detail="sessionId field is required and cannot be empty")

    user_id = None
    if isinstance(payload, dict) and isinstance(payload.get("userId"), str):
        user_id = payload["userId"].strip() or None

    options = payload.get("options") if isinstance(payload, dict) else None
    request_key = _request_key(session_id=session_id, message=message, user_id=user_id, options=options)
    rate_limit_key = _rate_limit_key(session_id=session_id, user_id=user_id)

    future_to_wait: asyncio.Future[dict[str, object]] | None = None
    created_future = False

    async with _state_lock:
        now = time.monotonic()
        _cleanup_state(now)

        if now < _upstream_cooldown_until:
            retry_after = max(1, math.ceil(_upstream_cooldown_until - now))
            logger.warning("Upstream cooldown active for %.0fs", retry_after)
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "upstream_rate_limited",
                    "retryAfter": retry_after,
                    "message": "Gemini is temporarily rate-limited. Please retry later.",
                },
                headers={"Retry-After": str(retry_after)},
            )

        cached_entry = _response_cache.get(request_key)
        if cached_entry is not None:
            expires_at, cached_response = cached_entry
            if expires_at > now:
                logger.info("Cache hit for session=%s", session_id)
                return cached_response

        existing_future = _inflight_requests.get(request_key)
        if existing_future is not None:
            logger.info("Joining in-flight request for session=%s", session_id)
            future_to_wait = existing_future
        else:
            timestamps = _request_windows.setdefault(rate_limit_key, deque())
            while timestamps and (now - timestamps[0]) >= 60:
                timestamps.popleft()

            if len(timestamps) >= _rate_limit_per_minute:
                retry_after = _rate_limit_retry_after(timestamps, now)
                logger.warning("Local rate limit hit for key=%s", rate_limit_key)
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limited",
                        "scope": rate_limit_key,
                        "retryAfter": retry_after,
                        "limitPerMinute": _rate_limit_per_minute,
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)
            future_to_wait = asyncio.get_running_loop().create_future()
            _inflight_requests[request_key] = future_to_wait
            created_future = True

    if future_to_wait is not None and not created_future:
        return await future_to_wait

    try:
        logger.debug(f"Calling Gemini with message: {message[:50]}...")
        async with _request_semaphore:
            reply, raw_payload = await asyncio.to_thread(
                client.generate_reply,
                message,
                session_id,
                options,
            )
        logger.debug(f"Gemini reply: {reply[:100]}...")
    except GeminiRateLimitError as exc:
        retry_after = exc.retry_after or _cooldown_seconds or 60
        async with _state_lock:
            _upstream_cooldown_until = max(_upstream_cooldown_until, time.monotonic() + retry_after)
            inflight = _inflight_requests.pop(request_key, None)
            if inflight is not None and not inflight.done():
                inflight.set_exception(exc)
        logger.warning("Gemini rate limit reached: retry_after=%s", retry_after)
        raise HTTPException(
            status_code=429,
            detail={
                "error": "upstream_rate_limited",
                "retryAfter": retry_after,
                "message": "Gemini quota is exhausted right now. Please retry later.",
            },
            headers={"Retry-After": str(retry_after)},
        ) from exc
    except Exception as exc:
        logger.error(f"Gemini request failed: {exc}", exc_info=True)
        async with _state_lock:
            inflight = _inflight_requests.pop(request_key, None)
            if inflight is not None and not inflight.done():
                inflight.set_exception(exc)
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {str(exc)}") from exc

    if not reply:
        logger.error("Gemini returned empty reply")
        async with _state_lock:
            inflight = _inflight_requests.pop(request_key, None)
            if inflight is not None and not inflight.done():
                inflight.set_exception(RuntimeError("Gemini returned an empty reply"))
        raise HTTPException(status_code=502, detail="Gemini returned an empty reply")

    response_payload = _build_response(reply, raw_payload)
    async with _state_lock:
        if _cache_ttl_seconds > 0:
            _response_cache[request_key] = (time.monotonic() + _cache_ttl_seconds, response_payload)
        inflight = _inflight_requests.pop(request_key, None)
        if inflight is not None and not inflight.done():
            inflight.set_result(response_payload)

    logger.info(f"Successfully processed request for session {session_id}")
    return response_payload


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers or None)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.errors()})
