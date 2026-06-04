import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ADVISOR_PHRASES = [
  'Qual é a sua dúvida estratégica?',
  'Pergunte sobre frequência de posts...',
  'Qual tese editorial quer desenvolver?',
  'Como posso orquestrar seu conteúdo?',
  'Sobre o que quer falar hoje?',
];

const AGENT_COLOR = '#f59e0b';

function Advisor() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { agents, addPost, credits, addMessageToAgent, resetAgentHistory, user } = useStore();

  const agent = agents.find(a => a.id === 'linage');

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestPost, setSuggestPost] = useState(false);
  const [showPostGenerator, setShowPostGenerator] = useState(false);
  const [generatedPostTitle, setGeneratedPostTitle] = useState('');
  const [generatedPostContent, setGeneratedPostContent] = useState('');
  const [editorMode, setEditorMode] = useState('raw');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [postGenerated, setPostGenerated] = useState(false);
  const [pendingRevision, setPendingRevision] = useState(null);

  const chatEndRef = useRef(null);
  const { ref: advisorInputRef, onFocus: advisorFocus, onBlur: advisorBlur } = useDecryptPlaceholder(ADVISOR_PHRASES);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [agent?.history, isTyping, suggestPost]);

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
      const conversationContext = (agent?.history || [])
        .map(m => `${m.sender === 'user' ? 'Usuário' : 'Linage'}: ${m.text}`)
        .join('\n');

      const topicMsg = [...(agent?.history || [])].reverse().find(m => m.sender === 'user')?.text || '';
      const token = await getToken();
      const newsContext = await fetchNewsForTopic(topicMsg, token);

      const res = await fetch('/api/agent/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationContext, newsContext }),
      });
      const data = await res.json();
      if (data.credits !== undefined) useStore.setState({ credits: data.credits });
      const raw = data.text || '';
      const titleMatch = raw.match(/TÍTULO:\s*(.+)/);
      const contentMatch = raw.match(/CONTEÚDO:\s*([\s\S]+)/);

      setGeneratedPostTitle(titleMatch ? titleMatch[1].trim() : 'Post gerado por Linage');
      setGeneratedPostContent(contentMatch ? contentMatch[1].trim() : raw);

      resetAgentHistory('linage');
      setPostGenerated(true);
      addMessageToAgent('linage', {
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
      agentId: 'linage',
      createdAt: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          agentId: newPost.agentId,
          status: status === 'draft' ? 'draft' : 'completed',
        }),
      });
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
    addMessageToAgent('linage', {
      sender: 'agent',
      text: 'Alterações aplicadas ao post.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleNewConversation = () => {
    if (!window.confirm('Iniciar nova conversa? O rascunho atual será perdido se não foi salvo.')) return;
    resetAgentHistory('linage');
    setPostGenerated(false);
    setPendingRevision(null);
    setSuggestPost(false);
    setShowPostGenerator(false);
    setGeneratedPostTitle('');
    setGeneratedPostContent('');
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
          <span className="header-subtitle">Advisor Estratégico</span>
          <h1 className="header-title">Fale com Linage</h1>
          <p className="header-desc">Pergunte qualquer coisa — um tema que ficou entalado, uma dúvida de posicionamento, ou só uma ideia bruta que precisa de ângulo.</p>
        </div>
      </header>

      <div className="advisor-full">
        <div className="advisor-chat-card glass-card">
          {postGenerated && (
            <div className="chat-card-header">
              <div className="chat-header-agent-info">
                <div className="online-indicator-dot"></div>
                <div>
                  <h3>Sessão Ativa</h3>
                  <p>Conversando com Linage</p>
                </div>
              </div>
              <div className="chat-header-actions">
                {!showPostGenerator && (
                  <button className="view-draft-btn" onClick={() => setShowPostGenerator(true)}>
                    <FileText size={14} />
                    <span>Ver rascunho</span>
                  </button>
                )}
                <button className="generate-post-trigger-btn generate-post-trigger-btn--secondary" onClick={handleNewConversation}>
                  <RefreshCw size={15} />
                  <span>Nova Conversa</span>
                </button>
              </div>
            </div>
          )}

          <div className="advisor-chat-messages">
            <div className="advisor-message-row linage">
              <div className="linage-avatar-icon">L</div>
              <div className="advisor-msg-bubble">
                <p>Pode jogar qualquer coisa — uma notícia do dia que você não sabe por onde pegar, uma dúvida de posicionamento, ou só um tema que ficou entalado. A gente vai de lá.</p>
                <div className="advisor-msg-suggestions">
                  <button onClick={() => setInputText("Com que frequência devo publicar?")} className="advisor-quick-btn">
                    Com que frequência publicar?
                  </button>
                  <button onClick={() => setInputText("Como estruturo meu posicionamento no LinkedIn?")} className="advisor-quick-btn">
                    Como estruturo meu posicionamento?
                  </button>
                  <button onClick={() => setInputText("Tenho uma ideia de post mas não sei por onde começar.")} className="advisor-quick-btn">
                    Tenho uma ideia, mas...
                  </button>
                </div>
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

            <div ref={chatEndRef} />
          </div>

          {pendingRevision && (
            <div className="pending-revision-bar">
              <span className="pending-revision-label">Revisão pronta para aplicar</span>
              <button className="apply-revision-btn" onClick={handleApplyRevision}>Aplicar ao post</button>
              <button className="dismiss-revision-btn" onClick={() => setPendingRevision(null)}>Ignorar</button>
            </div>
          )}

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
        </div>
      </div>

      {showPostGenerator && (
        <div className="modal-overlay">
          <div className="post-generator-panel animate-slide-left">
            {isGenerating ? (
              <div className="generator-loading-state">
                <div className="rotating-gradient-ring"></div>
                <Sparkles size={40} className="glow-spark-icon animate-pulse" />
                <h3>Linage está redigindo...</h3>
                <p>Moldando argumentos de alto impacto, revisando ritmo e injetando autoridade.</p>
              </div>
            ) : (
              <div className="generator-main-workspace">
                <header className="generator-header">
                  <div>
                    <span className="generator-badge" style={{ backgroundColor: AGENT_COLOR + '20', color: AGENT_COLOR }}>
                      Escritório do Linage
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
                          <div className="mock-avatar" style={{ backgroundColor: AGENT_COLOR }}>L</div>
                          <div>
                            <h4 className="mock-user-name">{user.name || 'Especialista Financeiro'}</h4>
                            <p className="mock-user-headline">Advisory Privado | Insights Financeiros Descontraídos & Substância</p>
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
                    <button className="btn-primary" style={{ backgroundColor: AGENT_COLOR }} onClick={() => handleSavePost('publish')}>
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
