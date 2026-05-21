import { useState } from 'react'
import { X, BookOpen, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveToJournalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, notes: string) => Promise<void>
  sessionSummary?: string
}

export default function SaveToJournalModal({
  isOpen,
  onClose,
  onSave,
  sessionSummary,
}: SaveToJournalModalProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState(sessionSummary || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onSave(title.trim(), notes.trim())
      onClose()
    } catch (error) {
      console.error('Failed to save to journal:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-[#00D4FF]/10">
            <BookOpen className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Save to Journal</h2>
            <p className="text-sm text-muted-foreground">
              Keep a record of this conversation
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Entry Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conversation about anxiety"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Notes / Summary
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or let us auto-generate a summary..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#00D4FF] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-gradient-to-r from-[#0EA5E9] to-[#00D4FF] text-white',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save to Journal
          </button>
        </div>
      </div>
    </div>
  )
}
