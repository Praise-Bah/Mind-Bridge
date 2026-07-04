import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { X, Check, ExternalLink, MessageCircle, Calendar, Heart, AtSign, Bell, Brain, User, BookOpen } from 'lucide-react'
import type { Notification } from '@/types'
import { markAsRead, removeNotification, setUnreadCount } from '@/store/slices/notificationSlice'
import { notificationService } from '@/services/notificationService'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  message:           <MessageCircle size={15} className="text-blue-400" />,
  booking:           <Calendar size={15} className="text-green-400" />,
  booking_confirmed: <Calendar size={15} className="text-green-400" />,
  reminder:          <Calendar size={15} className="text-amber-400" />,
  reaction:          <Heart size={15} className="text-rose-400" />,
  comment:           <MessageCircle size={15} className="text-indigo-400" />,
  mention:           <AtSign size={15} className="text-purple-400" />,
  professional:      <User size={15} className="text-teal-400" />,
  follower:          <User size={15} className="text-cyan-400" />,
  checkin:           <Bell size={15} className="text-amber-400" />,
  ai_summary:        <Brain size={15} className="text-violet-400" />,
  system:            <Bell size={15} className="text-gray-400" />,
  daily_verse:       <BookOpen size={15} className="text-amber-300" />,
}

const SOURCE_ROUTES: Record<string, (data: Record<string, unknown>) => string> = {
  message:           d => `/chat/${d.conversation_id ?? ''}`,
  booking:           _d => '/bookings',
  booking_confirmed: _d => '/bookings',
  reminder:          _d => '/bookings',
  reaction:          d => `/community#post-${d.post_id ?? ''}`,
  comment:           d => `/community#post-${d.post_id ?? ''}`,
  mention:           d => `/community#post-${d.post_id ?? ''}`,
  professional:      _d => '/professionals',
  follower:          _d => '/profile',
  checkin:           _d => '/journal',
  ai_summary:        _d => '/ai-companion',
  system:            _d => '/notifications',
  daily_verse:       _d => '/notifications',
}

interface Props {
  notification: Notification
  isNew?: boolean
}

export default function NotificationItem({ notification: n, isNew = false }: Props) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  async function handleMarkRead(e: React.MouseEvent) {
    e.stopPropagation()
    if (n.is_read) return
    dispatch(markAsRead(n.id))
    const result = await notificationService.markAsRead(n.id)
    dispatch(setUnreadCount(result.unread_count))
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    try {
      const result = await notificationService.deleteNotification(n.id)
      dispatch(removeNotification(n.id))
      dispatch(setUnreadCount(result.unread_count))
    } catch {
      setDeleting(false)
    }
  }

  function handleGoToSource() {
    const routeFn = SOURCE_ROUTES[n.notification_type]
    if (routeFn) navigate(routeFn(n.data))
    if (!n.is_read) {
      dispatch(markAsRead(n.id))
      notificationService.markAsRead(n.id).then(r => dispatch(setUnreadCount(r.unread_count)))
    }
  }

  function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const icon = TYPE_ICONS[n.notification_type] ?? TYPE_ICONS.system

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer
        ${!n.is_read
          ? 'bg-indigo-500/5 border-indigo-500/20 border-l-2 border-l-indigo-500'
          : 'bg-white/3 border-white/5 hover:bg-white/5'
        }
        ${isNew ? 'animate-notif-slide-in' : ''}
        ${deleting ? 'opacity-0 scale-95 pointer-events-none' : ''}
      `}
      onClick={handleGoToSource}
    >
      {/* Type icon */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mt-0.5">
        {n.sender_avatar ? (
          <img src={n.sender_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          icon
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${n.is_read ? 'text-gray-300' : 'text-white'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-gray-600 mt-1">{relativeTime(n.created_at)}</p>
      </div>

      {/* Unread dot */}
      {!n.is_read && (
        <span className={`shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5`} />
      )}

      {/* Action buttons (shown on hover) */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {!n.is_read && (
          <button
            onClick={handleMarkRead}
            title="Mark as read"
            className="p-1 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
          >
            <Check size={13} />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); handleGoToSource() }}
          title="Go to source"
          className="p-1 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
        >
          <ExternalLink size={13} />
        </button>
        <button
          onClick={handleDelete}
          title="Delete"
          className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
