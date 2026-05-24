'use client'

import { useState } from 'react'
import LoginForm, { type LoginPayload } from './login-form'
import { authenticateUser } from '@/lib/auth-data'

interface AuthPageProps {
  onLoginSuccess: (user: any) => void
  onSwitchToSignup?: () => void
  onBack?: () => void
  notice?: string
}

export default function AuthPage({
  onLoginSuccess,
  onSwitchToSignup,
  onBack,
  notice,
}: AuthPageProps) {
  const [error, setError] = useState('')

  const handleLogin = (payload: LoginPayload) => {
    setError('')
    // authenticateUser matches either username OR email, so existing seed
    // accounts AND new sign-ups both work with the same Username field.
    const user = authenticateUser(payload.username, payload.password)
    if (!user) {
      setError('Invalid username or password.')
      return
    }
    onLoginSuccess({ ...user, role: payload.role })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LoginForm
        onSubmit={handleLogin}
        error={error}
        notice={notice}
        onSwitchToSignup={onSwitchToSignup}
        onBack={onBack}
      />
    </div>
  )
}
