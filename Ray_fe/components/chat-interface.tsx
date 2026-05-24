'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { RayMascot } from './ray-mascot'
import { Loader2, Send, ChevronDown, Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'employee' | 'admin' | 'executive'

interface UploadedFile {
  name: string
  type: string
  size: number
  dataUrl: string
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content?: string
  timestamp: Date
  // Webhook response fields
  answer?: string
  source?: string
  confidence?: number
  noData?: boolean
  // UI-only fields (file attachments, validation, processing metadata)
  files?: UploadedFile[]
  validated?: boolean
  metadata?: {
    processingTime: number
    keywords: string[]
  }
}

interface SerializedMessage {
  id: string
  type: 'user' | 'assistant'
  content?: string
  timestamp: string
  answer?: string
  source?: string
  confidence?: number
  noData?: boolean
}

interface ChatInterfaceProps {
  role: Role
  selectedSessionId?: string | null
}

type ApiChatResponse = {
  answer?: string
  source?: string
  confidence?: number | string
  raw?: unknown
}

type ApiRequestError = Error & {
  status?: number
}

type HistoryApiMessage = {
  id?: string
  type?: 'user' | 'assistant' | string
  content?: string
  answer?: string
  source?: string
  confidence?: number | string
  timestamp?: string
}

interface RecentChatItem {
  id: string
  sessionId: string
  role: Role
  title: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SESSION_COOKIE_KEY = 'ray_session_id'
const getHistoryCookieKey = (role: Role) => `ray_chat_history_v2_${role}`
const LEGACY_HISTORY_COOKIE_KEY = 'ray_chat_history'
const RECENT_CHATS_STORAGE_KEY = 'ray_recent_chats'

const setCookie = (name: string, value: string, maxAge = COOKIE_MAX_AGE) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

const getCookie = (name: string) => {
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

// ---------------------------------------------------------------------------
// Message serialization
// ---------------------------------------------------------------------------

const serializeMessages = (messages: Message[]): SerializedMessage[] =>
  messages.slice(-8).map((msg) => ({ ...msg, timestamp: msg.timestamp.toISOString() }))

const deserializeMessages = (messages: SerializedMessage[]): Message[] =>
  messages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) }))

// ---------------------------------------------------------------------------
// Confidence helper
// ---------------------------------------------------------------------------

const toConfidencePercent = (value: unknown): number | undefined => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value.trim())
        : NaN
  if (!Number.isFinite(parsed)) return undefined
  return parsed <= 1 ? Math.round(parsed * 100) : Math.round(parsed)
}

// ---------------------------------------------------------------------------
// History response mapper
// ---------------------------------------------------------------------------

