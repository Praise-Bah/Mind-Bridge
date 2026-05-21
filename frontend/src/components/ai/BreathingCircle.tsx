import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BreathingCircleProps {
  isActive: boolean
  className?: string
}

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2'

const PHASES: { phase: BreathingPhase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4000, label: 'Breathe In' },
  { phase: 'hold1', duration: 7000, label: 'Hold' },
  { phase: 'exhale', duration: 8000, label: 'Breathe Out' },
  { phase: 'hold2', duration: 0, label: '' },
]

export default function BreathingCircle({ isActive, className }: BreathingCircleProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [countdown, setCountdown] = useState(4)

  const currentPhase = PHASES[currentPhaseIndex]

  useEffect(() => {
    if (!isActive) {
      setCurrentPhaseIndex(0)
      setCountdown(4)
      return
    }

    const phaseTimer = setInterval(() => {
      setCurrentPhaseIndex((prev) => {
        const next = (prev + 1) % 3
        setCountdown(PHASES[next].duration / 1000)
        return next
      })
    }, currentPhase.duration)

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearInterval(phaseTimer)
      clearInterval(countdownTimer)
    }
  }, [isActive, currentPhaseIndex, currentPhase.duration])

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div
        className={cn(
          'absolute rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#8B5CF6]/20',
          'transition-all duration-1000 ease-in-out',
          isActive && currentPhase.phase === 'inhale' && 'w-64 h-64',
          isActive && currentPhase.phase === 'hold1' && 'w-64 h-64',
          isActive && currentPhase.phase === 'exhale' && 'w-32 h-32',
          !isActive && 'w-32 h-32'
        )}
        style={{
          transitionDuration: `${currentPhase.duration}ms`,
        }}
      />

      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-[#00D4FF] via-[#0EA5E9] to-[#8B5CF6]',
          'flex items-center justify-center shadow-lg',
          'transition-all ease-in-out',
          isActive && currentPhase.phase === 'inhale' && 'w-48 h-48',
          isActive && currentPhase.phase === 'hold1' && 'w-48 h-48',
          isActive && currentPhase.phase === 'exhale' && 'w-24 h-24',
          !isActive && 'w-24 h-24'
        )}
        style={{
          transitionDuration: `${currentPhase.duration}ms`,
          boxShadow: isActive ? '0 0 60px rgba(0, 212, 255, 0.4)' : 'none',
        }}
      >
        <div className="text-center text-white">
          <p className="text-lg font-medium">{currentPhase.label}</p>
          {countdown > 0 && (
            <p className="text-3xl font-bold">{countdown}</p>
          )}
        </div>
      </div>
    </div>
  )
}
