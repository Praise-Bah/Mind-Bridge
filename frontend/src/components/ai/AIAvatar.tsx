import { cn } from '@/lib/utils'

interface AIAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export default function AIAvatar({ size = 'md', animated = true, className }: AIAvatarProps) {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
  }

  const imageClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-19 h-19',
  }

  return (
    <div
      className={cn(
        'relative rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center',
        sizeClasses[size],
        animated && 'animate-pulse-slow',
        className
      )}
    >
      <div className="absolute inset-0.5 rounded-full bg-background flex items-center justify-center">
        <img
          src="/logo.png"
          alt="MindBridge logo"
          className={cn('rounded-full object-contain', imageClasses[size])}
        />
      </div>
    </div>
  )
}
