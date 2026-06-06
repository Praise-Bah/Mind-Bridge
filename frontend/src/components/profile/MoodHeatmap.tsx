import { useEffect, useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import type { MoodCalendarDay } from '@/types'
import { profileService } from '@/services/profileService'

interface MoodHeatmapProps {
  onDateClick: (date: string) => void
}

const MOOD_COLORS = {
  1: 'bg-red-500',      // Very anxious
  2: 'bg-orange-500',  // Anxious
  3: 'bg-yellow-500',  // Neutral
  4: 'bg-green-500',   // Good
  5: 'bg-emerald-500'  // Great
}

export default function MoodHeatmap({ onDateClick }: MoodHeatmapProps) {
  const [calendarData, setCalendarData] = useState<MoodCalendarDay[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendarData()
  }, [currentMonth])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const data = await profileService.getMoodCalendar(year, month)
      setCalendarData(data)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const getMoodColor = (day: MoodCalendarDay) => {
    if (!day.has_entry) return 'bg-gray-800'
    if (!day.mood_score) return 'bg-gray-700'
    return MOOD_COLORS[day.mood_score as keyof typeof MOOD_COLORS] || 'bg-gray-600'
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = calendarData.find(d => d.date === dateStr)
      
      days.push(
        <div
          key={day}
          onClick={() => dayData?.has_entry && onDateClick(dateStr)}
          className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-110 ${
            dayData?.has_entry 
              ? `${getMoodColor(dayData)} text-white hover:ring-2 hover:ring-white/50` 
              : 'bg-gray-800 text-gray-600 hover:bg-gray-700'
          }`}
          title={dayData?.has_entry ? `Mood: ${dayData.mood_score}/5` : 'No entry'}
        >
          {day}
        </div>
      )
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + direction)
      return newMonth
    })
  }

  const monthYearString = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Mood Journal</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-white font-medium min-w-[150px] text-center">
            {monthYearString}
          </span>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Mood:</span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(mood => (
              <div
                key={mood}
                className={`w-3 h-3 rounded ${MOOD_COLORS[mood as keyof typeof MOOD_COLORS]}`}
                title={`${mood}/5`}
              ></div>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => onDateClick(new Date().toISOString().split('T')[0])}
          className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Today</span>
        </button>
      </div>
    </div>
  )
}
