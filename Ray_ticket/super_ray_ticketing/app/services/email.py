"""
SMTP email service.

Synchronous (used inside Celery tasks, which run in threads).
Templates kept inline for zero-dependency simplicity.
"""
from __future__ import annotations

import smtplib
from email.message import EmailMessage
from typing import Iterable

from app.core.config import settings
from app.core.enums import Department, Priority, TicketStatus
from app.core.logging import get_logger

log = get_logger(__name__)


class EmailError(Exception):
    pass


def _send(to_addrs: Iterable[str], subject: str, html: str, text: str) -> None:
    """Low-level SMTP send. Raises EmailError on failure."""
    to_list = [a for a in to_addrs if a]
    if not to_list:
        raise EmailError("No recipients provided.")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = ", ".join(to_list)
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as srv:
            srv.starttls()
            srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            srv.send_message(msg)
        log.info("Email sent to %s | subject=%s", to_list, subject)
    except Exception as e:
        log.exception("SMTP send failed")
        raise EmailError(f"SMTP send failed: {e}") from e


# ---------- Templates ----------

_BASE_CSS = """
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;line-height:1.5;margin:0;padding:24px;background:#f6f7f9}
  .card{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e4e7eb;border-radius:8px;overflow:hidden}
  .hdr{padding:18px 24px;background:#0f172a;color:#fff}
  .hdr h1{margin:0;font-size:18px;font-weight:600}
  .body{padding:24px}
  .row{display:flex;padding:8px 0;border-bottom:1px solid #f1f3f5}
  .row:last-child{border-bottom:0}
  .k{width:140px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
  .v{flex:1;color:#0f172a}
  .pill{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;text-transform:uppercase}
  .pill.low{background:#e0f2fe;color:#075985}
  .pill.medium{background:#fef3c7;color:#92400e}
  .pill.high{background:#fed7aa;color:#9a3412}
  .pill.critical{background:#fecaca;color:#991b1b}
  .ftr{padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center}
"""

def _priority_pill(p: Priority) -> str:
    return f'<span class="pill {p.value}">{p.value}</span>'


def render_department_email(ticket) -> tuple[str, str, str]:
    """Returns (subject, html, plain) for the team-routing email."""
    subject = f"[{ticket.priority.value.upper()}] New Ticket #{str(ticket.id)[:8]} — {ticket.title}"
    html = f"""<!doctype html><html><head><style>{_BASE_CSS}</style></head><body>
<div class="card">
  <div class="hdr"><h1>🎫 New Ticket Assigned to {ticket.department.display_name}</h1></div>
  <div class="body">
    <div class="row"><div class="k">Ticket ID</div><div class="v"><code>{ticket.id}</code></div></div>
    <div class="row"><div class="k">Title</div><div class="v"><strong>{ticket.title}</strong></div></div>
    <div class="row"><div class="k">Priority</div><div class="v">{_priority_pill(ticket.priority)}</div></div>
    <div class="row"><div class="k">Department</div><div class="v">{ticket.department.display_name}</div></div>
    <div class="row"><div class="k">Reporter</div><div class="v">{ticket.reporter_email}</div></div>
    <div class="row"><div class="k">Created</div><div class="v">{ticket.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")}</div></div>
    <div class="row"><div class="k">SLA</div><div class="v">{ticket.sla_minutes // 60} hours</div></div>
    <div class="row"><div class="k">Impact</div><div class="v">{ticket.impact}</div></div>
    <div class="row"><div class="k">Description</div><div class="v">{ticket.description}</div></div>
  </div>
  <div class="ftr">Super Ray Ticketing · This is an automated message.</div>
</div></body></html>"""
    plain = (
        f"NEW TICKET #{ticket.id}\n"
        f"Title:       {ticket.title}\n"
        f"Priority:    {ticket.priority.value.upper()}\n"
        f"Department:  {ticket.department.display_name}\n"
        f"Reporter:    {ticket.reporter_email}\n"
        f"Created:     {ticket.created_at}\n"
        f"SLA:         {ticket.sla_minutes // 60}h\n"
        f"Impact:      {ticket.impact}\n\n"
        f"Description:\n{ticket.description}\n"
    )
    return subject, html, plain


def render_user_ack_email(ticket) -> tuple[str, str, str]:
    """Returns (subject, html, plain) for the reporter acknowledgement."""
    subject = f"We received your ticket — #{str(ticket.id)[:8]}"
    html = f"""<!doctype html><html><head><style>{_BASE_CSS}</style></head><body>
<div class="card">
  <div class="hdr"><h1>✅ Your ticket has been created</h1></div>
  <div class="body">
    <p>Hi,</p>
    <p>We've received your request and routed it to our <strong>{ticket.department.display_name}</strong> team.
       Someone will follow up within {ticket.sla_minutes // 60} hours.</p>
    <div class="row"><div class="k">Ticket ID</div><div class="v"><code>{ticket.id}</code></div></div>
    <div class="row"><div class="k">Title</div><div class="v"><strong>{ticket.title}</strong></div></div>
    <div class="row"><div class="k">Priority</div><div class="v">{_priority_pill(ticket.priority)}</div></div>
    <div class="row"><div class="k">Status</div><div class="v">{ticket.status.value}</div></div>
    <div class="row"><div class="k">Summary</div><div class="v">{ticket.description}</div></div>
  </div>
  <div class="ftr">Super Ray Ticketing · Reply to this thread to add details.</div>
</div></body></html>"""
    plain = (
        f"Hi,\n\nWe've received your ticket and routed it to {ticket.department.display_name}.\n\n"
        f"Ticket ID:  {ticket.id}\n"
        f"Title:      {ticket.title}\n"
        f"Priority:   {ticket.priority.value.upper()}\n"
        f"Status:     {ticket.status.value}\n"
        f"SLA:        {ticket.sla_minutes // 60} hours\n\n"
        f"Summary:\n{ticket.description}\n\n"
        f"— Super Ray Ticketing\n"
    )
    return subject, html, plain


