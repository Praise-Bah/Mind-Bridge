import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Share2, Flag, BookOpen, Pin, MoreHorizontal } from 'lucide-react'
import type { Post } from '@/types'
import { communityService } from '@/services/communityService'
import ReactionPicker, { REACTIONS } from './ReactionPicker'

interface Props {
  post: Post
  isModerator?: boolean
  onOpenComments: (post: Post) => void
  onShare: (post: Post) => void
  onReport: (post: Post) => void
  onSaveToJournal: (post: Post) => void
  onUpdate: (updated: Post) => void
}

const MOOD_COLORS: Record<string, string> = {
  anxious: 'bg-purple-500/20 text-purple-300',
  sad: 'bg-blue-500/20 text-blue-300',
  angry: 'bg-red-500/20 text-red-300',
  overwhelmed: 'bg-orange-500/20 text-orange-300',
  hopeful: 'bg-green-500/20 text-green-300',
  grateful: 'bg-yellow-500/20 text-yellow-300',
  calm: 'bg-teal-500/20 text-teal-300',
  happy: 'bg-pink-500/20 text-pink-300',
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PostCard({ post, isModerator, onOpenComments, onShare, onReport, onSaveToJournal, onUpdate }: Props) {
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [reacting, setReacting] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleReaction(type: string) {
    if (reacting) return
    setReacting(type)
    const hadReaction = (post.user_reactions ?? []).includes(type)
    const newUserReactions = hadReaction
      ? (post.user_reactions ?? []).filter(r => r !== type)
      : [...(post.user_reactions ?? []), type]
    const newSummary = {
      ...(post.reactions_summary ?? {}),
      [type]: ((post.reactions_summary ?? {})[type] ?? 0) + (hadReaction ? -1 : 1),
    }
    onUpdate({ ...post, user_reactions: newUserReactions, reactions_summary: newSummary })
    try {
      await communityService.toggleReaction(post.id, type)
    } catch {
      onUpdate(post)
    } finally {
      setReacting(null)
    }
  }

  async function handlePin() {
    const result = await communityService.pinPost(post.id)
    onUpdate({ ...post, is_pinned: result.is_pinned })
    setShowMenu(false)
  }

  const totalReactions = Object.values(post.reactions_summary ?? {}).reduce((a, b) => a + b, 0)
  const activeEmojis = REACTIONS.filter(r => ((post.reactions_summary ?? {})[r.type] ?? 0) > 0).slice(0, 3)

  return (
    <div className={`bg-[#1a1a2e] border rounded-2xl p-4 transition-all duration-200 animate-post-slide-in ${post.is_pinned ? 'border-indigo-500/40' : 'border-white/10'}`}>
      {/* Pinned badge */}
      {post.is_pinned && (
        <div className="flex items-center gap-1 text-indigo-400 text-xs mb-2">
          <Pin size={11} /> Pinned post
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-none">{post.author_name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              <button
                onClick={() => navigate(`/community/${post.group_slug}`)}
                className="hover:text-indigo-400 transition-colors"
              >{post.group_name}</button>
              {' · '}{timeAgo(post.created_at)}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-40 w-44 bg-[#12121f] border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <button onClick={() => { onSaveToJournal(post); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                <BookOpen size={14} /> Save to Journal
              </button>
              <button onClick={() => { onShare(post); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                <Share2 size={14} /> Share Post
              </button>
              {isModerator && (
                <button onClick={handlePin}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:bg-white/5 transition-colors">
                  <Pin size={14} /> {post.is_pinned ? 'Unpin' : 'Pin Post'}
                </button>
              )}
              <button onClick={() => { onReport(post); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors">
                <Flag size={14} /> Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.image && (
        <img src={post.image} alt="" className="mt-3 rounded-xl w-full max-h-64 object-cover" />
      )}

      {/* Mood tag */}
      {post.mood_tag && (
        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${MOOD_COLORS[post.mood_tag] ?? 'bg-white/10 text-gray-300'}`}>
          {post.mood_tag}
        </span>
      )}

      {/* Reaction summary bar */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
          {activeEmojis.map(r => (
            <span key={r.type} className="text-base leading-none">{r.emoji}</span>
          ))}
          <span className="ml-1">{totalReactions}</span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
        {/* Reaction trigger */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              (post.user_reactions ?? []).length > 0
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <span className="text-base leading-none">
              {(post.user_reactions ?? []).length > 0
                ? REACTIONS.find(r => r.type === (post.user_reactions ?? [])[0])?.emoji ?? '❤️'
                : '❤️'}
            </span>
            <span className={`tabular-nums transition-all duration-200 ${reacting ? 'animate-reaction-bounce' : ''}`}>
              {totalReactions > 0 ? totalReactions : 'React'}
            </span>
          </button>
          {showPicker && (
            <ReactionPicker
              userReactions={post.user_reactions ?? []}
              onSelect={handleReaction}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        <button
          onClick={() => onOpenComments(post)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
        >
          <MessageCircle size={14} />
          {post.comments_count > 0 ? post.comments_count : 'Comment'}
        </button>
      </div>
    </div>
  )
}
