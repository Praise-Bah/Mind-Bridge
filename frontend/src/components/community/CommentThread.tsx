import { useState } from 'react'
import { Reply, Trash2, Flag } from 'lucide-react'
import type { Comment } from '@/types'
import { communityService } from '@/services/communityService'

interface Props {
  postId: string
  comments: Comment[]
  onReport: (commentId: string) => void
  onDeleted: (commentId: string) => void
  onAdded: (comment: Comment) => void
}

function renderWithMentions(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-indigo-400 font-medium">{part}</span>
      : part
  )
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface CommentItemProps {
  comment: Comment
  postId: string
  isReply?: boolean
  onReport: (commentId: string) => void
  onDeleted: (commentId: string) => void
  onAdded: (comment: Comment) => void
}

function CommentItem({ comment, postId, isReply, onReport, onDeleted, onAdded }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submitReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const newComment = await communityService.createComment(postId, {
        content: replyText.trim(),
        is_anonymous: isAnon,
        parent: comment.id,
      })
      onAdded(newComment)
      setReplyText('')
      setShowReply(false)
      setShowReplies(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    await communityService.deletePost(comment.id)
    onDeleted(comment.id)
  }

  return (
    <div className={`${isReply ? 'animate-comment-indent' : ''}`}>
      <div className="flex gap-2.5">
        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold mt-0.5">
          {comment.author_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3 py-2">
            <p className="text-xs font-semibold text-indigo-300">{comment.author_name}</p>
            <p className="text-sm text-gray-200 leading-relaxed mt-0.5">
              {renderWithMentions(comment.content)}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 ml-1">
            <span className="text-[11px] text-gray-500">{timeAgo(comment.created_at)}</span>

            {!isReply && (
              <button onClick={() => setShowReply(v => !v)}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-400 transition-colors">
                <Reply size={11} /> Reply
              </button>
            )}

            <button onClick={() => onReport(comment.id)}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-400 transition-colors">
              <Flag size={10} /> Report
            </button>

            {comment.user_can_delete && (
              <button onClick={handleDelete}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={10} /> Delete
              </button>
            )}
          </div>

          {/* Inline reply box */}
          {showReply && (
            <div className="mt-2 flex gap-2 items-start">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                placeholder="Write a reply… use @username to mention"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setIsAnon(v => !v)}
                title="Anonymous"
                className={`px-2 py-1.5 rounded-xl text-xs border transition-colors ${isAnon ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-400'}`}
              >
                Anon
              </button>
              <button onClick={submitReply} disabled={!replyText.trim() || submitting}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                {submitting ? '…' : 'Send'}
              </button>
            </div>
          )}

          {/* Show replies toggle */}
          {!isReply && (comment.replies?.length ?? 0) > 0 && (
            <button onClick={() => setShowReplies(v => !v)}
              className="mt-2 ml-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              {showReplies ? 'Hide' : `Show ${comment.replies?.length ?? 0} repl${(comment.replies?.length ?? 0) === 1 ? 'y' : 'ies'}`}
            </button>
          )}

          {/* Nested replies */}
          {!isReply && showReplies && (comment.replies?.length ?? 0) > 0 && (
            <div className="mt-2 ml-2 pl-3 border-l-2 border-white/10 space-y-3">
              {(comment.replies ?? []).map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isReply
                  onReport={onReport}
                  onDeleted={onDeleted}
                  onAdded={onAdded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentThread({ postId, comments, onReport, onDeleted, onAdded }: Props) {
  const [text, setText] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const comment = await communityService.createComment(postId, {
        content: text.trim(),
        is_anonymous: isAnon,
      })
      onAdded(comment)
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment… use @username to mention"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button type="button" onClick={() => setIsAnon(v => !v)}
          className={`px-3 py-2 rounded-xl text-xs border transition-colors ${isAnon ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-400 hover:text-gray-200'}`}>
          Anon
        </button>
        <button type="submit" disabled={!text.trim() || submitting}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
          {submitting ? '…' : 'Post'}
        </button>
      </form>

      {/* Comment list */}
      <div className="space-y-4">
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReport={onReport}
            onDeleted={onDeleted}
            onAdded={onAdded}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  )
}
