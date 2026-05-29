import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store';
import {
  Send,
  Sparkles,
  Clock,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Zap,
  Coins,
  Check,
  ChevronRight,
  FileText,
  FileCheck,
  Award
} from 'lucide-react';
import { useDecryptPlaceholder } from '../hooks/useDecryptPlaceholder';

const CHAT_PHRASES = [
  'Qual tema quer desenvolver hoje?',
  'Compartilhe sua ideia bruta...',
  'O que você quer transformar em post?',
  'Descreva seu ponto de vista...',
  'Qual conceito quer posicionar?',
];

function Agent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agents, posts, addPost, credits, addMessageToAgent, user } = useStore();

  const headlines = {
    ashe:   'Assessor de Investimentos | Análise Técnica & Fundamentos',
    jace:   'Consultor Financeiro | Questionando Consensos de Mercado',
    aiden:  'Gestor de Patrimônio | Conectando Histórias & Resultados',
    venn:   'Wealth Strategist | Planejamento Macro & Cenários de 3ª Ordem',
    dexter: 'Advisory Privado | Insights Financeiros Descontraídos & Substância'
  };
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPostGenerator, setShowPostGenerator] = useState(false);
  const [generatedPostTitle, setGeneratedPostTitle] = useState('');
  const [generatedPostContent, setGeneratedPostContent] = useState('');
  const [editorMode, setEditorMode] = useState('raw'); // raw, preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const chatEndRef = useRef(null);
  const { ref: chatInputRef, onFocus: chatFocus, onBlur: chatBlur } = useDecryptPlaceholder(CHAT_PHRASES);

  const agent = agents.find(a => a.id === id);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent?.history, isTyping]);

  if (!agent) {
    return (
      <div className="page-container flex-center">
        <h2>Agente não encontrado</h2>
        <button onClick={() => navigate('/home')}>Voltar para Home</button>
      </div>
    );
  }

  // Configuration for Agent Styles
  const agentConfigs = {
    ashe: {
      color: '#3b82f6',
      accentGlow: 'rgba(59, 130, 246, 0.15)',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      badge: 'O Técnico',
      stats: { accuracy: '99.4%', density: 'Alta', speed: 'Rápido' },
      greeting: 'Olá. Análise estruturada pronta. Qual conjunto de dados ou tese de mercado vamos dissecar hoje?',
      exampleResponses: [
        'Analisando sob uma perspectiva puramente técnica: há três variáveis estruturais ignoradas pela maioria. Veja o encadeamento lógico:',
        'Se desmembrarmos essa tese em blocos de causalidade, notamos que o erro comum reside no atalho analítico. Permita-me ilustrar o fluxo correto:'
      ],
      generateDraft: (topic) => ({
        title: `A Anatomia Oculta de: ${topic}`,
        content: `**A Anatomia Oculta de: ${topic}**\n\nExiste uma falha metodológica grave na forma como a maioria dos analistas observa este tema. \n\nSe desmembrarmos a questão em seus componentes primários, identificamos **três alavancas de causalidade** que determinam o sucesso ou fracasso deste movimento:\n\n1. **A Assimetria de Dados Reativos**: Decisões baseadas em indicadores passados criam um atraso estrutural de 45 a 90 dias. A precisão exige leitura de fluxos de liquidez em tempo real.\n\n2. **A Elasticidade da Demanda Especulativa**: Ao contrário do senso comum, o comportamento do usuário neste nicho é inelástico sob estresse macroeconômico, o que valida a resiliência operacional do modelo.\n\n3. **A Taxa de Retenção Incremental (LTV/CAC)**: A margem de contribuição só se estabiliza a partir do 14º mês. Ignorar o custo de carregamento do cliente no curto prazo é um erro de sobrevida.\n\n**O Gráfico Mental de Decisão:**\n[Inputs Iniciais] ➔ [Análise de Fluxo de Caixa] ➔ [Filtro de Liquidez] ➔ [Retorno Real]\n\n*Conclusão*: O valor não está na volatilidade diária, mas na arquitetura de longo prazo. Estude os fundamentos antes de se posicionar.`
      })
    },
    jace: {
      color: '#ef4444',
      accentGlow: 'rgba(239, 68, 68, 0.15)',
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
      badge: 'O Disruptor',
      stats: { engagement: 'Extremo', boldness: '98%', debate: 'Crítico' },
      greeting: 'Pronto para rasgar o roteiro tradicional? Diga-me qual consenso confortável do mercado você deseja explodir hoje.',
      exampleResponses: [
        'O que todo mundo aceita como verdade absoluta é, na verdade, a maior armadilha de liquidez dos últimos cinco anos. Quer que eu prove?',
        'Concordar com a maioria é o caminho mais rápido para a mediocridade. Vamos colocar o dedo na ferida desse mercado:'
      ],
      generateDraft: (topic) => ({
        title: `Por que tudo o que te ensinaram sobre ${topic} está ERRADO`,
        content: `**Por que tudo o que te ensinaram sobre ${topic} está ERRADO**\n\nDesculpe o choque de realidade, mas a maioria das pessoas que você segue está mentindo para você — ou simplesmente não entende o jogo de verdade.\n\nEles te vendem a ilusão de que este caminho é seguro, previsível e garantido. Não é.\n\nA verdade desconfortável que ninguém tem coragem de dizer:\n\n- **O consenso é burro**: Se todo mundo está comprando a mesma tese, a assimetria positiva de retorno simplesmente deixou de existir. Você está apenas pagando o almoço de quem entrou cedo.\n- **A segurança é uma armadilha**: O que você chama de estabilidade é, na verdade, uma morte lenta em termos de rentabilidade.\n- **O medo do debate é sinal de fraqueza**: Se a sua tese não sobrevive a 5 minutos de questionamento ácido, ela não é uma estratégia de negócios — é um dogma religioso.\n\nSe você quer continuar na média, continue aplaudindo os posts genéricos de sempre. Mas se você busca vantagem competitiva real, comece questionando o óbvio.\n\nQual é o seu lado nessa mesa? O dos que repetem mantras ou o dos que mudam as regras do jogo? Discorde de mim nos comentários.`
      })
    },
    aiden: {
      color: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.15)',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
      badge: 'O Storyteller',
      stats: { retention: 'Máxima', imagery: 'Rica', pacing: 'Fluido' },
      greeting: 'Toda grande lição começa com uma história inesquecível. Qual acontecimento ou conceito vamos transformar em enredo hoje?',
      exampleResponses: [
        'Imagine a seguinte cena: Nova York, inverno de 2008. Enquanto todos olhavam para os gráficos, um homem trancado em uma sala tomava uma decisão que mudaria tudo...',
        'Isso me lembra a história clássica da corrida do ouro. O verdadeiro vencedor nunca foi quem achou a maior pepita, mas quem montou a loja de pás na entrada da mina. Vamos desenhar isso:'
      ],
      generateDraft: (topic) => ({
        title: `A Incrível Parábola sobre ${topic}`,
        content: `**A Incrível Parábola sobre ${topic}**\n\nEra uma terça-feira chuvosa quando o telefone dele tocou. Do outro lado da linha, um investidor em pânico exigia respostas. Aquela ligação custaria milhões de dólares — ou ensinaria a maior lição de nossas vidas.\n\nEssa não é apenas mais uma história corporativa. É o retrato vivo de como encaramos o tema:\n\n**O Cenário:**\nImagine uma pequena embarcação no meio de uma tempestade sem precedentes. A tripulação tem duas escolhas claras:\n1. Ajustar as velas para a direção da tempestade na esperança de cruzar mais rápido.\n2. Recolher tudo e esperar o mar se acalmar, correndo o risco de perder a rota principal.\n\nA maioria dos marinheiros amadores escolhe uma terceira via invisível: o pânico absoluto.\n\nNo mundo corporativo e nos investimentos, agir sob o calor das notícias é exatamente como tentar consertar o motor de um barco enquanto as ondas batem no convés.\n\n*A lição silenciosa*: Os melhores navegadores não são os que evitam tempestades, mas os que conhecem a fundo a resistência da própria madeira.\n\nVocê está pronto para ajustar suas velas na próxima tempestade ou vai continuar culpando o vento?`
      })
    },
    venn: {
      color: '#8b5cf6',
      accentGlow: 'rgba(139, 92, 246, 0.15)',
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
      badge: 'O Visionário',
      stats: { foresight: 'Global', logic: 'Implacável', macro: 'Avançado' },
      greeting: 'Minha mente mapeia o padrão invisível. O que parece ser um evento isolado é parte de um dominó. O que vamos projetar hoje?',
      exampleResponses: [
        'Se você olhar apenas para a consequência direta, perderá o jogo. Precisamos calcular a reação em cadeia. Deixe-me conectar os três pontos cruciais:',
        'A verdadeira vantagem estratégica reside em ver o que acontece na terceira ordem de eventos. Eis o mapa de desdobramentos futuros:'
      ],
      generateDraft: (topic) => ({
        title: `A Reação em Cadeia Invisível de ${topic}`,
        content: `**A Reação em Cadeia Invisível de ${topic}**\n\nA maioria dos profissionais olha para o mercado e enxerga apenas eventos isolados. Mas quem domina o jogo de verdade sabe que cada ação gera ondas invisíveis de segunda e terceira ordem.\n\nVamos conectar os pontos fundamentais que estão desenhando o cenário atual de forma silenciosa:\n\n- **1ª Ordem (O Óbvio)**: A mudança imediata atrai a atenção da mídia e dos curiosos. É o efeito de superfície.\n- **2ª Ordem (O Deslocamento)**: A escassez de recursos gerada pelo ponto anterior migra silenciosamente para os setores adjacentes, abrindo janelas de assimetria que ninguém está olhando.\n- **3ª Ordem (O Novo Normal)**: Consolidação estrutural. Quem se posicionou na segunda fase agora colhe lucros exponenciais enquanto a massa tenta correr atrás do prejuízo.\n\n**O Mapa das Consequências:**\n[Mudança Inicial] ➔ [Escassez Setorial] ➔ [Readequação de Preços] ➔ [Barreira de Entrada Elevada]\n\n*A Projeção*: Em 18 meses, este nicho estará saturado e caro. A janela de entrada estratégica com alta assimetria positiva está aberta **agora**.\n\nNão seja o passageiro que embarca quando o navio já está lotado. Projete seus passos com inteligência macro.`
      })
    },
    dexter: {
      color: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.15)',
      gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
      badge: 'O Magnético',
      stats: { wit: 'Espirituoso', dynamic: 'Humano', vibe: '10/10' },
      greeting: 'E aí! Quem disse que conteúdo inteligente precisa ser chato e dar sono? Vamos criar um post que faça rir e pensar ao mesmo tempo?',
      exampleResponses: [
        'Hahaha adorei o tema! É basicamente como tentar fazer dieta na semana de aniversário da sua avó. Deixa eu te mostrar como fisgar a atenção das pessoas com esse gancho:',
        'Dá pra ser profundo sem parecer um manual de instruções antigo. Vamos contar isso com leveza, ironia fina e substância:'
      ],
      generateDraft: (topic) => ({
        title: `A Arte Secreta de Sobreviver a ${topic} (Sem Enlouquecer)`,
        content: `**A Arte Secreta de Sobreviver a ${topic} (Sem Enlouquecer)**\n\nVamos ser sinceros: tentar entender isso ultimamente é como tentar decifrar um menu de restaurante chique em outro idioma. Parece lindo, mas você não tem certeza do que está prestes a engolir.\n\nPara te poupar de mais um slide chato de reunião corporativa, aqui estão as regras de sobrevivência em três passos simples:\n\n1. **Simplifique a ópera**: Se você não consegue explicar o assunto para uma criança de 8 anos (ou para o seu tio que ainda usa rede social vizinha), talvez você também não tenha entendido tão bem.\n2. **Fuja dos termos de efeito**: Usar expressões em inglês super complicadas não te deixa mais inteligente, só deixa as reuniões mais longas. Vamos focar no que dá resultado de verdade.\n3. **Mantenha o bom humor**: O mercado já está cheio de pessoas excessivamente sérias que não entregam nada. Seja leve, seja focado, mas nunca perca a graça.\n\n*Resumo da Ópera*: Trabalhe duro, não compre teses milagrosas e, acima de tudo, divirta-se no processo. Afinal, a vida é curta demais para posts monótonos.\n\nE você? Costuma complicar o simples ou simplificar o complexo? Me conta nos comentários!`
      })
    }
  };

  const config = agentConfigs[id] || agentConfigs.ashe;

  // Handle User Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addMessageToAgent(id, userMessage);
    const userPrompt = inputText;
    setInputText('');
    
    // Simulate AI Agent typing and responding
    setIsTyping(true);
    setTimeout(() => {
      const responses = config.exampleResponses;
      const baseResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = {
        sender: 'agent',
        text: `${baseResponse} \n\n"Em relação ao seu ponto sobre '${userPrompt}', acredito que devemos focar na essência pragmática. Se quiser, clique no botão **'Gerar Rascunho de Post'** logo acima para eu moldar um texto completo com essa pegada para o seu LinkedIn ou blog!"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      addMessageToAgent(id, botMessage);
      setIsTyping(false);
    }, 1500);
  };

  // Generate Post Draft handler
  const handleTriggerGenerator = () => {
    if (credits < 10) {
      alert("Saldo insuficiente! A geração de post de alto nível consome 10 créditos. Recarregue no botão '+' da barra lateral!");
      return;
    }
    
    setIsGenerating(true);
    setShowPostGenerator(true);
    
    // Deduct credits and simulate writing
    setTimeout(() => {
      // Find last user prompt or fallback
      const lastUserMsg = [...(agent.history || [])].reverse().find(m => m.sender === 'user')?.text || 'Estratégias Avançadas';
      const draft = config.generateDraft(lastUserMsg);
      
      setGeneratedPostTitle(draft.title);
      setGeneratedPostContent(draft.content);
      setIsGenerating(false);
    }, 1800);
  };

  const handleSavePost = (status) => {
    // Add to Zustand posts database
    const newPost = {
      id: 'post_' + Date.now(),
      title: generatedPostTitle,
      content: generatedPostContent,
      draft: status === 'draft',
      agentId: id,
      createdAt: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    addPost(newPost);
    
    // Deduct credits in state
    useStore.getState().addCredits(-10);

    setShowPostGenerator(false);
    navigate('/posts');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPostContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const agentPosts = posts.filter(p => p.agentId === id);

  return (
    <div className="page-container agent-page animate-fade-in">
      {/* Upper header section */}
      <div className="agent-hero-banner" style={{ background: config.gradient }}>
        <div className="agent-hero-glow"></div>
        <div className="agent-hero-content">
          <span className="agent-badge-pill" style={{ color: config.color, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            {config.badge}
          </span>
          <h1 className="agent-hero-name">{agent.name}</h1>
          <p className="agent-hero-desc">"{agent.personality.split('.')[0]}."</p>
        </div>
      </div>

      <div className="agent-grid-layout">
        {/* Main Chat Interface */}
        <div className="chat-card glass-card">
          <div className="chat-card-header">
            <div className="chat-header-agent-info">
              <div className="online-indicator-dot"></div>
              <div>
                <h3>Sessão Ativa</h3>
                <p>Conversando com {agent.name}</p>
              </div>
            </div>
            
            {/* Generate Post action button */}
            <button 
              className="generate-post-trigger-btn"
              onClick={handleTriggerGenerator}
              disabled={isGenerating}
            >
              <Sparkles size={16} />
              <span>Transformar em Post (-10cr)</span>
            </button>
          </div>

          {/* Messages area */}
          <div className="chat-messages-container">
            {/* Initial Welcome message */}
            <div className="message-row agent">
              <div className="msg-avatar-wrapper" style={{ borderColor: config.color }}>
                {agent.name[0]}
              </div>
              <div className="msg-bubble">
                <p>{config.greeting}</p>
                <span className="msg-time">09:00</span>
              </div>
            </div>

            {/* Render history from store */}
            {(agent.history || []).map((msg, index) => (
              <div key={index} className={`message-row ${msg.sender}`}>
                {msg.sender === 'agent' && (
                  <div className="msg-avatar-wrapper" style={{ borderColor: config.color }}>
                    {agent.name[0]}
                  </div>
                )}
                <div className="msg-bubble">
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  <span className="msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-row agent">
                <div className="msg-avatar-wrapper" style={{ borderColor: config.color }}>
                  {agent.name[0]}
                </div>
                <div className="msg-bubble typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              ref={chatInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={chatFocus}
              onBlur={chatBlur}
              className="chat-text-input"
            />
            <button type="submit" className="chat-send-btn" style={{ backgroundColor: config.color }}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Sidebar details panel */}
        <div className="agent-detail-panel">
          <div className="glass-card detail-card">
            <h3 className="detail-card-title">Tese do Agente</h3>
            <p className="detail-card-desc">{agent.personality}</p>
            
            <div className="divider"></div>
            
            <div className="stat-rows">
              <div className="stat-row">
                <span className="stat-label">Métrica de Foco</span>
                <span className="stat-value" style={{ color: config.color }}>
                  {Object.keys(config.stats)[0] === 'accuracy' ? 'Precisão' : ''}
                  {Object.keys(config.stats)[0] === 'engagement' ? 'Engajamento' : ''}
                  {Object.keys(config.stats)[0] === 'retention' ? 'Retenção' : ''}
                  {Object.keys(config.stats)[0] === 'foresight' ? 'Visão Macro' : ''}
                  {Object.keys(config.stats)[0] === 'wit' ? 'Espírito' : ''}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Performance</span>
                <span className="stat-value">{Object.values(config.stats)[0]}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Tom de Voz</span>
                <span className="stat-value">{Object.values(config.stats)[1]}</span>
              </div>
            </div>
          </div>

          {/* Agent History Posts Panel */}
          <div className="glass-card detail-card posts-history-card">
            <div className="card-header-with-badge">
              <h3 className="detail-card-title">Posts Gerados</h3>
              <span className="badge-count">{agentPosts.length}</span>
            </div>
            
            {agentPosts.length === 0 ? (
              <p className="empty-sub-text">Nenhum post gerado por este agente ainda.</p>
            ) : (
              <div className="agent-posts-mini-scroll">
                {agentPosts.map(post => (
                  <div key={post.id} className="mini-post-item" onClick={() => navigate('/posts')}>
                    <span className="mini-post-date">{post.createdAt}</span>
                    <h4 className="mini-post-title">{post.title}</h4>
                    <span className="mini-post-status">{post.draft ? 'Rascunho' : 'Publicado'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Generator Slide Panel Modal */}
      {showPostGenerator && (
        <div className="modal-overlay">
          <div className="post-generator-panel animate-slide-left">
            {isGenerating ? (
              <div className="generator-loading-state">
                <div className="rotating-gradient-ring"></div>
                <Sparkles size={40} className="glow-spark-icon animate-pulse" />
                <h3>{agent.name} está redigindo...</h3>
                <p>Moldando argumentos de alto impacto, revisando ritmo e injetando autoridade.</p>
              </div>
            ) : (
              <div className="generator-main-workspace">
                <header className="generator-header">
                  <div>
                    <span className="generator-badge" style={{ backgroundColor: config.color + '20', color: config.color }}>
                      Escritório do {agent.name}
                    </span>
                    <h2>Rascunho Redigido</h2>
                  </div>
                  <button className="generator-close-btn" onClick={() => setShowPostGenerator(false)}>×</button>
                </header>

                <div className="generator-editor-area">
                  <div className="editor-tabs-bar">
                    <button 
                      className={`editor-tab-btn ${editorMode === 'raw' ? 'active' : ''}`}
                      onClick={() => setEditorMode('raw')}
                    >
                      <FileText size={14} />
                      <span>Rascunho Raw</span>
                    </button>
                    <button 
                      className={`editor-tab-btn ${editorMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setEditorMode('preview')}
                    >
                      <FileCheck size={14} />
                      <span>Visualização de Feed</span>
                    </button>
                  </div>

                  {editorMode === 'raw' ? (
                    <div className="editor-input-container">
                      <input 
                        type="text"
                        value={generatedPostTitle}
                        onChange={(e) => setGeneratedPostTitle(e.target.value)}
                        className="post-editor-title-input"
                        placeholder="Título do Post..."
                      />
                      <textarea
                        value={generatedPostContent}
                        onChange={(e) => setGeneratedPostContent(e.target.value)}
                        className="post-editor-textarea"
                        placeholder="Conteúdo do post..."
                      />
                    </div>
                  ) : (
                    <div className="social-mock-preview-container">
                      <div className="social-preview-card">
                        <div className="social-card-header">
                          <div className="mock-avatar" style={{ backgroundColor: config.color }}>
                            {agent.name[0]}
                          </div>
                          <div>
                            <h4 className="mock-user-name">{user.name || 'Especialista Financeiro'}</h4>
                            <p className="mock-user-headline">{headlines[id] || 'Especialista do Mercado Financeiro'}</p>
                            <p className="mock-post-time">Agora • Editado • 🌐 • Focado em Atração de Leads</p>
                          </div>
                        </div>
                        <div className="mock-card-body">
                          <p style={{ whiteSpace: 'pre-line' }}>{generatedPostContent}</p>
                        </div>
                        <div className="mock-card-footer">
                          <span>👍 42 Reações</span>
                          <span>💬 12 Comentários</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="generator-footer-bar">
                  <div className="generator-footer-left">
                    <button className="copy-post-btn" onClick={copyToClipboard}>
                      {copySuccess ? <Check size={14} /> : <FileText size={14} />}
                      <span>{copySuccess ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                  <div className="generator-actions">
                    <button className="btn-secondary" onClick={() => handleSavePost('draft')}>
                      Salvar como Rascunho
                    </button>
                    <button className="btn-primary" style={{ backgroundColor: config.color }} onClick={() => handleSavePost('publish')}>
                      Publicar Post (-10cr)
                    </button>
                  </div>
                </footer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Agent;
