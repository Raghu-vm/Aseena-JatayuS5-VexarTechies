'use client'

/**
 * RAY Dashboard.
 *
 * One component, branches internally on user role.
 *   - employee → "How is RAY doing for ME?" (personal queries, my topics, my SLA)
 *   - admin    → "How is RAY doing for the ORG?" (org metrics, dept breakdown, KB gaps)
 *   - executive → Falls back to executive-dashboard.tsx (kept untouched)
 *
 * Data sources:
 *   - sampleChatbotQueries (lib/sample-data.ts) — seeded into localStorage
 *   - sampleTickets / sampleEmployees — existing
 *   - All numeric widgets are *computed* from the data, not hardcoded.
 */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { Ticket } from '@/lib/ticket-types'
import { ChatbotQuery, CHATBOT_TOPIC_LABELS, loadChatbotQueries, saveChatbotQueries } from '@/lib/chatbot-types'
import { sampleTickets, sampleEmployees, sampleChatbotQueries } from '@/lib/sample-data'
import { getRayTint, rayColors, rayMascotByRole, rayTypography, type RayRole } from '@/lib/design-system'
import { getTipOfTheDay } from '@/lib/ray-tips'

interface DashboardPageProps {
  currentUser?: any
}

// ============================================================
// Shared style helpers (typed once, used everywhere)
// ============================================================

const pageStyle = (bg: string): React.CSSProperties => ({
  flex: 1,
  overflowY: 'auto',
  background: bg,
  padding: '28px 28px 48px',
  fontFamily: rayTypography.family,
  color: rayColors.ink,
})

const innerStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const card = (border: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: rayColors.white,
  borderRadius: 12,
  border: `1px solid ${border}`,
  boxShadow: '0 1px 2px rgba(45, 27, 92, 0.04)',
  padding: 16,
  ...extra,
})

const statStripStyle = (color: string): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  background: color,
})

const labelStyle: React.CSSProperties = {
  margin: 0,
  ...rayTypography.label,
  fontSize: 10,
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DashboardPage({ currentUser }: DashboardPageProps) {
  const role: RayRole = (currentUser?.role as RayRole) || 'employee'
  const tint = getRayTint(role)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [queries, setQueries] = useState<ChatbotQuery[]>([])

  // Hydrate from localStorage with first-time seed
  useEffect(() => {
    // Tickets
    const storedT = localStorage.getItem('ray_tickets')
    if (storedT) {
      const parsed = JSON.parse(storedT)
      setTickets(parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })))
    } else {
      setTickets(sampleTickets)
      localStorage.setItem('ray_tickets', JSON.stringify(sampleTickets))
    }

    // Chatbot queries
    const storedQ = loadChatbotQueries()
    if (storedQ.length > 0) {
      setQueries(storedQ)
    } else {
      setQueries(sampleChatbotQueries)
      saveChatbotQueries(sampleChatbotQueries)
    }
  }, [])

  if (role === 'executive') {
    // Executive view is handled by its own page — fall through with a soft note.
    return (
      <div style={pageStyle(tint.pageBackground)}>
        <div style={innerStyle}>
          <p style={{ color: rayColors.inkMuted }}>
            Executive dashboard is rendered separately by the executive flow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle(tint.pageBackground)}>
      <div style={innerStyle}>
        <DashboardHeader role={role} currentUser={currentUser} queries={queries} tickets={tickets} />
        {role === 'admin'
          ? <AdminBody queries={queries} tickets={tickets} tint={tint} />
          : <EmployeeBody queries={queries} tickets={tickets} currentUser={currentUser} tint={tint} />
        }
      </div>
    </div>
  )
}

// ============================================================
// HEADER (shared shell — different copy per role)
// ============================================================

