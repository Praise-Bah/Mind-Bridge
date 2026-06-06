import { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { Bell, LogOut, Sun, Moon } from 'lucide-react'
import { setTheme } from '@/store/slices/uiSlice'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { unreadCount } = useSelector((state: RootState) => state.notifications)
  const { theme } = useSelector((state: RootState) => state.ui)
  const prevCountRef = useRef(unreadCount)
  const [badgeAnimate, setBadgeAnimate] = useState(false)

  useEffect(() => {
    if (unreadCount < prevCountRef.current) {
      setBadgeAnimate(true)
      const t = setTimeout(() => setBadgeAnimate(false), 400)
      prevCountRef.current = unreadCount
      return () => clearTimeout(t)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))
  }

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {user?.first_name || user?.username || 'User'}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 hover:bg-accent rounded-full">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 hover:bg-accent rounded-full relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center ${badgeAnimate ? 'animate-bell-badge-decrement' : ''}`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button onClick={handleLogout} className="p-2 hover:bg-accent rounded-full" title="Logout">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
