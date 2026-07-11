import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';
import {
  Send,
  Sparkles,
  Check,
  FileText,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useDecryptPlaceholder } from '../hooks/useDecryptPlaceholder';
import { fetchNewsForTopic } from '../lib/news';

const ADVISOR_PHRASES = [
  'Qual tema quer desenvolver hoje?',
  'Compartilhe sua ideia...',
  'O que você quer transformar em post?',
  'Descreva seu ponto de vista...',
  'Qual conceito quer posicionar?',
];

const AGENT_COLOR = '#f59e0b';

function Advisor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const {
    agents, posts, addPost, updatePost, removePost, setPosts,
    credits, addMessageToAgent, resetAgentHistory, user,
    activeDraftId, setActiveDraftId,
  } = useStore();

  const agent = agents.find(a => a.id === 'linage');

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestPost, setSuggestPost] = useState(false);
  const [showPostGenerator, setShowPostGenerator] = useState(false);
  const [generatedPostTitle, setGeneratedPostTitle] = useState('');
  const [generatedPostContent, setGeneratedPostContent] = useState('');
const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [postGenerated, setPostGenerated] = useState(false);
  const [pendingRevision, setPendingRevision] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const chatEndRef = useRef(null);
  const { ref: advisorInputRef, onFocus: advisorFocus, onBlur: advisorBlur } = useDecryptPlaceholder(ADVISOR_PHRASES);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.overflow = '';
    };
  }, []);


  // Restore from active draft on mount
  useEffect(() => {
    if (activeDraftId) {
      const draft = posts.find(p => p.id === activeDraftId && p.draft);
      if (draft) {
        if (draft.chatHistory?.length > 0) {
          useStore.setState(s => ({
            agents: s.agents.map(a =>
              a.id === 'linage' ? { ...a, history: draft.chatHistory } : a
            )
          }));
        }
        setGeneratedPostTitle(draft.title);
        setGeneratedPostContent(draft.content);
        setPostGenerated(true);
        setDraftSaved(true);
      } else {
        // Draft was completed or deleted elsewhere
        setActiveDraftId(null);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!agent?.history?.length && !isTyping && !suggestPost) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [agent?.history, isTyping, suggestPost]);




  useEffect(() => {
    const seedMessage = location.state?.seedMessage;
    if (!seedMessage) return;
    navigate(location.pathname, { replace: true, state: {} });

    const userMessage = {
      sender: 'user',
      text: seedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addMessageToAgent('linage', userMessage);
    setIsTyping(true);

    (async () => {
      try {
        const token = await getToken();
        const existingHistory = (agent?.history || []).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
        const messages = [...existingHistory, { role: 'user', content: seedMessage }];
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages }),
        });
        const data = await res.json();
        addMessageToAgent('linage', {
          sender: 'agent',
          text: data.text || 'Algo deu errado. Tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (data.suggestPost) setSuggestPost(true);
      } catch {
        addMessageToAgent('linage', {
          sender: 'agent',
          text: 'Algo deu errado na conexão. Tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } finally {
        setIsTyping(false);
      }
    })();
  }, [location.state?.seedMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveChatToDb = async (token) => {
    if (!activeDraftId) return;
    const latest = useStore.getState().agents.find(a => a.id === 'linage')?.history || [];
    const post = useStore.getState().posts.find(p => p.id === activeDraftId);
    if (!post) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: activeDraftId,
          title: post.title,
          content: post.content,
          agentId: 'linage',
          status: 'draft',
          chatHistory: latest,
        }),
      });
      if (res.ok) updatePost(activeDraftId, { chatHistory: latest });
    } catch {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    setSuggestPost(false);

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessageToAgent('linage', userMessage);
    setInputText('');
    setIsTyping(true);

    try {
      const history = [...(agent?.history || []), userMessage];
      const token = await getToken();

      if (postGenerated) {
        const allMsgs = history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
        const firstUserIdx = allMsgs.findIndex(m => m.role === 'user');
        const apiMessages = firstUserIdx >= 0 ? allMsgs.slice(firstUserIdx) : allMsgs;

        const res = await fetch('/api/agent/post-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: apiMessages, postContent: generatedPostContent }),
        });
        const data = await res.json();

        addMessageToAgent('linage', {
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

        addMessageToAgent('linage', {
          sender: 'agent',
          text: data.text || 'Algo deu errado. Tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        if (data.suggestPost) setSuggestPost(true);
      }

      await saveChatToDb(token);
    } catch {
      addMessageToAgent('linage', {
        sender: 'agent',
        text: 'Algo deu errado na conexão. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleTriggerGenerator = async () => {
    setSuggestPost(false);

    if (credits < 450) {
      alert('Saldo insuficiente! São necessários 450 créditos para gerar um post. Recarregue em Planos & Créditos.');
      return;
    }

    setIsGenerating(true);
    setShowPostGenerator(true);

    try {
      const currentHistory = useStore.getState().agents.find(a => a.id === 'linage')?.history || [];
      const conversationContext = currentHistory
        .map(m => `${m.sender === 'user' ? 'Usuário' : 'Linage'}: ${m.text}`)
        .join('\n');

      const topicMsg = [...currentHistory].reverse().find(m => m.sender === 'user')?.text || '';
      const token = await getToken();
      const newsContext = await fetchNewsForTopic(topicMsg, token);

      const res = await fetch('/api/agent/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationContext, newsContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar o post');
      if (data.credits !== undefined) useStore.setState({ credits: data.credits });

      const raw = data.text || '';
      const titleMatch = raw.match(/TÍTULO:\s*(.+)/);
      const contentMatch = raw.match(/CONTEÚDO:\s*([\s\S]+)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Post gerado por Linage';
      const content = contentMatch ? contentMatch[1].trim() : raw;

      setGeneratedPostTitle(title);
      setGeneratedPostContent(content);

      // Auto-save as draft immediately
      const newPostId = 'post_' + Date.now();
      const newPost = {
        id: newPostId,
        title,
        content,
        draft: true,
        agentId: 'linage',
        createdAt: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
        chatHistory: [...currentHistory],
      };

      addPost(newPost);
      setActiveDraftId(newPostId);
      setDraftSaved(true);

      (async () => {
        while (true) {
          try {
            const t = await getToken();
            const res = await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
              body: JSON.stringify({
                id: newPost.id,
                title: newPost.title,
                content: newPost.content,
                agentId: 'linage',
                status: 'draft',
                chatHistory: newPost.chatHistory,
              }),
            });
            if (res.ok) break;
          } catch {}
          await new Promise(r => setTimeout(r, 5000));
        }
      })();

      setPostGenerated(true);
      addMessageToAgent('linage', {
        sender: 'agent',
        text: 'Post redigido e salvo como rascunho! Quer ajustar algo antes de publicar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setGeneratedPostContent('Erro ao gerar o post. Tente novamente.');
      setShowPostGenerator(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompletePost = async () => {
    const token = await getToken();
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: activeDraftId,
          title: generatedPostTitle,
          content: generatedPostContent,
          agentId: 'linage',
          status: 'completed',
        }),
      });
      if (!res.ok) throw new Error('save failed');
      updatePost(activeDraftId, { draft: false, chatHistory: [] });
    } catch {
      alert('Erro ao salvar. Tente novamente.');
      return;
    }

    resetAgentHistory('linage');
    setActiveDraftId(null);
    setPostGenerated(false);
    setSuggestPost(false);
    setDraftSaved(false);
    setShowPostGenerator(false);
    setGeneratedPostTitle('');
    setGeneratedPostContent('');
    navigate('/posts');
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm('Excluir este rascunho? O chat também será encerrado.')) return;

    const token = await getToken();
    try {
      if (activeDraftId) {
        const res = await fetch(`/api/posts/${activeDraftId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) removePost(activeDraftId);
      }
    } catch {}

    resetAgentHistory('linage');
    setActiveDraftId(null);
    setPostGenerated(false);
    setSuggestPost(false);
    setPendingRevision(null);
    setDraftSaved(false);
    setShowPostGenerator(false);
    setGeneratedPostTitle('');
    setGeneratedPostContent('');
  };

  const handleNewConversation = () => {
    if (!window.confirm('Iniciar nova conversa? O rascunho atual permanece salvo em Meus Posts.')) return;
    resetAgentHistory('linage');
    setActiveDraftId(null);
    setPostGenerated(false);
    setPendingRevision(null);
    setSuggestPost(false);
    setDraftSaved(false);
    setShowPostGenerator(false);
    setGeneratedPostTitle('');
    setGeneratedPostContent('');
  };

  const handleApplyRevision = () => {
    if (!pendingRevision) return;
    setGeneratedPostContent(pendingRevision);
    if (activeDraftId) {
      updatePost(activeDraftId, { content: pendingRevision });
    }
    setPendingRevision(null);
    if (!showPostGenerator) setShowPostGenerator(true);
    addMessageToAgent('linage', {
      sender: 'agent',
      text: 'Alterações aplicadas ao post.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPostContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="page-container advisor-page animate-fade-in">
      <header className="page-header">
        <div className="ai-orb-wrapper">
          <div className="ai-orb-glow"></div>
          <div className="ai-orb-core"></div>
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Copywriter Estratégico</span>
          <h1 className="header-title">Fale com Linage</h1>
          <p className="header-desc">Você dá as ordens. Eu faço a mágica, mas pode ficar com a fama.</p>
        </div>
      </header>

      <div className="advisor-full">
        <div className={`advisor-chat-card${isMobile ? '' : ' glass-card'}`}>
          {(agent?.history || []).length > 0 && (
            <div className="chat-card-header">
              <div className="chat-header-agent-info">
                <div className="online-indicator-dot"></div>
                <div>
                  <h3>Sessão Ativa</h3>
                  <p>Conversando com Linage</p>
                </div>
              </div>
              <div className="chat-header-actions">
                {postGenerated && !showPostGenerator && (
                  <button className="view-draft-btn" onClick={() => setShowPostGenerator(true)}>
                    <FileText size={14} />
                    <span>Ver rascunho</span>
                  </button>
                )}
                <button className="generate-post-trigger-btn generate-post-trigger-btn--secondary" onClick={handleNewConversation}>
                  <RefreshCw size={15} />
                  <span>Nova conversa</span>
                </button>
              </div>
            </div>
          )}
          <div className="advisor-chat-scroll-area">
          <div className="advisor-chat-content-wrapper">
          <div className="advisor-chat-messages">
            <div className="advisor-message-row linage">
              <div className="linage-avatar-icon">L</div>
              <div className="advisor-msg-bubble">
                <p>E aí! Pode jogar qualquer tema — eu transformo em algo que as pessoas vão querer comentar. Do que vamos falar hoje?</p>
<span className="advisor-msg-time">agora</span>
              </div>
            </div>

            {(agent?.history || []).map((msg, index) => (
              <div key={index} className={`advisor-message-row ${msg.sender === 'user' ? 'user' : 'linage'}`}>
                {msg.sender !== 'user' && (
                  <div className="linage-avatar-icon">L</div>
                )}
                <div className="advisor-msg-bubble">
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  <span className="advisor-msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="advisor-message-row linage">
                <div className="linage-avatar-icon">L</div>
                <div className="advisor-msg-bubble typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            {suggestPost && !isTyping && (
              <div className="advisor-message-row linage">
                <div className="linage-avatar-icon">L</div>
                <div className="advisor-msg-bubble post-offer-bubble">
                  <div className="post-offer-actions">
                    <button className="post-offer-confirm" onClick={handleTriggerGenerator}>
                      <Sparkles size={14} />
                      Sim, gera o post <span className="post-offer-cost">−450 cr</span>
                    </button>
                    <button className="post-offer-decline" onClick={() => setSuggestPost(false)}>
                      Agora não
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ height: '160px', flexShrink: 0 }} />
            <div ref={chatEndRef} />
          </div>
          </div>
          </div>

          {pendingRevision && (
            <div className="pending-revision-bar">
              <span className="pending-revision-label">Revisão pronta para aplicar</span>
              <button className="apply-revision-btn" onClick={handleApplyRevision}>Aplicar ao post</button>
              <button className="dismiss-revision-btn" onClick={() => setPendingRevision(null)}>Ignorar</button>
            </div>
          )}

          {isMobile ? createPortal(
            <form onSubmit={handleSendMessage} className="advisor-chat-input">
              <input
                ref={advisorInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={advisorFocus}
                onBlur={advisorBlur}
                className="advisor-input-text"
              />
              <button type="submit" className="advisor-send-btn">
                <Send size={16} />
              </button>
            </form>,
            document.body
          ) : (
            <form onSubmit={handleSendMessage} className="advisor-chat-input">
              <input
                ref={advisorInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={advisorFocus}
                onBlur={advisorBlur}
                className="advisor-input-text"
              />
              <button type="submit" className="advisor-send-btn">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {showPostGenerator && (
        <div className="modal-overlay">
          <div className="post-generator-panel animate-slide-left">
            {isGenerating ? (
              <div className="generator-loading-state">
                <div className="rotating-gradient-ring"></div>
                <Sparkles size={40} className="glow-spark-icon animate-pulse" />
                <h3>Estou escrevendo…</h3>
                <p>Se ficar bom, foi sorte. Se ficar ótimo, finja que foi você.</p>
              </div>
            ) : (
              <div className="generator-main-workspace">
                <header className="generator-header">
                  <div className="generator-header-left">
                    <span className="generator-badge" style={{ backgroundColor: AGENT_COLOR + '20', color: AGENT_COLOR }}>
                      Escritório do Linage
                    </span>
                    <h2>Rascunho Redigido</h2>
                    {draftSaved && (
                      <span className="draft-saved-indicator">
                        <Check size={11} /> Rascunho salvo
                      </span>
                    )}
                  </div>
                  <button className="generator-close-btn" onClick={() => setShowPostGenerator(false)}>×</button>
                </header>

                <div className="generator-editor-area">
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
                </div>

                <footer className="generator-footer-bar">
                  <div className="generator-footer-left">
                    <button className="copy-post-btn" onClick={copyToClipboard}>
                      {copySuccess ? <Check size={14} /> : <FileText size={14} />}
                      <span>{copySuccess ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                    <button className="delete-draft-btn" onClick={handleDeleteDraft}>
                      <Trash2 size={13} />
                      <span>Excluir Rascunho</span>
                    </button>
                  </div>
                  <div className="generator-actions">
                    <button className="btn-primary" style={{ backgroundColor: AGENT_COLOR }} onClick={handleCompletePost}>
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

export default Advisor;
