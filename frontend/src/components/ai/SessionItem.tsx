import { useState } from 'react'
import { MessageSquare, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AISession } from '@/types'

interface SessionItemProps {
  session: AISession
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}

export default function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: SessionItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted'
        )}
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(session.updated_at)}
            {session.message_count > 0 && ` · ${session.message_count} messages`}
          </p>
        </div>
      </button>

      {onDelete && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className={cn(
              'p-1.5 rounded-md transition-opacity',
              'opacity-0 group-hover:opacity-100',
              'hover:bg-muted'
            )}
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-popover border rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