function DashboardHeader({ role, currentUser, queries, tickets }: {
  role: RayRole
  currentUser: any
  queries: ChatbotQuery[]
  tickets: Ticket[]
}) {
  const tint = getRayTint(role)
  const mascot = rayMascotByRole[role]
  const name = currentUser?.fullName || currentUser?.username || 'there'

  // Headline numbers
  const myQueries = queries.filter((q) => q.userEmail === currentUser?.email)
  const myResolved = myQueries.filter((q) => q.wasResolved).length
  const orgResolved = queries.filter((q) => q.wasResolved).length
  const monthMs = 30 * 24 * 60 * 60 * 1000
  const monthQueries = queries.filter((q) => Date.now() - q.askedAt.getTime() < monthMs)
  const orgMonthResolved = monthQueries.filter((q) => q.wasResolved).length

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '4px 4px 18px',
      borderBottom: `1px solid ${tint.cardBorder}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: rayColors.white,
        boxShadow: `0 2px 16px ${role === 'admin' ? 'rgba(45,27,92,0.16)' : 'rgba(123,91,255,0.16)'}`,
        border: `1px solid ${tint.cardBorder}`,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Image
          src={mascot}
          alt={`RAY ${role}`}
          width={56}
          height={56}
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, ...labelStyle, color: tint.roleLabel }}>
          {role === 'admin' ? 'Admin · Operations' : `Hi ${name} · Employee`}
        </p>
        <h1 style={{ margin: '4px 0 0', ...rayTypography.h1 }}>
          {role === 'admin'
            ? <>RAY solved <span style={{ color: rayColors.cyan500 }}>{orgMonthResolved.toLocaleString()} queries</span> across the org this month</>
            : <>RAY has helped you <span style={{ color: rayColors.cyan500 }}>{myResolved} times</span> so far</>
          }
        </h1>
        <p style={{ margin: '6px 0 0', ...rayTypography.body, fontSize: 12 }}>
          {role === 'admin'
            ? `${tickets.filter((t) => t.status === 'closed').length} tickets resolved across all departments · ${queries.length} total queries logged`
            : `Member since ${currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026'} · ${currentUser?.department || 'your team'}`
          }
        </p>
      </div>
    </div>
  )
}

// ============================================================
// EMPLOYEE BODY
// ============================================================