const mapHistoryMessages = (payload: unknown): Message[] => {
  if (!Array.isArray(payload)) return []

  return payload
    .map((raw, index): Message | null => {
      if (!raw || typeof raw !== 'object') return null
      const item = raw as HistoryApiMessage
      const type = item.type === 'assistant' ? 'assistant' : item.type === 'user' ? 'user' : null
      if (!type) return null

      const id =
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim()
          : `history-${Date.now()}-${index}`

      const timestamp =
        typeof item.timestamp === 'string' && item.timestamp.trim()
          ? new Date(item.timestamp)
          : new Date()

      if (type === 'user') {
        const content =
          typeof item.content === 'string' && item.content.trim()
            ? item.content
            : typeof item.answer === 'string'
              ? item.answer
              : ''
        return { id, type, content, timestamp }
      }

      const answer =
        typeof item.answer === 'string' && item.answer.trim()
          ? item.answer
          : typeof item.content === 'string'
            ? item.content
            : ''

      return {
        id,
        type,
        timestamp,
        answer,
        source: typeof item.source === 'string' && item.source.trim() ? item.source : undefined,
        confidence: toConfidencePercent(item.confidence),
        noData: !answer,
      }
    })
    .filter((msg): msg is Message => Boolean(msg))
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

const generateSessionId = () => {
  const randomPart = Math.random().toString(36).slice(2, 8)
  return `session-${Date.now()}-${randomPart}`
}

// ---------------------------------------------------------------------------
// Recent chats helpers
// ---------------------------------------------------------------------------

const getRecentChats = (): RecentChatItem[] => {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(RECENT_CHATS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as RecentChatItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveRecentChats = (recentChats: RecentChatItem[]) => {
  localStorage.setItem(RECENT_CHATS_STORAGE_KEY, JSON.stringify(recentChats.slice(0, 8)))
  window.dispatchEvent(new Event('ray_recent_chats_updated'))
}

const getChatTitle = (question: string) => {
  const trimmed = question.trim()
  if (!trimmed) return 'New Chat'
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatInterface({ role, selectedSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [lastPayload, setLastPayload] = useState<{
    chatInput: string
    sessionId: string
    role: Role
  } | null>(null)
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  // Metadata expansion state
  const [expandedMetadata, setExpandedMetadata] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Role-based theme (restores per-role colors from original UI)
  // -------------------------------------------------------------------------

  const roleTheme =
    role === 'executive'
      ? {
          icon: 'text-cyan-600',
          border: 'border-cyan-200',
          hover: 'hover:border-cyan-400',
          title: 'text-cyan-600',
          badge: 'bg-cyan-600 text-white',
        }
      : role === 'admin'
      ? {
          icon: 'text-cyan-600',
          border: 'border-cyan-200',
          hover: 'hover:border-cyan-400',
          title: 'text-cyan-600',
          badge: 'bg-cyan-600 text-white',
        }
      : {
          icon: 'text-cyan-600',
          border: 'border-border',
          hover: 'hover:border-cyan-400',
          title: 'text-cyan-600',
          badge: 'bg-cyan-600 text-white',
        }

  const suggestionBtn = `p-4 rounded-lg bg-card border ${roleTheme.border} ${roleTheme.hover} hover:shadow-md transition-all cursor-pointer text-left`

  // -------------------------------------------------------------------------
  // File upload handlers
  // -------------------------------------------------------------------------

  const handleFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = []
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        newFiles.push({ name: file.name, type: file.type, size: file.size, dataUrl })
        if (newFiles.length === Math.min(files.length, 5)) {
          setUploadedFiles((prev) => [...prev, ...newFiles])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // -------------------------------------------------------------------------
  // Fetch history — role is part of the URL path for isolation
  // GET /api/chat/history/:role/:sessionId
  // -------------------------------------------------------------------------

  const fetchSessionHistory = async (targetRole: Role, targetSessionId: string) => {
    const response = await fetch(
      `/api/chat/history/${encodeURIComponent(targetRole)}/${encodeURIComponent(targetSessionId)}`,
      { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' },
    )

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok) {
      const details = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '')
      const message =
        typeof details === 'string'
          ? details
          : details?.error || details?.details || 'Failed to load session history.'
      throw { status: response.status, message }
    }

    if (!contentType.includes('application/json')) {
      throw { status: response.status, message: 'History endpoint returned non-JSON response.' }
    }

    const data = await response.json().catch(() => null)
    return mapHistoryMessages(data?.messages)
  }

  // -------------------------------------------------------------------------
  // Initialise session on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    setCookie(LEGACY_HISTORY_COOKIE_KEY, '', 0)

    const savedSession = getCookie(SESSION_COOKIE_KEY)?.trim()
    const activeSession = savedSession || generateSessionId()

    setSessionId(activeSession)
    setCookie(SESSION_COOKIE_KEY, activeSession)

    const savedHistory = getCookie(getHistoryCookieKey(role))
    let hasCookieHistory = false

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as SerializedMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasCookieHistory = true
          setMessages(deserializeMessages(parsed))
        }
      } catch {
        // ignore malformed cookie
      }
    }

    void (async () => {
      try {
        const restoredMessages = await fetchSessionHistory(role, activeSession)
        if (restoredMessages.length === 0) return
        setMessages(restoredMessages)
        setCookie(getHistoryCookieKey(role), JSON.stringify(serializeMessages(restoredMessages)))
      } catch {
        if (!hasCookieHistory) setMessages([])
      }
    })()
  }, [role])

  // -------------------------------------------------------------------------
  // Load a selected session from the sidebar
  // -------------------------------------------------------------------------

  useEffect(() => {
    const normalizedSelectedSession = selectedSessionId?.trim()
    if (!normalizedSelectedSession) return
    if (normalizedSelectedSession === sessionId && messages.length > 0) return

    setError(null)
    setErrorStatus(null)

    void (async () => {
      try {
        const restoredMessages = await fetchSessionHistory(role, normalizedSelectedSession)
        setSessionId(normalizedSelectedSession)
        setMessages(restoredMessages)
        setChatInput('')
        setLastPayload(null)
        setCookie(SESSION_COOKIE_KEY, normalizedSelectedSession)
        setCookie(getHistoryCookieKey(role), JSON.stringify(serializeMessages(restoredMessages)))
      } catch (err: unknown) {
        const parsedError = err as { status?: number; message?: string }
        setError(parsedError.message || 'Failed to load selected chat history.')
        setErrorStatus(parsedError.status || 500)
      }
    })()
  }, [selectedSessionId, role])

  useEffect(() => {
    if (sessionId.trim()) setCookie(SESSION_COOKIE_KEY, sessionId.trim())
  }, [sessionId])

  useEffect(() => {
    if (messages.length > 0) {
      setCookie(getHistoryCookieKey(role), JSON.stringify(serializeMessages(messages)))
    }
  }, [messages, role])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  // -------------------------------------------------------------------------
  // Parse assistant response
  // -------------------------------------------------------------------------

  const parseAssistantMessage = (data: ApiChatResponse): Message => {
    if (!data || !data.answer) {
      return {
        id: `msg-${Date.now()}-assistant`,
        type: 'assistant',
        timestamp: new Date(),
        noData: true,
        answer: 'No data returned.',
      }
    }

    const answerValue = typeof data.answer === 'string' ? data.answer : ''
    const sourceValue =
      typeof data.source === 'string' && data.source.trim() ? data.source.trim() : undefined

    return {
      id: `msg-${Date.now()}-assistant`,
      type: 'assistant',
      timestamp: new Date(),
      answer: answerValue || 'No data returned.',
      source: sourceValue,
      confidence: toConfidencePercent(data.confidence),
      noData: !answerValue,
    }
  }

  // -------------------------------------------------------------------------
  // Send request — role is included in every POST body
  // -------------------------------------------------------------------------

  const runRequest = async (payload: { chatInput: string; sessionId: string; role: Role }) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok) {
      const details = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '')
      const msg =
        typeof details === 'string'
          ? details
          : details?.error || details?.details || 'Request failed'
      const error = new Error(msg) as ApiRequestError
      error.status = response.status
      throw error
    }

    if (!contentType.includes('application/json')) {
      const error = new Error('Received non-JSON response from server.') as ApiRequestError
      error.status = response.status
      throw error
    }

    return response.json() as Promise<ApiChatResponse>
  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleSend()
  }

  const handleSend = async () => {
    if (isLoading) return

    const normalizedQuestion = chatInput.trim()
    if (!normalizedQuestion && uploadedFiles.length === 0) {
      setError('Please enter your question.')
      setErrorStatus(400)
      return
    }

    const normalizedSession = sessionId.trim() || generateSessionId()
    if (!sessionId.trim()) {
      setSessionId(normalizedSession)
      setCookie(SESSION_COOKIE_KEY, normalizedSession)
    }

    setError(null)
    setErrorStatus(null)

    const payload = { chatInput: normalizedQuestion, sessionId: normalizedSession, role }
    setLastPayload(payload)

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: normalizedQuestion,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setUploadedFiles([])
    setIsLoading(true)

    try {
      const data = await runRequest(payload)
      const assistantMessage = parseAssistantMessage(data)
      setMessages((prev) => [...prev, assistantMessage])

      const recentChats = getRecentChats()
      const existingIndex = recentChats.findIndex(
        (item) => item.sessionId === normalizedSession && item.role === role,
      )
      const chatItem: RecentChatItem = {
        id: existingIndex >= 0 ? recentChats[existingIndex].id : `recent-${Date.now()}`,
        sessionId: normalizedSession,
        role,
        title: getChatTitle(normalizedQuestion),
        updatedAt: new Date().toISOString(),
      }

      const updatedRecentChats =
        existingIndex >= 0
          ? [chatItem, ...recentChats.filter((item) => item.sessionId !== normalizedSession || item.role !== role)]
          : [chatItem, ...recentChats]

      saveRecentChats(updatedRecentChats)
    } catch (err: unknown) {
      const parsedError = err as ApiRequestError
      const message = parsedError?.message || 'Failed to get response from the server.'
      const status = parsedError?.status || 500
      if (status >= 500 || !parsedError?.status) console.error('Error sending message:', err)
      setError(message)
      setErrorStatus(status)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!lastPayload || isLoading) return
    setError(null)
    setErrorStatus(null)
    setIsLoading(true)
    try {
      const data = await runRequest(lastPayload)
      const assistantMessage = parseAssistantMessage(data)
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: unknown) {
      const parsedError = err as { status?: number; message?: string }
      setError(parsedError.message || 'Failed to get response from the server.')
      setErrorStatus(parsedError.status || 500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunAgain = () => {
    setMessages([])
    setChatInput('')
    setUploadedFiles([])
    const newSession = generateSessionId()
    setSessionId(newSession)
    setCookie(SESSION_COOKIE_KEY, newSession)
    setCookie(getHistoryCookieKey(role), '', 0)
    setError(null)
    setErrorStatus(null)
    setLastPayload(null)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const containerClass = `flex-1 flex flex-col h-full ${role === 'executive' ? 'bg-[#faf9fb]' : 'bg-background'}`

  return (
    <div className={containerClass}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        {messages.length === 0 ? (
          // -----------------------------------------------------------------
          // Empty state — role-specific welcome + suggestion cards
          // -----------------------------------------------------------------
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
            <RayMascot size="xl" role={role} className="mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-3">
              <span className={roleTheme.title}>Hey!</span> I am Ray :)
            </h2>
            <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
              {role === 'executive'
                ? 'Your AI executive assistant for insights, analysis, and strategic intelligence. Ask me anything about your organization, performance, risks, or knowledge base.'
                : role === 'admin'
                ? "I'm your AI assistant for managing your organization. Ask me anything about users, tickets, systems, reports, or settings."
                : "I'm your AI assistant for support and information. Ask me anything about your work, tickets, or organization."}
            </p>

            {/* Role-specific suggestion cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
              {role === 'executive' && (
                <>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>📈</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Executive Overview</h3>
                    <p className="text-xs text-muted-foreground">Show me the executive overview for this month</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>🛡️</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Top Risks</h3>
                    <p className="text-xs text-muted-foreground">What are the top risks that need attention?</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>👥</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Performance Trends</h3>
                    <p className="text-xs text-muted-foreground">Compare department performance trends</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>📋</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Highlights</h3>
                    <p className="text-xs text-muted-foreground">Summarize recent operational highlights</p>
                  </button>
                </>
              )}
              {role === 'admin' && (
                <>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>📊</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">System Insights</h3>
                    <p className="text-xs text-muted-foreground">Get real-time insights and performance overview</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>📋</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">User & Access</h3>
                    <p className="text-xs text-muted-foreground">Manage users, roles, permissions and access</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>🛡️</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Alerts & Risks</h3>
                    <p className="text-xs text-muted-foreground">Monitor risks, alerts and system anomalies</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>⚙️</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Automation</h3>
                    <p className="text-xs text-muted-foreground">Configure workflows and automation rules</p>
                  </button>
                </>
              )}
              {role === 'employee' && (
                <>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>🎫</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">My Tickets</h3>
                    <p className="text-xs text-muted-foreground">View and manage my support tickets</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>📚</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Knowledge Base</h3>
                    <p className="text-xs text-muted-foreground">Search documentation and resources</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>👤</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Profile</h3>
                    <p className="text-xs text-muted-foreground">Manage my profile and preferences</p>
                  </button>
                  <button className={suggestionBtn}>
                    <div className={`${roleTheme.icon} text-2xl mb-2`}>❓</div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">Help</h3>
                    <p className="text-xs text-muted-foreground">Get help and support resources</p>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          // -----------------------------------------------------------------
          // Message list
          // -----------------------------------------------------------------
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <RayMascot size="sm" role={role} className="mr-3 flex-shrink-0" />
              )}
              <Card
                className={`${
                  message.type === 'user'
                    ? 'max-w-md bg-primary text-primary-foreground rounded-3xl rounded-tr-sm'
                    : 'max-w-[85%] md:max-w-3xl bg-card border shadow-sm rounded-3xl rounded-tl-sm'
                }`}
              >
                <div className="p-4">
                  {/* User message */}
                  {message.type === 'user' && (
                    <>
                      <p className="text-sm leading-relaxed">{message.content}</p>

                      {/* File attachments on user message */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                          <div className="text-xs font-semibold opacity-70 mb-2">Attached Files</div>
                          <div className="space-y-2">
                            {message.files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded bg-white/10">
                                {file.type.startsWith('image/') ? (
                                  <img src={file.dataUrl} alt={file.name} className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <FileText className="h-4 w-4 opacity-70 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs truncate block">{file.name}</span>
                                  <span className="text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Assistant message */}
                  {message.type === 'assistant' && (
                    <div className="space-y-2">
                      {/* Main answer rendered as Markdown */}
                      <div className="text-sm leading-relaxed font-medium prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.answer || ''}
                        </ReactMarkdown>
                      </div>

                      {/* Source */}
                      {message.source && (
                        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                          Source: {message.source}
                        </p>
                      )}

                      {/* Confidence — progress bar style */}
                      {typeof message.confidence === 'number' && Number.isFinite(message.confidence) && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-semibold text-primary">{message.confidence}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-full rounded-full transition-all"
                              style={{ width: `${message.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Processing metadata — expandable */}
                      {message.metadata && (
                        <>
                          <button
                            onClick={() =>
                              setExpandedMetadata(expandedMetadata === message.id ? null : message.id)
                            }
                            className="pt-2 border-t border-border flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full justify-between"
                          >
                            <span>Processing Details</span>
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                expandedMetadata === message.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedMetadata === message.id && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>⏱ Processing: {message.metadata.processingTime}ms</div>
                              <div>🔑 Keywords: {message.metadata.keywords.join(', ')}</div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Validated badge */}
                      {message.validated && (
                        <div className="pt-2 border-t border-border">
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                            ✓ Validated
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))
        )}

        {/* Error card */}
        {error && (
          <div className="flex justify-start">
            <Card className="max-w-md bg-destructive/5 border-destructive/30 shadow-sm rounded-3xl rounded-tl-sm p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-destructive">Request failed</p>
                <p className="text-sm text-foreground">{error}</p>
                {errorStatus && (
                  <p className="text-xs text-muted-foreground">Status: {errorStatus}</p>
                )}
                <Button size="sm" variant="outline" onClick={handleRetry} disabled={isLoading || !lastPayload}>
                  Retry
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Loading indicator — role-specific text and mascot image */}
        {isLoading && (
          <div className="flex justify-start items-center gap-3">
            <RayMascot
              size="sm"
              role={role}
              className="flex-shrink-0"
              imageSrc={
                role === 'admin'
                  ? '/ray-admin1.png'
                  : role === 'executive'
                  ? '/ray-executive1.png'
                  : undefined
              }
            />
            <Card className="bg-card border shadow-sm rounded-3xl rounded-tl-sm p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {role === 'executive'
                    ? 'Capt RAY is thinking...'
                    : role === 'admin'
                    ? 'Admin RAY is thinking...'
                    : 'RAY is thinking...'}
                </span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-muted/30 w-full space-y-3">

        {/* File previews */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs text-foreground max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => handleRemoveFile(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`flex gap-3 w-full transition-all ${
            dragActive ? 'ring-2 ring-primary bg-primary/5 rounded-lg p-2' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            title="Upload files"
          >
            <Upload className="h-4 w-4 text-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              uploadedFiles.length > 0
                ? 'Add a message...'
                : 'Ask RAY anything... (or drag files here)'
            }
            disabled={isLoading}
            className="rounded-full bg-background"
          />

          <Button
            type="submit"
            disabled={isLoading || (!chatInput.trim() && uploadedFiles.length === 0)}
            size="icon"
            className="rounded-full flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {/* Run again button */}
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={handleRunAgain}
            disabled={isLoading}
            className="rounded-full text-xs"
          >
            Run again
          </Button>
        </div>
      </div>
    </div>
  )
}