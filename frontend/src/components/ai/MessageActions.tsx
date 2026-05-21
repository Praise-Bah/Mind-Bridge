import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  messageId: string
  onRegenerate?: () => void
  onRate?: (rating: 'up' | 'down') => void
  className?: string
}

export default function MessageActions({
  content,
  messageId,
  onRegenerate,
  onRate,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState<'up' | 'down' | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleRate = (newRating: 'up' | 'down') => {
    if (rating === newRating) {
      setRating(null)
      return
    }
    setRating(newRating)
    onRate?.(newRating)
  }

  return (
    <div className={cn('flex items-center gap-1 mt-2', className)}>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={() => handleRate('up')}
        className={cn(
          'p-1.5 rounded-md hover:bg-muted transition-colors',
          rating === 'up'
            ? 'text-green-500'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Good response"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleRate('down')}
        className={cn(
          'p-1.5 rounded-md hover:bg-muted transition-colors',
          rating === 'down'
            ? 'text-red-500'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Bad response"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Regenerate response"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
