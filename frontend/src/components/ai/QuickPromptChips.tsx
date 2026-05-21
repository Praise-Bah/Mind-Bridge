import { cn } from '@/lib/utils'

interface QuickPromptChipsProps {
  onSelect: (prompt: string) => void
  context?: 'anxiety' | 'stress' | 'sad' | 'general'
  className?: string
}

const CONTEXTUAL_PROMPTS: Record<string, string[]> = {
  anxiety: [
    'Can you guide me through a breathing exercise?',
    'What can I do right now to feel calmer?',
    'Help me identify my anxiety triggers',
  ],
  stress: [
    'How can I manage my stress better?',
    'I need help prioritizing my tasks',
    'Can we talk about work-life balance?',
  ],
  sad: [
    'I just need to vent for a bit',
    "Help me see things from a different perspective",
    "What are some things I can do to feel better?",
  ],
  general: [
    'Tell me something positive',
    'Can you suggest a mindfulness activity?',
    'I want to set a wellness goal',
  ],
}

export default function QuickPromptChips({
  onSelect,
  context = 'general',
  className,
}: QuickPromptChipsProps) {
  const prompts = CONTEXTUAL_PROMPTS[context] || CONTEXTUAL_PROMPTS.general

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs',
            'bg-muted/50 hover:bg-[#7C3AED]/10',
            'text-muted-foreground hover:text-[#7C3AED]',
            'border border-transparent hover:border-[#7C3AED]/20',
            'transition-all duration-200'
          )}
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
