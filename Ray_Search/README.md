# Ray Search Gemini Webhook

Minimal FastAPI webhook server with a built-in browser UI.

This build adds local protection for free-tier usage and always enables Google Search grounding on Gemini requests:

- per-session rate limiting
- in-flight request deduplication
- short-lived response caching
- cooldown handling when Gemini returns 429 RESOURCE_EXHAUSTED
- grounded responses with sources and confidence where the model provides them

If your installed `google-genai` version exposes `UrlContext`, the client will include it automatically; otherwise Google Search grounding still works on its own.

The default model is `gemini-flash-lite-latest`, but it can be changed with `GEMINI_MODEL`.

## Endpoint

Open the browser UI at:

`http://127.0.0.1:8001/`

The UI sends requests to:

`POST http://127.0.0.1:8001/ray-search`

### Request

```json
{
  "message": "How do I reset my password?",
  "sessionId": "abc123",
  "requestId": "req-1",
  "userId": "user-42",
  "timestamp": "2026-05-19T12:00:00Z",
  "options": {
    "topK": 5,
    "filter": "support"
  }
}
```

### Response

```json
{
  "reply": "...",
  "sources": [
    {
      "name": "Example Source",
      "url": "https://example.com"
    }
  ],
  "confidence": 0.87,
  "raw": {
    "...": "..."
  }
}
```

### Rate limiting

The webhook now returns HTTP 429 in two cases:

- local throttling, when the same session/user sends too many requests per minute
- upstream throttling, when Gemini returns RESOURCE_EXHAUSTED

When that happens, the response includes a `Retry-After` header and a JSON body with `retryAfter`.

Default environment settings:

```powershell
GEMINI_MODEL=gemini-flash-lite-latest
RATE_LIMIT_PER_MINUTE=4
MAX_CONCURRENT_REQUESTS=1
CACHE_TTL_SECONDS=120
COOLDOWN_SECONDS=60
```

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set your Gemini API key:

```powershell
$env:GEMINI_API_KEY="your-key"
```

Optional tuning:

```powershell
$env:GEMINI_MODEL="gemini-flash-lite-latest"
$env:RATE_LIMIT_PER_MINUTE="4"
$env:MAX_CONCURRENT_REQUESTS="1"
$env:CACHE_TTL_SECONDS="120"
$env:COOLDOWN_SECONDS="60"
```

3. Run the server:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

4. Open `http://127.0.0.1:8001/` in your browser and send a message from the form.

If you keep hitting upstream 429 responses, the app will pause outgoing Gemini calls for the configured cooldown window instead of hammering the API repeatedly.

## Example request

```bash
curl -X POST http://127.0.0.1:8001/ray-search ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Hello\",\"sessionId\":\"abc123\"}"
```
