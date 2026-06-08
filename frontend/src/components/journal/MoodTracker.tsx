import { useState } from 'react'
import { TrendingUp, Calendar, BarChart3, Brain } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface MoodData {
  date: string
  mood: number
  label: string
}

interface MoodTrackerProps {
  data: MoodData[]
}

const MOOD_LABELS = {
  1: 'Very Sad',
  2: 'Sad', 
  3: 'Neutral',
  4: 'Happy',
  5: 'Very Happy'
}

const MOOD_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#ec4899'
}

export default function MoodTracker({ data }: MoodTrackerProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'stats'>('chart')
  
  // Calculate statistics
  const avgMood = data.length > 0 ? (data.reduce((sum, d) => sum + d.mood, 0) / data.length).toFixed(1) : 0
  const trend = data.length >= 2 ? data[data.length - 1].mood - data[data.length - 2].mood : 0
  const bestDay = data.reduce((best, current) => current.mood > best.mood ? current : best, data[0])
  
  // Mood distribution
  const moodDistribution = [1, 2, 3, 4, 5].map(mood => ({
    mood: MOOD_LABELS[mood as keyof typeof MOOD_LABELS],
    count: data.filter(d => d.mood === mood).length,
    color: MOOD_COLORS[mood as keyof typeof MOOD_COLORS]
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].payload.label}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mood: {MOOD_LABELS[payload[0].value as keyof typeof MOOD_LABELS]}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} />
          Mood Tracker
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'chart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-6">
          {/* Line Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">7-Day Mood Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Mood Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Mood Distribution</h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={moodDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="mood" 
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Average Mood</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{avgMood}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Out of 5</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Entries</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{data.length}</p>
              <p className="text-xs text-green-600 dark:text-green-400">This period</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Current Trend</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {trend > 0 ? '+' : ''}{trend}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-pink-700 dark:text-pink-300">Best Day</span>
              </div>
              <p className="text-lg font-bold text-pink-900 dark:text-pink-100 truncate">
                {bestDay?.label || 'N/A'}
              </p>
              <p className="text-xs text-pink-600 dark:text-pink-400">
                {bestDay ? MOOD_LABELS[bestDay.mood as keyof typeof MOOD_LABELS] : ''}
              </p>
            </div>
          </div>

          {/* Mood Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Mood Breakdown</h4>
            <div className="space-y-2">
              {moodDistribution.map((item) => (
                <div key={item.mood} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{item.mood}</div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${data.length > 0 ? (item.count / data.length) * 100 : 0}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
