import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';
import {
  Send,
  Sparkles,
  Check,
  FileText,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useDecryptPlaceholder } from '../hooks/useDecryptPlaceholder';
import { fetchNewsForTopic } from '../lib/news';

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
  const { getToken } = useAuth();
  const { agents, posts, addPost, credits, addMessageToAgent, resetAgentHistory, user } = useStore();

  const headlines = {
    linage: 'Advisory Privado | Insights Financeiros Descontraídos & Substância'
  };

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPostGenerator, setShowPostGenerator] = useState(false);
  const [generatedPostTitle, setGeneratedPostTitle] = useState('');
  const [generatedPostContent, setGeneratedPostContent] = useState('');
  const [editorMode, setEditorMode] = useState('raw');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [postGenerated, setPostGenerated] = useState(false);
  const [pendingRevision, setPendingRevision] = useState(null);

  const chatEndRef = useRef(null);
  const { ref: chatInputRef, onFocus: chatFocus, onBlur: chatBlur } = useDecryptPlaceholder(CHAT_PHRASES);

  const agent = agents.find(a => a.id === id);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [agent?.history, isTyping]);

  if (!agent) {
    return (
      <div className="page-container flex-center">
        <h2>Agente não encontrado</h2>
        <button onClick={() => navigate('/home')}>Voltar para Home</button>
      </div>
    );
  }

  const agentConfigs = {
    linage: {
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
      badge: 'O Magnético',
      stats: { wit: 'Espirituoso', dynamic: 'Humano', vibe: '10/10' },
      greeting: 'E aí. Pode jogar qualquer tema — eu transformo em algo que as pessoas vão querer comentar. Do que vamos falar hoje?',
    },
  };

  const config = agentConfigs[id] || agentConfigs.linage;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessageToAgent(id, userMessage);
    setInputText('');
    setIsTyping(true);

    try {
      const history = [...(agent.history || []), userMessage];
      const token = await getToken();

      if (postGenerated) {
        const allMsgs = history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
        // Anthropic requires first message to be from user
        const firstUserIdx = allMsgs.findIndex(m => m.role === 'user');
        const apiMessages = firstUserIdx >= 0 ? allMsgs.slice(firstUserIdx) : allMsgs;

        const res = await fetch('/api/agent/post-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: apiMessages, postContent: generatedPostContent }),
        });
        const data = await res.json();

        addMessageToAgent(id, {
          sender: 'agent',
          text: data.text || 'Algo deu errado. Tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        if (data.revisedPost) setPendingRevision(data.revisedPost);
      } else {
        const messages = history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages }),
        });
        const data = await res.json();

        addMessageToAgent(id, {
          sender: 'agent',
          text: data.text || 'Algo deu errado. Tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch {
      addMessageToAgent(id, {
        sender: 'agent',
        text: 'Algo deu errado. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleTriggerGenerator = async () => {
    if (credits < 450) {
      alert('Saldo insuficiente! São necessários 450 créditos para gerar um post. Recarregue em Planos & Créditos.');
      return;
    }

    setIsGenerating(true);
    setShowPostGenerator(true);

    try {
      const conversationContext = (agent.history || [])
        .map(m => `${m.sender === 'user' ? 'Usuário' : agent.name}: ${m.text}`)
        .join('\n');

      const topicMsg = [...(agent.history || [])].reverse().find(m => m.sender === 'user')?.text || '';
      const token = await getToken();
      const newsContext = await fetchNewsForTopic(topicMsg, token);

      const res = await fetch('/api/agent/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationContext, newsContext }),
      });
      const data = await res.json();
      const raw = data.text || '';
      const titleMatch = raw.match(/TÍTULO:\s*(.+)/);
      const contentMatch = raw.match(/CONTEÚDO:\s*([\s\S]+)/);

      setGeneratedPostTitle(titleMatch ? titleMatch[1].trim() : 'Post gerado por ' + agent.name);
      setGeneratedPostContent(contentMatch ? contentMatch[1].trim() : raw);

      resetAgentHistory(id);
      setPostGenerated(true);
      addMessageToAgent(id, {
        sender: 'agent',
        text: 'Post redigido! Quer marcar como concluído ou tem uma visão diferente para apresentar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setGeneratedPostContent('Erro ao gerar o post. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async (status) => {
    const token = await getToken();
    const newPost = {
      id: 'post_' + Date.now(),
      title: generatedPostTitle,
      content: generatedPostContent,
      draft: status === 'draft',
      agentId: id,
      createdAt: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          agentId: newPost.agentId,
          status: status === 'draft' ? 'draft' : 'published',
        }),
      });
      if (res.status === 402) {
        alert('Saldo insuficiente. Você precisa de 450 créditos para salvar um post. Recarregue em Planos & Créditos.');
        return;
      }
      const data = await res.json();
      if (data.credits !== undefined) useStore.setState({ credits: data.credits });
      addPost(newPost);
    } catch {
      alert('Erro ao salvar o post. Tente novamente.');
      return;
    }

    setShowPostGenerator(false);
    navigate('/posts');
  };

  const handleApplyRevision = () => {
    if (!pendingRevision) return;
    setGeneratedPostContent(pendingRevision);
    setPendingRevision(null);
    if (!showPostGenerator) setShowPostGenerator(true);
    addMessageToAgent(id, {
      sender: 'agent',
      text: 'Alterações aplicadas ao post.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleNewConversation = () => {
    if (!window.confirm('Iniciar nova conversa? O rascunho atual será perdido se não foi salvo.')) return;
    resetAgentHistory(id);
    setPostGenerated(false);
    setPendingRevision(null);
    setShowPostGenerator(false);
    setGeneratedPostTitle('');
    setGeneratedPostContent('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPostContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const agentPosts = posts.filter(p => p.agentId === id);

  return (
    <div className="page-container agent-page animate-fade-in">
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
        <div className="chat-card glass-card">
          <div className="chat-card-header">
            <div className="chat-header-agent-info">
              <div className="online-indicator-dot"></div>
              <div>
                <h3>Sessão Ativa</h3>
                <p>Conversando com {agent.name}</p>
              </div>
            </div>

            <div className="chat-header-actions">
              {postGenerated && !showPostGenerator && (
                <button className="view-draft-btn" onClick={() => setShowPostGenerator(true)}>
                  <FileText size={14} />
                  <span>Ver rascunho</span>
                </button>
              )}
              {postGenerated ? (
                <button className="generate-post-trigger-btn generate-post-trigger-btn--secondary" onClick={handleNewConversation}>
                  <RefreshCw size={15} />
                  <span>Nova Conversa</span>
                </button>
              ) : (
                <button
                  className="generate-post-trigger-btn"
                  onClick={handleTriggerGenerator}
                  disabled={isGenerating}
                >
                  <Sparkles size={16} />
                  <span>Transformar em Post (-450 cr)</span>
                </button>
              )}
            </div>
          </div>

          <div className="chat-messages-container">
            <div className="message-row agent">
              <div className="msg-avatar-wrapper" style={{ borderColor: config.color }}>
                {agent.name[0]}
              </div>
              <div className="msg-bubble">
                <p>{config.greeting}</p>
                <span className="msg-time">09:00</span>
              </div>
            </div>

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

          {pendingRevision && (
            <div className="pending-revision-bar">
              <span className="pending-revision-label">Revisão pronta para aplicar</span>
              <button className="apply-revision-btn" onClick={handleApplyRevision}>Aplicar ao post</button>
              <button className="dismiss-revision-btn" onClick={() => setPendingRevision(null)}>Ignorar</button>
            </div>
          )}

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

        <div className="agent-detail-panel">
          <div className="glass-card detail-card">
            <h3 className="detail-card-title">Tese do Agente</h3>
            <p className="detail-card-desc">{agent.personality}</p>
            <div className="divider"></div>
            <div className="stat-rows">
              <div className="stat-row">
                <span className="stat-label">Métrica de Foco</span>
                <span className="stat-value" style={{ color: config.color }}>
                  {Object.keys(config.stats)[0] === 'wit' ? 'Espírito' : Object.keys(config.stats)[0]}
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
                    <span className="mini-post-status">{post.draft ? 'Rascunho' : 'Concluído'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
                            <p className="mock-post-time">Agora • 🌐</p>
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
                      Salvar Rascunho
                    </button>
                    <button className="btn-primary" style={{ backgroundColor: config.color }} onClick={() => handleSavePost('publish')}>
                      Post Concluído
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
