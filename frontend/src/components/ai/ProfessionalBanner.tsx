import { useNavigate } from 'react-router-dom'
import { X, UserCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfessionalBannerProps {
  isVisible: boolean
  onDismiss: () => void
}

export default function ProfessionalBanner({
  isVisible,
  onDismiss,
}: ProfessionalBannerProps) {
  const navigate = useNavigate()

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'mx-4 mb-4 p-4 rounded-xl border',
        'bg-gradient-to-r from-[#8B5CF6]/10 to-[#7C3AED]/10',
        'border-[#8B5CF6]/20',
        'animate-slide-down'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#8B5CF6]/20">
            <UserCheck className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <p className="font-medium">Want to talk to a real professional?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our licensed therapists are here to provide personalized support
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => navigate('/professionals')}
        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] transition-colors"
      >
        Find a Professional
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
