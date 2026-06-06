import { useState } from 'react'
import { Calendar, Heart, Lock, Unlock, Edit3, Trash2, Brain, Smile, Meh, Frown } from 'lucide-react'
import type { JournalEntry } from '@/types'

interface JournalEntryCardProps {
  entry: JournalEntry
  onEdit?: (entry: JournalEntry) => void
  onDelete?: (entry: JournalEntry) => void
}

const moodIcons = {
  1: { icon: Frown, color: 'text-red-500', label: 'Very Sad' },
  2: { icon: Frown, color: 'text-orange-500', label: 'Sad' },
  3: { icon: Meh, color: 'text-yellow-500', label: 'Neutral' },
  4: { icon: Smile, color: 'text-green-500', label: 'Happy' },
  5: { icon: Heart, color: 'text-pink-500', label: 'Very Happy' }
}

export default function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const moodIcon = entry.mood_score ? moodIcons[entry.mood_score as keyof typeof moodIcons] : null
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {entry.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(entry.created_at)}</span>
              </div>
              {moodIcon && (
                <div className="flex items-center gap-1">
                  <moodIcon.icon size={14} className={moodIcon.color} />
                  <span>{moodIcon.label}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {entry.is_private ? <Lock size={14} /> : <Unlock size={14} />}
                <span>{entry.is_private ? 'Private' : 'Public'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(entry)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Edit3 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(entry)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {isExpanded ? entry.content : truncateContent(entry.content)}
        </div>
        
        {entry.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
        
        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {entry.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Preview */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
            <Brain size={14} />
            AI Insights
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            This entry shows emotional growth and self-awareness. Consider reflecting on the patterns you've noticed.
          </p>
        </div>
      </div>
    </div>
  )
}
