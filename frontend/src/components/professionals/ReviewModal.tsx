import { useState } from 'react'
import { X, Star } from 'lucide-react'
import type { Booking } from '@/types'
import { professionalService } from '@/services/professionalService'

interface Props {
  booking: Booking
  onClose: () => void
  onReviewed: () => void
}

export default function ReviewModal({ booking, onClose, onReviewed }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setLoading(true)
    try {
      await professionalService.createReview(booking.id, { rating, comment })
      setDone(true)
      setTimeout(onReviewed, 1500)
    } finally {
      setLoading(false)
    }
  }

  const display = hovered || rating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Leave a Review</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="text-green-400 font-medium">Review submitted!</p>
            <p className="text-gray-400 text-sm mt-1">Thank you for your feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-sm text-gray-300">
              How was your session with <span className="text-white font-medium">{booking.professional_name}</span>?
            </p>

            {/* Star picker */}
            <div className="flex items-center justify-center gap-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHovered(i + 1)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform duration-100 hover:scale-125 active:scale-110"
                >
                  <Star
                    size={32}
                    className={`transition-all duration-150 ${
                      display > i
                        ? 'text-amber-400 fill-amber-400 animate-star-fill'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-sm text-amber-400 font-medium">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />

            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!rating || loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">
                {loading ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
