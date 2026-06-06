import { useState } from 'react'
import { Search, Plus, MessageCircle } from 'lucide-react'
import type { Conversation } from '@/types'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (conversation: Conversation) => void
  onNewChat: () => void
  loading?: boolean
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString()
}

export default function ConversationList({ conversations, selectedId, onSelect, onNewChat, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message?.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-[#0d0d1a] border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white hover:opacity-90 transition-opacity"
            title="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00BFFF]"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageCircle size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">No conversations yet</p>
            <p className="text-gray-500 text-sm mt-1">Start a chat with a professional</p>
            <button
              onClick={onNewChat}
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  selectedId === conversation.id
                    ? 'bg-gradient-to-r from-[#00BFFF]/20 to-[#7C5CBF]/20 border border-[#00BFFF]/30'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center text-white font-semibold">
                    {conversation.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  {/* Online indicator - placeholder */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0d0d1a] rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white truncate">
                      {conversation.name || 'Conversation'}
                    </p>
                    <span className="text-xs text-gray-500 shrink-0">
                      {timeAgo(conversation.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.last_message?.content || 'No messages yet'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#00BFFF] text-white text-xs font-medium flex items-center justify-center">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
