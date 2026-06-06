import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { addNotification, setNotifications, setUnreadCount } from '@/store/slices/notificationSlice'
import api from '@/services/api'
import type { Notification } from '@/types'

const POLL_INTERVAL_MS = 30_000

export default function useNotificationSocket() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const prevCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) return

    // Fetch full notification list once on mount so the store is populated
    async function fetchAll() {
      try {
        const res = await api.get('/notifications/')
        const notifications: Notification[] = res.data.results ?? res.data ?? []
        dispatch(setNotifications(notifications))
        prevCountRef.current = notifications.filter(n => !n.is_read).length
      } catch {
        // ignore — user may not be authenticated yet
      }
    }

    // Poll only the unread count on every tick, add new notifications incrementally
    async function pollUnread() {
      try {
        const countRes = await api.get('/notifications/unread-count/')
        const newCount: number = countRes.data.unread_count ?? 0

        if (newCount > prevCountRef.current) {
          // Fetch the full list to pick up new notifications
          const res = await api.get('/notifications/')
          const notifications: Notification[] = res.data.results ?? res.data ?? []
          dispatch(setNotifications(notifications))
          // Surface newly arrived ones as toast-like state updates
          const unread = notifications.filter(n => !n.is_read)
          const prevIds = new Set(
            notifications
              .filter(n => n.is_read)
              .map(n => n.id)
          )
          unread
            .filter(n => !prevIds.has(n.id))
            .forEach(n => dispatch(addNotification(n)))
        } else {
          dispatch(setUnreadCount(newCount))
        }

        prevCountRef.current = newCount
      } catch {
        // ignore network errors
      }
    }

    fetchAll()
    const intervalId = setInterval(pollUnread, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [isAuthenticated, dispatch])
}
