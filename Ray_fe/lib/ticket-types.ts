export type TicketStatus = 'open' | 'on-hold' | 'in-progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  department: string
  assignee?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
  resolutionNotes?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  title: string
  phone: string
  bio: string
}
