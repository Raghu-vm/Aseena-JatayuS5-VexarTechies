'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  FileText,
  BarChart3,
  Settings,
  Trash2,
  ChevronDown,
  Ticket,
  Shield,
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  user?: any
  onLogout?: () => void
}

export function Sidebar({ activeTab, onTabChange, user, onLogout }: SidebarProps) {
  const [chatHistory, setChatHistory] = useState([
    { id: '1', title: 'Workflow Questions' },
    { id: '2', title: 'Data Analysis' },
    { id: '3', title: 'RAY Features' },
  ])

  const baseNavItems: NavItem[] = [
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" />, href: '/' },
    { id: 'ray-desk', label: 'RAY Desk', icon: <Ticket className="h-5 w-5" />, href: '/ray-desk' },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileText className="h-5 w-5" />, href: '/knowledge' },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  ]

  const adminNavItems: NavItem[] = [
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" />, href: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard' },
    { id: 'ray-desk', label: 'RAY Desk', icon: <Ticket className="h-5 w-5" />, href: '/ray-desk' },
    { id: 'knowledge', label: 'Knowledge Base', icon: <FileText className="h-5 w-5" />, href: '/knowledge' },
    { id: 'user-mgmt', label: 'User Management', icon: <Shield className="h-5 w-5" />, href: '/admin' },
    { id: 'settings', label: 'System Settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  ]

  const executiveNavItems: NavItem[] = [
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" />, href: '/' },
    { id: 'dashboard', label: 'Executive Overview', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard' },
    { id: 'ops', label: 'Operational Intelligence', icon: <Ticket className="h-5 w-5" />, href: '/ray-desk' },
    { id: 'knowledge', label: 'Knowledge Governance', icon: <FileText className="h-5 w-5" />, href: '/knowledge' },
    { id: 'alerts', label: 'Alerts & Risks', icon: <Shield className="h-5 w-5" />, href: '/alerts' },
    { id: 'audit', label: 'Audit Logs', icon: <FileText className="h-5 w-5" />, href: '/audit' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  ]

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return adminNavItems
    }
    if (user?.role === 'executive') {
      return executiveNavItems
    }
    return baseNavItems
  }

  const theme = user?.role === 'executive'
    ? {
        container: 'bg-cyan-950 text-cyan-100',
        border: 'border-cyan-800',
        button: 'text-cyan-100',
        muted: 'text-cyan-300',
        active: 'bg-cyan-700 text-white',
        hover: 'text-cyan-100 hover:bg-cyan-800 hover:text-white',
        footerBg: 'bg-cyan-900/80',
        footerText: 'text-cyan-100',
      }
    : user?.role === 'admin'
    ? {
        container: 'bg-slate-950 text-slate-100',
        border: 'border-slate-800',
        button: 'text-slate-100',
        muted: 'text-slate-400',
        active: 'bg-slate-800 text-white',
        hover: 'text-slate-200 hover:bg-slate-800 hover:text-white',
        footerBg: 'bg-slate-900/90',
        footerText: 'text-slate-100',
      }
    : {
        container: 'bg-sidebar text-sidebar-foreground',
        border: 'border-sidebar-border',
        button: 'text-sidebar-foreground',
        muted: 'text-muted-foreground',
        active: 'bg-sidebar-accent text-sidebar-accent-foreground',
        hover: 'text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-20',
        footerBg: 'bg-sidebar-accent/30',
        footerText: 'text-sidebar-foreground',
      }

  const sidebarImageByRole: Record<'admin' | 'executive' | 'employee', string> = {
    admin: '/ray-admin1.png',
    executive: '/ray-executive1.png',
    employee: '/ray-sidebar.png',
  }

  const sidebarImageSrc = user?.role ? sidebarImageByRole[user.role as 'admin' | 'executive' | 'employee'] ?? '/ray-sidebar.png' : '/ray-sidebar.png'

  const title = user?.role === 'executive' ? 'Executive RAY' : user?.role === 'admin' ? 'Admin RAY' : 'RAY'
  const subtitle = user?.role === 'executive' ? 'Executive AI Assistant' : user?.role === 'admin' ? 'Admin AI Assistant' : 'AI Assistant'

  const navItems = getNavItems()

  return (
    <div className={`w-72 ${theme.container} border-r ${theme.border} flex flex-col h-full`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme.border}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Image
              src={sidebarImageSrc}
              alt={`${title} icon`}
              width={80}
              height={80}
              priority
              className="w-16 h-16"
            />
          </div>
          <div className="flex-1">
            <h1 className={`font-bold ${theme.button} text-lg`}>{title}</h1>
            <p className={`text-xs ${theme.muted}`}>{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2 mb-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? `${theme.active} font-medium`
                  : `${theme.button} ${theme.hover}`
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="mb-6">
          <h3 className={`text-xs font-semibold uppercase tracking-wide px-4 mb-3 ${theme.muted}`}>
            Recent Chats
          </h3>
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 px-4 py-2 rounded-lg ${theme.hover} cursor-pointer transition-colors`}
              >
                <MessageCircle className="h-4 w-4 text-current flex-shrink-0" />
                <span className={`text-sm ${theme.button} truncate flex-1`}>
                  {chat.title}
                </span>
                <button
                  onClick={() =>
                    setChatHistory(chatHistory.filter((c) => c.id !== chat.id))
                  }
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={`border-t ${theme.border} p-4 space-y-4`}>
        {user && (
          <div className={`${theme.footerBg} rounded-lg p-3 space-y-2`}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${theme.footerText}`}>{user.username}</p>
                <p className={`text-xs ${theme.muted} capitalize`}>{user.role}</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="w-full text-xs justify-start"
            >
              <span>Logout</span>
            </Button>
          </div>
        )}
        <div className="text-xs text-muted-foreground text-center">
          <p>RAY v1.0</p>
          <p>Powered by Vexar Tech</p>
        </div>
      </div>
    </div>
  )
}
