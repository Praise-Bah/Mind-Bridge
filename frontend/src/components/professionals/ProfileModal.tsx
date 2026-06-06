import { useState, useEffect } from 'react'
import { X, Calendar, Globe, DollarSign, Award, MessageCircle } from 'lucide-react'
import type { Professional, Review, Availability } from '@/types'
import { professionalService } from '@/services/professionalService'
import StarRating from './StarRating'
import AvailabilityDot from './AvailabilityDot'
import BookingModal from './BookingModal'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  professional: Professional
  onClose: () => void
  onUpdate: (updated: Professional) => void
  onMessage?: (p: Professional) => void
}

export default function ProfileModal({ professional: p, onClose, onMessage }: Props) {
  const [tab, setTab] = useState<'about' | 'reviews' | 'availability'>('about')
  const [reviews, setReviews] = useState<Review[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    if (tab === 'reviews' && reviews.length === 0) {
      setLoadingReviews(true)
      professionalService.getReviews(p.id).then(setReviews).finally(() => setLoadingReviews(false))
    }
    if (tab === 'availability' && availability.length === 0) {
      setLoadingAvail(true)
      professionalService.getAvailability(p.id).then(setAvailability).finally(() => setLoadingAvail(false))
    }
  }, [tab, p.id])

  const initials = p.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const availByDay = WEEKDAYS.reduce<Record<number, Availability[]>>((acc, _, i) => {
    acc[i] = availability.filter(a => a.weekday === i)
    return acc
  }, {})

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-5 border-b border-white/10 shrink-0">
            <div className="relative shrink-0">
              {p.user_avatar ? (
                <img src={p.user_avatar} alt={p.user_name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1">
                <AvailabilityDot isOnline={p.is_online} size="md" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{p.user_name}</h2>
              <p className="text-indigo-300 text-sm">{p.title}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <StarRating value={p.average_rating} size={13} />
                  <span className="text-xs text-gray-400">
                    {p.average_rating ? `${p.average_rating} (${p.review_count})` : 'No reviews'}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                  <DollarSign size={13} />{Number(p.session_rate).toFixed(0)}/session
                </span>
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <Award size={12} />{p.years_of_experience}y experience
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onMessage?.(p)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
              >
                <MessageCircle size={14} />
                Message
              </button>
              <button
                onClick={() => setShowBooking(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Book Session
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Specializations & languages strip */}
          <div className="px-5 py-3 border-b border-white/5 shrink-0 flex items-center gap-3 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {p.specializations.map(s => (
                <span key={s.id} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 rounded-full text-xs">
                  {s.name}
                </span>
              ))}
            </div>
            {p.languages.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Globe size={12} /> {p.languages.join(', ')}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0 px-5">
            {(['about', 'reviews', 'availability'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-all duration-150 border-b-2 -mb-px ${
                  tab === t
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {t === 'reviews' ? `Reviews (${p.review_count})` : t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto p-5 flex-1">
            {tab === 'about' && (
              <div className="space-y-5">
                {p.intro_video && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Intro Video</p>
                    <video src={p.intro_video} controls className="w-full rounded-xl max-h-48 bg-black" />
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400 mb-1.5">About</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{p.bio}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Credentials</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{p.credentials}</p>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="space-y-4">
                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">No reviews yet</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-indigo-300">{r.reviewer_name}</p>
                        <StarRating value={r.rating} size={13} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-300 leading-relaxed">{r.comment}</p>}
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'availability' && (
              <div>
                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                  <Calendar size={12} /> Weekly availability schedule
                </p>
                {loadingAvail ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day, i) => {
                      const slots = availByDay[i] ?? []
                      return (
                        <div key={day} className="text-center">
                          <p className="text-[11px] text-gray-400 mb-1 font-medium">{day}</p>
                          {slots.length === 0 ? (
                            <div className="h-8 rounded-lg bg-white/3 flex items-center justify-center">
                              <span className="text-gray-600 text-[10px]">—</span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              {slots.map(s => (
                                <div key={s.id} className="bg-indigo-500/20 text-indigo-300 text-[10px] rounded-md px-1 py-0.5 leading-tight">
                                  {s.start_time.slice(0, 5)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {availability.length > 0 && (
                  <button
                    onClick={() => setShowBooking(true)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    Book a Session
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          professional={p}
          availability={availability}
          onClose={() => setShowBooking(false)}
          onBooked={() => { setShowBooking(false); onClose() }}
        />
      )}
    </>
  )
}
