-- PostgreSQL schema for super_ray_ticketing
-- Matches the project's SQLAlchemy models and Alembic initial migration.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL DEFAULT 'demo-password-disabled',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    impact VARCHAR(500) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'created',
    reporter_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reporter_email VARCHAR(320) NOT NULL,
    initiation_query TEXT NOT NULL,
    clarifying_question TEXT,
    clarifying_answer TEXT,
    llm_raw_response JSONB,
    sla_minutes INTEGER NOT NULL DEFAULT 2880,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    sla_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_tickets_department ON tickets (department);
CREATE INDEX IF NOT EXISTS ix_tickets_priority ON tickets (priority);
CREATE INDEX IF NOT EXISTS ix_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS ix_tickets_reporter_id ON tickets (reporter_id);
CREATE INDEX IF NOT EXISTS ix_tickets_sla_breached ON tickets (sla_breached);

CREATE TABLE IF NOT EXISTS ticket_events (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    actor_email VARCHAR(320),
    payload JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ticket_events_ticket_id ON ticket_events (ticket_id);
