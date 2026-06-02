import React, { useState, useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import useStore from '../store';
import { useDecryptPlaceholder } from '../hooks/useDecryptPlaceholder';
import {
  User, Shield, CreditCard, BarChart2,
  Check, X, ArrowDown, Mail, ChevronRight, Camera, Bell,
} from 'lucide-react';
import { PLANS } from './Credits';

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 };
const PLAN_CREDITS = { free: 2000, starter: 15000, pro: 40000 };

const SECTIONS = [
  { id: 'conta',       label: 'Conta',       Icon: User },
  { id: 'privacidade', label: 'Privacidade', Icon: Shield },
  { id: 'cobranca',    label: 'Cobrança',    Icon: CreditCard },
  { id: 'uso',         label: 'Uso',         Icon: BarChart2 },
];

function Settings() {
  const { user, credits, posts, advisorHistory, notifications, privacy } = useStore();
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [activeSection, setActiveSection] = useState('conta');
  const [userName, setUserName] = useState(user.name);
  const [nickname, setNickname] = useState(user.nickname || '');
  const [instructions, setInstructions] = useState(user.instructions || '');
  const [saveSuccess, setSaveSuccess] = useState(null); // field name that was saved
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [notifSuggestions, setNotifSuggestions] = useState(notifications?.suggestions ?? true);
  const [notifResponse, setNotifResponse] = useState(notifications?.responseComplete ?? false);
  const [memoryEnabled, setMemoryEnabled] = useState(privacy?.memoryEnabled ?? true);
  const [improveProduct, setImproveProduct] = useState(privacy?.improveProduct ?? true);
  const [expandProtect, setExpandProtect] = useState(false);
  const [expandUse, setExpandUse] = useState(false);
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    if (activeSection !== 'cobranca' || invoices !== null) return;
    const fetchInvoices = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/stripe/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setInvoices(await res.json());
        else setInvoices([]);
      } catch { setInvoices([]); }
    };
    fetchInvoices();
  }, [activeSection]);

  const INSTRUCTION_PHRASES = [
    'ex.: Evito conteúdo sensacionalista...',
    'ex.: Prefiro tom técnico mas acessível...',
    'ex.: Foco em clientes de alta renda...',
    'ex.: Não uso jargão sem explicar...',
    'ex.: Gosto de terminar posts com uma pergunta...',
  ];
  const { ref: instructionsRef, onFocus: instructionsFocus, onBlur: instructionsBlur } = useDecryptPlaceholder(INSTRUCTION_PHRASES);

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza? Todos os seus posts e dados serão apagados permanentemente. Esta ação é irreversível.')) return;
    if (!confirm('Confirme novamente: sua conta será excluída agora.')) return;
    try {
      const token = await getToken();
      await fetch('/api/user', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await signOut();
    } catch {
      alert('Erro ao excluir conta. Entre em contato com suporte@linage.app.');
    }
  };

  const handleExportData = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linage-posts-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar dados.');
    }
  };

  const handleOpenPortal = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Nenhuma assinatura ativa encontrada.');
    } catch {
      alert('Erro ao abrir portal de cobrança.');
    }
  };

  const currentPlan = PLANS.find((p) => p.id === user.plan) || PLANS[0];
  const downgradePlans = PLANS.filter(
    (p) => PLAN_ORDER[p.id] < PLAN_ORDER[user.plan] && p.id !== 'free'
  );
  const isPaidPlan = user.plan !== 'free';
  const email = clerkUser?.primaryEmailAddress?.emailAddress || '—';

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser) return;
    await clerkUser.setProfileImage({ file });
  };

  const planMax = PLAN_CREDITS[user.plan] || 2000;
  const creditsPercent = Math.min(100, (credits / planMax) * 100);
  const messagesSent = advisorHistory.filter((m) => m.sender === 'user').length;

  const saveField = async (field, value) => {
    useStore.setState((s) => ({ user: { ...s.user, [field]: value } }));
    setSaveSuccess(field);
    setTimeout(() => setSaveSuccess(null), 2000);

    if (field === 'nickname' || field === 'instructions') {
      const store = useStore.getState();
      const token = await getToken();
      fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nickname: field === 'nickname' ? value : (store.user.nickname || ''),
          instructions: field === 'instructions' ? value : (store.user.instructions || ''),
        }),
      });
    }
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

          {/* CONTA */}
          {activeSection === 'conta' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Conta</h3>
              <div>

                {/* Avatar */}
                <div className="settings-photo-row">
                  <div className="settings-photo-wrap">
                    {clerkUser?.imageUrl
                      ? <img src={clerkUser.imageUrl} alt="Foto de perfil" className="settings-photo-img" />
                      : <div className="settings-photo-placeholder"><User size={24} /></div>
                    }
                    <label className="settings-photo-overlay" title="Alterar foto">
                      <Camera size={14} />
                      <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <div>
                    <h4 className="settings-action-title">Foto de perfil</h4>
                    <p className="settings-action-desc">Sincronizada pelo LinkedIn. Clique na foto para substituir.</p>
                  </div>
                </div>

                <div className="settings-divider" />

                {/* Email */}
                <div className="settings-info-row">
                  <Mail size={16} className="settings-info-icon" />
                  <div>
                    <span className="settings-info-label">Email</span>
                    <span className="settings-info-value">{email}</span>
                  </div>
                </div>

                <div className="settings-divider" />

                {/* Nome completo */}
                <div className="form-group">
                  <label className="form-label">Nome completo</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onBlur={() => saveField('name', userName)}
                    className="settings-text-input"
                  />
                </div>

                {/* Apelido */}
                <div className="form-group">
                  <label className="form-label">Como o Linage deveria te chamar?</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onBlur={() => saveField('nickname', nickname)}
                    className="settings-text-input"
                  />
                </div>

                <div className="settings-divider" />

                {/* Instruções */}
                <div className="form-group">
                  <label className="form-label">Instruções para o Linage</label>
                  <p className="settings-action-desc" style={{ marginBottom: 8 }}>
                    O Linage terá isso em mente ao criar conteúdo para você.
                  </p>
                  <textarea
                    ref={instructionsRef}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    onFocus={instructionsFocus}
                    onBlur={(e) => { instructionsBlur(e); saveField('instructions', instructions); }}
                    className="settings-text-input"
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="settings-divider" />

                {/* Notificações */}
                <h4 className="settings-section-subheading">Notificações</h4>

                <div className="settings-action-row">
                  <div>
                    <h4 className="settings-action-title">Sugestões do dia</h4>
                    <p className="settings-action-desc">Receba uma notificação push com suas sugestões de pauta diárias.</p>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={notifSuggestions}
                      onChange={(e) => {
                        setNotifSuggestions(e.target.checked);
                        useStore.setState((s) => ({ notifications: { ...s.notifications, suggestions: e.target.checked } }));
                      }}
                    />
                    <span className="settings-toggle-slider" />
                  </label>
                </div>

                <div className="settings-divider" />

                <div className="settings-action-row">
                  <div>
                    <h4 className="settings-action-title">Conclusão de resposta</h4>
                    <p className="settings-action-desc">Receba uma notificação push quando o Linage terminar de gerar seu conteúdo.</p>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={notifResponse}
                      onChange={(e) => {
                        setNotifResponse(e.target.checked);
                        useStore.setState((s) => ({ notifications: { ...s.notifications, responseComplete: e.target.checked } }));
                      }}
                    />
                    <span className="settings-toggle-slider" />
                  </label>
                </div>

                <div className="settings-divider" />

                <div className="settings-action-row">
                  <div>
                    <h4 className="settings-action-title settings-action-title--danger">Excluir conta</h4>
                    <p className="settings-action-desc">Remove permanentemente sua conta e todos os dados associados.</p>
                  </div>
                  <button className="plan-cancel-btn" onClick={handleDeleteAccount}>Excluir conta</button>
                </div>

                {saveSuccess && (
                  <span className="save-success-msg" style={{ marginTop: 12, display: 'inline-flex' }}>
                    <Check size={14} style={{ marginRight: 4 }} /> Salvo!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* PRIVACIDADE */}
          {activeSection === 'privacidade' && (
            <div className="settings-section-card glass-card">
              <h3 className="settings-section-heading">Privacidade</h3>
              <p className="settings-action-desc" style={{ marginBottom: 20 }}>
                O Linage acredita em práticas transparentes de dados. Saiba como suas informações são protegidas e visite nossa{' '}
                <button className="settings-privacy-link settings-privacy-link--inline">Política de Privacidade</button>
                {' '}para mais detalhes.
              </p>

              <div className="settings-privacy-links">
                <button className="settings-privacy-link" onClick={() => setExpandProtect(!expandProtect)}>
                  Como protegemos seus dados
                  <ChevronRight size={14} style={{ transform: expandProtect ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </button>
                {expandProtect && (
                  <div className="settings-privacy-expand">
                    <p>Você tem controle sobre seus dados e pode alterar suas preferências a qualquer momento em Configurações → Privacidade.</p>
                    <p>O Linage exclui seus dados quando solicitado, exceto em casos de violações de segurança ou conversas compartilhadas via feedback.</p>
                    <p>O Linage não vende seus dados para terceiros.</p>
                  </div>
                )}

                <button className="settings-privacy-link" onClick={() => setExpandUse(!expandUse)}>
                  Como usamos seus dados
                  <ChevronRight size={14} style={{ transform: expandUse ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </button>
                {expandUse && (
                  <div className="settings-privacy-expand">
                    <p>Com sua permissão, usaremos suas conversas para treinar e melhorar o Linage — tornando o produto mais útil e preciso para todos.</p>
                    <p>O Linage pode usar seu e-mail para verificação de conta, cobrança e comunicações sobre novos recursos.</p>
                    <p>O Linage pode conduzir análises agregadas e anonimizadas para entender como as pessoas usam o produto.</p>
                  </div>
                )}
              </div>

              <div className="settings-divider" />

              <h4 className="settings-section-subheading">Preferências</h4>

              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Memória ativa</h4>
                  <p className="settings-action-desc">O Linage lembra o contexto das sessões anteriores para personalizar cada nova conversa.</p>
                </div>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={memoryEnabled}
                    onChange={(e) => {
                      setMemoryEnabled(e.target.checked);
                      useStore.setState((s) => ({ privacy: { ...s.privacy, memoryEnabled: e.target.checked } }));
                    }}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>

              <div className="settings-divider" />

              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Ajudar a melhorar o Linage</h4>
                  <p className="settings-action-desc">Permite o uso das suas conversas para treinar e melhorar o produto. Seus dados nunca são compartilhados com terceiros.</p>
                </div>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={improveProduct}
                    onChange={(e) => {
                      setImproveProduct(e.target.checked);
                      useStore.setState((s) => ({ privacy: { ...s.privacy, improveProduct: e.target.checked } }));
                    }}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>

              <div className="settings-divider" />

              <h4 className="settings-section-subheading">Seus dados</h4>

              <div className="settings-action-row">
                <div>
                  <h4 className="settings-action-title">Exportar dados</h4>
                  <p className="settings-action-desc">Baixe uma cópia de todos os seus posts e conversas.</p>
                </div>
                <button className="settings-action-btn" onClick={handleExportData}>
                  Exportar <ChevronRight size={14} />
                </button>
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
                <button className="settings-action-btn" onClick={handleOpenPortal}>
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

              <div className="settings-divider" />

              <h4 className="settings-section-subheading">Faturas</h4>

              {invoices === null && (
                <p className="settings-action-desc">Carregando...</p>
              )}
              {invoices?.length === 0 && (
                <div className="settings-invoices-empty">
                  <p>Nenhuma fatura disponível.</p>
                </div>
              )}
              {invoices?.length > 0 && (
                <div className="settings-invoices-list">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="settings-invoice-row">
                      <span className="settings-invoice-date">{inv.date}</span>
                      <span className="settings-invoice-amount">{inv.amount}</span>
                      <span className={`settings-invoice-status settings-invoice-status--${inv.status}`}>
                        {inv.status === 'paid' ? 'Pago' : inv.status}
                      </span>
                      {inv.pdf && (
                        <a href={inv.pdf} target="_blank" rel="noreferrer" className="settings-invoice-download">
                          PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    {credits.toLocaleString('pt-BR')} <span className="settings-usage-max">/ {planMax.toLocaleString('pt-BR')}</span>
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
                      <button className="plan-cta-btn plan-cta-btn--downgrade" onClick={handleOpenPortal}>
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
              <button className="plan-cancel-btn" onClick={handleOpenPortal}>Cancelar assinatura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
