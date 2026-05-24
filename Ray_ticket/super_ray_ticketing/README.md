# Super Ray Ticketing

AI-powered internal ticketing system. The user types a free-form problem, the model asks **one** clarifying question, and the answer plus the original message are sent together to produce a structured ticket (title, description, department, priority, impact), persisted to Postgres, and notified by email.

## Architecture

```
Frontend (existing)
      │
      │ POST /clarify          ──► Gemini ──► single follow-up question
      │ POST /create-webhook   ──► Gemini ──► structured ticket JSON
      ▼
FastAPI (port 8003)
      │
      ├── Postgres (Neon)              ── tickets, ticket_events, users
      └── Redis ──► Celery Worker      ── send_creation_emails, send_update_email_task,
                                          send_sla_breach_email_task
              └── Celery Beat          ── scan_sla_breaches (every 5 min)
                                          ▼
                                       SMTP (Gmail) ──► department + reporter
```

**Stack:** FastAPI · SQLAlchemy 2 (async) · Alembic · Celery + Redis · Google Generative AI (Gemini 2.0 Flash) · Postgres (Neon) · SMTP

---

## Quick start (local dev)

### 1. Prerequisites
- Python 3.11+
- Redis (`brew install redis && brew services start redis`, or Docker, or `apt install redis-server`)
- A Postgres database (Neon is fine — your existing DSN already works)
- A Gemini API key and Gmail SMTP App Password

### 2. Setup

```bash
git clone <this repo>
cd super_ray_ticketing

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements-dev.txt

cp .env.example .env
# Open .env and fill in: POSTGRES_DSN, POSTGRES_SYNC_DSN, GEMINI_API_KEY,
# SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SECRET_KEY.
```

### 3. Migrate + seed

```bash
alembic upgrade head
python -m scripts.seed_users
```

### 4. Run all three processes (3 terminals)

```bash
# Terminal 1 — API
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 2 — Celery worker
celery -A app.workers.celery_app.celery_app worker --loglevel=info --concurrency=4

# Terminal 3 — Celery beat (the SLA scanner)
celery -A app.workers.celery_app.celery_app beat --loglevel=info
```

Or use the Makefile: `make dev`, `make worker`, `make beat`.

Or just `docker-compose up --build` and skip the venv dance.

### 5. Smoke test

```bash
# Get a clarifying question
curl -X POST http://localhost:8003/clarify \
  -H 'Content-Type: application/json' \
  -d '{"user_email":"test.user@example.com","initiation_query":"my laptop wont connect to the wifi"}'

# Create the ticket (paste the question from above as clarifying_question)
curl -X POST http://localhost:8003/create-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "user_email":"test.user@example.com",
    "initiation_query":"my laptop wont connect to the wifi",
    "clarifying_question":"When did the issue start, and is it only on the office network or also at home?",
    "clarifying_answer":"It started this morning, and it happens on both office and home networks."
  }'
```

Open `http://localhost:8003/docs` for the full OpenAPI UI.

---

## API reference

| Method   | Path                                | Purpose                                                        |
|----------|-------------------------------------|----------------------------------------------------------------|
| `POST`   | `/clarify`                          | Turn 1 — returns ONE clarifying question from Gemini.          |
| `POST`   | `/create-webhook`                   | Turn 2 — both turns in, structured ticket + emails out.        |
| `GET`    | `/tickets`                          | List tickets (filters: `mine_only`, `status`, `department`).   |
| `GET`    | `/tickets/{id}`                     | Fetch a single ticket.                                         |
| `PATCH`  | `/tickets/{id}`                     | Update status/priority/department; triggers an update email.   |
| `POST`   | `/users`                            | Create a user.                                                 |
| `GET`    | `/users/{email}`                    | Look up a user.                                                |
| `POST`   | `/api/v1/admin/sla-scan`            | Manually trigger the SLA breach scan.                          |
| `GET`    | `/health`                           | Liveness check.                                                |

`/clarify` and `/create-webhook` are mounted at **both** `/` (the URL your frontend already uses) and `/api/v1/` (preferred for new clients).

For listing tickets, send your email in the `X-User-Email` header.

---

## Configuration

All settings live in `.env` and are validated by `app/core/config.py`. Key vars:

| Var                          | Purpose                                                |
|------------------------------|--------------------------------------------------------|
| `POSTGRES_DSN`               | Async DSN for FastAPI (`postgresql+asyncpg://...`)     |
| `POSTGRES_SYNC_DSN`          | Sync DSN for Celery + Alembic (`postgresql+psycopg2://...`) |
| `REDIS_URL`                  | Celery broker + backend                                |
| `GEMINI_API_KEY`             | From https://aistudio.google.com/app/apikey            |
| `GEMINI_MODEL`               | Default `gemini-2.0-flash`                             |
| `SMTP_*`                     | Outgoing email settings                                |
| `DEFAULT_DEPARTMENT_EMAIL`   | Fallback for all 6 departments (used in demo)          |
| `IT_SUPPORT_EMAIL`, etc.     | Per-department overrides (unset = use default)         |
| `SLA_DEFAULT_MINUTES`        | 2880 = 48 hours                                        |

