import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { toggleSidebar } from '@/store/slices/uiSlice'
import {
  LayoutDashboard, Users, MessageCircle, Video, Brain,
  BookOpen, User, Settings, Calendar, Menu
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/professionals', icon: Calendar, label: 'Professionals' },
  { path: '/bookings', icon: Calendar, label: 'My Bookings' },
  { path: '/videos', icon: Video, label: 'Videos' },
  { path: '/ai-assistant', icon: Brain, label: 'AI Assistant' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)

  return (
    <aside className={`bg-card border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {sidebarOpen && <span className="text-xl font-bold text-primary">MindBridge</span>}
        <button onClick={() => dispatch(toggleSidebar())} className="p-2 hover:bg-accent rounded-md">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
