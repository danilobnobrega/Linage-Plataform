import React, { useState } from 'react';
import useStore from '../store';
import {
  Settings as SettingsIcon,
  User,
  Check,
  X,
  ArrowDown,
} from 'lucide-react';
import { PLANS } from './Credits';

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 };

function Settings() {
  const { user } = useStore();
  const [userName, setUserName] = useState(user.name);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === user.plan) || PLANS[0];
  const downgradePlans = PLANS.filter(
    (p) => PLAN_ORDER[p.id] < PLAN_ORDER[user.plan] && p.id !== 'free'
  );
  const isPaidPlan = user.plan !== 'free';

  const handleSaveSettings = (e) => {
    e.preventDefault();
    useStore.setState((s) => ({
      user: { ...s.user, name: userName }
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="page-container settings-page animate-fade-in">
      <header className="page-header">
        <div className="header-icon-wrapper settings-glow">
          <SettingsIcon className="settings-star-icon" size={24} />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Configurações</span>
          <h1 className="header-title">Configurações</h1>
          <p className="header-desc">Gerencie seu perfil, plano e preferências da plataforma.</p>
        </div>
      </header>

      {/* Meu Plano Card */}
      <div className="settings-plan-card glass-card">
        <div className="settings-plan-left">
          <div className="settings-plan-icon-wrap">
            <currentPlan.Icon size={18} />
          </div>
          <div>
            <span className="settings-plan-label">Meu Plano</span>
            <h3 className="settings-plan-name">{currentPlan.name}</h3>
            <span className="settings-plan-credits">{currentPlan.creditsLabel}</span>
          </div>
        </div>
        {isPaidPlan && (
          <button
            className="settings-change-plan-btn"
            onClick={() => setShowPlanModal(true)}
          >
            Mudar de plano
          </button>
        )}
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
              <button className="plan-cancel-btn">
                Cancelar assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Form */}
        <form onSubmit={handleSaveSettings} className="settings-form-card glass-card">
          <h3 className="settings-section-title">
            <User size={18} style={{ marginRight: 8, color: 'var(--accent)' }} />
            Perfil
          </h3>

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
                <Check size={14} style={{ marginRight: 4 }} /> Salvo com sucesso!
              </span>
            )}
            <button type="submit" className="save-settings-submit-btn">
              Salvar Alterações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default Settings;
