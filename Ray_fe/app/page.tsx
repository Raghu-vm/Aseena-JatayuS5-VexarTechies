'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopNavigation } from '@/components/top-navigation'
import { CommandPalette } from '@/components/command-palette'
import { ChatInterface } from '@/components/chat-interface'
import { DashboardPage } from '@/components/dashboard-page'
import { ExecutiveDashboard } from '@/components/executive-dashboard'
import { KnowledgeBasePage } from '@/components/knowledge-base-page'
import { SettingsPage } from '@/components/settings-page'
import { RayDeskPage } from '@/components/ray-desk-page'
import { AdminPanel } from '@/components/admin-panel'
import UserManagement from '@/components/user-management'
import AuthPage from '@/components/auth-page'
import { OperationalIntelligence } from '@/components/operational-intelligence'
import { AlertsRisks } from '@/components/alerts-risks'
import { AuditLogs } from '@/components/audit-logs'
import { Plus, MessageCircle, FileText, BarChart3, Settings, LogOut } from 'lucide-react'

// New landing / signup / OTP screens
import LandingPage from '@/components/ui/LandingPage'
import SignupPage, { SignupFormData } from '@/components/ui/SignupPage'
import OTPPage from '@/components/ui/OTPPage'
import { createNewUser, initializeAuth } from '@/lib/auth-data'

type TabType =
  | 'chat'
  | 'knowledge'
  | 'dashboard'
  | 'settings'
  | 'ray-desk'
  | 'admin'
  | 'user-mgmt'
  | 'alerts'
  | 'audit'
  | 'ops'

