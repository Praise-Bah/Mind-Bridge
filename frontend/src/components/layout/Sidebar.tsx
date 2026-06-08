import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { toggleSidebar, setMobileSidebarOpen } from '@/store/slices/uiSlice'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MessageCircle, Video, Brain,
  BookOpen, User, Settings, Calendar, Menu, X, Bell, ShieldCheck, Briefcase
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
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarOpen, mobileSidebarOpen } = useSelector((state: RootState) => state.ui)
  const { unreadCount } = useSelector((state: RootState) => state.notifications)
  const { user } = useSelector((state: RootState) => state.auth)

  // On mobile the sidebar is an off-canvas drawer (hidden until opened via the
  // Header's hamburger button), so it always shows full labels when visible —
  // the icon-only "collapsed rail" only makes sense on desktop where it stays
  // on-screen permanently and `sidebarOpen` controls its width.
  const showLabels = sidebarOpen || mobileSidebarOpen
  const closeMobile = () => dispatch(setMobileSidebarOpen(false))

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 bg-card border-r',
          'transform transition-transform duration-300 ease-in-out lg:transform-none',
          'w-64 transition-[width] lg:transition-[width]',
          sidebarOpen ? 'lg:w-64' : 'lg:w-16',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
      <div className={`flex h-16 items-center ${showLabels ? 'justify-between px-4' : 'justify-center px-2'} border-b`}>
        {showLabels ? (
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
          <button onClick={() => dispatch(toggleSidebar())} className="hidden lg:block p-2 hover:bg-accent rounded-md">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <button onClick={closeMobile} className="lg:hidden p-2 hover:bg-accent rounded-md">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="p-2 space-y-1" onClick={closeMobile}>
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
            {showLabels && <span className="flex-1 text-sm font-medium">Pro Dashboard</span>}
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
            {showLabels && <span className="flex-1 text-sm font-medium">Admin Panel</span>}
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
            {showLabels && <span className="flex-1">{label}</span>}
            {showLabels && badge && unreadCount > 0 && (
              <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
    </>
  )
}
