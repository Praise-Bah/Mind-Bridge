import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { communityService } from '@/services/communityService'

const REASONS = [
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'spam', label: 'Spam' },
  { value: 'harmful', label: 'Harmful Content' },
  { value: 'other', label: 'Other' },
]

interface Props {
  type: 'post' | 'comment'
  targetId: string
  onClose: () => void
}

export default function ReportModal({ type, targetId, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setLoading(true)
    try {
      if (type === 'post') {
        await communityService.reportPost(targetId, reason, details)
      } else {
        await communityService.reportComment(targetId, reason, details)
      }
      setDone(true)
      setTimeout(onClose, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-red-400">
            <Flag size={16} />
            <h2 className="font-semibold text-white">Report {type === 'post' ? 'Post' : 'Comment'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="text-green-400 font-medium">Report submitted</p>
            <p className="text-gray-400 text-sm mt-1">Our moderation team will review this.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Reason</label>
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{r.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Additional details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={2}
                placeholder="Describe the issue…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!reason || loading}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
