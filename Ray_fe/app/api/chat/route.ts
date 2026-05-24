import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'employee' | 'admin' | 'executive'
type Command = 'default' | 'search' | 'create' | 'database'

const VALID_ROLES: Role[] = ['employee', 'admin', 'executive']

// ---------------------------------------------------------------------------
// Webhook configuration
// Each role has its own set of backends per command.
// Employee URLs are live. Admin / Executive URLs are clearly marked as
// placeholders — replace each array with your real URLs when those backends
// are ready. The fallback logic (tries each URL in order) is preserved.
// ---------------------------------------------------------------------------

const WEBHOOK_CONFIG: Record<Role, Record<Command, string[]>> = {
  employee: {
    default: [
      'http://127.0.0.1:8000/ray-rag-model',
      'http://127.0.0.1:8001/ray-rag-model',
      'http://127.0.0.1:8010',
      'http://localhost:5678/webhook-test/ray-rag-model',
      'http://localhost:5678/webhook/ray-rag-model',
    ],
    search: ['http://127.0.0.1:8001/ray-search'],
    create: ['http://127.0.0.1:8003/create-webhook'],
    database: ['http://127.0.0.1:9002/database-webhook'],
  },
  admin: {
    default: ['http://127.0.0.1:REPLACE_PORT/admin-rag-model'],
    search: ['http://127.0.0.1:8001/ray-search'],
    create: ['http://127.0.0.1:8003/create-webhook'],
    database: ['http://127.0.0.1:REPLACE_PORT/admin-database'],
  },
  executive: {
    default: ['http://127.0.0.1:REPLACE_PORT/executive-rag-model'],
    search: ['http://127.0.0.1:8001/ray-search'],
    create: ['http://127.0.0.1:8003/create-webhook'],
    database: ['http://127.0.0.1:REPLACE_PORT/executive-database'],
  },
}

// Slash-command token → Command key mapping (shared across all roles)
const COMMAND_MAP: Record<string, Command> = {
  search: 'search',
  create: 'create',
  database: 'database',
}

// ---------------------------------------------------------------------------
// Webhook response normalizer (unchanged from original)
// ---------------------------------------------------------------------------

