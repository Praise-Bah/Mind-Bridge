import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MessageCircle } from 'lucide-react'
import type { Conversation } from '@/types'
import type { RootState } from '@/store'
import { chatService } from '@/services/chatService'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import NewChatModal from '@/components/chat/NewChatModal'

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations()
      setConversations(data)
      
      // If conversationId is in URL, select that conversation
      if (conversationId) {
        const found = data.find(c => c.id === conversationId)
        if (found) setSelectedConversation(found)
      }
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    navigate(`/chat/${conversation.id}`)
  }

  const handleNewChat = async (professionalId: string) => {
    try {
      const conversation = await chatService.createConversation([professionalId])
      setConversations(prev => [conversation, ...prev])
      setSelectedConversation(conversation)
      navigate(`/chat/${conversation.id}`)
      setShowNewChat(false)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-white/10 bg-[#12121f]">
      {/* Conversation list sidebar */}
      <div className="w-80 shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
          onNewChat={() => setShowNewChat(true)}
          loading={loading}
        />
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={user?.id || ''}
            onBookSession={() => navigate('/professionals')}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#12121f]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00BFFF]/20 to-[#7C5CBF]/20 flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-[#00BFFF]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Select a conversation</h2>
            <p className="text-gray-400 max-w-sm">
              Choose an existing conversation from the sidebar or start a new chat with a mental health professional.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Start New Conversation
            </button>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={handleNewChat}
        />
      )}
    </div>
  )
}
