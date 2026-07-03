import { useState } from 'react'
import { X, BookOpen } from 'lucide-react'
import type { Post } from '@/types'
import { journalService } from '@/services/journalService'

interface Props {
  post: Post
  onClose: () => void
}

export default function ShareToJournalModal({ post, onClose }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const content = [
        `Saved from ${post.group_name} community:`,
        '',
        `"${post.content}"`,
        `— ${post.author_name}`,
        '',
        ...(note.trim() ? ['My thoughts:', note.trim()] : []),
      ].join('\n')

      await journalService.createEntry({ content, is_private: true })
      setDone(true)
      setTimeout(onClose, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-white">Save to Journal</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="text-green-400 font-medium">Saved to your journal</p>
            <p className="text-gray-400 text-sm mt-1">You can view it in your private journal.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Post preview */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-indigo-400 mb-1">{post.group_name} · {post.author_name}</p>
              <p className="text-sm text-gray-200 line-clamp-3">{post.content}</p>
            </div>

            {/* Personal note */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Add your thoughts (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="What resonated with you?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <p className="text-xs text-gray-500">This will be saved as a private journal entry only visible to you.</p>

            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                {loading ? 'Saving…' : 'Save to Journal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
