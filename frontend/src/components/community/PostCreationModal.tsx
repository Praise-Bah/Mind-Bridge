import { useState, useRef } from 'react'
import { X, Image, UserX, ChevronDown } from 'lucide-react'
import type { CommunityGroup } from '@/types'
import { communityService } from '@/services/communityService'

const MOOD_OPTIONS = [
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😤' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌱' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
]

interface Props {
  groups: CommunityGroup[]
  defaultGroupSlug?: string
  onClose: () => void
  onCreated: () => void
}

export default function PostCreationModal({ groups, defaultGroupSlug, onClose, onCreated }: Props) {
  const [content, setContent] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(defaultGroupSlug ?? groups[0]?.slug ?? '')
  const [moodTag, setMoodTag] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMoodMenu, setShowMoodMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !selectedGroup) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('is_anonymous', String(isAnonymous))
      if (moodTag) formData.append('mood_tag', moodTag)
      if (imageFile) formData.append('image', imageFile)

      await communityService.createPost(selectedGroup, formData)
      onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedMood = MOOD_OPTIONS.find(m => m.value === moodTag)
  const joinedGroups = groups.filter(g => g.is_member)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">New Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group selector */}
          {!defaultGroupSlug && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Post to group</label>
              <select
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {joinedGroups.map(g => (
                  <option key={g.slug} value={g.slug} className="bg-[#1a1a2e]">{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Text area */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="" className="rounded-xl w-full max-h-40 object-cover" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Image attach */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors border border-white/10">
              <Image size={13} /> Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            {/* Mood tag */}
            <div className="relative">
              <button type="button" onClick={() => setShowMoodMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors border border-white/10">
                {selectedMood ? <>{selectedMood.emoji} {selectedMood.label}</> : <>😶 Mood</>}
                <ChevronDown size={11} />
              </button>
              {showMoodMenu && (
                <div className="absolute top-9 left-0 z-40 bg-[#12121f] border border-white/10 rounded-xl shadow-xl grid grid-cols-2 gap-0.5 p-1.5 w-44">
                  <button type="button" onClick={() => { setMoodTag(''); setShowMoodMenu(false) }}
                    className="col-span-2 px-2 py-1.5 text-xs text-gray-400 hover:bg-white/5 rounded-lg text-left">
                    None
                  </button>
                  {MOOD_OPTIONS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => { setMoodTag(m.value); setShowMoodMenu(false) }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${moodTag === m.value ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300 hover:bg-white/5'}`}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous toggle */}
            <button type="button" onClick={() => setIsAnonymous(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                isAnonymous ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}>
              <UserX size={13} /> Anonymous
            </button>
          </div>

          {isAnonymous && (
            <p className="text-xs text-indigo-400 bg-indigo-500/10 rounded-lg px-3 py-2">
              Your identity will be hidden behind a unique pseudonym (e.g. "Brave Owl")
            </p>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!content.trim() || !selectedGroup || loading}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
