import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { HelpCircle, Send, Check, Clock } from 'lucide-react';

function Help() {
  const { getToken } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setStatus('sending');
    try {
      const token = await getToken();
      const res = await fetch('/api/help/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar mensagem.');
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="page-container help-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <HelpCircle size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Suporte</span>
          <h1 className="header-title">Como podemos ajudar?</h1>
          <p className="header-desc">
            Descreva sua dúvida ou problema e entraremos em contato em breve.
          </p>
        </div>
      </header>

      <div className="help-response-time">
        <Clock size={14} />
        <span>Respondemos em até <strong>5 dias úteis</strong></span>
      </div>

      {status === 'success' ? (
        <div className="help-success glass-card">
          <div className="help-success-icon">
            <Check size={28} />
          </div>
          <h3>Mensagem enviada!</h3>
          <p>Recebemos sua mensagem e responderemos em até 5 dias úteis no seu email.</p>
        </div>
      ) : (
        <form className="help-form glass-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Assunto</label>
            <input
              type="text"
              className="settings-text-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex.: Problema ao gerar post"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mensagem</label>
            <textarea
              className="settings-text-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Descreva sua dúvida com o máximo de detalhes possível..."
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          {status === 'error' && (
            <p className="help-error">{errorMsg}</p>
          )}

          <div className="help-form-footer">
            <button
              type="submit"
              className="save-settings-submit-btn magnetic"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Enviando...' : (
                <><Send size={14} /> Enviar mensagem</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Help;
