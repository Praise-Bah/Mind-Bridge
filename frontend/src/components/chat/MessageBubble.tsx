import { useState } from 'react'
import { Check, CheckCheck, Heart, ThumbsUp, Smile, Frown, MoreHorizontal, Reply, Copy, Trash2, Flag } from 'lucide-react'
import type { Message } from '@/types'

interface Props {
  message: Message
  isOwn: boolean
  onReact?: (messageId: string, reaction: string) => void
  onReply?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onReport?: (messageId: string) => void
}

const REACTIONS = [
  { type: 'heart', icon: Heart, color: 'text-red-400' },
  { type: 'thumbsup', icon: ThumbsUp, color: 'text-blue-400' },
  { type: 'smile', icon: Smile, color: 'text-yellow-400' },
  { type: 'sad', icon: Frown, color: 'text-purple-400' },
]

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isOwn, onReact, onReply, onDelete, onReport }: Props) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setShowMenu(false)
  }

  return (
    <div 
      className={`group flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseLeave={() => { setShowReactions(false); setShowMenu(false) }}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {message.sender_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      <div className={`relative max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name for non-own messages */}
        {!isOwn && (
          <p className="text-xs text-[#00BFFF] font-medium mb-1 ml-1">{message.sender_name}</p>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white rounded-br-md'
              : 'bg-white/10 text-white rounded-bl-md'
          }`}
        >
          {/* Image attachment */}
          {message.message_type === 'image' && message.attachment && (
            <img 
              src={message.attachment} 
              alt="Attachment" 
              className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90"
            />
          )}

          {/* File attachment */}
          {message.message_type === 'file' && message.attachment && (
            <a 
              href={message.attachment} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg mb-2 hover:bg-white/20 transition-colors"
            >
              <span className="text-sm">📎 Attachment</span>
            </a>
          )}

          {/* Text content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time and read status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] opacity-70">{formatTime(message.created_at)}</span>
            {isOwn && (
              message.is_read 
                ? <CheckCheck size={12} className="text-[#00BFFF]" />
                : <Check size={12} className="opacity-70" />
            )}
          </div>
        </div>

        {/* Reaction bar - appears on hover */}
        <div 
          className={`absolute ${isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          <div className="flex items-center gap-1">
            {/* Quick reactions */}
            <div 
              className="relative"
              onMouseEnter={() => setShowReactions(true)}
            >
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Heart size={14} className="text-gray-400" />
              </button>
              
              {showReactions && (
                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-1 flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl z-10`}>
                  {REACTIONS.map(r => (
                    <button
                      key={r.type}
                      onClick={() => { onReact?.(message.id, r.type); setShowReactions(false) }}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <r.icon size={16} className={r.color} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* More options */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <MoreHorizontal size={14} className="text-gray-400" />
              </button>

              {showMenu && (
                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 w-36 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10`}>
                  <button
                    onClick={() => { onReply?.(message); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Reply size={14} /> Reply
                  </button>
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  {isOwn ? (
                    <button
                      onClick={() => { onDelete?.(message.id); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => { onReport?.(message.id); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <Flag size={14} /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
