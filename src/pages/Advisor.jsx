import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { Send } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useDecryptPlaceholder } from '../hooks/useDecryptPlaceholder';

const ADVISOR_PHRASES = [
  'Qual é a sua dúvida estratégica?',
  'Pergunte sobre frequência de posts...',
  'Qual tese editorial quer desenvolver?',
  'Como posso orquestrar seu conteúdo?',
  'Sobre o que quer falar hoje?',
];

function Advisor() {
  const { getToken } = useAuth();
  const { advisorHistory, addAdvisorMessage } = useStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const { ref: advisorInputRef, onFocus: advisorFocus, onBlur: advisorBlur } = useDecryptPlaceholder(ADVISOR_PHRASES);



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [advisorHistory, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addAdvisorMessage(userMessage);
    setInputText('');
    setIsTyping(true);

    try {
      const history = [...advisorHistory, userMessage];
      const messages = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

      const token = await getToken();
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();

      addAdvisorMessage({
        sender: 'advisor',
        text: data.text || 'Algo deu errado na conexão. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      addAdvisorMessage({
        sender: 'advisor',
        text: 'Algo deu errado na conexão. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsTyping(false);
    }
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

      {/* Grid of quick prompts & chat */}
      <div className="advisor-full">
        {/* Chat Area */}
        <div className="advisor-chat-card glass-card">
          <div className="advisor-chat-messages">
            {/* Linage Welcome message */}
            <div className="advisor-message-row linage">
              <div className="linage-avatar-icon">
                L
              </div>
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

            {/* State messages history */}
            {advisorHistory.map((msg, index) => (
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
            <div ref={chatEndRef} />
          </div>

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
    </div>
  );
}

export default Advisor;
