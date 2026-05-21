import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import SessionItem from './SessionItem'
import type { AISession } from '@/types'

interface SessionSidebarProps {
  sessions: AISession[]
  currentSessionId?: string
  isOpen: boolean
  onClose: () => void
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  onDeleteSession?: (sessionId: string) => void
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  isOpen,
  onClose,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupSessionsByDate = (sessions: AISession[]) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups: { label: string; sessions: AISession[] }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'This Week', sessions: [] },
      { label: 'Older', sessions: [] },
    ]

    sessions.forEach((session) => {
      const date = new Date(session.updated_at)
      if (date.toDateString() === today.toDateString()) {
        groups[0].sessions.push(session)
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups[1].sessions.push(session)
      } else if (date >= lastWeek) {
        groups[2].sessions.push(session)
      } else {
        groups[3].sessions.push(session)
      }
    })

    return groups.filter((g) => g.sessions.length > 0)
  }

  const groupedSessions = groupSessionsByDate(filteredSessions)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-card border-r',
          'transform transition-transform duration-300 ease-in-out',
          'lg:transform-none flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chat History</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          <button
            onClick={onNewSession}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#00D4FF] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {groupedSessions.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onClick={() => onSelectSession(session.id)}
                    onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
