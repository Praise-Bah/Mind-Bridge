import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, Mail, Settings, MessageCircle, Calendar, Heart, AtSign, User, Brain } from 'lucide-react'
import { RootState } from '@/store'
import { setNotifications, markAllAsRead, setUnreadCount } from '@/store/slices/notificationSlice'
import { notificationService } from '@/services/notificationService'
import type { Notification } from '@/types'
import NotificationItem from '@/components/notifications/NotificationItem'

function groupNotifications(notifications: Notification[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfWeek = startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400000

  const today: Notification[] = []
  const thisWeek: Notification[] = []
  const older: Notification[] = []

  for (const n of notifications) {
    const ts = new Date(n.created_at).getTime()
    if (ts >= startOfToday) today.push(n)
    else if (ts >= startOfWeek) thisWeek.push(n)
    else older.push(n)
  }

  return { today, thisWeek, older }
}

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { notifications, unreadCount, isConnected } = useSelector(
    (state: RootState) => state.notifications
  )
  const [loading, setLoading] = useState(notifications.length === 0)
  const [markingAll, setMarkingAll] = useState(false)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (notifications.length > 0) {
      setLoading(false)
      return
    }
    notificationService.getNotifications()
      .then(data => dispatch(setNotifications(data)))
      .finally(() => setLoading(false))
  }, [])

  // Track IDs that arrive while page is open (for slide-in animation)
  const prevLengthRef = { current: notifications.length }
  useEffect(() => {
    if (notifications.length > prevLengthRef.current) {
      const latest = notifications[0]
      if (latest) setNewIds(prev => new Set(prev).add(latest.id))
    }
    prevLengthRef.current = notifications.length
  }, [notifications.length])

  async function handleMarkAllRead() {
    if (!unreadCount || markingAll) return
    setMarkingAll(true)
    try {
      const result = await notificationService.markAllAsRead()
      dispatch(markAllAsRead())
      dispatch(setUnreadCount(result.unread_count))
    } finally {
      setMarkingAll(false)
    }
  }

  const { today, thisWeek, older } = groupNotifications(notifications)

  const lastDigest = notifications.find(
    n => n.notification_type === 'checkin' || n.notification_type === 'system'
  )

  function Section({ title, items }: { title: string; items: Notification[] }) {
    if (items.length === 0) return null
    const unread = items.filter(n => !n.is_read).length
    return (
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
              {unread} unread
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {items.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              isNew={newIds.has(n.id)}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={20} className="text-indigo-400 shrink-0" />
          <h1 className="text-2xl font-bold text-white truncate">Notifications Centre</h1>
          {isConnected && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[11px] font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-availability-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleMarkAllRead}
            disabled={!unreadCount || markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Mark read</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            title="Notification settings"
            className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Daily digest preview card */}
      {lastDigest && (
        <div className="bg-gradient-to-r from-indigo-600/15 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-200">Daily Email Digest</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{lastDigest.message}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap transition-colors"
          >
            Email preferences →
          </button>
        </div>
      )}

      {/* Types of notifications info card */}
      <div className="bg-white/3 rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Types of notifications</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-blue-400" />
            <span className="text-gray-300">New messages</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-green-400" />
            <span className="text-gray-300">Session reminders</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            <span className="text-gray-300">Community reactions</span>
          </div>
          <div className="flex items-center gap-2">
            <AtSign size={14} className="text-purple-400" />
            <span className="text-gray-300">Mentions</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-teal-400" />
            <span className="text-gray-300">New followers</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-amber-400" />
            <span className="text-gray-300">Daily check-ins</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-violet-400" />
            <span className="text-gray-300">AI summaries</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-gray-400" />
            <span className="text-gray-300">System updates</span>
          </div>
        </div>
      </div>

      {/* Notification feed */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
          <Bell size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">You're all caught up</p>
          <p className="text-gray-500 text-sm mt-1">New notifications will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Section title="Today" items={today} />
          <Section title="This Week" items={thisWeek} />
          <Section title="Older" items={older} />
        </div>
      )}
    </div>
  )
}
