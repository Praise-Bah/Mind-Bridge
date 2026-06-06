import { Trophy, Flame, Target, BookOpen, Heart, Brain, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface JournalStatsProps {
  entries: any[]
  streak: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function JournalStats({ entries, streak }: JournalStatsProps) {

  // Calculate statistics
  const totalEntries = entries.length
  const avgWordsPerEntry = entries.length > 0 
    ? Math.round(entries.reduce((sum, entry) => sum + (entry.content?.length || 0), 0) / entries.length)
    : 0
  
  const entriesWithMood = entries.filter(entry => entry.mood_score).length
  const avgMood = entriesWithMood > 0
    ? (entries.filter(entry => entry.mood_score).reduce((sum, entry) => sum + entry.mood_score, 0) / entriesWithMood).toFixed(1)
    : 0

  // Tag analysis
  const allTags = entries.flatMap(entry => entry.tags || [])
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag, count]) => ({ name: tag, value: count }))

  // Writing consistency (entries per day)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const consistencyData = last7Days.map(date => ({
    date,
    entries: entries.filter(entry => entry.created_at?.startsWith(date)).length,
    label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  // Achievements
  const achievements = [
    { 
      icon: Flame, 
      title: `${streak} Day Streak`, 
      description: 'Keep writing daily!',
      unlocked: streak >= 1,
      color: 'from-orange-500 to-red-500'
    },
    { 
      icon: Trophy, 
      title: 'Journal Master', 
      description: '50+ entries',
      unlocked: totalEntries >= 50,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: Target, 
      title: 'Consistent Writer', 
      description: '7 days in a row',
      unlocked: streak >= 7,
      color: 'from-blue-500 to-purple-500'
    },
    { 
      icon: Brain, 
      title: 'Self-Aware', 
      description: 'Mood tracking pro',
      unlocked: entriesWithMood >= 20,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: Heart, 
      title: 'Emotional Explorer', 
      description: 'Used all mood levels',
      unlocked: new Set(entries.filter(e => e.mood_score).map(e => e.mood_score)).size === 5,
      color: 'from-pink-500 to-red-500'
    },
    { 
      icon: Zap, 
      title: 'Quick Writer', 
      description: '100+ words avg',
      unlocked: avgWordsPerEntry >= 100,
      color: 'from-green-500 to-teal-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Entries</p>
              <p className="text-2xl font-bold">{totalEntries}</p>
            </div>
            <BookOpen size={24} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">{streak} days</p>
            </div>
            <Flame size={24} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Mood</p>
              <p className="text-2xl font-bold">{avgMood || '—'}</p>
            </div>
            <Heart size={24} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Writing Consistency */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Writing Consistency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={consistencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="entries" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Used Tags</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={topTags}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {topTags.map((_tag, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4">
            {topTags.map((tag, index) => (
              <div key={tag.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  #{tag.name} ({tag.value as number})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`relative rounded-xl p-4 border-2 transition-all ${
                achievement.unlocked
                  ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-5 rounded-xl`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${achievement.color} flex items-center justify-center mb-3 ${
                  !achievement.unlocked && 'grayscale'
                }`}>
                  <achievement.icon size={20} className="text-white" />
                </div>
                <h4 className={`font-semibold text-gray-900 dark:text-white ${
                  !achievement.unlocked && 'text-gray-400'
                }`}>
                  {achievement.title}
                </h4>
                <p className={`text-sm text-gray-600 dark:text-gray-400 ${
                  !achievement.unlocked && 'text-gray-400'
                }`}>
                  {achievement.description}
                </p>
                {achievement.unlocked && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Unlocked</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="text-blue-600 dark:text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Writing Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Average words per entry:</strong> {avgWordsPerEntry}
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-2">
              <strong>Most productive day:</strong> {
                consistencyData.reduce((best, current) => 
                  current.entries > best.entries ? current : best
                ).label
              }
            </p>
          </div>
          <div>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Mood tracking rate:</strong> {
                entries.length > 0 
                  ? Math.round((entriesWithMood / entries.length) * 100) 
                  : 0
              }%
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-2">
              <strong>Favorite tag:</strong> {
                topTags[0]?.name || 'None yet'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
