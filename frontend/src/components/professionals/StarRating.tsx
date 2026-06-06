import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  value: number | null
  max?: number
  interactive?: boolean
  size?: number
  onChange?: (rating: number) => void
}

export default function StarRating({ value, max = 5, interactive = false, size = 16, onChange }: Props) {
  const [hovered, setHovered] = useState(0)

  const display = hovered || value || 0

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = display > i
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`transition-transform duration-100 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${filled && interactive && hovered ? 'animate-star-fill' : ''}`}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${filled ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
