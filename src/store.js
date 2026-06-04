import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(persist(
  (set, get) => ({
    // User info
    user: {
      name: 'Alex Silva, CFP®',
      nickname: '',
      instructions: '',
      plan: 'free', // 'free' | 'starter' | 'pro'
      dailyQuote: 'Posicionamento autoral não é sobre o que você vende, mas sobre a tese que você defende para atrair os clientes (leads) qualificados.',
      suggestions: [
        'Como explicar a volatilidade atual para captar clientes de alta renda?',
        'A tese oculta sobre fundos exclusivos que atrai grandes investidores.',
        'Por que a maioria dos assessores perde leads ao complicar demais a carteira?'
      ]
    },
    // Notification preferences
    notifications: {
      suggestions: true,
      responseComplete: false,
    },
    // Privacy preferences
    privacy: {
      memoryEnabled: true,
      improveProduct: true,
    },
    // Theme handling
    theme: 'light',
    setTheme: (t) => set({ theme: t }),
    // DB user (synced from backend after login)
    dbUser: null,
    setDbUser: (u) => set((s) => ({
      dbUser: u,
      credits: u?.credits ?? 0,
      avulsoCredits: u?.avulso_credits ?? 0,
      user: {
        ...s.user,
        plan: u?.plan ?? s.user.plan,
        nickname: u?.nickname ?? s.user.nickname,
        instructions: u?.instructions ?? s.user.instructions,
      },
    })),
    // Credit balance (local mirror of dbUser.credits)
    credits: 0,
    avulsoCredits: 0,
    addCredits: (amt) => set((s) => ({ credits: s.credits + amt })),
    // Agents definitions — history is session-only (not persisted, see partialize)
    agents: [
      {
        id: 'linage',
        name: 'Linage',
        personality: 'Usa humor como ferramenta estratégica, não como muleta. Sabe ser leve sem ser raso. Faz o leitor sorrir e pensar ao mesmo tempo. Extrovertido, comunicativo, genuinamente descontraído — mas nunca perde a substância. A autoridade dele é tão sólida que pode brincar sem que ninguém questione sua competência. Tom: confiante, magnético, espirituoso sem forçar.',
        history: []
      }
    ],
    // Posts collection — each post may carry chatHistory for draft continuity
    posts: [],
    addPost: (post) => set((s) => ({ posts: [...s.posts, post] })),
    // Preserve local chatHistory when overwriting with DB posts
    setPosts: (newPosts) => set((s) => ({
      posts: newPosts.map(p => {
        const existing = s.posts.find(ep => ep.id === p.id);
        return existing?.chatHistory ? { ...p, chatHistory: existing.chatHistory } : p;
      })
    })),
    updatePost: (id, updates) =>
      set((s) => ({
        posts: s.posts.map((p) => (p.id === id ? { ...p, ...updates } : p))
      })),
    // Active draft being worked on in the Advisor page
    activeDraftId: null,
    setActiveDraftId: (id) => set({ activeDraftId: id }),
    // Chat handling (simple push to agent.history)
    addMessageToAgent: (agentId, message) =>
      set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId ? { ...a, history: [...a.history, message] } : a
        )
      })),
    resetAgentHistory: (agentId) =>
      set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId ? { ...a, history: [] } : a
        )
      })),
    setDailyContent: (quote, suggestions) =>
      set((s) => ({
        user: { ...s.user, dailyQuote: quote, suggestions }
      })),
    // Legacy — kept so existing persisted state doesn't break on load
    advisorHistory: [],
    addAdvisorMessage: (msg) =>
      set((s) => ({ advisorHistory: [...s.advisorHistory, msg] }))
  }),
  {
    name: 'linage-store-v3',
    // Agent history is session-only: never written to localStorage
    partialize: (state) => ({
      ...state,
      agents: state.agents.map(a => ({ ...a, history: [] }))
    }),
    // Clear any history that might exist in older stored data
    onRehydrateStorage: () => (state) => {
      if (state?.agents) {
        state.agents = state.agents.map(a => ({ ...a, history: [] }));
      }
    }
  }
));

export default useStore;
