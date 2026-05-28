import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { 
  Send, 
  Sparkles, 
  ChevronRight, 
  Map, 
  TrendingUp, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  Activity
} from 'lucide-react';

function Advisor() {
  const navigate = useNavigate();
  const { advisorHistory, addAdvisorMessage, agents } = useStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisorHistory, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addAdvisorMessage(userMessage);
    const prompt = inputText.toLowerCase();
    setInputText('');

    setIsTyping(true);
    
    // Simulate Linage Advisor strategic thinking
    setTimeout(() => {
      let replyText = '';
      
      if (prompt.includes('agente') || prompt.includes('qual escolher') || prompt.includes('quem') || prompt.includes('ajuda')) {
        replyText = `Com base nas suas metas, recomendo orquestrar os agentes com as seguintes atribuições:\n\n1. **Para construir autoridade inquestionável**: Acione o **Cirurgião**. Ele disseca dados complexos em mini-aulas práticas.\n2. **Para gerar alto engajamento e debate**: Use o **Provocador**. Ele desconstrói os consensos mornos e faz a sua audiência reagir.\n3. **Para capturar atenção emocional**: Vá de **Narrador**. Histórias grudam na mente muito mais que estatísticas puras.\n4. **Para demonstrar visão de futuro**: Conecte-se ao **Estrategista**. Ele desvenda consequências de 2ª e 3ª ordem.\n5. **Para humanizar e aproximar**: Use o **Carismático**. Ele escreve com humor refinado e magnetismo absoluto.\n\nQual dessas frentes faz mais sentido impulsionar agora? Posso te encaminhar direto para o agente ideal.`;
      } else if (prompt.includes('frequência') || prompt.includes('calendário') || prompt.includes('postar')) {
        replyText = `Mapeei uma cadência ótima para o seu posicionamento. Menos ruído, mais sinal. Minha recomendação de frequência semanal é:\n\n• **Terça-feira (Manhã)**: Post Técnico de alta densidade com **O Cirurgião** para fundar sua autoridade.\n• **Quinta-feira (Tarde)**: Post Disruptivo com **O Provocador** para surfar no debate e atrair alcance orgânico.\n• **Sábado (Manhã)**: Post Storytelling com **O Narrador** ou Leve com **O Carismático** para gerar conexão genuína com a base.\n\nEsta combinação equilibra autoridade, engajamento e branding. Deseja que eu formule sugestões de temas para iniciarmos a pauta de terça?`;
      } else if (prompt.includes('estratégia') || prompt.includes('posicionamento') || prompt.includes('tese')) {
        replyText = `Excelente. Sua tese de posicionamento deve girar em torno de uma verdade que só você enxerga no seu mercado.\n\nMinha sugestão estratégica:\n- **O Pilar central**: Focar nas assimetrias de investimento geradas pela IA.\n- **Os Agentes executores**: O **Estrategista** conecta as frentes globais, e o **Cirurgião** desce ao detalhe dos dados.\n\nRecomendo conversarmos com o **Estrategista** agora para estruturar sua primeira projeção trimestral. Deseja fazer isso?`;
      } else {
        replyText = `Entendido perfeitamente. Sua presença deve ser desenhada como um ecossistema. Para maximizar sua marca:\n\n• Escolha o **Cirurgião** se precisar de posts densos e precisos.\n• Chame o **Provocador** para furar a bolha de opiniões comuns.\n• Use o **Narrador** para engajar através de jornadas reais.\n\nSe quiser estruturar um calendário específico de posts ou obter feedback de frequência, basta me pedir! Estou aqui para orquestrar sua linha editorial.`;
      }

      const botMessage = {
        sender: 'advisor',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      addAdvisorMessage(botMessage);
      setIsTyping(false);
    }, 1500);
  };

  const handleRouteAgent = (agentId) => {
    navigate(`/agent/${agentId}`);
  };

  return (
    <div className="page-container advisor-page animate-fade-in">
      <header className="page-header">
        <div className="header-icon-wrapper advisor-glow">
          <Sparkles className="advisor-star-icon" size={24} />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Advisor Estratégico</span>
          <h1 className="header-title">Fale com Linage</h1>
          <p className="header-desc">O arquiteto da sua marca digital. Linage orquestra sua frequência, tese editorial e recomenda o melhor agente para cada tipo de narrativa.</p>
        </div>
      </header>

      {/* Grid of quick prompts & chat */}
      <div className="advisor-grid">
        {/* Chat Area */}
        <div className="advisor-chat-card glass-card">
          <div className="advisor-chat-messages">
            {/* Linage Welcome message */}
            <div className="advisor-message-row linage">
              <div className="linage-avatar-icon">
                L
              </div>
              <div className="advisor-msg-bubble">
                <p>Olá, especialista. Eu sou o Linage, seu advisor de posicionamento estratégico.</p>
                <p>Meu papel é refinar sua linha editorial para atrair investidores qualificados e leads de alta renda. Qual é o foco do seu posicionamento hoje?</p>
                <div className="advisor-msg-suggestions">
                  <button onClick={() => setInputText("Qual agente devo usar para criar autoridade rápida?")} className="advisor-quick-btn">
                    Qual agente escolher?
                  </button>
                  <button onClick={() => setInputText("Sugira um calendário e frequência de posts para mim")} className="advisor-quick-btn">
                    Recomendação de Frequência
                  </button>
                  <button onClick={() => setInputText("Como estruturar minha tese estratégica de conteúdo?")} className="advisor-quick-btn">
                    Tese Estratégica
                  </button>
                </div>
                <span className="advisor-msg-time">09:00</span>
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
              type="text" 
              placeholder="Pergunte ao Linage sobre estratégia de canais, cadência ou qual agente utilizar..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="advisor-input-text"
            />
            <button type="submit" className="advisor-send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Strategic Guidelines Panel */}
        <div className="advisor-strategic-sidebar">
          {/* Quick Routing Card */}
          <div className="glass-card strategic-card">
            <div className="card-header-with-badge">
              <h3 className="strategic-title">Orquestrar Agentes</h3>
              <span className="pulse-dot-green">Ativos</span>
            </div>
            <p className="strategic-desc">Direcione tarefas imediatamente para a personalidade mais alinhada à sua pauta de hoje:</p>
            
            <div className="routing-agents-list">
              {agents.map(agent => (
                <button 
                  key={agent.id} 
                  className="routing-agent-row-btn"
                  onClick={() => handleRouteAgent(agent.id)}
                >
                  <div className="routing-agent-info">
                    <span className="routing-agent-name">{agent.name}</span>
                    <span className="routing-agent-meta">
                      {agent.id === 'cirurgiao' && 'Induções Lógicas & Dados'}
                      {agent.id === 'provocador' && 'Desconstrução de Clichês'}
                      {agent.id === 'narrador' && 'Analogias & Conexão'}
                      {agent.id === 'estrategista' && 'Visão de Futuro e Padrões'}
                      {agent.id === 'carismatico' && 'Humor Inteligente & Charme'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="routing-arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* Strategic stats card */}
          <div className="glass-card strategic-card metrics-card">
            <h3 className="strategic-title">Diagnóstico do Canal</h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-num">3/sem</span>
                <span className="metric-lbl">Frequência Ótima</span>
              </div>
              <div className="metric-box">
                <span className="metric-num">89%</span>
                <span className="metric-lbl">Sinal Analítico</span>
              </div>
              <div className="metric-box">
                <span className="metric-num">11%</span>
                <span className="metric-lbl">Ruído Comercial</span>
              </div>
            </div>
            <div className="strategic-disclaimer">
              <Activity size={12} style={{marginRight: 6}} />
              Próximo diagnóstico editorial em 48h.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Advisor;
