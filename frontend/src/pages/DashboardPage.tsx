import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '@/store'
import { Brain, Users, Video, BookOpen, Calendar, TrendingUp } from 'lucide-react'

const quickActions = [
  { icon: Brain, label: 'Talk to AI', path: '/ai-assistant', color: 'bg-purple-500' },
  { icon: Users, label: 'Community', path: '/community', color: 'bg-blue-500' },
  { icon: Video, label: 'Watch Videos', path: '/videos', color: 'bg-green-500' },
  { icon: BookOpen, label: 'Write Journal', path: '/journal', color: 'bg-yellow-500' },
  { icon: Calendar, label: 'Book Session', path: '/professionals', color: 'bg-pink-500' },
]

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-2xl font-bold">Good day, {user?.first_name || 'there'}!</h1>
        <p className="mt-2 opacity-90">How are you feeling today? Take a moment to check in with yourself.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">0 days</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Journal Entries</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/10 p-3 rounded-full">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Sessions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map(({ icon: Icon, label, path, color }) => (
            <Link
              key={path}
              to={path}
              className="bg-card border rounded-lg p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className={`${color} text-white p-3 rounded-full inline-flex mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="font-medium">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Mood Check-in</h2>
        <p className="text-muted-foreground mb-4">How are you feeling right now?</p>
        <div className="flex gap-4 justify-center">
          {['😢', '😕', '😐', '🙂', '😊'].map((emoji, index) => (
            <button
              key={index}
              className="text-4xl hover:scale-125 transition-transform p-2"
              title={['Very Bad', 'Bad', 'Neutral', 'Good', 'Very Good'][index]}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
