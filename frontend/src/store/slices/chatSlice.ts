import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Message, Conversation } from '@/types'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  typingUsers: Record<string, boolean>
  isConnected: boolean
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {},
  isConnected: false,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload
    },
    setActiveConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.activeConversation = action.payload
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setTypingUser: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      state.typingUsers[action.payload.userId] = action.payload.isTyping
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    clearChat: (state) => {
      state.activeConversation = null
      state.messages = []
      state.typingUsers = {}
    },
  },
})

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  addMessage,
  setTypingUser,
  setConnected,
  clearChat,
} = chatSlice.actions

export default chatSlice.reducer
