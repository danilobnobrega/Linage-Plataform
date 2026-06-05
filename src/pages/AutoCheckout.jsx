import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

function AutoCheckout() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    const billing = params.get('billing') || 'monthly';

    if (!plan) { navigate('/credits', { replace: true }); return; }

    async function startCheckout() {
      try {
        const token = await getToken();
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan, billing }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    }

    startCheckout();
  }, []);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <p style={{ color: 'var(--text-secondary)' }}>Erro ao iniciar o checkout. Tente novamente.</p>
      <button onClick={() => navigate('/credits')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Ir para Planos & Créditos
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Redirecionando para o checkout...</p>
    </div>
  );
}

export default AutoCheckout;
