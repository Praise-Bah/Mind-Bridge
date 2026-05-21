import { useState, useCallback, useRef } from 'react'
import { aiService } from '@/services/aiService'
import type { AIMessage, AISession } from '@/types'

interface UseAIChatOptions {
  onStreamStart?: () => void
  onStreamEnd?: () => void
  onError?: (error: Error) => void
}

interface UseAIChatReturn {
  messages: AIMessage[]
  currentSession: AISession | null
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  sendMessage: (content: string) => Promise<void>
  sendMessageWithStream: (content: string) => Promise<void>
  stopStreaming: () => void
  loadSession: (sessionId: string) => Promise<void>
  createNewSession: () => void
  setMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [currentSession, setCurrentSession] = useState<AISession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)
      const session = await aiService.getSession(sessionId)
      setCurrentSession(session)
      setMessages(session.messages || [])
    } catch (error) {
      options.onError?.(error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const createNewSession = useCallback(() => {
    stopStreaming()
    setCurrentSession(null)
    setMessages([])
    setStreamingContent('')
  }, [stopStreaming])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

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
      }

      const aiMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      options.onError?.(error as Error)
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or consider chatting with one of our professionals.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [currentSession, options])

  const sendMessageWithStream = useCallback(async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    options.onStreamStart?.()

    try {
      const eventSource = aiService.streamMessage(content, currentSession?.id)
      eventSourceRef.current = eventSource

      let fullContent = ''

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close()
          eventSourceRef.current = null
          setIsStreaming(false)
          options.onStreamEnd?.()

          const aiMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, aiMessage])
          setStreamingContent('')
          setIsLoading(false)
        } else {
          fullContent += event.data
          setStreamingContent(fullContent)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        eventSourceRef.current = null
        setIsStreaming(false)
        setIsLoading(false)
        options.onError?.(new Error('Stream connection failed'))

        if (fullContent) {
          const aiMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, aiMessage])
        }
        setStreamingContent('')
      }
    } catch (error) {
      setIsStreaming(false)
      setIsLoading(false)
      options.onError?.(error as Error)
    }
  }, [currentSession, options])

  return {
    messages,
    currentSession,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    sendMessageWithStream,
    stopStreaming,
    loadSession,
    createNewSession,
    setMessages,
  }
}
