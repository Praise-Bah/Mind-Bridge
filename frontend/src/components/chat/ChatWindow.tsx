import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Phone, Video, MoreVertical, AlertTriangle, Calendar, Loader2 } from 'lucide-react'
import type { Conversation, Message } from '@/types'
import type { RootState } from '@/store'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { chatService } from '@/services/chatService'

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost/ws').replace(/\/$/, '')

interface Props {
  conversation: Conversation
  currentUserId: string
  onBookSession?: () => void
}

export default function ChatWindow({ conversation, currentUserId, onBookSession }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { token } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    loadMessages()
    chatService.markAsRead(conversation.id).catch(() => {})
  }, [conversation.id])

  // Real-time WebSocket connection per conversation
  useEffect(() => {
    if (!token) return

    const ws = new WebSocket(`${WS_BASE}/chat/${conversation.id}/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message') {
          const msg: Message = data.message
          // Skip if already in list — REST response adds the sender's own message
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        } else if (data.type === 'typing') {
          if (data.user_id !== currentUserId) {
            setIsTyping(data.is_typing)
            if (data.is_typing) {
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
              typingTimerRef.current = setTimeout(() => setIsTyping(false), 4_000)
            }
          }
        }
      } catch {
        // ignore malformed frames
      }
    }

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      ws.close()
      wsRef.current = null
    }
  }, [conversation.id, token, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const data = await chatService.getMessages(conversation.id)
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (content: string) => {
    if (!content.trim()) return
    setSending(true)
    try {
      const newMessage = await chatService.sendMessage(conversation.id, content)
      // Skip if WS broadcast already added it
      setMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }))
    }
  }

  // Get other participant info (for 1:1 chats)
  const otherParticipant = conversation.name || 'Professional'

  return (
    <div className="h-full flex flex-col bg-[#12121f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center text-white font-semibold">
              {otherParticipant.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0d0d1a] rounded-full" />
          </div>

          <div>
            <h3 className="font-semibold text-white">{otherParticipant}</h3>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Video call */}
          <button className="p-2.5 rounded-xl text-gray-400 hover:text-[#00BFFF] hover:bg-white/5 transition-colors" title="Video call">
            <Video size={20} />
          </button>

          {/* Voice call */}
          <button className="p-2.5 rounded-xl text-gray-400 hover:text-[#00BFFF] hover:bg-white/5 transition-colors" title="Voice call">
            <Phone size={20} />
          </button>

          {/* Book session */}
          {onBookSession && (
            <button 
              onClick={onBookSession}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Calendar size={16} />
              Book Session
            </button>
          )}

          {/* More options */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(v => !v)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  View Profile
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  Mute Notifications
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
                  <AlertTriangle size={14} />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#00BFFF]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00BFFF]/20 to-[#7C5CBF]/20 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-gray-400 font-medium">Start the conversation</p>
            <p className="text-gray-500 text-sm mt-1">Send a message to begin chatting</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender === currentUserId}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center text-white text-xs font-semibold">
                  {otherParticipant.charAt(0).toUpperCase()}
                </div>
                <div className="px-4 py-2.5 bg-white/10 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Crisis button */}
      <div className="px-4 pb-2">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
          <AlertTriangle size={16} />
          I need urgent help
        </button>
      </div>

      {/* Message input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={sending}
        placeholder={`Message ${otherParticipant}...`}
      />
    </div>
  )
}
