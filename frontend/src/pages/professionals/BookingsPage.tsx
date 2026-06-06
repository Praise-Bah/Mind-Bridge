import { useState, useEffect } from 'react'
import { Calendar, Clock, Loader2, Star } from 'lucide-react'
import type { Booking } from '@/types'
import { professionalService } from '@/services/professionalService'
import ReviewModal from '@/components/professionals/ReviewModal'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-300',
  confirmed: 'bg-green-500/15 text-green-300',
  completed: 'bg-indigo-500/15 text-indigo-300',
  cancelled: 'bg-red-500/15 text-red-300',
}

function canCancel(booking: Booking): boolean {
  if (booking.status !== 'pending' && booking.status !== 'confirmed') return false
  const sessionMs = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`).getTime()
  return sessionMs - Date.now() > 2 * 60 * 60 * 1000
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  useEffect(() => {
    professionalService.getBookings()
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId)
    try {
      await professionalService.cancelBooking(bookingId)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } finally {
      setCancellingId(null)
    }
  }

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const past = bookings.filter(b => b.status === 'completed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={30} />
      </div>
    )
  }

  function BookingCard({ booking: b }: { booking: Booking }) {
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 animate-card-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white">{b.professional_name}</p>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[b.status]}`}>
                {b.status}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} />{b.scheduled_date}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />{b.scheduled_time.slice(0, 5)}
              </span>
              <span className="text-gray-500">{b.duration_minutes} min</span>
            </div>

            {b.description && (
              <p className="text-gray-400 text-xs mt-2 line-clamp-2">{b.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {canCancel(b) && (
              <button
                onClick={() => handleCancel(b.id)}
                disabled={cancellingId === b.id}
                className="px-3 py-1.5 rounded-xl text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
              >
                {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
            {b.status === 'completed' && !b.has_review && (
              <button
                onClick={() => setReviewBooking(b)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Star size={11} /> Review
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        <p className="text-gray-400 text-sm mt-0.5">View and manage your scheduled sessions</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
          <Calendar size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No bookings yet</p>
          <p className="text-gray-500 text-sm mt-1">Book a session with a professional to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Past Sessions ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                Cancelled ({cancelled.length})
              </h2>
              <div className="space-y-3">
                {cancelled.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewed={() => {
            setBookings(prev => prev.map(b => b.id === reviewBooking.id ? { ...b, has_review: true } : b))
            setReviewBooking(null)
          }}
        />
      )}
    </div>
  )
}
