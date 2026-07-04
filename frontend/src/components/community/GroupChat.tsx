import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Send, Loader2, Shield } from 'lucide-react'
import type { Message } from '@/types'
import type { RootState } from '@/store'
import { communityService } from '@/services/communityService'

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost/ws').replace(/\/$/, '')

interface Props {
  groupSlug: string
  groupName: string
}

export default function GroupChat({ groupSlug, groupName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { token } = useSelector((state: RootState) => state.auth)
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    initChat()
  }, [groupSlug])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId || !token) return

    const ws = new WebSocket(`${WS_BASE}/chat/${conversationId}/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message') {
          const msg: Message = {
            id: data.message.id,
            conversation: conversationId,
            sender: data.sender_id,
            sender_name: data.sender_name,
            sender_avatar: data.sender_avatar || null,
            content: data.message.content,
            message_type: 'text',
            attachment: null,
            is_read: false,
            read_at: null,
            created_at: data.message.created_at,
          }
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        } else if (data.type === 'typing' && data.user_id !== user?.id) {
          setIsTyping(data.is_typing)
          setTypingUser(data.username || '')
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
          if (data.is_typing) {
            typingTimerRef.current = setTimeout(() => setIsTyping(false), 4000)
          }
        }
      } catch {}
    }

    return () => {
      ws.close()
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [conversationId, token])

  async function initChat() {
    setLoading(true)
    try {
      const chatInfo = await communityService.getGroupChat(groupSlug)
      setConversationId(chatInfo.conversation_id)
      const msgs = await communityService.getGroupChatMessages(groupSlug)
      setMessages(msgs)
    } catch (error) {
      console.error('Failed to init group chat:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'chat_message', message: content }))
      } else {
        const msg = await communityService.sendGroupChatMessage(groupSlug, content)
        setMessages(prev => [...prev, msg])
      }
    } catch {
      setText(content)
    } finally {
      setSending(false)
    }
  }

  function handleTyping() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  function getAvatarColor(name: string) {
    const colors = [
      'from-indigo-500 to-purple-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-yellow-500',
      'from-violet-500 to-fuchsia-500',
      'from-lime-500 to-green-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-indigo-400" size={28} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[60vh] bg-[#12121f] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Shield size={16} className="text-indigo-400" />
        <span className="text-sm text-gray-300">
          All identities are anonymous in this chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
              <Shield size={28} className="text-indigo-400" />
            </div>
            <p className="text-gray-400 text-sm">
              Welcome to the {groupName} group chat!
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Your identity is hidden behind an anonymous pseudonym.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === user?.id
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(msg.sender_name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {getInitials(msg.sender_name)}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <p className="text-xs text-indigo-400 font-medium mb-0.5 px-1">
                      {msg.sender_name}
                    </p>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white/8 text-gray-200 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-500 mt-0.5 px-1 ${isMe ? 'text-right' : ''}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="animate-pulse">{typingUser || 'Someone'} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              handleTyping()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