function EmployeeBody({ queries, tickets, currentUser, tint }: {
  queries: ChatbotQuery[]
  tickets: Ticket[]
  currentUser: any
  tint: ReturnType<typeof getRayTint>
}) {
  const myEmail = currentUser?.email || ''
  const myDept = currentUser?.department || ''

  const stats = useMemo(() => {
    const my = queries.filter((q) => q.userEmail === myEmail)
    const resolved = my.filter((q) => q.wasResolved)
    const escalated = my.filter((q) => q.escalatedToTicket)
    const avgConf = my.length ? my.reduce((s, q) => s + q.confidence, 0) / my.length : 0
    const avgResp = my.length ? my.reduce((s, q) => s + q.responseTimeMs, 0) / my.length : 0
    const myTickets = tickets.filter((t) => t.createdBy === myEmail || t.assignee === currentUser?.username)
    const myTicketsResolved = myTickets.filter((t) => t.status === 'closed').length

    return {
      asked: my.length,
      resolved: resolved.length,
      resolvedPct: my.length ? Math.round((resolved.length / my.length) * 100) : 0,
      avgConfidence: +avgConf.toFixed(2),
      avgResponseSeconds: +(avgResp / 1000).toFixed(1),
      escalationPct: my.length ? Math.round((escalated.length / my.length) * 100) : 0,
      ticketsResolvedForMe: myTicketsResolved,
    }
  }, [queries, tickets, myEmail, currentUser])

  const myQueries = queries.filter((q) => q.userEmail === myEmail)
  const recent5 = myQueries.slice(0, 5)

  // Top 5 topics for me
  const topTopics = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const q of myQueries) counts[q.topic] = (counts[q.topic] || 0) + 1
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [myQueries])

  // Performance trend (last 14 days)
  const perfTrend = useMemo(() => buildDailyTrend(myQueries, 14), [myQueries])

  // Confidence over the last 7 weeks
  const confTrend = useMemo(() => buildWeeklyConfidence(myQueries, 7), [myQueries])

  // Response time per week
  const respTrend = useMemo(() => buildWeeklyResponseTime(myQueries, 7), [myQueries])

  // Peer comparison
  const peerStats = useMemo(() => {
    const peerQueries = queries.filter((q) => q.department === myDept && q.userEmail !== myEmail)
    const peers = new Set(peerQueries.map((q) => q.userEmail))
    const peerCount = peers.size || 1
    const peerAvg = peerQueries.length / peerCount
    return {
      myCount: myQueries.length,
      peerAvg: Math.round(peerAvg),
      vsPeers: peerAvg > 0 ? Math.round(((myQueries.length - peerAvg) / peerAvg) * 100) : 0,
    }
  }, [queries, myQueries, myEmail, myDept])

  const tip = getTipOfTheDay()

  return (
    <>
      {/* Stat strip — 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Queries asked" value={stats.asked.toString()} stripColor={rayColors.purple500} tint={tint} />
        <StatCard label="Resolved by RAY" value={`${stats.resolved}`} sub={`${stats.resolvedPct}%`} stripColor={rayColors.cyan500} tint={tint} />
        <StatCard label="Avg confidence" value={stats.avgConfidence.toFixed(2)} sub={stats.avgConfidence > 0.75 ? 'strong' : 'fair'} stripColor={rayColors.purple400} tint={tint} />
        <StatCard label="Tickets resolved for me" value={stats.ticketsResolvedForMe.toString()} stripColor={rayColors.purple700} tint={tint} />
      </div>

      {/* Secondary stat strip — escalation + response time */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <StatCard label="My escalation rate" value={`${stats.escalationPct}%`} sub="queries that became tickets" stripColor={rayColors.purple500} tint={tint} />
        <StatCard label="RAY's avg response" value={`${stats.avgResponseSeconds}s`} sub="time to answer your questions" stripColor={rayColors.cyan500} tint={tint} />
      </div>

      {/* Performance chart — area chart, two series */}
      <div style={card(tint.cardBorder)}>
        <CardHeader title="RAY's performance for you" subtitle="Last 14 days · asked vs resolved" tint={tint}>
          <Legend items={[
            { label: 'Asked', color: rayColors.purple500 },
            { label: 'Resolved', color: rayColors.cyan500 },
          ]} />
        </CardHeader>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={perfTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-asked" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={rayColors.purple500} stopOpacity={0.20} />
                  <stop offset="100%" stopColor={rayColors.purple500} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-resolved" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={rayColors.cyan500} stopOpacity={0.20} />
                  <stop offset="100%" stopColor={rayColors.cyan500} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tint.cardBorder} />
              <XAxis dataKey="day" tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle(tint.cardBorder)} />
              <Area type="monotone" dataKey="asked" stroke={rayColors.purple500} strokeWidth={2} fill="url(#grad-asked)" />
              <Area type="monotone" dataKey="resolved" stroke={rayColors.cyan500} strokeWidth={2} fill="url(#grad-resolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: confidence trend + response time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={card(tint.cardBorder)}>
          <CardHeader title="Confidence over time" subtitle="Last 7 weeks" tint={tint} />
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1]} hide />
                <Tooltip contentStyle={tooltipStyle(tint.cardBorder)} />
                <Bar dataKey="confidence" fill={rayColors.purple400} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card(tint.cardBorder)}>
          <CardHeader title="Response time trend" subtitle="Avg seconds to answer" tint={tint} />
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={respTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle(tint.cardBorder)} formatter={(v: any) => `${v}s`} />
                <Line type="monotone" dataKey="seconds" stroke={rayColors.cyan500} strokeWidth={2.5} dot={{ r: 3, fill: rayColors.cyan500 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Three-column: Top topics · Recent queries · Tip / Peer / Org */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {/* Top topics */}
        <div style={card(tint.cardBorder)}>
          <CardHeader title="My top topics" subtitle="What I ask RAY most" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {topTopics.length === 0 && <EmptyState text="Ask RAY a few questions to see your top topics here." />}
            {topTopics.map(({ topic, count }: { topic: string; count: number }) => {
              const max = topTopics[0]?.count || 1
              const pct = Math.round((count / max) * 100)
              return (
                <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: '0 0 110px', fontSize: 12, color: rayColors.inkMuted, fontWeight: 500 }}>
                    {CHATBOT_TOPIC_LABELS[topic as keyof typeof CHATBOT_TOPIC_LABELS] || topic}
                  </span>
                  <div style={{ flex: 1, height: 8, background: rayColors.purple50, borderRadius: 4 }}>
                    <div style={{
                      width: `${pct}%`, height: 8, borderRadius: 4,
                      background: `linear-gradient(90deg, ${rayColors.purple500}, ${rayColors.cyan500})`,
                    }} />
                  </div>
                  <span style={{ flex: '0 0 22px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: rayColors.ink }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent queries */}
        <div style={card(tint.cardBorder)}>
          <CardHeader title="Recent conversations" subtitle="Last 5 things I asked RAY" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {recent5.length === 0 && <EmptyState text="Your recent RAY chats will appear here." />}
            {recent5.map((q) => (
              <div key={q.id} style={{
                padding: 8, borderRadius: 8,
                background: rayColors.purple50,
                border: `1px solid ${tint.cardBorder}`,
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: rayColors.ink, lineHeight: 1.4 }}>
                  {q.question}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: rayColors.inkMuted }}>
                  {timeAgo(q.askedAt)} · {q.wasResolved
                    ? <span style={{ color: rayColors.cyan600 }}>resolved</span>
                    : <span style={{ color: rayColors.warning }}>escalated</span>}
                  {' '}· confidence {q.confidence.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Tip + Peer + Org (stacked) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={card(tint.cardBorder, { background: `linear-gradient(135deg, ${rayColors.white} 0%, ${rayColors.purple50} 100%)` })}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{tip.icon}</span>
              <div>
                <p style={{ margin: 0, ...labelStyle, color: tint.roleLabel }}>Tip from RAY</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: rayColors.ink, lineHeight: 1.5 }}>{tip.tip}</p>
              </div>
            </div>
          </div>

          <div style={card(tint.cardBorder)}>
            <p style={{ margin: 0, ...labelStyle, color: tint.roleLabel }}>Vs my team</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: rayColors.ink }}>
              You: <span style={{ fontWeight: 600 }}>{peerStats.myCount}</span> · team avg: <span style={{ fontWeight: 600 }}>{peerStats.peerAvg}</span>
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: peerStats.vsPeers > 0 ? rayColors.cyan600 : rayColors.inkMuted }}>
              {peerStats.vsPeers > 0
                ? `You're asking RAY ${peerStats.vsPeers}% more than your team`
                : peerStats.vsPeers < 0
                ? `You're asking RAY ${Math.abs(peerStats.vsPeers)}% less than your team`
                : 'Right at the team average'}
            </p>
          </div>

          <div style={card(tint.cardBorder, { background: `linear-gradient(135deg, ${rayColors.white} 0%, ${rayColors.purple50} 100%)` })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, background: rayColors.cyan500, borderRadius: '50%', boxShadow: `0 0 6px ${rayColors.cyan500}` }} />
              <p style={{ margin: 0, ...labelStyle, color: tint.roleLabel }}>Vexar Tech</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 11 }}>
              <span style={{ color: rayColors.inkMuted }}>Team</span><span style={{ color: rayColors.ink, fontWeight: 500 }}>{myDept || '—'}</span>
              <span style={{ color: rayColors.inkMuted }}>Headcount</span><span style={{ color: rayColors.ink, fontWeight: 500 }}>{sampleEmployees.length}</span>
              <span style={{ color: rayColors.inkMuted }}>RAY since</span><span style={{ color: rayColors.ink, fontWeight: 500 }}>Jan 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={card(tint.cardBorder)}>
        <p style={{ margin: 0, ...labelStyle, color: tint.roleLabel }}>Quick actions</p>
        <p style={{ margin: '2px 0 12px', fontSize: 12, color: rayColors.inkMuted }}>Skip the form — let RAY do it for you</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <QuickAction icon="🔑" label="Reset password" hint="Ask RAY to walk you through it" />
          <QuickAction icon="🌴" label="Request leave" hint="Apply via chat in 30 seconds" />
          <QuickAction icon="💸" label="View payslip" hint="Latest one, pulled instantly" />
          <QuickAction icon="💬" label="Talk to RAY" hint="Ask anything — RAY is online" />
        </div>
      </div>
    </>
  )
}

