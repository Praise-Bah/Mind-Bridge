import { useState, useEffect } from 'react'
import { Plus, BookOpen, TrendingUp, Calendar, Search } from 'lucide-react'
import { journalService } from '@/services/journalService'
import type { JournalEntry } from '@/types'
import JournalEntryCard from '@/components/journal/JournalEntryCard'
import JournalEntryModal from '@/components/journal/JournalEntryModal'
import MoodTracker from '@/components/journal/MoodTracker'
import JournalStats from '@/components/journal/JournalStats'

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [dailyPrompt, setDailyPrompt] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entries' | 'mood' | 'stats'>('entries')
  const [searchTerm, setSearchTerm] = useState('')
  const [moodFilter, setMoodFilter] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [entriesData, promptData] = await Promise.all([
        journalService.getEntries(),
        journalService.getDailyPrompt()
      ])
      
      setEntries(entriesData)
      setDailyPrompt(promptData?.prompt_text || null)
      
      // Calculate streak (simplified - in real app this would come from backend)
      const today = new Date().toISOString().split('T')[0]
      const hasEntryToday = entriesData.some(entry => 
        entry.created_at?.startsWith(today)
      )
      setStreak(hasEntryToday ? 1 : 0)
      
    } catch (error) {
      console.error('Error loading journal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async (entryData: Partial<JournalEntry>) => {
    try {
      if (editingEntry) {
        await journalService.updateEntry(editingEntry.id, entryData)
        setEntries(entries.map(e => e.id === editingEntry.id ? { ...e, ...entryData } : e))
      } else {
        const newEntry = await journalService.createEntry(entryData)
        setEntries([newEntry, ...entries])
      }
      
      setEditingEntry(null)
      setShowModal(false)
    } catch (error) {
      console.error('Error saving entry:', error)
    }
  }

  const handleDeleteEntry = async (entry: JournalEntry) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await journalService.deleteEntry(entry.id)
        setEntries(entries.filter(e => e.id !== entry.id))
      } catch (error) {
        console.error('Error deleting entry:', error)
      }
    }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMood = moodFilter === null || entry.mood_score === moodFilter
    return matchesSearch && matchesMood
  })

  // Prepare mood data for tracker
  const moodData = entries
    .filter(entry => entry.mood_score)
    .map(entry => ({
      date: new Date(entry.created_at).toISOString().split('T')[0],
      mood: entry.mood_score!,
      label: new Date(entry.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
    .slice(-7) // Last 7 days

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Journal</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={28} />
            My Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Record your thoughts and track your emotional journey
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: 'entries', label: 'Entries', icon: BookOpen },
          { id: 'mood', label: 'Mood Tracker', icon: TrendingUp },
          { id: 'stats', label: 'Statistics', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'entries' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={moodFilter || ''}
                onChange={(e) => setMoodFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Moods</option>
                <option value="5">Very Happy</option>
                <option value="4">Happy</option>
                <option value="3">Neutral</option>
                <option value="2">Sad</option>
                <option value="1">Very Sad</option>
              </select>
            </div>
          </div>

          {/* Daily Prompt */}
          {dailyPrompt && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Today's Prompt</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">{dailyPrompt}</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Write about this
                </button>
              </div>
            </div>
          )}

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || moodFilter ? 'No matching entries' : 'No journal entries yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || moodFilter 
                  ? 'Try adjusting your filters'
                  : 'Start your journaling journey by writing your first entry'
                }
              </p>
              {!searchTerm && !moodFilter && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Write Your First Entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map(entry => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={setEditingEntry}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mood' && (
        <MoodTracker data={moodData} />
      )}

      {activeTab === 'stats' && (
        <JournalStats entries={entries} streak={streak} />
      )}

      {/* Modal */}
      {(showModal || editingEntry) && (
        <JournalEntryModal
          entry={editingEntry}
          onClose={() => {
            setShowModal(false)
            setEditingEntry(null)
          }}
          onSave={handleSaveEntry}
          dailyPrompt={dailyPrompt}
        />
      )}
    </div>
  )
}
