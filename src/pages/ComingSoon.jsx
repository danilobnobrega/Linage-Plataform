import { useState } from 'react';
import ThreeBackground from '../components/ThreeBackground';
import AuthCursor from '../components/AuthCursor';

function ComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="auth-page">
      <ThreeBackground />
      <AuthCursor />
      <div className="auth-content coming-soon-content">
        <div className="auth-logo">
          <svg width="28" height="27" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
          </svg>
          Linage
        </div>

        <h1 className="coming-soon-title">Estou trabalhando em mim mesmo.</h1>

        <p className="coming-soon-text">
          Até aqui eu só escrevia o post que você pedia — você mandava o tema, eu devolvia o texto, ficávamos por aí. Agora vou cuidar de tudo, do mapeamento até a publicação: entender sua especialidade e quem você quer atrair, definir seu posicionamento, montar o calendário do mês com o formato e objetivo de cada post, escrever e publicar no horário certo.
        </p>

        {status === 'done' ? (
          <p className="coming-soon-confirmation">Feito! Sua vaga está garantida.</p>
        ) : (
          <form className="coming-soon-form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              className="coming-soon-input"
            />
            <button type="submit" className="coming-soon-btn" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Quero minha vaga'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="coming-soon-error">Algo deu errado. Tenta de novo?</p>
        )}

        <p className="coming-soon-sub">7 dias grátis. 40% off no primeiro ano pra quem entrar agora.</p>
      </div>
    </div>
  );
}

export default ComingSoon;