// ============================================================
// ADMIN BODY
// ============================================================

function AdminBody({ queries, tickets, tint }: {
  queries: ChatbotQuery[]
  tickets: Ticket[]
  tint: ReturnType<typeof getRayTint>
}) {
  const stats = useMemo(() => {
    const total = queries.length
    const resolved = queries.filter((q) => q.wasResolved).length
    const deflection = total ? Math.round((resolved / total) * 100) : 0
    const ticketsResolved = tickets.filter((t) => t.status === 'closed').length
    const slaBreaches = tickets.filter((t) => {
      if (t.status === 'closed') return false
      const ageDays = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return ageDays > 2
    }).length
    return { total, resolved, deflection, ticketsResolved, slaBreaches }
  }, [queries, tickets])

  // Active users: today / week / month
  const activeUsers = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000
    const within = (days: number) => {
      const set = new Set<string>()
      const cutoff = Date.now() - days * dayMs
      for (const q of queries) if (q.askedAt.getTime() >= cutoff) set.add(q.userEmail)
      return set.size
    }
    return { today: within(1), week: within(7), month: within(30) }
  }, [queries])

  // Queries by role (stacked bar)
  const queriesByRole = useMemo(() => {
    const counts: Record<string, number> = { employee: 0, admin: 0, executive: 0 }
    for (const q of queries) counts[q.userRole] = (counts[q.userRole] || 0) + 1
    const total = counts.employee + counts.admin + counts.executive
    return {
      counts,
      total,
      pct: {
        employee: total ? Math.round((counts.employee / total) * 100) : 0,
        admin:    total ? Math.round((counts.admin / total) * 100) : 0,
        executive: total ? Math.round((counts.executive / total) * 100) : 0,
      },
    }
  }, [queries])

  // Headcount by department (from sample employees)
  const headcountByDept = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of sampleEmployees) counts[e.department] = (counts[e.department] || 0) + 1
    return Object.entries(counts).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count)
  }, [])

  // Top 10 questions org-wide
  const topQuestions = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const q of queries) counts[q.question] = (counts[q.question] || 0) + 1
    return Object.entries(counts).map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [queries])

  // Department deflection rate leaderboard
  const deptDeflection = useMemo(() => {
    const byDept: Record<string, { total: number; resolved: number }> = {}
    for (const q of queries) {
      if (!byDept[q.department]) byDept[q.department] = { total: 0, resolved: 0 }
      byDept[q.department].total += 1
      if (q.wasResolved) byDept[q.department].resolved += 1
    }
    return Object.entries(byDept)
      .map(([dept, { total, resolved }]) => ({
        dept,
        total,
        resolved,
        rate: total ? Math.round((resolved / total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [queries])

  // Low-confidence query feed
  const lowConfidence = useMemo(
    () => queries.filter((q) => q.confidence < 0.65).sort((a, b) => a.confidence - b.confidence).slice(0, 6),
    [queries],
  )

  // Usage heatmap — hours × days-of-week
  const heatmap = useMemo(() => buildHeatmap(queries), [queries])

  // Org-wide 14-day query volume trend
  const orgTrend = useMemo(() => buildDailyTrend(queries, 14), [queries])

  return (
    <>
      {/* 5-up stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        <StatCard label="Total queries" value={stats.total.toLocaleString()} stripColor={rayColors.inkSoft} tint={tint} />
        <StatCard label="Resolved by RAY" value={stats.resolved.toLocaleString()} stripColor={rayColors.cyan500} tint={tint} />
        <StatCard label="Deflection rate" value={`${stats.deflection}%`} stripColor={rayColors.purple500} tint={tint} />
        <StatCard label="Tickets resolved" value={stats.ticketsResolved.toString()} stripColor={rayColors.purple400} tint={tint} />
        <StatCard label="SLA breaches" value={stats.slaBreaches.toString()} stripColor={rayColors.danger} tint={tint} valueColor={stats.slaBreaches > 0 ? rayColors.danger : undefined} />
      </div>

      {/* Active users + queries by role */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <div style={card(tint.cardBorder)}>
          <CardHeader title="Active users" subtitle="Distinct users asking RAY" tint={tint} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            <MiniStat label="Today" value={activeUsers.today} accent={rayColors.cyan500} />
            <MiniStat label="This week" value={activeUsers.week} accent={rayColors.purple500} />
            <MiniStat label="This month" value={activeUsers.month} accent={rayColors.inkSoft} />
          </div>
        </div>

        <div style={card(tint.cardBorder)}>
          <CardHeader title="Queries by role" subtitle="Who's using RAY · all time" tint={tint}>
            <Legend items={[
              { label: 'Employee', color: rayColors.cyan500 },
              { label: 'Admin', color: rayColors.purple500 },
              { label: 'Executive', color: rayColors.inkSoft },
            ]} />
          </CardHeader>
          <div style={{ display: 'flex', gap: 2, height: 24, borderRadius: 6, overflow: 'hidden', marginTop: 16 }}>
            {queriesByRole.pct.employee > 0 && (
              <div style={{ flex: queriesByRole.pct.employee, background: rayColors.cyan500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 500 }}>
                Employee · {queriesByRole.counts.employee} ({queriesByRole.pct.employee}%)
              </div>
            )}
            {queriesByRole.pct.admin > 0 && (
              <div style={{ flex: queriesByRole.pct.admin, background: rayColors.purple500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 500 }}>
                Admin · {queriesByRole.counts.admin}
              </div>
            )}
            {queriesByRole.pct.executive > 0 && (
              <div style={{ flex: queriesByRole.pct.executive, background: rayColors.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 500 }}>
                Exec
              </div>
            )}
            {queriesByRole.total === 0 && (
              <div style={{ flex: 1, background: rayColors.purple50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: rayColors.inkMuted }}>
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Org trend */}
      <div style={card(tint.cardBorder)}>
        <CardHeader title="Org query volume" subtitle="Asked vs resolved · last 14 days" tint={tint}>
          <Legend items={[
            { label: 'Asked', color: rayColors.purple500 },
            { label: 'Resolved', color: rayColors.cyan500 },
          ]} />
        </CardHeader>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={orgTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ag-asked" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={rayColors.purple500} stopOpacity={0.20} />
                  <stop offset="100%" stopColor={rayColors.purple500} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ag-resolved" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={rayColors.cyan500} stopOpacity={0.20} />
                  <stop offset="100%" stopColor={rayColors.cyan500} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tint.cardBorder} />
              <XAxis dataKey="day" tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: rayColors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle(tint.cardBorder)} />
              <Area type="monotone" dataKey="asked" stroke={rayColors.purple500} strokeWidth={2} fill="url(#ag-asked)" />
              <Area type="monotone" dataKey="resolved" stroke={rayColors.cyan500} strokeWidth={2} fill="url(#ag-resolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Headcount + deflection leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={card(tint.cardBorder)}>
          <CardHeader title="Headcount by department" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
            {headcountByDept.map(({ dept, count }: { dept: string; count: number }) => {
              const max = headcountByDept[0]?.count || 1
              const pct = Math.round((count / max) * 100)
              return (
                <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: '0 0 110px', fontSize: 12, color: rayColors.inkMuted, fontWeight: 500 }}>{dept}</span>
                  <div style={{ flex: 1, height: 10, background: rayColors.purple50, borderRadius: 3 }}>
                    <div style={{
                      width: `${pct}%`, height: 10, borderRadius: 3,
                      background: `linear-gradient(90deg, ${rayColors.purple500}, ${rayColors.cyan500})`,
                    }} />
                  </div>
                  <span style={{ flex: '0 0 24px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={card(tint.cardBorder)}>
          <CardHeader title="Deflection leaderboard" subtitle="By department · resolution rate" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
            {deptDeflection.length === 0 && <EmptyState text="No queries logged yet." />}
            {deptDeflection.map(({ dept, total, rate }: { dept: string; total: number; resolved: number; rate: number }, i: number) => (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  flex: '0 0 22px', textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: i < 3 ? rayColors.cyan600 : rayColors.inkMuted,
                }}>#{i + 1}</span>
                <span style={{ flex: '0 0 100px', fontSize: 12, color: rayColors.inkMuted, fontWeight: 500 }}>{dept}</span>
                <div style={{ flex: 1, height: 8, background: rayColors.purple50, borderRadius: 3 }}>
                  <div style={{ width: `${rate}%`, height: 8, borderRadius: 3, background: rayColors.cyan500 }} />
                </div>
                <span style={{ flex: '0 0 38px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: rayColors.ink }}>{rate}%</span>
                <span style={{ flex: '0 0 36px', textAlign: 'right', fontSize: 10, color: rayColors.inkMuted }}>({total})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 questions + low-confidence feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <div style={card(tint.cardBorder)}>
          <CardHeader title="Top 10 most asked questions" subtitle="What employees keep getting stuck on" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {topQuestions.map(({ question, count }: { question: string; count: number }, i: number) => (
              <div key={question + i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: i < topQuestions.length - 1 ? `1px dashed ${rayColors.borderSoft}` : 'none',
              }}>
                <span style={{
                  flex: '0 0 22px', textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: rayColors.inkMuted,
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, color: rayColors.ink, lineHeight: 1.4 }}>{question}</span>
                <span style={{
                  background: rayColors.purple50, color: rayColors.purple700,
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card(tint.cardBorder)}>
          <CardHeader title="Knowledge gaps" subtitle="Lowest-confidence answers · fix the KB" tint={tint} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {lowConfidence.length === 0 && <EmptyState text="No low-confidence answers — RAY is solid 👍" />}
            {lowConfidence.map((q: ChatbotQuery) => (
              <div key={q.id} style={{
                padding: 8, borderRadius: 8,
                background: '#FFF5F5',
                border: `1px solid #FED7D7`,
              }}>
                <p style={{ margin: 0, fontSize: 11, color: rayColors.ink, fontWeight: 500, lineHeight: 1.4 }}>
                  {q.question}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: rayColors.inkMuted }}>
                  confidence <span style={{ color: rayColors.danger, fontWeight: 600 }}>{q.confidence.toFixed(2)}</span> · {q.department}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={card(tint.cardBorder)}>
        <CardHeader title="When RAY is busiest" subtitle="Queries by hour and day of week" tint={tint} />
        <Heatmap data={heatmap} />
      </div>
    </>
  )
}

// ============================================================
// Small reusable building blocks
// ============================================================

function StatCard({ label, value, sub, stripColor, tint, valueColor }: {
  label: string
  value: string
  sub?: string
  stripColor: string
  tint: ReturnType<typeof getRayTint>
  valueColor?: string
}) {
  return (
    <div style={{
      background: rayColors.white,
      borderRadius: 12,
      border: `1px solid ${tint.cardBorder}`,
      boxShadow: '0 1px 2px rgba(45, 27, 92, 0.04)',
      padding: 14,
      paddingTop: 18,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={statStripStyle(stripColor)} />
      <p style={{ margin: 0, ...labelStyle, color: rayColors.inkMuted }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 600, color: valueColor || rayColors.ink, letterSpacing: '-0.3px' }}>
        {value}
        {sub && <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 500, color: rayColors.inkMuted }}> · {sub}</span>}
      </p>
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background: rayColors.purple50,
      borderRadius: 8,
      padding: 12,
      textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: 10, color: rayColors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, color: accent }}>{value}</p>
    </div>
  )
}

function CardHeader({ title, subtitle, tint, children }: {
  title: string
  subtitle?: string
  tint: ReturnType<typeof getRayTint>
  children?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: rayColors.ink }}>{title}</p>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: tint.roleLabel }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: rayColors.inkMuted }}>
      {items.map((it) => (
        <span key={it.label}>
          <span style={{ display: 'inline-block', width: 10, height: 2, background: it.color, verticalAlign: 'middle', marginRight: 4 }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

function QuickAction({ icon, label, hint }: { icon: string; label: string; hint: string }) {
  return (
    <button
      type="button"
      style={{
        background: rayColors.white,
        border: `1px solid ${rayColors.borderSoft}`,
        borderRadius: 10,
        padding: '12px 12px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 120ms ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = rayColors.purple300
        e.currentTarget.style.background = rayColors.purple50
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = rayColors.borderSoft
        e.currentTarget.style.background = rayColors.white
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: rayColors.ink }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: rayColors.inkMuted }}>{hint}</p>
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ margin: 0, fontSize: 12, color: rayColors.inkMuted, fontStyle: 'italic' }}>{text}</p>
}

function Heatmap({ data }: { data: number[][] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const max = Math.max(1, ...data.flat())
  return (
    <div style={{ marginTop: 12, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(24, 1fr)', gap: 3 }}>
        <span />
        {Array.from({ length: 24 }).map((_, h) => (
          <span key={h} style={{ fontSize: 9, color: rayColors.inkMuted, textAlign: 'center' }}>
            {h % 3 === 0 ? `${h}` : ''}
          </span>
        ))}
        {days.map((day, d) => (
          <>
            <span key={`l-${d}`} style={{ fontSize: 10, color: rayColors.inkMuted, alignSelf: 'center', fontWeight: 500 }}>{day}</span>
            {Array.from({ length: 24 }).map((_, h) => {
              const v = data[d][h]
              const intensity = v / max
              const bg = intensity === 0
                ? rayColors.purple50
                : `rgba(123, 91, 255, ${0.15 + intensity * 0.75})`
              return (
                <div
                  key={`${d}-${h}`}
                  title={`${day} ${h}:00 — ${v} queries`}
                  style={{
                    height: 18,
                    borderRadius: 3,
                    background: bg,
                    transition: 'transform 80ms',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function tooltipStyle(border: string): React.CSSProperties {
  return {
    backgroundColor: rayColors.white,
    borderRadius: 8,
    border: `1px solid ${border}`,
    fontSize: 12,
    color: rayColors.ink,
  }
}

function buildDailyTrend(queries: ChatbotQuery[], days: number): { day: string; asked: number; resolved: number }[] {
  const out: { day: string; asked: number; resolved: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const inDay = queries.filter((q) => q.askedAt >= date && q.askedAt < next)
    out.push({
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      asked: inDay.length,
      resolved: inDay.filter((q) => q.wasResolved).length,
    })
  }
  return out
}

function buildWeeklyConfidence(queries: ChatbotQuery[], weeks: number): { week: string; confidence: number }[] {
  const out: { week: string; confidence: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 7)
    const inWeek = queries.filter((q) => q.askedAt >= start && q.askedAt < end)
    const avg = inWeek.length ? inWeek.reduce((s, q) => s + q.confidence, 0) / inWeek.length : 0
    out.push({ week: i === 0 ? 'Now' : `W${weeks - i}`, confidence: +avg.toFixed(2) })
  }
  return out
}

function buildWeeklyResponseTime(queries: ChatbotQuery[], weeks: number): { week: string; seconds: number }[] {
  const out: { week: string; seconds: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 7)
    const inWeek = queries.filter((q) => q.askedAt >= start && q.askedAt < end)
    const avg = inWeek.length ? inWeek.reduce((s, q) => s + q.responseTimeMs, 0) / inWeek.length : 0
    out.push({ week: i === 0 ? 'Now' : `W${weeks - i}`, seconds: +(avg / 1000).toFixed(1) })
  }
  return out
}

function buildHeatmap(queries: ChatbotQuery[]): number[][] {
  // 7 days × 24 hours. Mon=0 ... Sun=6.
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const q of queries) {
    const jsDay = q.askedAt.getDay() // 0=Sun ... 6=Sat
    const day = jsDay === 0 ? 6 : jsDay - 1 // Mon=0 ... Sun=6
    grid[day][q.askedAt.getHours()] += 1
  }
  return grid
}

function timeAgo(d: Date): string {
  const ms = Date.now() - d.getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
