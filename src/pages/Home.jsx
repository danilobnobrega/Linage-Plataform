import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import ConsensusConverter from '../components/ConsensusConverter';
import DecryptText from '../components/DecryptText';
import { useDailyContent } from '../hooks/useDailyContent';

const HOME_PHRASES = [
  'Existe um post ótimo na sua cabeça. Eu só vou tirar ele de lá.',
  'Você sabe. Só não teve tempo de escrever ainda.',
  'O que você falou no café hoje rendia um post. De nada.',
  'Autoridade não se pede emprestada. Mas às vezes se escreve em 3 minutos.',
  'Seu feed vai agradecer. A sua agenda também.',
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
  const daily = useDailyContent(user.dailyQuote, user.suggestions);
  const navigate = useNavigate();
  


  // Daily Quote & Dynamic Welcome
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleSuggestionClick = (suggestion) => {
    addMessageToAgent('linage', {
      sender: 'user',
      text: `Quero criar um conteúdo baseado nesta pauta: "${suggestion}". Como podemos começar?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    navigate('/agent/linage');
  };

  // Pre-configured custom backgrounds for agent quick launcher
  const agentThemeStyles = {
    linage: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
  };

  const agentBorders = {
    linage: 'rgba(245, 158, 11, 0.25)',
  };

  return (
    <div className="page-container home-page animate-fade-in">
      {/* Top Greeting & Header */}
      <header className="home-header">
        <div className="welcome-section">
          <span className="greeting-pill">{getTimeOfDayGreeting()}, {(user.name || 'Especialista').split(',')[0].trim()}</span>
          <h1 className="home-title">O que você tem a dizer hoje?</h1>
          <DecryptText phrases={HOME_PHRASES} className="decrypt-subtitle" />
        </div>
        
        {/* Quick Credit indicator */}
        <div className="status-badge">
          <Zap size={14} className="glowing-icon" />
          <span>
            { user.plan === 'pro' ? 'Plano Pro Ativo'
            : user.plan === 'starter' ? 'Plano Starter Ativo'
            : 'Plano Gratuito' }
          </span>
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
            <span className="quote-label">PERSPECTIVA DO DIA:</span>
            <p className="quote-text">"{daily.quote}"</p>
          </div>
        </div>
        <button className="quote-action-btn" onClick={() => navigate('/agent/linage')}>
          Explorar com Linage <ArrowRight size={16} />
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
          <p className="card-desc">Temas que estão rendendo conversa agora. Clique para criar algo em torno disso.</p>
          
          <div className="suggestions-list">
            {daily.suggestions.map((suggestion, index) => (
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
          <p className="card-desc">Jogue qualquer tema. O Linage transforma em algo que as pessoas vão querer comentar.</p>

          <div className="agents-quick-grid">
            <button
              className="quick-agent-btn"
              style={{
                background: agentThemeStyles.linage,
                borderColor: agentBorders.linage,
              }}
              onClick={() => navigate('/agent/linage')}
            >
              <span className="quick-agent-name">Linage</span>
              <span className="quick-agent-desc">O Magnético</span>
            </button>
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
            <h3>Ainda silencioso por aqui.</h3>
            <p>Os agentes estão esperando qualquer tema, qualquer notícia, qualquer insight que ficou na cabeça durante a semana.</p>
            <button className="primary-action-btn" onClick={() => navigate('/agent/linage')}>
              Conversar com Linage
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

    </div>
  );
}

export default Home;
