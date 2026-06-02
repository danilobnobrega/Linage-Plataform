import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import ConsensusConverter from '../components/ConsensusConverter';
import DecryptText from '../components/DecryptText';
import { useDailyContent } from '../hooks/useDailyContent';
import { PLANS } from './Credits';
import { Sparkles, ArrowRight, PenTool, Zap, ArrowUpRight, X, Check } from 'lucide-react';

const HOME_PHRASES = [
  'Existe um post ótimo na sua cabeça. Eu só vou tirar ele de lá.',
  'Você sabe. Só não teve tempo de escrever ainda.',
  'O que você falou no café hoje rendia um post. De nada.',
  'Autoridade não se pede emprestada. Mas às vezes se escreve em 3 minutos.',
  'Seu feed vai agradecer. A sua agenda também.',
];

function Home() {
  const { user, posts, agents, addMessageToAgent } = useStore();
  const [showPlanModal, setShowPlanModal] = useState(false);
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
        
        {/* Plan badge */}
        {user.plan === 'pro' ? (
          <div className="status-badge">
            <Zap size={14} className="glowing-icon" />
            <span>Plano Pro Ativo</span>
          </div>
        ) : (
          <button className="status-badge status-badge--clickable" onClick={() => setShowPlanModal(true)}>
            <Zap size={14} className="glowing-icon" />
            <span>{user.plan === 'starter' ? 'Plano Starter Ativo' : 'Free Trial Ativo'}</span>
          </button>
        )}
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
        <button className="quote-action-btn magnetic" onClick={() => navigate('/advisor')}>
          Explorar com Linage <ArrowRight size={16} />
        </button>
      </div>

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

      {/* Plan modal for non-pro users */}
      {showPlanModal && (
        <div className="plan-modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plan-modal-header">
              <div>
                <h2 className="plan-modal-title">Seu plano atual</h2>
                <p className="plan-modal-desc">Faça upgrade para desbloquear mais recursos.</p>
              </div>
              <button className="plan-modal-close" onClick={() => setShowPlanModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="plans-grid">
              {PLANS.filter((p) => p.id !== 'free').map((plan) => {
                const { Icon } = plan;
                const isCurrent = plan.id === user.plan;
                return (
                  <div key={plan.id} className={`plan-card glass-card${plan.highlight ? ' plan-card--highlight' : ''}`}>
                    {plan.highlight && <div className="plan-badge">Mais popular</div>}
                    <div className="plan-icon-wrap"><Icon size={20} /></div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price-row">
                      <span className="plan-price-value">{plan.price}</span>
                      <span className="plan-price-period">{plan.period}</span>
                    </div>
                    <span className="plan-credits-label">{plan.creditsLabel}</span>
                    <ul className="plan-features">
                      {plan.features.map((f, i) => (
                        <li key={i} className="plan-feature-item">
                          <Check size={13} className="plan-check-icon" />{f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="plan-current-label">Plano atual</div>
                    ) : (
                      <button
                        className="plan-cta-btn"
                        onClick={() => { setShowPlanModal(false); navigate('/credits'); }}
                      >
                        Fazer upgrade <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