// Pre-auth flow: where the unauthenticated user is in the funnel
type PreAuthStep = 'landing' | 'signup' | 'otp' | 'login'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [chatKey, setChatKey] = useState(0)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Pre-auth state — kept in sessionStorage so a hot-reload, refresh, or
  // accidental navigation doesn't dump the user back to the landing page
  // mid-signup. (sessionStorage clears when the tab closes, which is the
  // right behavior for an in-flight signup.)
  const [preAuthStep, setPreAuthStep] = useState<PreAuthStep>('landing')
  const [pendingSignup, setPendingSignup] = useState<SignupFormData | null>(null)
  const [signupError, setSignupError] = useState<string>('')

  useEffect(() => {
    setIsClient(true)
    initializeAuth() // seed default users into localStorage on first run

    // Restore session state in this order:
    //   1. logged-in user (skip pre-auth entirely)
    //   2. in-flight signup (resume on the same step they left off)
    const storedUser = localStorage.getItem('ray_current_user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
      return
    }

    const storedStep = sessionStorage.getItem('ray_preauth_step') as PreAuthStep | null
    if (storedStep === 'signup' || storedStep === 'otp' || storedStep === 'login') {
      setPreAuthStep(storedStep)
    }
    const storedPending = sessionStorage.getItem('ray_pending_signup')
    if (storedPending) {
      try {
        setPendingSignup(JSON.parse(storedPending))
      } catch {
        sessionStorage.removeItem('ray_pending_signup')
      }
    }
  }, [])

  // Mirror preAuthStep / pendingSignup into sessionStorage whenever they change
  // — but only after the initial restore has run (guarded by isClient).
  useEffect(() => {
    if (!isClient) return
    sessionStorage.setItem('ray_preauth_step', preAuthStep)
  }, [preAuthStep, isClient])

  useEffect(() => {
    if (!isClient) return
    if (pendingSignup) {
      sessionStorage.setItem('ray_pending_signup', JSON.stringify(pendingSignup))
    } else {
      sessionStorage.removeItem('ray_pending_signup')
    }
  }, [pendingSignup, isClient])

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isClient) return null

  // -----------------------------------------------------------------
  // PRE-AUTH FLOW: landing → signup → otp, OR landing → login
  // -----------------------------------------------------------------
  if (!currentUser) {
    // Note: we deliberately do NOT reset preAuthStep here. The previous
    // version reset it to 'landing' as soon as a user was created, which
    // caused a race where any re-render hiccup would dump the user back on
    // the landing page mid-login. We reset only on logout.
    const finalizeLogin = (user: any) => {
      if (!user) return
      setPendingSignup(null)
      setSignupError('')
      localStorage.setItem('ray_current_user', JSON.stringify(user))
      setCurrentUser(user)
    }

    if (preAuthStep === 'landing') {
      return (
        <LandingPage
          onSignup={() => {
            setSignupError('')
            setPreAuthStep('signup')
          }}
          onLogin={() => {
            setSignupError('')
            setPreAuthStep('login')
          }}
        />
      )
    }

    if (preAuthStep === 'signup') {
      return (
        <SignupPage
          onBack={() => setPreAuthStep('landing')}
          onSwitchToLogin={() => setPreAuthStep('login')}
          onSubmit={(data) => {
            setPendingSignup(data)
            setPreAuthStep('otp')
          }}
        />
      )
    }

    if (preAuthStep === 'otp' && pendingSignup) {
      return (
        <OTPPage
          email={pendingSignup.email}
          onBack={() => setPreAuthStep('signup')}
          onVerified={() => {
            try {
              const created = createNewUser(
                pendingSignup.username,
                pendingSignup.password,
                pendingSignup.email,
                pendingSignup.company,
                pendingSignup.role,
                pendingSignup.name,
                pendingSignup.company,
              )
              if (!created) {
                throw new Error('createNewUser returned nothing')
              }
              finalizeLogin(created)
            } catch (err) {
              console.error('Failed to create user after OTP:', err)
              setSignupError(
                'We verified your code but couldn\'t finish creating your account. Please try signing in instead.',
              )
              setPreAuthStep('login')
            }
          }}
        />
      )
    }

    // login (default fallback / signup link target)
    return (
      <AuthPage
        notice={signupError}
        onBack={() => setPreAuthStep('landing')}
        onSwitchToSignup={() => setPreAuthStep('signup')}
        onLoginSuccess={(user) => {
          finalizeLogin(user)
        }}
      />
    )
  }

  // -----------------------------------------------------------------
  // AUTHENTICATED FLOW: the existing dashboard shell, untouched.
  // -----------------------------------------------------------------
  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('ray_current_user')
    sessionStorage.removeItem('ray_preauth_step')
    sessionStorage.removeItem('ray_pending_signup')
    setActiveTab('chat')
    setPreAuthStep('landing')
    setPendingSignup(null)
    setSignupError('')
  }

  const handleNewChat = () => {
    setChatKey((prev) => prev + 1)
  }

  const commands = [
    {
      id: 'chat',
      label: 'Open Chat',
      category: 'Navigation',
      icon: <MessageCircle className="h-4 w-4" />,
      action: () => setActiveTab('chat'),
      shortcut: '⌘C',
    },
    {
      id: 'dashboard',
      label: 'Open Dashboard',
      category: 'Navigation',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => setActiveTab('dashboard'),
      shortcut: '⌘D',
    },
    {
      id: 'knowledge',
      label: 'Open Knowledge Base',
      category: 'Navigation',
      icon: <FileText className="h-4 w-4" />,
      action: () => setActiveTab('knowledge'),
      shortcut: '⌘K',
    },
    {
      id: 'settings',
      label: 'Open Settings',
      category: 'Navigation',
      icon: <Settings className="h-4 w-4" />,
      action: () => setActiveTab('settings'),
      shortcut: '⌘,',
    },
    {
      id: 'new-chat',
      label: 'New Chat',
      category: 'Chat',
      icon: <MessageCircle className="h-4 w-4" />,
      action: handleNewChat,
      shortcut: '⌘N',
    },
    {
      id: 'logout',
      label: 'Logout',
      category: 'Account',
      icon: <LogOut className="h-4 w-4" />,
      action: handleLogout,
      shortcut: '⌘L',
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface key={chatKey} role={currentUser?.role ?? 'employee'} />
      case 'ray-desk':
        return <RayDeskPage currentUser={currentUser} />
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminPanel /> : <RayDeskPage currentUser={currentUser} />
      case 'user-mgmt':
        return currentUser?.role === 'admin' ? <UserManagement /> : <RayDeskPage currentUser={currentUser} />
      case 'knowledge':
        return <KnowledgeBasePage role={currentUser?.role} />
      case 'dashboard':
        return currentUser?.role === 'executive' ? <ExecutiveDashboard /> : <DashboardPage currentUser={currentUser} />
      case 'ops':
        return <OperationalIntelligence />
      case 'alerts':
        return <AlertsRisks />
      case 'audit':
        return <AuditLogs />
      case 'settings':
        return <SettingsPage role={currentUser?.role} />
      default:
        return <ChatInterface key={chatKey} role={currentUser?.role ?? 'employee'} />
    }
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabType)}
          user={currentUser}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <TopNavigation user={currentUser} onNewChat={handleNewChat} onLogout={handleLogout} />
          )}
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </div>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        commands={commands}
      />
    </>
  )
}
