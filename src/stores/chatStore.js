import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentSessionId: null,

  // Brain Language state
  chatMode: 'listening', // 'listening' | 'solution'
  brainInsights: null, // latest insight snapshot from AI
  isAnalyzing: false,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setMessages: (messages) => set({ messages }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamChunk: (text) =>
    set((state) => ({ streamingContent: state.streamingContent + text })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setCurrentSession: (id) => set({ currentSessionId: id }),

  setChatMode: (mode) => set({ chatMode: mode }),

  setBrainInsights: (insights) => set({ brainInsights: insights }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  resetChat: () =>
    set({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      currentSessionId: null,
      brainInsights: null,
      isAnalyzing: false,
    }),
}))