def render_update_email(ticket, change_summary: str) -> tuple[str, str, str]:
    subject = f"Ticket #{str(ticket.id)[:8]} updated — {ticket.title}"
    html = f"""<!doctype html><html><head><style>{_BASE_CSS}</style></head><body>
<div class="card">
  <div class="hdr"><h1>🔄 Ticket update</h1></div>
  <div class="body">
    <p>{change_summary}</p>
    <div class="row"><div class="k">Ticket ID</div><div class="v"><code>{ticket.id}</code></div></div>
    <div class="row"><div class="k">Status</div><div class="v"><strong>{ticket.status.value}</strong></div></div>
    <div class="row"><div class="k">Priority</div><div class="v">{_priority_pill(ticket.priority)}</div></div>
    <div class="row"><div class="k">Department</div><div class="v">{ticket.department.display_name}</div></div>
    <div class="row"><div class="k">Updated</div><div class="v">{ticket.updated_at.strftime("%Y-%m-%d %H:%M:%S UTC")}</div></div>
  </div>
  <div class="ftr">Super Ray Ticketing</div>
</div></body></html>"""
    plain = f"{change_summary}\n\nTicket: {ticket.id}\nStatus: {ticket.status.value}\nPriority: {ticket.priority.value}\nDept: {ticket.department.display_name}\n"
    return subject, html, plain


def render_sla_breach_email(ticket) -> tuple[str, str, str]:
    subject = f"⚠️ SLA BREACHED — Ticket #{str(ticket.id)[:8]} ({ticket.department.display_name})"
    hours_over = int((ticket.updated_at - ticket.sla_deadline).total_seconds() // 3600)
    html = f"""<!doctype html><html><head><style>{_BASE_CSS}</style></head><body>
<div class="card">
  <div class="hdr" style="background:#991b1b"><h1>⚠️ SLA Breach</h1></div>
  <div class="body">
    <p>The following ticket has exceeded the {ticket.sla_minutes // 60}-hour SLA and remains unresolved.</p>
    <div class="row"><div class="k">Ticket ID</div><div class="v"><code>{ticket.id}</code></div></div>
    <div class="row"><div class="k">Title</div><div class="v"><strong>{ticket.title}</strong></div></div>
    <div class="row"><div class="k">Priority</div><div class="v">{_priority_pill(ticket.priority)}</div></div>
    <div class="row"><div class="k">Status</div><div class="v">{ticket.status.value}</div></div>
    <div class="row"><div class="k">Reporter</div><div class="v">{ticket.reporter_email}</div></div>
    <div class="row"><div class="k">Created</div><div class="v">{ticket.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")}</div></div>
    <div class="row"><div class="k">Overdue by</div><div class="v" style="color:#991b1b"><strong>~{max(0, hours_over)} hours</strong></div></div>
  </div>
  <div class="ftr">Super Ray Ticketing · Please take action immediately.</div>
</div></body></html>"""
    plain = (
        f"SLA BREACHED — Ticket {ticket.id}\n"
        f"Title: {ticket.title}\nStatus: {ticket.status.value}\nPriority: {ticket.priority.value}\n"
        f"Reporter: {ticket.reporter_email}\nCreated: {ticket.created_at}\n"
        f"Overdue by ~{max(0, hours_over)}h. Please action this ticket.\n"
    )
    return subject, html, plain


# ---------- Public helpers ----------

def send_department_notification(ticket) -> None:
    dept_email = settings.department_email_map()[ticket.department.value]
    subject, html, plain = render_department_email(ticket)
    _send([dept_email], subject, html, plain)


def send_user_acknowledgement(ticket) -> None:
    subject, html, plain = render_user_ack_email(ticket)
    _send([ticket.reporter_email], subject, html, plain)


def send_update_notification(ticket, change_summary: str) -> None:
    dept_email = settings.department_email_map()[ticket.department.value]
    subject, html, plain = render_update_email(ticket, change_summary)
    _send([dept_email, ticket.reporter_email], subject, html, plain)


def send_sla_breach_notification(ticket) -> None:
    dept_email = settings.department_email_map()[ticket.department.value]
    subject, html, plain = render_sla_breach_email(ticket)
    _send([dept_email], subject, html, plain)
