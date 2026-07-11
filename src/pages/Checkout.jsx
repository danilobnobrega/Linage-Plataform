import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Check, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { PLANS } from './Credits';
import useStore from '../store';

let stripePromise = null;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const cardStyle = {
  base: {
    color: '#e8e6f0',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontSize: '15px',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#6b7280' },
  },
  invalid: { color: '#ff4d6a', iconColor: '#ff4d6a' },
};

function StripeField({ label, children, focused }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.fieldLabel}>{label}</label>
      <div style={{
        ...s.stripeField,
        border: focused ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: focused ? '0 0 0 2px rgba(0,255,136,0.15)' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
}

// --- Card form (used for new, payment-method, credits) ---
function CardForm({ mode, planData, billing, creditsAmount, creditsPrice, getToken, clientSecret, isMobile }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { setDbUser, setCredits } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(null);

  async function refreshUser() {
    try {
      const token = await getToken();
      const res = await fetch('/api/auth/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDbUser(await res.json());
    } catch {}
  }

  const price = mode === 'credits'
    ? creditsPrice
    : billing === 'annual' ? planData?.priceAnnual : planData?.price;

  const fo = (name) => ({ onFocus: () => setFocused(name), onBlur: () => setFocused(null) });
  const pad = isMobile ? '24px 20px' : '36px 32px';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const cardNumber = elements.getElement(CardNumberElement);

    if (mode === 'credits') {
      const { paymentIntent, error: payErr } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber },
      });
      if (payErr) { setError(payErr.message); setLoading(false); return; }

      try {
        const token = await getToken();
        const res = await fetch('/api/stripe/fulfill-credit-pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        const data = await res.json();
        if (data.credits !== undefined) {
          setDbUser(data);
          navigate('/credits?credits=success', { replace: true });
        } else {
          setError(data.error || 'Erro ao adicionar créditos.');
        }
      } catch {
        setError('Erro de conexão. Tente novamente.');
      }
      setLoading(false);
      return;
    }

    // new and payment-method both use SetupIntent
    const { setupIntent, error: setupError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardNumber },
    });
    if (setupError) { setError(setupError.message); setLoading(false); return; }

    try {
      const token = await getToken();

      if (mode === 'payment-method') {
        const res = await fetch('/api/stripe/update-payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
        });
        const data = await res.json();
        if (data.success) {
          navigate('/settings?section=cobranca&updated=payment-method', { replace: true });
        } else {
          setError(data.error || 'Erro ao atualizar método de pagamento.');
        }
        setLoading(false);
        return;
      }

      // mode === 'new'
      const res = await fetch('/api/stripe/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planData.id, billing, paymentMethodId: setupIntent.payment_method }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        navigate('/home?upgrade=success', { replace: true });
        return;
      }
      if (data.requiresAction && data.clientSecret) {
        const { error: actionError } = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (actionError) { setError(actionError.message); setLoading(false); return; }
        await refreshUser();
        navigate('/home?upgrade=success', { replace: true });
        return;
      }
      setError(data.error || 'Erro ao ativar assinatura.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
    setLoading(false);
  }

  const leftTitle = mode === 'credits' ? `${creditsAmount?.toLocaleString('pt-BR')} créditos` : planData?.name;
  const leftSubtitle = mode === 'credits' ? 'Créditos avulsos' : mode === 'payment-method' ? 'Método de pagamento' : 'Plano selecionado';
  const btnLabel = mode === 'credits' ? 'Confirmar compra' : mode === 'payment-method' ? 'Salvar cartão' : `Assinar ${planData?.name}`;

  return (
    <div style={{
      ...s.card,
      gridTemplateColumns: isMobile ? undefined : '1fr 1px 1.4fr',
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
    }}>
      <div style={{ ...s.cardLeft, padding: pad }}>
        <div style={s.planLabel}>{leftSubtitle}</div>
        {mode !== 'payment-method' && (
          <>
            <div style={{ ...s.planName, fontSize: isMobile ? 26 : 34 }}>{leftTitle}</div>
            {price && (
              <div style={s.priceRow}>
                <span style={{ ...s.priceAmount, fontSize: isMobile ? 22 : 28 }}>{price}</span>
                {planData?.period && <span style={s.pricePeriod}>{planData.period}</span>}
              </div>
            )}
            {billing === 'annual' && planData?.annualTotal && (
              <div style={s.annualNote}>{planData.annualTotal}</div>
            )}
            {mode === 'credits' && (
              <p style={{ ...s.annualNote, marginTop: 8 }}>Créditos acumulam e nunca expiram.</p>
            )}
          </>
        )}
        {mode === 'payment-method' && (
          <p style={s.annualNote}>Adicione ou atualize o cartão vinculado à sua assinatura.</p>
        )}
        {planData?.features?.length > 0 && (
          <>
            <div style={s.divider} />
            <ul style={s.featureList}>
              {planData.features.map((f, i) => (
                <li key={i} style={s.featureItem}>
                  <Check size={13} color="#00ff88" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div style={s.secureRow}>
          <Lock size={11} color="#6b7280" />
          <span style={s.secureText}>Pagamento seguro via Stripe</span>
        </div>
      </div>

      <div style={isMobile
        ? { height: 1, background: 'rgba(255,255,255,0.07)' }
        : { width: 1, background: 'rgba(255,255,255,0.07)' }
      } />

      <div style={{ ...s.cardRight, padding: pad }}>
        <div style={s.formTitle}>Dados do pagamento</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StripeField label="Número do cartão" focused={focused === 'number'}>
            <CardNumberElement options={{ style: cardStyle, showIcon: true }} {...fo('number')} />
          </StripeField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StripeField label="Validade" focused={focused === 'expiry'}>
              <CardExpiryElement options={{ style: cardStyle }} {...fo('expiry')} />
            </StripeField>
            <StripeField label="CVC" focused={focused === 'cvc'}>
              <CardCvcElement options={{ style: cardStyle }} {...fo('cvc')} />
            </StripeField>
          </div>
          {error && <p style={s.errorMsg}>{error}</p>}
          <button
            type="submit"
            className="magnetic"
            disabled={!stripe || loading}
            style={{ ...s.submitBtn, opacity: (!stripe || loading) ? 0.6 : 1 }}
          >
            {loading ? 'Processando...' : btnLabel}
          </button>
          <p style={s.cancelNote}>
            {mode === 'new' ? 'Cancele a qualquer momento. Sem taxas de cancelamento.' : ''}
            {mode === 'credits' ? 'Créditos adicionados imediatamente após confirmação.' : ''}
            {mode === 'payment-method' ? 'Seu cartão anterior será substituído.' : ''}
          </p>
        </form>
      </div>
    </div>
  );
}

// --- Confirmation layout (used for update mode) ---
function UpdateConfirmForm({ planData, billing, currentPlan, getToken, isMobile }) {
  const navigate = useNavigate();
  const { setDbUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const price = billing === 'annual' ? planData?.priceAnnual : planData?.price;
  const pad = isMobile ? '24px 20px' : '36px 32px';

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planData.id, billing }),
      });
      const data = await res.json();
      if (data.success) {
        const syncRes = await fetch('/api/auth/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (syncRes.ok) setDbUser(await syncRes.json());
        navigate('/home?upgrade=success', { replace: true });
      } else {
        setError(data.error || 'Erro ao alterar plano.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      ...s.card,
      gridTemplateColumns: isMobile ? undefined : '1fr 1px 1.4fr',
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
    }}>
      <div style={{ ...s.cardLeft, padding: pad }}>
        <div style={s.planLabel}>Alteração de plano</div>
        <div style={{ ...s.planName, fontSize: isMobile ? 24 : 30 }}>{planData?.name}</div>
        <div style={s.priceRow}>
          <span style={{ ...s.priceAmount, fontSize: isMobile ? 20 : 26 }}>{price}</span>
          {planData?.period && <span style={s.pricePeriod}>{planData.period}</span>}
        </div>
        {billing === 'annual' && planData?.annualTotal && (
          <div style={s.annualNote}>{planData.annualTotal}</div>
        )}
        {planData?.features?.length > 0 && (
          <>
            <div style={s.divider} />
            <ul style={s.featureList}>
              {planData.features.map((f, i) => (
                <li key={i} style={s.featureItem}>
                  <Check size={13} color="#00ff88" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div style={isMobile
        ? { height: 1, background: 'rgba(255,255,255,0.07)' }
        : { width: 1, background: 'rgba(255,255,255,0.07)' }
      } />

      <div style={{ ...s.cardRight, padding: pad, justifyContent: 'center' }}>
        <div style={s.formTitle}>Confirmar alteração</div>
        <p style={{ ...s.cancelNote, marginBottom: 24, textAlign: 'left', fontSize: 14, color: '#8b8897', lineHeight: 1.6 }}>
          Sua assinatura será alterada imediatamente. O novo valor começa a ser cobrado a partir do próximo ciclo de cobrança.
        </p>
        {error && <p style={{ ...s.errorMsg, marginBottom: 12 }}>{error}</p>}
        <button
          className="magnetic"
          onClick={handleConfirm}
          disabled={loading}
          style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Processando...' : <><span>Confirmar</span> <ArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  );
}

// --- Main Checkout component ---
function Checkout() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useStore();
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'new';
  const planId = params.get('plan');
  const billing = params.get('billing') || 'monthly';
  const creditsAmount = parseInt(params.get('amount') || '0', 10);
  const creditsUnitAmount = parseInt(params.get('unitAmount') || '0', 10);
  const creditsPrice = params.get('price') || '';
  const planData = PLANS.find(p => p.id === planId);

  useEffect(() => {
    if (mode === 'update') {
      if (!planId || !planData) { navigate('/credits', { replace: true }); return; }
      setLoading(false);
      return;
    }

    if (mode === 'new') {
      if (!planId || planId === 'trial' || !planData) { navigate('/credits', { replace: true }); return; }
    }

    if (mode === 'credits') {
      if (!creditsAmount || !creditsUnitAmount) { navigate('/credits', { replace: true }); return; }
    }

    async function init() {
      try {
        const token = await getToken();
        let endpoint, body;

        if (mode === 'new') {
          endpoint = '/api/stripe/create-setup-intent';
          body = { plan: planId, billing };
        } else if (mode === 'payment-method') {
          endpoint = '/api/stripe/create-payment-method-intent';
          body = {};
        } else if (mode === 'credits') {
          endpoint = '/api/stripe/create-payment-intent';
          body = { amount: creditsAmount, unitAmount: creditsUnitAmount };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.clientSecret && data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey);
          setClientSecret(data.clientSecret);
          setStripeReady(true);
        } else {
          setInitError(data.error || 'Erro ao iniciar pagamento.');
        }
      } catch {
        setInitError('Erro de conexão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const elementsOptions = useMemo(() =>
    stripeReady ? { appearance: { theme: 'night' } } : null
  , [stripeReady]);

  const headerTitle = {
    new: 'Assinar',
    update: 'Alterar Plano',
    'payment-method': 'Método de Pagamento',
    credits: 'Comprar Créditos',
  }[mode] || 'Checkout';

  return (
    <div style={{
      ...s.page,
      padding: isMobile ? '24px 12px 40px' : '40px 16px',
      alignItems: isMobile ? 'flex-start' : 'center',
    }}>
      <ThreeBackground />
      <div style={{
        ...s.content,
        gap: isMobile ? 20 : 28,
        maxWidth: isMobile ? '100%' : 840,
      }}>
        <div style={s.header}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
          <div style={{ ...s.logo, fontSize: isMobile ? '1.15rem' : '1.5rem', gap: isMobile ? 8 : 10 }}>
            <svg width={isMobile ? 16 : 20} height={isMobile ? 15 : 19} viewBox="0 0 48 46" fill="none">
              <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
            </svg>
            Linage
          </div>
          <div />
        </div>

        {loading && (
          <div style={s.centered}>
            <p style={s.loadingText}>Preparando checkout...</p>
          </div>
        )}

        {initError && (
          <div style={s.centered}>
            <p style={s.errorText}>{initError}</p>
            <button onClick={() => navigate(-1)} style={s.linkBtn}>Voltar</button>
          </div>
        )}

        {!loading && !initError && mode === 'update' && planData && (
          <UpdateConfirmForm
            planData={planData}
            billing={billing}
            currentPlan={user?.plan}
            getToken={getToken}
            isMobile={isMobile}
          />
        )}

        {stripeReady && elementsOptions && mode !== 'update' && (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <CardForm
              mode={mode}
              planData={planData}
              billing={billing}
              creditsAmount={creditsAmount}
              creditsPrice={creditsPrice}
              getToken={getToken}
              clientSecret={clientSecret}
              isMobile={isMobile}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    background: '#030508',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 16px',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 840,
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#8b8897',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem',
    fontWeight: 300,
    letterSpacing: '0.25em',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  card: {
    background: 'rgba(8, 11, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    boxShadow: '0 0 60px rgba(0,255,136,0.05), 0 24px 64px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    width: '100%',
  },
  cardLeft: {
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardRight: {
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  planLabel: {
    fontSize: 11,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#00ff88',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 500,
  },
  planName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 34,
    fontWeight: 300,
    color: '#f0eef8',
    letterSpacing: '0.04em',
    lineHeight: 1.1,
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
    fontFamily: "'Space Grotesk', sans-serif",
  },
  pricePeriod: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  annualNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: "'Space Grotesk', sans-serif",
    marginTop: -4,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '4px 0',
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
    color: '#8b8897',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  secureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  secureText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  formTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#8b8897',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 500,
  },
  stripeField: {
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    transition: 'border 0.15s, box-shadow 0.15s',
  },
  errorMsg: {
    color: '#ff4d6a',
    fontSize: 13,
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  submitBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#030508',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    letterSpacing: '0.02em',
    marginTop: 4,
  },
  cancelNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: "'Space Grotesk', sans-serif",
    margin: 0,
    textAlign: 'center',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  loadingText: {
    color: '#8b8897',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    margin: 0,
  },
  errorText: {
    color: '#ff4d6a',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    margin: 0,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#00ff88',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
  },
};

export default Checkout;
