import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { toggleSidebar } from '@/store/slices/uiSlice'
import {
  LayoutDashboard, Users, MessageCircle, Video, Brain,
  BookOpen, User, Settings, Calendar, Menu, Bell, ShieldCheck, Briefcase, Info
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/professionals', icon: Calendar, label: 'Professionals' },
  { path: '/bookings', icon: Calendar, label: 'My Bookings' },
  { path: '/videos', icon: Video, label: 'Videos' },
  { path: '/ai-companion', icon: Brain, label: 'AI Companion' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  const { unreadCount } = useSelector((state: RootState) => state.notifications)
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <aside className={`bg-card border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className={`flex h-16 items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'} border-b`}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MindBridge" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              MindBridge
            </span>
          </div>
        ) : (
          <img
            src="/logo.png"
            alt="MindBridge"
            className="h-8 w-8 object-contain cursor-pointer hover:scale-105 transition-transform"
            onClick={() => dispatch(toggleSidebar())}
          />
        )}
        {sidebarOpen && (
          <button onClick={() => dispatch(toggleSidebar())} className="p-2 hover:bg-accent rounded-md">
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="p-2 space-y-1">
        {user?.is_professional && (
          <NavLink
            to="/pro/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-sm'
                  : 'text-indigo-400 hover:bg-indigo-500/10'
              }`
            }
          >
            <Briefcase className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="flex-1 text-sm font-medium">Pro Dashboard</span>}
          </NavLink>
        )}
        {user?.is_staff && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-sm'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`
            }
          >
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="flex-1 text-sm font-medium">Admin Panel</span>}
          </NavLink>
        )}
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <div className="relative flex-shrink-0">
              <Icon className="h-5 w-5" />
              {badge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {sidebarOpen && <span className="flex-1">{label}</span>}
            {sidebarOpen && badge && unreadCount > 0 && (
              <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
