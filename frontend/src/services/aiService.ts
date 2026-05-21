import api from './api'
import type { AISession } from '@/types'

const OPENROUTER_SYSTEM_PROMPT = `You are a compassionate and supportive mental health companion on MindBridge. 
Listen empathetically, offer coping strategies, encourage self-care, and be non-judgmental.
You are NOT a licensed therapist. Never diagnose or prescribe. Always recommend professional help for serious concerns.
If someone expresses thoughts of self-harm, encourage them to contact emergency services or a crisis helpline.`

const getOpenRouterApiKey = () => ((import.meta as any).env?.VITE_OPENROUTER_API_KEY || '').trim()

const getOpenRouterModel = () => {
  const model = ((import.meta as any).env?.VITE_OPENROUTER_MODEL || '').trim()
  return model && !model.includes(' ') ? model : 'anthropic/claude-3-haiku'
}

async function callOpenRouterDirect(message: string, history: { role: string; content: string }[] = []): Promise<string> {
  const apiKey = getOpenRouterApiKey()
  if (!apiKey) throw new Error('No API key')
  const model = getOpenRouterModel()

  console.info('Calling OpenRouter directly with model:', model)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'MindBridge',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: OPENROUTER_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

export const aiService = {
  async getSessions(): Promise<AISession[]> {
    try {
      const response = await api.get('/ai/sessions/')
      return response.data.results || response.data
    } catch {
      return []
    }
  },

  async getSession(id: string): Promise<AISession> {
    const response = await api.get(`/ai/sessions/${id}/`)
    return response.data
  },

  async createSession(): Promise<AISession> {
    const response = await api.post('/ai/sessions/', { title: 'New Chat' })
    return response.data
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/ai/sessions/${id}/`)
  },

  async sendMessage(message: string, sessionId?: string): Promise<{ session_id: string; response: string }> {
    const hasOpenRouterKey = !!getOpenRouterApiKey()

    if (hasOpenRouterKey) {
      const responseText = await callOpenRouterDirect(message)
      return { session_id: sessionId || crypto.randomUUID(), response: responseText }
    }

    try {
      const response = await api.post('/ai/chat/', { message, session_id: sessionId })
      return response.data
    } catch (error) {
      if (getOpenRouterApiKey()) {
        const responseText = await callOpenRouterDirect(message)
        return { session_id: sessionId || crypto.randomUUID(), response: responseText }
      }
      throw error
    }
  },

  streamMessage(message: string, sessionId?: string): EventSource {
    const token = localStorage.getItem('token')
    const url = new URL('/api/v1/ai/chat/stream/', window.location.origin)
    url.searchParams.set('message', message)
    if (sessionId) url.searchParams.set('session_id', sessionId)
    if (token) url.searchParams.set('token', token)
    
    return new EventSource(url.toString())
  },
}
