import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StreamingTextProps {
  content: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export default function StreamingText({
  content,
  speed = 30,
  className,
  onComplete,
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!content) {
      setDisplayedContent('')
      setIsComplete(false)
      return
    }

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [content, speed, onComplete])

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {displayedContent}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
      )}
    </span>
  )
}
