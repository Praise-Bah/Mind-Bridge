import { cn } from '@/lib/utils'
import AIAvatar from './AIAvatar'
import type { AIMessage } from '@/types'

interface ChatMessageProps {
  message: AIMessage
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isUser && <AIAvatar size="sm" animated={isStreaming} />}
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-gradient-to-r from-[#0EA5E9] to-[#00D4FF] text-white rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </p>
        <span
          className={cn(
            'text-[10px] mt-1 block',
            isUser ? 'text-white/70 text-right' : 'text-muted-foreground'
          )}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
