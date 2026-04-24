import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentSessionId: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setMessages: (messages) => set({ messages }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamChunk: (text) =>
    set((state) => ({ streamingContent: state.streamingContent + text })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setCurrentSession: (id) => set({ currentSessionId: id }),

  resetChat: () =>
    set({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      currentSessionId: null,
    }),
}))
