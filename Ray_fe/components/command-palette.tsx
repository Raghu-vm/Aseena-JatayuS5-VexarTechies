'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, MessageCircle, FileText, BarChart3, Settings, Zap, LogOut } from 'lucide-react'

interface Command {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: Command[]
}

export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onOpenChange(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }

  const handleExecuteCommand = (command: Command) => {
    command.action()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
        <div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            />
            <kbd className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p>No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => handleExecuteCommand(command)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {command.icon}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{command.label}</div>
                        <div className="text-xs text-muted-foreground">{command.category}</div>
                      </div>
                    </div>
                    {command.shortcut && (
                      <kbd className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded hidden sm:block">
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground flex justify-between">
            <span>⏎ to execute</span>
            <span>↑ ↓ to navigate</span>
          </div>
        </div>
      </div>
    </>
  )
}
