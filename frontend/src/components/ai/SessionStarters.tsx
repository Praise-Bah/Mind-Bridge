import { cn } from '@/lib/utils'

interface SessionStartersProps {
  onSelect: (prompt: string) => void
  className?: string
}

const STARTER_PROMPTS = [
  {
    text: "I'm feeling anxious today",
    icon: '😰',
    color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30',
  },
  {
    text: 'I had a difficult conversation',
    icon: '💬',
    color: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
  },
  {
    text: 'Help me calm down',
    icon: '🧘',
    color: 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30',
  },
  {
    text: 'I need someone to talk to',
    icon: '🤝',
    color: 'from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30',
  },
  {
    text: "I'm feeling overwhelmed",
    icon: '🌊',
    color: 'from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30',
  },
]

export default function SessionStarters({ onSelect, className }: SessionStartersProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-sm text-muted-foreground text-center">
        Choose a conversation starter or type your own message
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {STARTER_PROMPTS.map((prompt, index) => (
          <button
            key={prompt.text}
            onClick={() => onSelect(prompt.text)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full',
              'bg-gradient-to-r border border-transparent',
              'text-sm font-medium transition-all duration-300',
              'hover:scale-105 hover:shadow-md',
              'animate-fade-in',
              prompt.color
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <span className="text-lg">{prompt.icon}</span>
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