const getByPath = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((acc: any, key) => {
    if (acc == null) return undefined
    return acc[key]
  }, obj as any)
}

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.trim().replace('%', '')
    const parsed = Number(cleaned)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const tryParseJsonString = (value: unknown): unknown => {
  const text = asString(value)
  if (!text) return value
  const trimmed = text.trim()
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const collectNestedObjects = (
  input: unknown,
  depth = 0,
  maxDepth = 6,
  out: Record<string, unknown>[] = [],
) => {
  if (depth > maxDepth) return out
  if (Array.isArray(input)) {
    for (const item of input) collectNestedObjects(item, depth + 1, maxDepth, out)
    return out
  }
  if (!isObject(input)) return out
  out.push(input)
  for (const value of Object.values(input)) {
    collectNestedObjects(value, depth + 1, maxDepth, out)
  }
  return out
}

const normalizeWebhookResponse = (payload: unknown) => {
  const roots = Array.isArray(payload) ? payload : [payload]
  const deepObjects = collectNestedObjects(payload).map(tryParseJsonString).filter(isObject)

  const answerPaths = [
    'answer', 'reply', 'output', 'response', 'text', 'message', 'content',
    'data.answer', 'data.reply', 'data.output', 'data.response',
    'result.answer', 'result.reply', 'result.output', 'result.response',
    'json.answer', 'json.reply', 'json.output', 'json.response',
  ]

  let answer = ''
  let source: string | undefined
  let confidence: number | undefined

  for (let i = roots.length - 1; i >= 0; i -= 1) {
    const root = roots[i]
    const candidateRoots = [
      root,
      getByPath(root, 'json'),
      getByPath(root, 'data'),
      getByPath(root, 'result'),
    ]
      .map(tryParseJsonString)
      .filter(Boolean)

    let currentAnswer = ''
    let currentSource: string | undefined
    let currentConfidence: number | undefined

    for (const current of candidateRoots) {
      for (const path of answerPaths) {
        const value = asString(getByPath(current, path))
        if (value && value.length >= currentAnswer.length) {
          currentAnswer = value
        }
      }

      currentSource =
        currentSource ||
        asString(getByPath(current, 'source')) ||
        asString(getByPath(current, 'data.source')) ||
        asString(getByPath(current, 'result.source')) ||
        asString(getByPath(current, 'metadata.file_title')) ||
        asString(getByPath(current, 'metadata.title'))

      if (!currentSource) {
        const sources = getByPath(current, 'sources')
        if (Array.isArray(sources) && sources.length > 0) {
          const first = sources[0] as any
          if (typeof first === 'string' && first.trim()) {
            currentSource = first.trim()
          } else if (first && typeof first === 'object') {
            currentSource =
              asString(first.title) ||
              asString(first.file_title) ||
              asString(first.name) ||
              asString(first.source) ||
              asString(first.metadata?.file_title) ||
              asString(first.metadata?.title) ||
              asString(first.metadata?.name) ||
              asString(first.document?.metadata?.file_title)

            currentConfidence =
              currentConfidence ||
              asNumber(first.confidence) ||
              asNumber(first.score) ||
              asNumber(first.relevance_score) ||
              asNumber(first.metadata?.score)
          }
        }
      }

      currentConfidence =
        currentConfidence ||
        asNumber(getByPath(current, 'confidence')) ||
        asNumber(getByPath(current, 'data.confidence')) ||
        asNumber(getByPath(current, 'result.confidence')) ||
        asNumber(getByPath(current, 'score')) ||
        asNumber(getByPath(current, 'data.score'))
    }

    if (currentAnswer) {
      answer = currentAnswer
      source = currentSource
      confidence = currentConfidence
      break
    }
  }

  if (!source) {
    for (const obj of deepObjects) {
      source =
        asString(obj.source) ||
        asString(obj.file_title) ||
        asString(obj.document_title) ||
        asString(obj.title) ||
        asString(getByPath(obj, 'metadata.file_title')) ||
        asString(getByPath(obj, 'metadata.title')) ||
        asString(getByPath(obj, 'document.metadata.file_title'))
      if (source) break
    }
  }

  if (confidence === undefined) {
    for (const obj of deepObjects) {
      confidence =
        asNumber(obj.confidence) ||
        asNumber(obj.score) ||
        asNumber(obj.relevance_score) ||
        asNumber(obj.similarity_score) ||
        asNumber(getByPath(obj, 'metadata.score'))
      if (confidence !== undefined) break
    }
  }

  return { answer, source, confidence, raw: payload }
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chatInput: chatInputRaw, sessionId, role: roleRaw } = body

    // --- Validate required fields ---
    if (!chatInputRaw || !sessionId) {
      return NextResponse.json(
        { error: 'chatInput and sessionId are required' },
        { status: 400 },
      )
    }

    // --- Validate role ---
    const role = (typeof roleRaw === 'string' ? roleRaw.toLowerCase() : '') as Role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role "${roleRaw}". Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      )
    }

    // --- Parse optional slash command ---
    let chatInput = String(chatInputRaw).trim()
    let command: Command = 'default'
    let useCommandPayload = false

    if (chatInput.startsWith('/')) {
      const parts = chatInput.split(/\s+/)
      const token = parts[0].slice(1).toLowerCase()

      if (token && COMMAND_MAP[token]) {
        command = COMMAND_MAP[token]
        chatInput = chatInput.slice(parts[0].length).trim()
        useCommandPayload = true

        if (!chatInput) {
          return NextResponse.json(
            { error: `Command /${token} requires a query or message` },
            { status: 400 },
          )
        }
      }
    }

    // --- Select webhook URLs for this role + command ---
    const selectedWebhooks = WEBHOOK_CONFIG[role][command]

    const buildRequestBody = () =>
      useCommandPayload
        ? { message: chatInput, sessionId }
        : { chatInput, sessionId }

    // --- Try each webhook URL in order (same fallback logic as before) ---
    let response: Response | null = null
    let errorText = ''

    for (const webhookUrl of selectedWebhooks) {
      let candidate: Response
      try {
        candidate = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody()),
        })
      } catch (fetchError) {
        errorText = fetchError instanceof Error ? fetchError.message : 'Failed to reach webhook'
        continue
      }

      if (candidate.ok) {
        response = candidate
        break
      }

      const candidateError = await candidate.text().catch(() => '')
      errorText = candidateError || `Webhook call failed with status ${candidate.status}`
    }

    if (!response) {
      console.error(`[${role}/${command}] Webhook error:`, errorText)
      return NextResponse.json(
        { error: 'Failed to get response from webhook', details: errorText },
        { status: 502 },
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const raw = await response.text()
      return NextResponse.json(
        { error: 'Webhook returned non-JSON response', details: raw },
        { status: 502 },
      )
    }

    const data = await response.json()
    const normalized = normalizeWebhookResponse(data)
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Error in chat API route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
