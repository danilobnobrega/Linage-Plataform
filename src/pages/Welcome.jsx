import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';
import ThreeBackground from '../components/ThreeBackground';
import { Gift, ArrowRight } from 'lucide-react';

function Welcome() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { dbUser, user, setDbUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dbUser) return;
    if (dbUser.trial_activated || user.plan !== 'trial') {
      navigate('/home', { replace: true });
    }
  }, [dbUser, user.plan]);

  const handleStartTrial = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/auth/start-trial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updatedUser = await res.json();
      setDbUser(updatedUser);
      navigate('/home', { replace: true });
    } catch {
      setError('Erro ao iniciar o teste. Tente novamente.');
      setLoading(false);
    }
  };

  if (!dbUser) return null;

  return (
    <div style={s.page}>
      <ThreeBackground />
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="32" height="31" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#00ff88" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
          </svg>
        </div>

        <h1 style={s.title}>Bem-vindo ao Linage</h1>
        <p style={s.subtitle}>Seu teste grátis está pronto.</p>

        <div style={s.badge}>
          <Gift size={16} style={{ color: '#00ff88', flexShrink: 0 }} />
          <span style={s.badgeText}>1.350 créditos gratuitos</span>
        </div>

        <p style={s.desc}>Crie até 3 posts completos sem pagar nada. Sem cartão de crédito.</p>

        {error && <p style={s.error}>{error}</p>}

        <button style={s.cta} onClick={handleStartTrial} disabled={loading}>
          {loading ? 'Iniciando...' : (
            <><span>Iniciar teste grátis</span><ArrowRight size={16} /></>
          )}
        </button>

        <button style={s.skip} onClick={() => navigate('/home', { replace: true })}>
          Explorar primeiro, ativar depois
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#030508',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(8, 11, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
    boxShadow: '0 0 60px rgba(0, 255, 136, 0.06)',
    textAlign: 'center',
  },
  logoWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(0, 255, 136, 0.08)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '28px',
    fontWeight: 400,
    color: '#f0eef8',
    marginBottom: '8px',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '15px',
    color: '#8b8897',
    marginBottom: '24px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 255, 136, 0.08)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '50px',
    padding: '8px 16px',
    marginBottom: '16px',
  },
  badgeText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#00ff88',
  },
  desc: {
    fontSize: '14px',
    color: '#8b8897',
    lineHeight: 1.6,
    marginBottom: '28px',
  },
  error: {
    fontSize: '13px',
    color: '#ff4d6a',
    marginBottom: '12px',
  },
  cta: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#030508',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '12px',
    fontFamily: "'Space Grotesk', sans-serif",
    transition: 'opacity 0.2s',
  },
  skip: {
    background: 'none',
    border: 'none',
    color: '#8b8897',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px',
    fontFamily: "'Space Grotesk', sans-serif",
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};

export default Welcome;
