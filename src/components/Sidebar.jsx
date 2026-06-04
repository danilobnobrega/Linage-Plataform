import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import useStore from '../store';
import {
  Home,
  Sparkles,
  FileText,
  Coins,
  Settings,
  HelpCircle,
  Zap,
  ExternalLink,
  LogOut,
} from 'lucide-react';

function Sidebar() {
  const { user, credits, avulsoCredits } = useStore();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const getInitials = (name) => {
    const clean = name.replace(/,.*$/, '').trim();
    return clean.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  };

  const firstName = user.name.replace(/,.*$/, '').trim().split(' ')[0];
  const isProPlan = user.plan === 'pro';
  const PLAN_CREDITS = { free: 1350, starter: 4500, pro: 9000 };
  const planMax = PLAN_CREDITS[user.plan] || 1350;
  const planCreditsRemaining = Math.max(0, credits - avulsoCredits);
  const hasPlanCredits = planCreditsRemaining > 0;
  const hasAvulso = avulsoCredits > 0;

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo-container" onClick={() => navigate('/home')}>
        <div className="logo-glow"></div>
        <div className="logo-icon-wrapper">
          <svg width="22" height="21" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
          </svg>
        </div>
        <span className="logo-text">LINAGE</span>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav-scroll">
        <nav className="sidebar-group">
          <div className="group-label">Navegação</div>
          <NavLink to="/home" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={18} className="advisor-spark" />
            <span>Falar com Linage</span>
          </NavLink>
          <NavLink to="/posts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            <span>Meus Posts</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom: credits card + user section */}
      <div className="sidebar-bottom">
        <div className="credits-card">
          <div className="credits-card-bg"></div>
          <div className="credits-header">
            <div className="credits-title-wrapper">
              <Coins size={16} className="credits-icon" />
              <span className="credits-title">Saldo de Créditos</span>
            </div>
          </div>
          {hasPlanCredits && (
            <div className="credits-amount">
              {planCreditsRemaining.toLocaleString('pt-BR')}
              <span className="credits-unit"> / {planMax.toLocaleString('pt-BR')} cr</span>
            </div>
          )}
          {hasAvulso && (
            <div className={`credits-avulso${hasPlanCredits ? ' credits-avulso--below' : ''}`}>
              {avulsoCredits.toLocaleString('pt-BR')}
              <span className="credits-unit"> cr avulsos</span>
            </div>
          )}
          {hasPlanCredits && (
            <div className="credits-bar-container">
              <div
                className="credits-bar"
                style={{ width: `${Math.min(100, (planCreditsRemaining / planMax) * 100)}%` }}
              />
            </div>
          )}
          <button className="credits-recharge-link" onClick={() => navigate('/credits')}>
            + Recarregar
          </button>
        </div>

        {/* User avatar + dropdown */}
        <div className="sidebar-user-section" ref={userMenuRef}>
          {showUserMenu && (
            <div className="user-dropdown">
              <button
                className="user-dropdown-item"
                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
              >
                <Settings size={14} /><span>Configurações</span>
              </button>
              <button
                className="user-dropdown-item"
                onClick={() => { navigate('/help'); setShowUserMenu(false); }}
              >
                <HelpCircle size={14} /><span>Receber ajuda</span>
              </button>
              {!isProPlan && (
                <button
                  className="user-dropdown-item user-dropdown-item--accent"
                  onClick={() => { navigate('/credits'); setShowUserMenu(false); }}
                >
                  <Zap size={14} /><span>Fazer upgrade</span>
                </button>
              )}
              <button
                className="user-dropdown-item"
                onClick={() => { navigate('/terms'); setShowUserMenu(false); }}
              >
                <ExternalLink size={14} /><span>Termos & Privacidade</span>
              </button>
              <div className="user-dropdown-divider" />
              <button
                className="user-dropdown-item user-dropdown-item--danger"
                onClick={() => signOut()}
              >
                <LogOut size={14} /><span>Sair</span>
              </button>
            </div>
          )}

          <button
            className="sidebar-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-hex">
              {clerkUser?.imageUrl
                ? <img src={clerkUser.imageUrl} alt="" className="user-avatar-hex-img" />
                : getInitials(user.name)
              }
            </div>
            <span className="sidebar-user-name">{firstName}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
