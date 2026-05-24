'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Ticket, TicketStatus, TicketPriority } from '@/lib/ticket-types'
import { sampleTickets } from '@/lib/sample-data'
import {
  unifiedTheme,
  cardStyle,
  buttonStyles,
  inputStyle,
  badgeStyle,
} from '@/lib/design-system'
import {
  Plus,
  X,
  Search,
  Inbox,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  AlertCircle,
  ChevronDown,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react'

interface RayDeskPageProps {
  currentUser?: any
}

// ─── Visual helpers ────────────────────────────────────────────────────

const statusMeta: Record<
  TicketStatus,
  { label: string; bg: string; fg: string; icon: React.ReactNode; dot: string }
> = {
  open: {
    label: 'Open',
    bg: '#fff7ed',
    fg: '#9a3412',
    dot: '#f97316',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  'in-progress': {
    label: 'In progress',
    bg: '#eff6ff',
    fg: '#1d4ed8',
    dot: '#3b82f6',
    icon: <Clock className="h-3 w-3" />,
  },
  'on-hold': {
    label: 'On hold',
    bg: '#fefce8',
    fg: '#854d0e',
    dot: '#eab308',
    icon: <Pause className="h-3 w-3" />,
  },
  closed: {
    label: 'Closed',
    bg: '#f0fdf4',
    fg: '#166534',
    dot: '#22c55e',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
}

const priorityMeta: Record<TicketPriority, { label: string; bg: string; fg: string }> = {
  low: { label: 'Low', bg: '#f1f5f9', fg: '#475569' },
  medium: { label: 'Medium', bg: '#eff6ff', fg: '#1d4ed8' },
  high: { label: 'High', bg: '#fff7ed', fg: '#9a3412' },
  critical: { label: 'Critical', bg: '#fee2e2', fg: '#991b1b' },
}

function formatRelative(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// ─── Reusable bits ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const m = statusMeta[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: m.bg,
        color: m.fg,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {m.icon}
      {m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const m = priorityMeta[priority]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 6,
        background: m.bg,
        color: m.fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}
    >
      {m.label}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────

export function RayDeskPage({ currentUser }: RayDeskPageProps = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'IT Support',
    priority: 'medium' as TicketPriority,
    assignee: '',
  })
  const detailScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTickets(sampleTickets)
  }, [])

  // Role-aware visibility (same rules as before)
  const visibleTickets = useMemo(() => {
    if (currentUser?.role === 'employee') {
      return tickets.filter(
        (t) => t.assignee === currentUser?.username || t.createdBy === currentUser?.username,
      )
    }
    return tickets
  }, [tickets, currentUser])

  // Distinct departments for the filter chips
  const departments = useMemo(() => {
    const set = new Set<string>()
    visibleTickets.forEach((t) => set.add(t.department))
    return ['all', ...Array.from(set)]
  }, [visibleTickets])

  // Filtered + searched
  const filtered = useMemo(() => {
    return visibleTickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (departmentFilter !== 'all' && t.department !== departmentFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = `${t.title} ${t.description} ${t.id} ${t.assignee ?? ''} ${t.createdBy ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [visibleTickets, statusFilter, priorityFilter, departmentFilter, searchQuery])

  // Stats are computed over the visible (role-filtered) set, not the
  // currently filtered list, so toggling filters doesn't shift the headline.
  const stats = useMemo(
    () => ({
      total: visibleTickets.length,
      open: visibleTickets.filter((t) => t.status === 'open').length,
      inProgress: visibleTickets.filter((t) => t.status === 'in-progress').length,
      highPriority: visibleTickets.filter((t) => t.priority === 'high' || t.priority === 'critical')
        .length,
      closed: visibleTickets.filter((t) => t.status === 'closed').length,
    }),
    [visibleTickets],
  )

  // Auto-select first ticket whenever the filter set changes if nothing selected
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
    } else if (!selectedId || !filtered.find((t) => t.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
    if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0
  }, [filtered, selectedId])

  const selected = filtered.find((t) => t.id === selectedId) ?? null

  const canEditTicket = (ticket: Ticket) => {
    if (currentUser?.role === 'admin') return true
    return ticket.createdBy === currentUser?.username
  }

  // ─── Actions ─────────────────────────────────────────────────────────

  const handleCreateTicket = () => {
    if (!formData.title.trim()) return
    const newTicket: Ticket = {
      id: `T${String(tickets.length + 1).padStart(4, '0')}`,
      title: formData.title,
      description: formData.description,
      status: 'open',
      priority: formData.priority,
      department: formData.department,
      assignee: formData.assignee || undefined,
      createdBy: currentUser?.username || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTickets([newTicket, ...tickets])
    setSelectedId(newTicket.id)
    setShowCreateForm(false)
    setFormData({
      title: '',
      description: '',
      department: 'IT Support',
      priority: 'medium',
      assignee: '',
    })
  }

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date() } : t)),
    )
  }

  const handlePriorityChange = (id: string, priority: TicketPriority) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority, updatedAt: new Date() } : t)),
    )
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
    setDepartmentFilter('all')
    setSearchQuery('')
  }

  const hasActiveFilters =
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    departmentFilter !== 'all' ||
    searchQuery.trim() !== ''

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100%',
        background: unifiedTheme.backgrounds.page,
        fontFamily: unifiedTheme.typography.family,
        color: unifiedTheme.text.primary,
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ─── HEADER ROW ─────────────────────────────────────────── */}
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: -0.4,
                  color: unifiedTheme.text.primary,
                }}
              >
                RAY Desk
              </h1>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  background: unifiedTheme.backgrounds.subtle,
                  color: unifiedTheme.text.muted,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {filtered.length} of {visibleTickets.length}
              </span>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                color: unifiedTheme.text.muted,
                fontSize: 14,
              }}
            >
              Unified support ticketing across departments — track, assign, and resolve in one place.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  color: unifiedTheme.text.muted,
                  pointerEvents: 'none',
                }}
              />
              <input
                placeholder="Search tickets by title, ID, assignee…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...inputStyle,
                  width: 320,
                  paddingLeft: 36,
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{ ...buttonStyles.primary, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              New ticket
            </button>
          </div>
        </header>

        {/* ─── STAT STRIP ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <StatTile label="Total" value={stats.total} accent="#64748b" icon={<Inbox size={16} />} />
          <StatTile label="Open" value={stats.open} accent="#f97316" icon={<AlertCircle size={16} />} />
          <StatTile label="In progress" value={stats.inProgress} accent="#3b82f6" icon={<Clock size={16} />} />
          <StatTile label="High priority" value={stats.highPriority} accent="#ef4444" icon={<AlertTriangle size={16} />} />
          <StatTile label="Closed" value={stats.closed} accent="#22c55e" icon={<CheckCircle2 size={16} />} />
        </div>

        {/* ─── FILTER CHIPS ───────────────────────────────────────── */}
        <div
          style={{
            ...cardStyle,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: unifiedTheme.text.muted }}>
            <Filter size={14} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Filters
            </span>
          </div>

          <FilterGroup
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as TicketStatus | 'all')}
            options={[
              { value: 'all', label: 'All status' },
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In progress' },
              { value: 'on-hold', label: 'On hold' },
              { value: 'closed', label: 'Closed' },
            ]}
          />

          <FilterGroup
            value={priorityFilter}
            onChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}
            options={[
              { value: 'all', label: 'All priority' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />

          <FilterGroup
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={departments.map((d) => ({
              value: d,
              label: d === 'all' ? 'All departments' : d,
            }))}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: unifiedTheme.colors.primary.main,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RotateCcw size={13} />
              Clear filters
            </button>
          )}
        </div>

        {/* ─── MASTER / DETAIL ────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(360px, 420px) 1fr',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          {/* LIST */}
          <div
            style={{
              ...cardStyle,
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 720,
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${unifiedTheme.borders.light}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: unifiedTheme.text.secondary }}>
                Tickets
              </span>
              <span style={{ fontSize: 12, color: unifiedTheme.text.muted }}>
                {filtered.length} shown
              </span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <EmptyList />
              ) : (
                filtered.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    selected={t.id === selectedId}
                    onSelect={() => setSelectedId(t.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* DETAIL */}
          <div
            ref={detailScrollRef}
            style={{
              ...cardStyle,
              padding: 0,
              overflowY: 'auto',
              maxHeight: 720,
            }}
          >
            {selected ? (
              <TicketDetail
                ticket={selected}
                canEdit={canEditTicket(selected)}
                onStatusChange={(s) => handleStatusChange(selected.id, s)}
                onPriorityChange={(p) => handlePriorityChange(selected.id, p)}
              />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </div>

      {/* ─── CREATE TICKET MODAL ──────────────────────────────────── */}
      {showCreateForm && (
        <CreateTicketModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateTicket}
        />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: number
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: unifiedTheme.text.muted,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: unifiedTheme.text.primary, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          ...inputStyle,
          padding: '8px 30px 8px 12px',
          fontSize: 13,
          fontWeight: 600,
          width: 'auto',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: unifiedTheme.text.muted,
        }}
      />
    </div>
  )
}

function TicketRow({
  ticket,
  selected,
  onSelect,
}: {
  ticket: Ticket
  selected: boolean
  onSelect: () => void
}) {
  const m = statusMeta[ticket.status]
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: selected ? unifiedTheme.backgrounds.subtle : 'transparent',
        border: 'none',
        borderLeft: selected
          ? `3px solid ${unifiedTheme.colors.primary.main}`
          : '3px solid transparent',
        padding: '14px 18px',
        borderBottom: `1px solid ${unifiedTheme.borders.light}`,
        cursor: 'pointer',
        transition: 'background 0.1s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: m.dot,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: unifiedTheme.text.muted, letterSpacing: 0.3 }}>
            {ticket.id}
          </span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: unifiedTheme.text.primary,
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {ticket.title}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: unifiedTheme.text.muted,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Building2 size={11} />
          {ticket.department}
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {formatRelative(ticket.updatedAt)}
        </span>
      </div>
    </button>
  )
}

function TicketDetail({
  ticket,
  canEdit,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: Ticket
  canEdit: boolean
  onStatusChange: (s: TicketStatus) => void
  onPriorityChange: (p: TicketPriority) => void
}) {
  return (
    <div>
      {/* Detail header */}
      <div
        style={{
          padding: '22px 28px',
          borderBottom: `1px solid ${unifiedTheme.borders.light}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: unifiedTheme.text.muted, letterSpacing: 0.5 }}>
            {ticket.id}
          </span>
          <span style={{ color: unifiedTheme.text.muted }}>·</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: unifiedTheme.text.primary,
            lineHeight: 1.3,
          }}
        >
          {ticket.title}
        </h2>
      </div>

      {/* Action toolbar */}
      {canEdit && (
        <div
          style={{
            padding: '14px 28px',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            background: unifiedTheme.backgrounds.subtle,
            borderBottom: `1px solid ${unifiedTheme.borders.light}`,
          }}
        >
          <ActionDropdown
            label="Change status"
            value={ticket.status}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In progress' },
              { value: 'on-hold', label: 'On hold' },
              { value: 'closed', label: 'Closed' },
            ]}
            onChange={(v) => onStatusChange(v as TicketStatus)}
          />
          <ActionDropdown
            label="Change priority"
            value={ticket.priority}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            onChange={(v) => onPriorityChange(v as TicketPriority)}
          />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 32 }}>
        <div>
          <SectionLabel icon={<MessageSquare size={14} />} text="Description" />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: unifiedTheme.text.secondary,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.description || <em style={{ color: unifiedTheme.text.muted }}>No description provided.</em>}
          </p>

          {ticket.resolutionNotes && (
            <div style={{ marginTop: 24 }}>
              <SectionLabel icon={<CheckCircle2 size={14} />} text="Resolution notes" />
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 13,
                  color: '#166534',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ticket.resolutionNotes}
              </div>
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            borderLeft: `1px solid ${unifiedTheme.borders.light}`,
            paddingLeft: 24,
          }}
        >
          <MetaRow icon={<User size={14} />} label="Assignee" value={ticket.assignee || 'Unassigned'} />
          <MetaRow icon={<User size={14} />} label="Reporter" value={ticket.createdBy || '—'} />
          <MetaRow icon={<Building2 size={14} />} label="Department" value={ticket.department} />
          <MetaRow icon={<Tag size={14} />} label="Priority" value={priorityMeta[ticket.priority].label} />
          <MetaRow
            icon={<Calendar size={14} />}
            label="Created"
            value={new Date(ticket.createdAt).toLocaleString()}
          />
          <MetaRow
            icon={<Clock size={14} />}
            label="Last update"
            value={formatRelative(ticket.updatedAt)}
          />
        </aside>
      </div>
    </div>
  )
}

function ActionDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: unifiedTheme.text.muted }}>{label}:</span>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          style={{
            ...inputStyle,
            padding: '6px 28px 6px 10px',
            fontSize: 13,
            fontWeight: 600,
            width: 'auto',
            appearance: 'none',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: unifiedTheme.text.muted,
          }}
        />
      </div>
    </div>
  )
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        color: unifiedTheme.text.muted,
      }}
    >
      {icon}
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {text}
      </span>
    </div>
  )
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          color: unifiedTheme.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {icon}
        {label}
      </span>
      <span style={{ fontSize: 13, color: unifiedTheme.text.primary, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function EmptyList() {
  return (
    <div
      style={{
        padding: 40,
        textAlign: 'center',
        color: unifiedTheme.text.muted,
        fontSize: 13,
      }}
    >
      <Inbox size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
      <p style={{ margin: 0 }}>No tickets match your filters.</p>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 360,
        color: unifiedTheme.text.muted,
        padding: 40,
        textAlign: 'center',
      }}
    >
      <ArrowUpRight size={36} style={{ opacity: 0.4, marginBottom: 12 }} />
      <p style={{ margin: 0, fontSize: 14 }}>Select a ticket on the left to see its details.</p>
    </div>
  )
}

function CreateTicketModal({
  formData,
  setFormData,
  onClose,
  onSubmit,
}: {
  formData: {
    title: string
    description: string
    department: string
    priority: TicketPriority
    assignee: string
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 560,
          boxShadow: '0 24px 80px rgba(15,23,42,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: unifiedTheme.text.primary,
              }}
            >
              Create new ticket
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: unifiedTheme.text.muted,
              }}
            >
              Fill in the details below to open a support request.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: unifiedTheme.backgrounds.subtle,
              border: 'none',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: unifiedTheme.text.muted,
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title">
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of the issue"
              style={inputStyle}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the problem, steps to reproduce, and any error messages"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Department">
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={inputStyle}
              >
                <option>IT Support</option>
                <option>Human Resources</option>
                <option>Finance</option>
                <option>Operations</option>
                <option>Sales</option>
                <option>Engineering</option>
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TicketPriority })
                }
                style={inputStyle}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
          </div>
          <Field label="Assignee (optional)">
            <input
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="Username to assign to"
              style={inputStyle}
            />
          </Field>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${unifiedTheme.borders.light}`,
          }}
        >
          <button onClick={onClose} style={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.title.trim()}
            style={{
              ...buttonStyles.primary,
              opacity: formData.title.trim() ? 1 : 0.5,
              cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Create ticket
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: unifiedTheme.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
