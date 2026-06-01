import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import useStore from '../store';
import {
  SlidersHorizontal, User, Shield, CreditCard, BarChart2, Zap,
  Check, X, ArrowDown, Mail, ChevronRight,
} from 'lucide-react';
import { PLANS } from './Credits';

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 };

const SECTIONS = [
  { id: 'geral',       label: 'Geral',        Icon: SlidersHorizontal },
  { id: 'conta',       label: 'Conta',         Icon: User },
  { id: 'privacidade', label: 'Privacidade',   Icon: Shield },
  { id: 'cobranca',    label: 'Cobrança',      Icon: CreditCard },
  { id: 'uso',         label: 'Uso',           Icon: BarChart2 },
  { id: 'capacidades', label: 'Capacidades',   Icon: Zap },
];

function Settings() {
  const { user, credits, posts, advisorHistory } = useStore();
  const { user: clerkUser } = useUser();
  const [activeSection, setActiveSection] = useState('geral');
  const [userName, setUserName] = useState(user.name);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === user.plan) || PLANS[0];
  const downgradePlans = PLANS.filter(
    (p) => PLAN_ORDER[p.id] < PLAN_ORDER[user.plan] && p.id !== 'free'
  );
  const isPaidPlan = user.plan !== 'free';
  const email = clerkUser?.primaryEmailAddress?.emailAddress || '—';
  const creditsPercent = Math.min(100, (credits / 500) * 100);
  const messagesSent = advisorHistory.filter((m) => m.sender === 'user').length;

  const handleSaveName = (e) => {
    e.preventDefault();
    useStore.setState((s) => ({ user: { ...s.user, name: userName } }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="page-container settings-page animate-fade-in">
      <h1 className="settings-page-title">Configurações</h1>

      <div className="settings-layout">
        <nav className="settings-nav">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`settings-nav-item${activeSection === id ? ' active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-content">

          {/* GERAL */}
          {activeSection === 'geral' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Geral</h3>
              <form onSubmit={handleSaveName}>
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="settings-text-input"
                    placeholder="Digite seu nome..."
                  />
                </div>
                <div className="form-actions-footer">
                  {saveSuccess && (
                    <span className="save-success-msg">
                      <Check size={14} style={{ marginRight: 4 }} /> Salvo!
                    </span>
                  )}
                  <button type="submit" className="save-settings-submit-btn">Salvar</button>
                </div>
              </form>
            </div>
          )}

          {/* CONTA */}
          {activeSection === 'conta' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Conta</h3>
              <div className="settings-info-row">
                <Mail size={16} className="settings-info-icon" />
                <div>
                  <span className="settings-info-label">Email</span>
                  <span className="settings-info-value">{email}</span>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Senha</h4>
                  <p className="settings-action-desc">Altere sua senha de acesso</p>
                </div>
                <button className="settings-action-btn">
                  Alterar senha <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* PRIVACIDADE */}
          {activeSection === 'privacidade' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Privacidade</h3>
              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title settings-action-title--danger">Excluir conta</h4>
                  <p className="settings-action-desc">Remove permanentemente sua conta e todos os dados associados.</p>
                </div>
                <button className="plan-cancel-btn">Excluir conta</button>
              </div>
            </div>
          )}

          {/* COBRANÇA */}
          {activeSection === 'cobranca' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Cobrança</h3>

              <div className="settings-billing-plan">
                <div className="settings-plan-left">
                  <div className="settings-plan-icon-wrap">
                    <currentPlan.Icon size={18} />
                  </div>
                  <div>
                    <span className="settings-plan-label">Plano atual</span>
                    <h3 className="settings-plan-name">{currentPlan.name}</h3>
                    <span className="settings-plan-credits">{currentPlan.creditsLabel}</span>
                  </div>
                </div>
                {isPaidPlan && (
                  <button className="settings-change-plan-btn" onClick={() => setShowPlanModal(true)}>
                    Mudar de plano
                  </button>
                )}
              </div>

              <div className="settings-divider" />

              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Método de pagamento</h4>
                  <p className="settings-action-desc">Nenhum método configurado</p>
                </div>
                <button className="settings-action-btn">
                  Adicionar <ChevronRight size={14} />
                </button>
              </div>

              <div className="settings-divider" />

              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Próxima cobrança</h4>
                  <p className="settings-action-desc">—</p>
                </div>
              </div>
            </div>
          )}

          {/* USO */}
          {activeSection === 'uso' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Uso</h3>

              <div className="settings-usage-item">
                <div className="settings-usage-header">
                  <span className="settings-usage-label">Créditos</span>
                  <span className="settings-usage-value">
                    {credits} <span className="settings-usage-max">/ 500</span>
                  </span>
                </div>
                <div className="credits-bar-container">
                  <div className="credits-bar" style={{ width: `${creditsPercent}%` }} />
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-usage-item">
                <div className="settings-usage-header">
                  <span className="settings-usage-label">Posts criados</span>
                  <span className="settings-usage-value">{posts.length}</span>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-usage-item">
                <div className="settings-usage-header">
                  <span className="settings-usage-label">Mensagens enviadas</span>
                  <span className="settings-usage-value">{messagesSent}</span>
                </div>
              </div>
            </div>
          )}

          {/* CAPACIDADES */}
          {activeSection === 'capacidades' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Capacidades</h3>
              <p className="settings-section-sub">O que está incluído no seu plano {currentPlan.name}.</p>
              <ul className="plan-features" style={{ marginTop: 16 }}>
                {currentPlan.features.map((f, i) => (
                  <li key={i} className="plan-feature-item">
                    <Check size={14} className="plan-check-icon" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="plan-modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plan-modal-header">
              <div>
                <h2 className="plan-modal-title">Alterar Plano</h2>
                <p className="plan-modal-desc">
                  {downgradePlans.length > 0
                    ? 'Faça downgrade para um plano menor ou cancele sua assinatura.'
                    : 'Cancele sua assinatura a qualquer momento.'}
                </p>
              </div>
              <button className="plan-modal-close" onClick={() => setShowPlanModal(false)}>
                <X size={18} />
              </button>
            </div>

            {downgradePlans.length > 0 && (
              <div className="plans-grid" style={{ marginBottom: 24 }}>
                {downgradePlans.map((plan) => {
                  const { Icon } = plan;
                  return (
                    <div key={plan.id} className="plan-card glass-card">
                      <div className="plan-icon-wrap"><Icon size={20} /></div>
                      <h3 className="plan-name">{plan.name}</h3>
                      <div className="plan-price-row">
                        <span className="plan-price-value">{plan.price}</span>
                        <span className="plan-price-period">{plan.period}</span>
                      </div>
                      <span className="plan-credits-label">{plan.creditsLabel}</span>
                      <ul className="plan-features">
                        {plan.features.map((f, i) => (
                          <li key={i} className="plan-feature-item">
                            <Check size={13} className="plan-check-icon" />{f}
                          </li>
                        ))}
                      </ul>
                      <button className="plan-cta-btn plan-cta-btn--downgrade">
                        <ArrowDown size={14} /> Fazer downgrade
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="plan-cancel-section">
              <div className="plan-cancel-info">
                <h4>Cancelar assinatura</h4>
                <p>Você perderá acesso ao plano {currentPlan.name} ao fim do ciclo atual.</p>
              </div>
              <button className="plan-cancel-btn">Cancelar assinatura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
