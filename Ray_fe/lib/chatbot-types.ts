/**
 * Chatbot query telemetry.
 *
 * One record per question a user asks RAY. The dashboard reads this data
 * to compute deflection rate, confidence, response time, top topics, etc.
 *
 * Right now it's seeded into localStorage via sample-data.ts. When you
 * wire the real Python backend later, swap the source — the dashboard
 * code doesn't change.
 */

export type ChatbotTopic =
  | 'vpn'
  | 'password'
  | 'leave'
  | 'payroll'
  | 'expense'
  | 'onboarding'
  | 'access'
  | 'policy'
  | 'benefits'
  | 'hardware'
  | 'software'
  | 'meeting'
  | 'other'

export const CHATBOT_TOPIC_LABELS: Record<ChatbotTopic, string> = {
  vpn: 'VPN & networking',
  password: 'Password & login',
  leave: 'Leave & time off',
  payroll: 'Payroll & pay',
  expense: 'Expenses & reimbursement',
  onboarding: 'Onboarding',
  access: 'Access & permissions',
  policy: 'Company policies',
  benefits: 'Benefits & insurance',
  hardware: 'Hardware & laptops',
  software: 'Software & tools',
  meeting: 'Meetings & calendar',
  other: 'Other',
}

export interface ChatbotQuery {
  id: string
  userId: string
  userEmail: string
  userRole: 'employee' | 'admin' | 'executive'
  department: string
  question: string
  topic: ChatbotTopic
  wasResolved: boolean        // did RAY answer satisfactorily (no escalation needed)
  confidence: number          // 0.0–1.0 — model's self-reported confidence
  responseTimeMs: number      // how long RAY took to answer
  escalatedToTicket: boolean  // true = user clicked "raise ticket" after
  ticketId?: string           // populated if escalated
  askedAt: Date
}

/** Helper: get all queries from localStorage, deserialising dates. */
export function loadChatbotQueries(): ChatbotQuery[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('ray_chatbot_queries')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ChatbotQuery[]
    return parsed.map((q) => ({ ...q, askedAt: new Date(q.askedAt) }))
  } catch {
    return []
  }
}

export function saveChatbotQueries(queries: ChatbotQuery[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ray_chatbot_queries', JSON.stringify(queries))
}
