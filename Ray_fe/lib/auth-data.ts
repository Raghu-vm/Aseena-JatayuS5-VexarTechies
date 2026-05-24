import { User } from './auth-types'

export const defaultUsers: Array<User & { password: string }> = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@vexartech.com',
    role: 'admin',
    department: 'Management',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    username: 'john.smith',
    password: 'emp123',
    email: 'john.smith@vexartech.com',
    role: 'employee',
    department: 'IT Support',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    username: 'sarah.johnson',
    password: 'emp123',
    email: 'sarah.johnson@vexartech.com',
    role: 'employee',
    department: 'HR',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    username: 'executive',
    password: 'exec123',
    email: 'executive@vexartech.com',
    role: 'executive',
    department: 'Leadership',
    createdAt: new Date('2024-01-10'),
  },
]

export const getStoredUsers = () => {
  if (typeof window === 'undefined') return defaultUsers
  const stored = localStorage.getItem('ray_users')
  return stored ? JSON.parse(stored) : defaultUsers
}

export const saveUsers = (users: any[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('ray_users', JSON.stringify(users))
}

export const authenticateUser = (identifier: string, password: string) => {
  const users = getStoredUsers()
  const user = users.find(
    (u: any) =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password
  )
  return user
    ? { ...user, password: undefined }
    : null
}

export const createNewUser = (
  username: string,
  password: string,
  email: string,
  department: string,
  role: 'admin' | 'employee' | 'executive',
  fullName?: string,
  company?: string
) => {
  const users = getStoredUsers()
  const newUser = {
    id: String(Math.max(...users.map((u: any) => parseInt(u.id) || 0), 0) + 1),
    username,
    password,
    email,
    role,
    department,
    fullName,
    company,
    createdAt: new Date(),
  }
  users.push(newUser)
  saveUsers(users)
  return { ...newUser, password: undefined }
}

export const initializeAuth = () => {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('ray_users')
  if (!stored) {
    localStorage.setItem('ray_users', JSON.stringify(defaultUsers))
  }
}
