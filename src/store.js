import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(persist(
  (set, get) => ({
    // User info
    user: {
      name: 'Alex Silva, CFP®',
      dailyQuote: 'Posicionamento autoral não é sobre o que você vende, mas sobre a tese que você defende para atrair os clientes (leads) qualificados.',
      suggestions: [
        'Como explicar a volatilidade atual para captar clientes de alta renda?',
        'A tese oculta sobre fundos exclusivos que atrai grandes investidores.',
        'Por que a maioria dos assessores perde leads ao complicar demais a carteira?'
      ]
    },
    // Theme handling
    theme: 'light',
    setTheme: (t) => set({ theme: t }),
    // Credit balance
    credits: 0,
    addCredits: (amt) => set((s) => ({ credits: s.credits + amt })),
    // Agents definitions
    agents: [
      {
        id: 'cirurgiao',
        name: 'O Cirurgião',
        personality: 'Preciso, técnico, denso. Escreve posts que parecem mini‑aulas. Usa dados, gráficos mentais, raciocínio lógico encadeado. Não tem medo de ser complexo, mas nunca é confuso. O leitor sai mais inteligente. Tom: autoridade silenciosa.',
        history: []
      },
      {
        id: 'provocador',
        name: 'O Provocador',
        personality: 'Confronta consensos. Começa posts com afirmações que incomodam, depois sustenta com argumentos sólidos. Não é polêmico por ser polêmico — é polêmico porque pensa diferente e tem coragem de dizer. Gera engajamento porque as pessoas precisam responder, concordando ou discordando. Tom: afiado, confiante, às vezes desconfortável.',
        history: []
      },
      {
        id: 'narrador',
        name: 'O Narrador',
        personality: 'Transforma informação em história. Pega uma notícia do mercado e conta como se fosse um episódio de série. Usa analogias, metáforas, estrutura narrativa. O leitor não percebe que está aprendendo porque está envolvido demais na história. Tom: envolvente, humano, com ritmo.',
        history: []
      },
      {
        id: 'estrategista',
        name: 'O Estrategista',
        personality: 'Conecta pontos que ninguém conectou. Pega 3 notícias aparentemente desconectadas e mostra o padrão por trás. Pensa em segundo e terceiro ordem de consequências. O leitor sente que ganhou uma vantagem competitiva só de ler. Tom: visionário, mas pé no chão. Não especula — projeta com lógica.',
        history: []
      },
      {
        id: 'carismatico',
        name: 'O Carismático',
        personality: 'Usa humor como ferramenta estratégica, não como muleta. Sabe ser leve sem ser raso. Faz o leitor sorrir e pensar ao mesmo tempo. Extrovertido, comunicativo, genuinamente descontraído — mas nunca perde a substância. A autoridade dele é tão sólida que pode brincar sem que ninguém questione sua competência. Escreve como quem conversa num jantar com gente inteligente: tem graça, tem ritmo, tem conteúdo. Tom: confiante, magnético, espirituoso sem forçar.',
        history: []
      }
    ],
    // Posts collection
    posts: [], // {id, title, draft:true/false, agentId, createdAt}
    addPost: (post) => set((s) => ({ posts: [...s.posts, post] })),
    updatePost: (id, updates) =>
      set((s) => ({
        posts: s.posts.map((p) => (p.id === id ? { ...p, ...updates } : p))
      })),
    // Chat handling (simple push to agent.history)
    addMessageToAgent: (agentId, message) =>
      set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId ? { ...a, history: [...a.history, message] } : a
        )
      })),
    // Advisor messages (store separate array)
    advisorHistory: [],
    addAdvisorMessage: (msg) =>
      set((s) => ({ advisorHistory: [...s.advisorHistory, msg] }))
  }),
  {
    name: 'linage-store', // localStorage key
    getStorage: () => localStorage
  }
));

export default useStore;
