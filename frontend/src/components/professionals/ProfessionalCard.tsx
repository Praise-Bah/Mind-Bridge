import { useState } from 'react'
import { Heart, MessageCircle, DollarSign } from 'lucide-react'
import type { Professional } from '@/types'
import { professionalService } from '@/services/professionalService'
import StarRating from './StarRating'
import AvailabilityDot from './AvailabilityDot'

interface Props {
  professional: Professional
  onViewProfile: (p: Professional) => void
  onUpdate: (updated: Professional) => void
  onMessage?: (p: Professional) => void
}

export default function ProfessionalCard({ professional: p, onViewProfile, onUpdate, onMessage }: Props) {
  const [togglingFav, setTogglingFav] = useState(false)

  async function handleFavourite(e: React.MouseEvent) {
    e.stopPropagation()
    if (togglingFav) return
    setTogglingFav(true)
    try {
      const result = await professionalService.toggleFavourite(p.id)
      onUpdate({ ...p, is_favourite: result.is_favourite })
    } finally {
      setTogglingFav(false)
    }
  }

  const initials = p.user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      onClick={() => onViewProfile(p)}
      className="group relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 hover:border-indigo-500/30 animate-card-in"
    >
      {/* Favourite button */}
      <button
        onClick={handleFavourite}
        disabled={togglingFav}
        className={`absolute top-4 right-4 p-1.5 rounded-full transition-all duration-200 ${
          p.is_favourite
            ? 'text-rose-400 bg-rose-500/10'
            : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
        } disabled:opacity-50`}
      >
        <Heart size={16} className={p.is_favourite ? 'fill-rose-400' : ''} />
      </button>

      {/* Avatar + online dot */}
      <div className="relative w-14 h-14 mb-3">
        {p.user_avatar ? (
          <img
            src={p.user_avatar}
            alt={p.user_name}
            className="w-14 h-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1">
          <AvailabilityDot isOnline={p.is_online} size="md" />
        </span>
      </div>

      {/* Name & title */}
      <h3 className="font-semibold text-white text-base leading-snug">{p.user_name}</h3>
      <p className="text-indigo-300 text-xs mt-0.5">{p.title}</p>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1 mt-2">
        {p.specializations.slice(0, 3).map(s => (
          <span key={s.id} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 rounded-full text-[10px] font-medium">
            {s.name}
          </span>
        ))}
        {p.specializations.length > 3 && (
          <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded-full text-[10px]">
            +{p.specializations.length - 3}
          </span>
        )}
      </div>

      {/* Languages */}
      {p.languages.length > 0 && (
        <p className="text-gray-500 text-xs mt-2">
          {p.languages.slice(0, 3).join(' · ')}
        </p>
      )}

      {/* Rating + price row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <StarRating value={p.average_rating} />
          {p.average_rating ? (
            <span className="text-xs text-gray-400">
              {p.average_rating} ({p.review_count})
            </span>
          ) : (
            <span className="text-xs text-gray-500">No reviews</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
          <DollarSign size={13} />
          {Number(p.session_rate).toFixed(0)}/session
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={e => { e.stopPropagation(); onViewProfile(p) }}
          className="flex-1 py-2 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={e => { e.stopPropagation(); onMessage?.(p) }}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
          title="Message"
        >
          <MessageCircle size={14} />
        </button>
      </div>
    </div>
  )
}
