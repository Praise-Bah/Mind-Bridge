import { useEffect, useRef } from 'react'

export const REACTIONS = [
  { type: 'heart',     emoji: '❤️',  label: 'Love' },
  { type: 'hug',       emoji: '🤗',  label: 'Hug' },
  { type: 'fist',      emoji: '✊',  label: 'Strength' },
  { type: 'lightbulb', emoji: '💡',  label: 'Helpful' },
  { type: 'prayer',    emoji: '🙏',  label: 'Prayer' },
  { type: 'sad',       emoji: '😢',  label: 'Empathy' },
]

interface Props {
  userReactions: string[]
  onSelect: (type: string) => void
  onClose: () => void
}

export default function ReactionPicker({ userReactions, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 flex items-center gap-1 bg-[#12121f] border border-white/15 rounded-2xl px-3 py-2 shadow-2xl animate-slide-up"
    >
      {REACTIONS.map((r) => {
        const active = userReactions.includes(r.type)
        return (
          <button
            key={r.type}
            onClick={() => { onSelect(r.type); onClose() }}
            title={r.label}
            className={`group relative flex flex-col items-center transition-transform duration-150 hover:scale-125 active:scale-110 ${active ? 'scale-110' : ''}`}
          >
            <span className="text-2xl leading-none select-none">{r.emoji}</span>
            <span className={`text-[9px] mt-0.5 transition-colors ${active ? 'text-indigo-400 font-semibold' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {r.label}
            </span>
            {active && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
