import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import ConsensusConverter from '../components/ConsensusConverter';
import DecryptText from '../components/DecryptText';

const HOME_PHRASES = [
  'Construindo autoridade inquestionável.',
  'Flipando consensos em teses outlier.',
  'Gerando leads de alto valor.',
  'Orquestrando sua narrativa de marca.',
  'Transformando dados em posts de impacto.',
];
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  PenTool, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Zap, 
  ArrowUpRight
} from 'lucide-react';

function Home() {
  const { user, posts, agents, addPost, credits, addMessageToAgent } = useStore();
  const navigate = useNavigate();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  


  // Daily Quote & Dynamic Welcome
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestModal(true);
  };

  const handleStartSuggestion = (agentId) => {
    // Inject the suggestion as a first message to that agent
    addMessageToAgent(agentId, {
      sender: 'user',
      text: `Quero criar um conteúdo baseado nesta pauta: "${selectedSuggestion}". Como podemos começar?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    // Redirect to the agent's chat page
    navigate(`/agent/${agentId}`);
    setShowSuggestModal(false);
  };

  // Pre-configured custom backgrounds for agent quick launcher
  const agentThemeStyles = {
    ashe:    'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
    jace:    'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
    aiden:   'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
    venn:    'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
    dexter:  'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
  };

  const agentBorders = {
    ashe:   'rgba(59, 130, 246, 0.25)',
    jace:   'rgba(239, 68, 68, 0.25)',
    aiden:  'rgba(16, 185, 129, 0.25)',
    venn:   'rgba(139, 92, 246, 0.25)',
    dexter: 'rgba(245, 158, 11, 0.25)',
  };

  const getAgentTag = (id) => {
    if (id === 'ashe')   return 'O Técnico';
    if (id === 'jace')   return 'O Disruptor';
    if (id === 'aiden')  return 'O Storyteller';
    if (id === 'venn')   return 'O Visionário';
    return 'O Magnético';
  };

  return (
    <div className="page-container home-page animate-fade-in">
      {/* Top Greeting & Header */}
      <header className="home-header">
        <div className="welcome-section">
          <span className="greeting-pill">{getTimeOfDayGreeting()}, {user.name || 'Especialista'}</span>
          <h1 className="home-title">Sua Fábrica de Opinião de Alto Impacto</h1>
          <DecryptText phrases={HOME_PHRASES} className="decrypt-subtitle" />
        </div>
        
        {/* Quick Credit indicator */}
        <div className="status-badge">
          <Zap size={14} className="glowing-icon" />
          <span>Plano Pro Ativo</span>
        </div>
      </header>

      {/* Quote Banner */}
      <div className="quote-banner">
        <div className="quote-glow"></div>
        <div className="quote-content">
          <div className="quote-icon-container">
            <Sparkles size={24} className="quote-stars" />
          </div>
          <div className="quote-text-wrapper">
            <span className="quote-label">DIRETRIZ DA LINAGE:</span>
            <p className="quote-text">"{user.dailyQuote}"</p>
          </div>
        </div>
        <button className="quote-action-btn" onClick={() => navigate('/advisor')}>
          Consolidar Estratégia <ArrowRight size={16} />
        </button>
      </div>

      {/* Suggestions and Quick Start Row */}
      <div className="grid-two-cols">
        {/* Suggestions Card */}
        <div className="glass-card suggestions-card">
          <div className="card-header-with-badge">
            <h2 className="card-title">Sugestões de Pauta de Hoje</h2>
            <span className="card-badge">Filtro de IA</span>
          </div>
          <p className="card-desc">Tópicos selecionados por Linage focados em atrair investidores qualificados. Clique para iniciar uma conversa.</p>
          
          <div className="suggestions-list">
            {user.suggestions.map((suggestion, index) => (
              <button 
                key={index} 
                className="suggestion-item-btn"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-bullet">0{index + 1}</div>
                <span className="suggestion-text">{suggestion}</span>
                <div className="suggestion-action-arrow">
                  <ArrowUpRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Card (Quick Agent Select) */}
        <div className="glass-card launcher-card">
          <h2 className="card-title">Começar Criação Imediata</h2>
          <p className="card-desc">Cada agente possui um estilo autoral refinado para converter sua audiência em leads. Escolha o ideal:</p>
          
          <div className="agents-quick-grid">
            {agents.map((agent) => {
              const available = agent.id === 'dexter';
              return (
                <button
                  key={agent.id}
                  className={`quick-agent-btn ${!available ? 'quick-agent-btn--soon' : ''}`}
                  style={{
                    background: agentThemeStyles[agent.id],
                    borderColor: agentBorders[agent.id],
                  }}
                  onClick={() => available && navigate(`/agent/${agent.id}`)}
                  disabled={!available}
                >
                  <span className="quick-agent-name">{agent.name}</span>
                  <span className="quick-agent-desc">{getAgentTag(agent.id)}</span>
                  {!available && <span className="quick-agent-soon">Em breve</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>



      {/* Consensus Converter */}
      <ConsensusConverter />

      {/* Recent Posts Section */}
      <section className="recent-posts-section">
        <div className="section-header">
          <h2 className="section-title">Posts Recentes / Rascunhos Pendentes</h2>
          <button className="view-all-posts-btn" onClick={() => navigate('/posts')}>
            Ver todos ({posts.length})
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="empty-posts-state">
            <PenTool size={36} className="empty-icon animate-bounce" />
            <h3>Nenhum post gerado ainda</h3>
            <p>Seus agentes estão prontos para redigir seus posts de atração de clientes. Fale com um agente ou com a Linage Advisor para captar seus primeiros leads qualificados!</p>
            <button className="primary-action-btn" onClick={() => navigate('/advisor')}>
              Falar com Linage Advisor
            </button>
          </div>
        ) : (
          <div className="posts-mini-list">
            {posts.slice(-3).reverse().map((post) => (
              <div key={post.id} className="post-row-card">
                <div className="post-row-left">
                  <div className={`status-badge-indicator ${post.draft ? 'draft' : 'published'}`}>
                    {post.draft ? 'Rascunho' : 'Publicado'}
                  </div>
                  <div className="post-meta-details">
                    <h4 className="post-row-title">{post.title}</h4>
                    <span className="post-row-sub">
                      Redigido por <strong style={{color: 'var(--accent)'}}>{agents.find(a => a.id === post.agentId)?.name || 'Linage'}</strong> • {post.createdAt}
                    </span>
                  </div>
                </div>
                <button className="preview-row-btn" onClick={() => navigate('/posts')}>
                  Visualizar Post <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggestion Router Modal */}
      {showSuggestModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
          <div className="modal-container glass-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Desenvolver Conteúdo</h3>
              <button className="close-modal-btn" onClick={() => setShowSuggestModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-instruction">Você selecionou a pauta:</p>
              <div className="modal-topic-quote">
                "{selectedSuggestion}"
              </div>
              <p className="modal-instruction">Qual agente deve estruturar este post?</p>
              
              <div className="modal-agents-grid">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    className="modal-agent-select-btn"
                    onClick={() => handleStartSuggestion(agent.id)}
                  >
                    <h4>{agent.name}</h4>
                    <p>{getAgentTag(agent.id)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
