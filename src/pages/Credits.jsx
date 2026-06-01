import React from 'react';
import useStore from '../store';
import { Check, Zap, Crown, Star, ArrowRight, Coins } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    creditsLabel: '50 créditos/mês',
    Icon: Star,
    features: [
      '50 créditos mensais',
      'Acesso ao Linage',
      '5 posts salvos',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    creditsLabel: '300 créditos/mês',
    Icon: Zap,
    features: [
      '300 créditos mensais',
      'Acesso ao Linage',
      'Posts ilimitados',
      'Suporte prioritário',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 197',
    period: '/mês',
    creditsLabel: '1.000 créditos/mês',
    Icon: Crown,
    highlight: true,
    features: [
      '1.000 créditos mensais',
      'Acesso ao Linage',
      'Posts ilimitados',
      'Suporte VIP',
      'Acesso antecipado a novos recursos',
    ],
  },
];

const CREDIT_PACKS = [
  { amount: 100, price: 'R$ 19', perUnit: 'R$ 0,19 por crédito' },
  { amount: 500, price: 'R$ 79', perUnit: 'R$ 0,15 por crédito', popular: true },
  { amount: 1000, price: 'R$ 139', perUnit: 'R$ 0,13 por crédito' },
];

function Credits() {
  const { user, credits } = useStore();

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
        <h2 className="credits-section-title">Planos</h2>
        <div className="plans-grid">
          {PLANS.map((plan) => {
            const isCurrent = user.plan === plan.id;
            const { Icon } = plan;
            return (
              <div
                key={plan.id}
                className={`plan-card glass-card${plan.highlight ? ' plan-card--highlight' : ''}${isCurrent ? ' plan-card--current' : ''}`}
              >
                {plan.highlight && (
                  <div className="plan-badge">Mais popular</div>
                )}
                {isCurrent && !plan.highlight && (
                  <div className="plan-badge plan-badge--current">Plano atual</div>
                )}
                <div className="plan-icon-wrap">
                  <Icon size={20} />
                </div>
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price-row">
                  <span className="plan-price-value">{plan.price}</span>
                  <span className="plan-price-period">{plan.period}</span>
                </div>
                <span className="plan-credits-label">{plan.creditsLabel}</span>
                <ul className="plan-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="plan-feature-item">
                      <Check size={13} className="plan-check-icon" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`plan-cta-btn${isCurrent ? ' plan-cta-btn--current' : ''}`}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Plano atual' : 'Fazer upgrade'}
                  {!isCurrent && <ArrowRight size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="credits-section">
        <h2 className="credits-section-title">Créditos Avulsos</h2>
        <p className="credits-section-desc">
          Sem troca de plano. Os créditos são adicionados diretamente ao seu saldo.
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
              <div className="pack-per-unit">{pack.perUnit}</div>
              <button className="pack-buy-btn">
                Comprar <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Credits;
