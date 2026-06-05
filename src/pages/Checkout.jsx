import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, ArrowLeft, Lock } from 'lucide-react';
import { PLANS } from './Credits';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const stripeAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#aa3bff',
    colorBackground: '#0d0e14',
    colorText: '#f3f4f6',
    colorTextSecondary: '#9ca3af',
    colorTextPlaceholder: '#6b7280',
    borderRadius: '8px',
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    fontSizeBase: '14px',
  },
  rules: {
    '.Input': { border: '1px solid #2e303a', boxShadow: 'none', backgroundColor: '#12131a' },
    '.Input:focus': { border: '1px solid #aa3bff', boxShadow: '0 0 0 2px rgba(170,59,255,0.2)', outline: 'none' },
    '.Label': { color: '#9ca3af', marginBottom: '6px' },
    '.Tab': { border: '1px solid #2e303a', backgroundColor: '#12131a' },
    '.Tab--selected': { border: '1px solid #aa3bff', backgroundColor: '#1a0a2e' },
  },
};

function CheckoutForm({ planData, billing, getToken }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const price = billing === 'annual' ? planData.priceAnnual : planData.price;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    // Step 1: validate form
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    // Step 2: confirm setup (save card)
    const { setupIntent, error: setupError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout${window.location.search}&setup_redirect=1`,
      },
    });

    if (setupError) {
      setError(setupError.message);
      setLoading(false);
      return;
    }

    // Step 3: create subscription with saved card
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan: planData.id,
          billing,
          paymentMethodId: setupIntent.payment_method,
        }),
      });
      const data = await res.json();

      if (data.success) {
        navigate('/home?upgrade=success', { replace: true });
        return;
      }

      if (data.requiresAction && data.clientSecret) {
        const { error: actionError } = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (actionError) { setError(actionError.message); setLoading(false); return; }
        navigate('/home?upgrade=success', { replace: true });
        return;
      }

      setError(data.error || 'Erro ao ativar assinatura.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  }

  return (
    <div style={s.layout}>
      <div style={s.summary}>
        <div style={s.planName}>{planData.name}</div>
        <div style={s.priceRow}>
          <span style={s.priceAmount}>{price}</span>
          <span style={s.pricePeriod}>{planData.period}</span>
        </div>
        {billing === 'annual' && planData.annualTotal && (
          <div style={s.annualNote}>{planData.annualTotal}</div>
        )}
        <div style={s.divider} />
        <ul style={s.featureList}>
          {planData.features.map((f, i) => (
            <li key={i} style={s.featureItem}>
              <Check size={14} color="#aa3bff" style={{ flexShrink: 0 }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div style={s.secureRow}>
          <Lock size={12} color="#6b7280" />
          <span style={s.secureText}>Pagamento seguro via Stripe</span>
        </div>
      </div>

      <div style={s.formWrap}>
        <p style={s.formLabel}>Dados do cartão</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PaymentElement options={{ layout: 'tabs' }} />
          {error && <p style={s.errorMsg}>{error}</p>}
          <button
            type="submit"
            disabled={!stripe || loading}
            style={{ ...s.submitBtn, opacity: (!stripe || loading) ? 0.6 : 1 }}
          >
            {loading ? 'Processando...' : `Assinar ${planData.name}`}
          </button>
          <p style={s.cancelNote}>Cancele a qualquer momento. Sem taxas de cancelamento.</p>
        </form>
      </div>
    </div>
  );
}

function Checkout() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [initError, setInitError] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan');
  const billing = params.get('billing') || 'monthly';
  const planData = PLANS.find(p => p.id === planId);

  useEffect(() => {
    if (!planId || planId === 'free' || !planData) {
      navigate('/credits', { replace: true });
      return;
    }

    async function createSetupIntent() {
      try {
        const token = await getToken();
        const res = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: planId, billing }),
        });
        const data = await res.json();
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setInitError(data.error || 'Erro ao iniciar pagamento.');
      } catch {
        setInitError('Erro de conexão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    createSetupIntent();
  }, []);

  if (!planData) return null;

  return (
    <div style={s.page}>
      <button onClick={() => navigate('/credits')} style={s.backBtn}>
        <ArrowLeft size={15} />
        <span>Voltar para planos</span>
      </button>

      {loading && (
        <div style={s.centered}>
          <p style={{ color: '#9ca3af', fontFamily: '"Space Grotesk", sans-serif' }}>
            Preparando checkout...
          </p>
        </div>
      )}

      {initError && (
        <div style={s.centered}>
          <p style={{ color: '#f87171', fontFamily: '"Space Grotesk", sans-serif' }}>{initError}</p>
          <button onClick={() => navigate('/credits')} style={s.linkBtn}>
            Voltar para planos
          </button>
        </div>
      )}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
          <CheckoutForm planData={planData} billing={billing} getToken={getToken} />
        </Elements>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: '40px 32px',
    maxWidth: 860,
    margin: '0 auto',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    width: 'fit-content',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: 40,
    alignItems: 'start',
  },
  summary: {
    background: '#0d0e14',
    border: '1px solid #1e1f29',
    borderRadius: 12,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  planName: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 30,
    fontWeight: 300,
    color: '#f3f4f6',
    letterSpacing: '0.04em',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 600,
    color: '#ffffff',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  annualNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: '"Space Grotesk", sans-serif',
    marginTop: -4,
  },
  divider: {
    height: 1,
    background: '#1e1f29',
    margin: '2px 0',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  secureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  secureText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  formWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formLabel: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: '#9ca3af',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  errorMsg: {
    color: '#f87171',
    fontSize: 13,
    margin: 0,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: '#aa3bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: '"Space Grotesk", sans-serif',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    letterSpacing: '0.02em',
  },
  cancelNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: '"Space Grotesk", sans-serif',
    margin: 0,
    textAlign: 'center',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flex: 1,
    minHeight: 300,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#aa3bff',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: '"Space Grotesk", sans-serif',
  },
};

export default Checkout;
