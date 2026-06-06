import { cn } from '@/lib/utils'

export const MOOD_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Calm', value: 'calm' },
  { label: 'Anxious relief', value: 'anxious' },
  { label: 'Happy', value: 'happy' },
  { label: 'Sad', value: 'sad' },
  { label: 'Overwhelmed', value: 'overwhelmed' },
]

interface MoodFilterBarProps {
  active: string
  onChange: (mood: string) => void
}

export default function MoodFilterBar({ active, onChange }: MoodFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_FILTERS.map((mood) => {
        const isActive = active === mood.value
        return (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={cn(
              'relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
              isActive
                ? 'bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white border-transparent shadow-md shadow-cyan-500/10'
                : 'bg-muted text-muted-foreground border-border hover:border-[#00BFFF] hover:text-[#00BFFF]'
            )}
          >
            {mood.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4/5 h-0.5 bg-white/60 rounded-full animate-slide-down" />
            )}
          </button>
        )
      })}
    </div>
  )
}
