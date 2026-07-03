import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Globe, DollarSign, Award, MessageCircle,
  Heart, Loader2,
} from 'lucide-react'
import type { Professional, Review, Availability } from '@/types'
import { professionalService } from '@/services/professionalService'
import { chatService } from '@/services/chatService'
import StarRating from '@/components/professionals/StarRating'
import AvailabilityDot from '@/components/professionals/AvailabilityDot'
import BookingModal from '@/components/professionals/BookingModal'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [professional, setProfessional] = useState<Professional | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [tab, setTab] = useState<'about' | 'reviews' | 'availability'>('about')
  const [showBooking, setShowBooking] = useState(false)
  const [togglingFav, setTogglingFav] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    professionalService.getProfessional(id)
      .then(setProfessional)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === 'reviews' && reviews.length === 0) {
      setLoadingReviews(true)
      professionalService.getReviews(id).then(setReviews).finally(() => setLoadingReviews(false))
    }
    if (tab === 'availability' && availability.length === 0) {
      setLoadingAvail(true)
      professionalService.getAvailability(id).then(setAvailability).finally(() => setLoadingAvail(false))
    }
  }, [tab, id])

  async function handleFavourite() {
    if (!professional || togglingFav) return
    setTogglingFav(true)
    try {
      const result = await professionalService.toggleFavourite(professional.id)
      setProfessional({ ...professional, is_favourite: result.is_favourite })
    } finally {
      setTogglingFav(false)
    }
  }

  async function handleMessage() {
    if (!professional) return
    try {
      const conv = await chatService.createConversation([professional.user])
      navigate(`/chat/${conv.id}`)
    } catch {
      // failed to start conversation
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={30} />
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Professional not found.</p>
        <button onClick={() => navigate('/professionals')} className="text-indigo-400 hover:text-indigo-300 mt-2 text-sm">
          ← Back to professionals
        </button>
      </div>
    )
  }

  const p = professional
  const initials = p.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const availByDay = WEEKDAYS.reduce<Record<number, Availability[]>>((acc, _, i) => {
    acc[i] = availability.filter(a => a.weekday === i)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/professionals')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to professionals
      </button>

      {/* Hero section */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {p.user_avatar ? (
              <img src={p.user_avatar} alt={p.user_name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1">
              <AvailabilityDot isOnline={p.is_online} size="md" />
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{p.user_name}</h1>
            <p className="text-indigo-300 text-sm mt-0.5">{p.title}</p>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarRating value={p.average_rating} size={14} />
                <span className="text-sm text-gray-400">
                  {p.average_rating ? `${p.average_rating} (${p.review_count} reviews)` : 'No reviews yet'}
                </span>
              </div>
              <span className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                <DollarSign size={14} />{Number(p.session_rate).toFixed(0)}/session
              </span>
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <Award size={13} />{p.years_of_experience} years experience
              </span>
            </div>

            {/* Specializations */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {p.specializations.map(s => (
                <span key={s.id} className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-full text-xs font-medium">
                  {s.name}
                </span>
              ))}
            </div>

            {/* Languages */}
            {p.languages.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                <Globe size={13} /> {p.languages.join(', ')}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowBooking(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Book Session
            </button>
            <button
              onClick={handleMessage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
            >
              <MessageCircle size={14} /> Message
            </button>
            <button
              onClick={handleFavourite}
              disabled={togglingFav}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${
                p.is_favourite
                  ? 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                  : 'border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/30'
              }`}
            >
              <Heart size={14} className={p.is_favourite ? 'fill-rose-400' : ''} />
              {p.is_favourite ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['about', 'reviews', 'availability'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-all duration-150 border-b-2 -mb-px ${
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
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
        {tab === 'about' && (
          <div className="space-y-6">
            {p.intro_video && (
              <div>
                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Intro Video</h3>
                <video src={p.intro_video} controls className="w-full rounded-xl max-h-64 bg-black" />
              </div>
            )}

            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">About</h3>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{p.bio}</p>
            </div>

            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Credentials</h3>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{p.credentials}</p>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-indigo-400" size={24} />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No reviews yet</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-indigo-300">{r.reviewer_name}</p>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={r.rating} size={13} />
                      <span className="text-xs text-gray-400">{r.rating}/5</span>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-300 leading-relaxed">{r.comment}</p>}
                  <p className="text-[11px] text-gray-500 mt-2">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'availability' && (
          <div>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
              <Calendar size={13} /> Weekly availability schedule
            </p>
            {loadingAvail ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-indigo-400" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day, i) => {
                  const slots = availByDay[i] ?? []
                  return (
                    <div key={day} className="text-center">
                      <p className="text-xs text-gray-400 mb-2 font-medium">{day}</p>
                      {slots.length === 0 ? (
                        <div className="h-10 rounded-lg bg-white/3 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">—</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {slots.map(s => (
                            <div key={s.id} className="bg-indigo-500/20 text-indigo-300 text-[11px] rounded-lg px-1.5 py-1 leading-tight">
                              {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
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
                className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Book a Session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {showBooking && (
        <BookingModal
          professional={p}
          availability={availability.length > 0 ? availability : []}
          onClose={() => setShowBooking(false)}
          onBooked={() => { setShowBooking(false); navigate('/bookings') }}
        />
      )}
    </div>
  )
}
