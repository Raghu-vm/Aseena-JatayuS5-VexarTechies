# Ray RAG Backend

This backend mirrors the provided n8n workflow and exposes a POST endpoint at `/ray-rag-model`.

## Setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. If a browser frontend calls this API from another origin, set `FRONTEND_ORIGINS` in `.env`.
  Example:

```bash
FRONTEND_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

## Frontend connection

Point the frontend at:

```text
http://<VM_PUBLIC_IP>:8000/ray-rag-model
```

For local development, `http://localhost:8000/ray-rag-model` works.

The backend accepts request bodies that include `chatInput`, `body.chatInput`, `query.chatInput`, `text`, or `message`.

## Endpoint

`POST /ray-rag-model`

Accepts flexible input fields (`chatInput`, `body.chatInput`, `query.chatInput`, `text`, `message`) and returns:

```json
{
  "answer": "...",
  "source": "...",
  "confidence": "...",
  "sources": []
}
```
