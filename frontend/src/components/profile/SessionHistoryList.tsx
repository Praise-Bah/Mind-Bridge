import { Calendar, Clock, Star } from 'lucide-react'
import type { Booking } from '@/types'

interface SessionHistoryListProps {
  bookings: Booking[]
}

export default function SessionHistoryList({ bookings }: SessionHistoryListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Session History</h2>
        </div>
        
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No completed sessions yet</p>
          <p className="text-gray-500 text-sm mt-2">Book your first session to see it here!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Session History</h2>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left side - Professional and Date */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {booking.professional_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{booking.professional_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(booking.scheduled_date)}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{formatTime(booking.scheduled_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {booking.description && (
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                    {booking.description}
                  </p>
                )}

                {/* Notes */}
                {booking.notes && (
                  <div className="mt-2 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Session Notes:</p>
                    <p className="text-sm text-gray-300">{booking.notes}</p>
                  </div>
                )}
              </div>

              {/* Right side - Status and Actions */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>

                {/* Duration */}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{booking.duration_minutes} min</span>
                </div>

                {/* Review Button */}
                {booking.status === 'completed' && !booking.has_review && (
                  <button className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs transition-colors">
                    <Star className="w-3 h-3" />
                    <span>Review</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      {bookings.length >= 5 && (
        <div className="mt-6 text-center">
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
            View All Sessions →
          </button>
        </div>
      )}
    </div>
  )
}
