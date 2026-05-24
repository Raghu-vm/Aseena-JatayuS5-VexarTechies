'use client'

import { Button } from '@/components/ui/button'
import { Plus, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopNavigationProps {
  user: any
  onNewChat: () => void
  onLogout: () => void
}

export function TopNavigation({
  user,
  onNewChat,
  onLogout,
}: TopNavigationProps) {
  return (
    <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        {/* Left - Title */}
        <h2 className="text-xl font-semibold text-foreground">Chat</h2>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            className="rounded-full gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground">
                    {user?.username}
                  </div>
                  <div className="text-xs">{user?.email}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
