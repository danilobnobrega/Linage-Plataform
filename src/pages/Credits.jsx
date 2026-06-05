import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';
import { Check, Zap, Crown, Star, ArrowRight, Coins, Sparkles } from 'lucide-react';

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 };

export const PLANS = [
  {
    id: 'free',
    name: 'Teste Grátis',
    price: 'Grátis',
    period: '',
    creditsLabel: '1.350 créditos únicos',
    Icon: Star,
    features: [],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 197',
    priceAnnual: 'R$ 157,60',
    annualTotal: 'R$ 1.891,20/ano',
    period: '/mês',
    creditsLabel: '4.500 créditos/mês (10 posts)',
    Icon: Zap,
    features: [
      '4.500 créditos mensais (10 posts)',
      'Pesquisa em tempo real',
      'Refinamento ilimitado por post',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 297',
    priceAnnual: 'R$ 237,60',
    annualTotal: 'R$ 2.851,20/ano',
    period: '/mês',
    creditsLabel: '9.000 créditos/mês (20 posts)',
    Icon: Crown,
    highlight: true,
    features: [
      '9.000 créditos mensais (20 posts)',
      'Pesquisa em tempo real',
      'Refinamento ilimitado por post',
      'Suporte prioritário',
      'Acesso antecipado a novos recursos',
    ],
  },
];

const CREDIT_PACKS = [
  { amount: 900,  price: 'R$ 59',  unitAmount: 5900 },
  { amount: 1800, price: 'R$ 99',  unitAmount: 9900 },
  { amount: 3600, price: 'R$ 179', unitAmount: 17900 },
];

function Credits() {
  const { user, credits } = useStore();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(null);
  const [billing, setBilling] = useState('monthly');

  const currentPlanOrder = PLAN_ORDER[user.plan] ?? 0;
  const paidPlans = PLANS.filter(p => p.id !== 'free');

  const handleUpgrade = async (planId) => {
    setLoading(planId);
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId, billing }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyPack = async (amount, unitAmount) => {
    setLoading(`pack-${amount}`);
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/credits-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, unitAmount }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="page-container credits-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <Coins size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Planos & Créditos</span>
          <h1 className="header-title">Recarregar Conta</h1>
          <p className="header-desc">
            Você tem <strong style={{ color: 'var(--accent)' }}>{credits} créditos</strong> disponíveis.
            Faça upgrade do plano ou compre créditos avulsos.
          </p>
        </div>
      </header>

      <section className="credits-section">
        <div className="credits-section-header">
          <h2 className="credits-section-title">Upgrade de Plano</h2>
          {upgradePlans.some(p => p.priceAnnual) && (
            <div className="billing-toggle">
              <button
                className={`billing-toggle-btn${billing === 'monthly' ? ' active' : ''}`}
                onClick={() => setBilling('monthly')}
              >
                Mensal
              </button>
              <button
                className={`billing-toggle-btn${billing === 'annual' ? ' active' : ''}`}
                onClick={() => setBilling('annual')}
              >
                Anual <span className="billing-discount">-20%</span>
              </button>
            </div>
          )}
        </div>

        <div className="plans-grid">
          {paidPlans.map((plan) => {
            const { Icon } = plan;
            const isCurrent = plan.id === user.plan;
            const isUpgrade = PLAN_ORDER[plan.id] > currentPlanOrder;
            const displayPrice = billing === 'annual' && plan.priceAnnual ? plan.priceAnnual : plan.price;
            return (
              <div
                key={plan.id}
                className={`plan-card glass-card${plan.highlight ? ' plan-card--highlight' : ''}`}
              >
                {plan.highlight && <div className="plan-badge">Mais popular</div>}
                <div className="plan-icon-wrap">
                  <Icon size={20} />
                </div>
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price-row">
                  <span className="plan-price-value">{displayPrice}</span>
                  <span className="plan-price-period">{plan.period}</span>
                </div>
                {billing === 'annual' && plan.annualTotal && (
                  <span className="plan-annual-total">{plan.annualTotal}</span>
                )}
                <span className="plan-credits-label">{plan.creditsLabel}</span>
                <ul className="plan-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="plan-feature-item">
                      <Check size={13} className="plan-check-icon" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="plan-current-label">Plano atual — gerencie em Configurações → Cobrança</div>
                ) : isUpgrade ? (
                  <button
                    className="plan-cta-btn"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? 'Aguarde...' : <><span>Fazer upgrade</span> <ArrowRight size={14} /></>}
                  </button>
                ) : (
                  <div className="plan-current-label">Para fazer downgrade, acesse Configurações → Cobrança</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="credits-section">
        <h2 className="credits-section-title">Créditos Avulsos</h2>
        <p className="credits-section-desc">
          Sem troca de plano. Os créditos avulsos acumulam e nunca expiram — ao contrário dos créditos do plano, que no início de cada ciclo voltam ao limite do seu plano.
        </p>
        <div className="packs-grid">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.amount}
              className={`pack-card glass-card${pack.popular ? ' pack-card--popular' : ''}`}
            >
              {pack.popular && <div className="pack-badge">Melhor valor</div>}
              <div className="pack-amount-row">
                <span className="pack-number">{pack.amount.toLocaleString('pt-BR')}</span>
                <span className="pack-unit">créditos</span>
              </div>
              <div className="pack-price">{pack.price}</div>
              <button
                className="pack-buy-btn"
                onClick={() => handleBuyPack(pack.amount, pack.unitAmount)}
                disabled={loading === `pack-${pack.amount}`}
              >
                {loading === `pack-${pack.amount}` ? 'Aguarde...' : <><span>Comprar</span> <ArrowRight size={14} /></>}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Credits;
