import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.is_read).length
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.is_read) {
        state.unreadCount++
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.is_read) {
        notification.is_read = true
        state.unreadCount--
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.is_read = true)
      state.unreadCount = 0
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
  },
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setConnected,
} = notificationSlice.actions

export default notificationSlice.reducer
