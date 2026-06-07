import { useState } from 'react'
import { X, Save, Brain, Lightbulb } from 'lucide-react'
import type { JournalEntry } from '@/types'

interface JournalEntryModalProps {
  entry?: JournalEntry | null
  onClose: () => void
  onSave: (entry: Partial<JournalEntry>) => void
  dailyPrompt?: string | null
}

const MOODS = [
  { value: 1, label: 'Very Sad', emoji: '😢', color: 'text-red-500' },
  { value: 2, label: 'Sad', emoji: '😔', color: 'text-orange-500' },
  { value: 3, label: 'Neutral', emoji: '😐', color: 'text-yellow-500' },
  { value: 4, label: 'Happy', emoji: '😊', color: 'text-green-500' },
  { value: 5, label: 'Very Happy', emoji: '😄', color: 'text-pink-500' }
]

const SUGGESTED_TAGS = [
  'gratitude', 'anxiety', 'achievement', 'challenge', 'growth',
  'reflection', 'relationships', 'work', 'health', 'creativity'
]

export default function JournalEntryModal({ entry, onClose, onSave, dailyPrompt }: JournalEntryModalProps) {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    mood_score: entry?.mood_score || null,
    tags: entry?.tags || [],
    is_private: entry?.is_private ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to save your entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
    setShowTagInput(false)
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) })
  }

  const generateAISuggestion = async () => {
    setGeneratingSuggestion(true)
    try {
      // Simulate AI suggestion generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      setAiSuggestion("Consider writing about three things you're grateful for today, and how they made you feel. This practice can help shift your perspective and improve your overall mood.")
    } finally {
      setGeneratingSuggestion(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Daily Prompt */}
          {dailyPrompt && !entry && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-2">
                <Lightbulb size={16} />
                Today's Prompt
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-sm">{dailyPrompt}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Give your entry a title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="What's on your mind today..."
              rows={8}
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">{formData.content.length} characters</span>
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How are you feeling?
            </label>
            <div className="flex gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood_score: mood.value })}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    formData.mood_score === mood.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={`text-xs mt-1 ${mood.color}`}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            {showTagInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                  className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Add a tag..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTagInput(false); setNewTag('') }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="px-3 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-gray-400 dark:hover:border-gray-500"
                >
                  + Add tag
                </button>
                {SUGGESTED_TAGS.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Suggestion */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                <Brain size={16} />
                AI Writing Assistant
              </div>
              <button
                type="button"
                onClick={generateAISuggestion}
                disabled={generatingSuggestion}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm disabled:opacity-50"
              >
                {generatingSuggestion ? 'Thinking...' : 'Get Suggestion'}
              </button>
            </div>
            {aiSuggestion && (
              <p className="text-purple-600 dark:text-purple-400 text-sm">{aiSuggestion}</p>
            )}
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              Keep this entry private
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Save size={16} />
              {entry ? 'Update' : 'Save'} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
