export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'employee' | 'executive'
  department?: string
  fullName?: string
  company?: string
  createdAt: Date
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export type UserRole = User['role']
