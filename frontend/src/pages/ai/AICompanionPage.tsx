import { useState, useRef, useEffect } from 'react'
import { Menu, X, Plus, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ChatMessage from '@/components/ai/ChatMessage'
import ChatInput from '@/components/ai/ChatInput'
import AIAvatar from '@/components/ai/AIAvatar'
import { aiService } from '@/services/aiService'
import type { AISession, AIMessage } from '@/types'

export default function AICompanionPage() {
  const [sessions, setSessions] = useState<AISession[]>([])
  const [currentSession, setCurrentSession] = useState<AISession | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSessions = async () => {
    try {
      const data = await aiService.getSessions()
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const session = await aiService.getSession(sessionId)
      setCurrentSession(session)
      setMessages(session.messages || [])
      setIsSidebarOpen(false)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const createNewSession = () => {
    setCurrentSession(null)
    setMessages([])
    setIsSidebarOpen(false)
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsStreaming(true)

    try {
      const response = await aiService.sendMessage(content, currentSession?.id)
      
      if (!currentSession) {
        setCurrentSession({ 
          id: response.session_id, 
          title: content.slice(0, 50),
          is_active: true,
          messages: [],
          message_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        loadSessions()
      }

      const aiMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or consider chatting with one of our professionals.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-card border-r transform transition-transform duration-300 ease-in-out',
          'lg:transform-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Chat History</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-muted rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={createNewSession}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  currentSession?.id === session.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(session.updated_at)}
                  </p>
                </div>
              </button>
            ))}

            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <AIAvatar size="sm" animated={false} />
            <div>
              <h1 className="font-semibold">AI Companion</h1>
              <p className="text-xs text-muted-foreground">Always here to listen</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <AIAvatar size="lg" animated />
              <h2 className="mt-6 text-xl font-semibold bg-gradient-to-r from-[#00BFFF] via-[#7C5CBF] to-[#4F46E5] bg-clip-text text-transparent">
                Hello! I'm your AI Companion
              </h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                I'm here to listen, support, and help you navigate your thoughts and feelings. 
                How are you feeling today?
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "I'm feeling anxious today",
                  "I had a difficult conversation",
                  "Help me calm down",
                  "I need someone to talk to",
                  "I'm feeling overwhelmed",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-4 py-2 rounded-full bg-muted hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] text-sm transition-colors border border-transparent hover:border-[#7C3AED]/20"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Share what's on your mind..."
        />
      </main>
    </div>
  )
}