### Department routing
For the demo, every department falls back to `DEFAULT_DEPARTMENT_EMAIL` (`raghunath11112004@gmail.com`). For production, uncomment the per-department vars in `.env`:

```bash
IT_SUPPORT_EMAIL=helpdesk@yourcompany.com
HUMAN_RESOURCES_EMAIL=hr@yourcompany.com
FINANCE_EMAIL=finance@yourcompany.com
OPERATIONS_EMAIL=ops@yourcompany.com
SALES_EMAIL=sales-ops@yourcompany.com
ENGINEERING_EMAIL=eng-oncall@yourcompany.com
```

---

## Data model

**users** — `id, email (unique), full_name, is_active, created_at`

**tickets** — `id, title, description, department, priority, impact, status, reporter_id → users.id, reporter_email, initiation_query, clarifying_question, clarifying_answer, llm_raw_response (JSONB), sla_minutes, sla_breached, sla_notified_at, created_at, updated_at, resolved_at`

**ticket_events** — append-only audit log: `id, ticket_id → tickets.id, event_type, actor_email, payload (JSONB), occurred_at`

### Lifecycle
`created` → `new` → `open` → `in_progress` → `resolved`

(`created` is the spec's "initial write" marker; tooling can transition to `new` automatically if you want. Currently new tickets stay in `created` until updated.)

### SLA
Every ticket has `sla_minutes` (default 2880 = 48h). Celery Beat runs `scan_sla_breaches` every 5 minutes; any unresolved ticket past its deadline triggers a `send_sla_breach_email_task` and flips `sla_breached = true` so we don't re-notify.

---

## Frontend integration

Your existing frontend posts to `http://127.0.0.1:8003/create-webhook`. That keeps working. To use the two-turn flow:

1. User types initial message.
2. Frontend → `POST /clarify` with `{user_email, initiation_query}` → gets `{question}`.
3. Frontend shows the question, collects the user's answer.
4. Frontend → `POST /create-webhook` with all four fields. Response includes the created ticket.

If you'd rather skip the clarification step in some flows, you can synthesize a stub question (e.g., the frontend can pass `"Any additional context?"` as `clarifying_question` and the user's full second message as `clarifying_answer`).

### Displaying the created ticket in the frontend

`POST /create-webhook` now returns the created ticket in both `data` and `ticket`, so the UI can render the full object directly instead of showing a generic success toast.

Example response:

```json
{
  "status": "created",
  "message": "Ticket created successfully",
  "data": {
    "id": "31bc51ed-98b6-4b61-a90a-dff482be966b",
    "title": "Salary payment not received",
    "description": "The employee has reported that salary has not been credited yet.",
    "department": "finance",
    "priority": "high",
    "impact": "The employee cannot confirm payroll has been received.",
    "status": "created",
    "reporter_email": "test.user@example.com",
    "sla_minutes": 2880,
    "sla_breached": false,
    "created_at": "2026-05-23T23:53:03.000Z",
    "updated_at": "2026-05-23T23:53:03.000Z",
    "resolved_at": null
  },
  "ticket": { "...same as data..." },
  "notifications_dispatched": true
}
```

React example:

```tsx
type Ticket = {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: string;
  impact: string;
  status: string;
  reporter_email: string;
  sla_minutes: number;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type CreateWebhookResponse = {
  status: string;
  message: string;
  data: Ticket;
  ticket: Ticket;
  notifications_dispatched: boolean;
};

async function createTicket(payload: Record<string, unknown>) {
  const response = await fetch('http://127.0.0.1:8003/create-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': 'test.user@example.com',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result = (await response.json()) as CreateWebhookResponse;
  return result.data ?? result.ticket;
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <section>
      <h2>{ticket.title}</h2>
      <p><strong>Department:</strong> {ticket.department}</p>
      <p><strong>Priority:</strong> {ticket.priority}</p>
      <p><strong>Status:</strong> {ticket.status}</p>
      <p><strong>Impact:</strong> {ticket.impact}</p>
      <p><strong>Description:</strong> {ticket.description}</p>
      <p><strong>Reporter:</strong> {ticket.reporter_email}</p>
      <p><strong>Ticket ID:</strong> {ticket.id}</p>
    </section>
  );
}
```

If your frontend currently shows `No data returned`, change it to read `response.data` first and fall back to `response.ticket`.

---

## Testing

```bash
pytest -v
```

Unit tests cover schema validation, LLM JSON parsing, and department routing. Integration tests against a real DB are intentionally out of scope here — wire them to `TEST_DATABASE_URL` if needed.

---

## Production notes

- **Rotate every secret in your existing `.env` immediately.** The values you shared (Neon password, Gemini key, Gmail OAuth secret, SMTP app password) should all be considered compromised.
- Run Uvicorn behind a real ASGI process manager (Gunicorn + UvicornWorker, or directly under systemd/Kubernetes).
- Use a managed Redis (Upstash, ElastiCache, etc.) for Celery in production.
- Configure `ALLOWED_ORIGINS` strictly to your frontend's domain.
- The catch-all 500 handler in `app/main.py` hides internals from clients; logs still capture stack traces.
- Consider adding a real auth layer (the JWT config in `.env` is reserved for that) before exposing this beyond an internal network.
