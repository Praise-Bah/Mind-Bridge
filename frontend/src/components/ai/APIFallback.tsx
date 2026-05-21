import { useNavigate } from 'react-router-dom'
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface APIFallbackProps {
  onRetry: () => void
  isRetrying?: boolean
  className?: string
}

export default function APIFallback({
  onRetry,
  isRetrying = false,
  className,
}: APIFallbackProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        AI Companion Unavailable
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        We're having trouble connecting to our AI service. 
        You can try again or chat with one of our professionals instead.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:opacity-90 transition-opacity',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>

        <button
          onClick={() => navigate('/professionals')}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Talk to Professional
        </button>
      </div>
    </div>
  )
}
