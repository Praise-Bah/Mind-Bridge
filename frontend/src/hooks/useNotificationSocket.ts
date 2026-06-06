import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
  addNotification,
  setNotifications,
  setUnreadCount,
  setConnected,
} from '@/store/slices/notificationSlice'
import api from '@/services/api'
import type { Notification } from '@/types'

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost/ws').replace(/\/$/, '')
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export default function useNotificationSocket() {
  const dispatch = useDispatch()
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalCloseRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token) return

    async function fetchAll() {
      try {
        const res = await api.get('/notifications/')
        const notifications: Notification[] = res.data.results ?? res.data ?? []
        dispatch(setNotifications(notifications))
      } catch {
        // ignore — may not be authenticated yet
      }
    }

    function connect() {
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) return

      const ws = new WebSocket(`${WS_BASE}/notifications/?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttemptRef.current = 0
        dispatch(setConnected(true))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.notification) {
            dispatch(addNotification(data.notification))
          } else if (data.unread_count !== undefined) {
            dispatch(setUnreadCount(data.unread_count))
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        dispatch(setConnected(false))
        if (!intentionalCloseRef.current) {
          scheduleReconnect()
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    function scheduleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      )
      reconnectAttemptRef.current++
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    intentionalCloseRef.current = false
    fetchAll()
    connect()

    return () => {
      intentionalCloseRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      dispatch(setConnected(false))
    }
  }, [isAuthenticated, token, dispatch])
}
