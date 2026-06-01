import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
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
  ChevronUp,
} from 'lucide-react';

function Sidebar() {
  const { user, credits } = useStore();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const getInitials = (name) => {
    const clean = name.replace(/,.*$/, '').trim();
    return clean.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  };

  const firstName = user.name.replace(/,.*$/, '').trim().split(' ')[0];
  const isProPlan = user.plan === 'pro';

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
          <Sparkles className="logo-sparkle" size={22} />
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
          <NavLink to="/advisor" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
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
          <div className="credits-amount">
            {credits} <span className="credits-unit">créditos</span>
          </div>
          <div className="credits-bar-container">
            <div
              className="credits-bar"
              style={{ width: `${Math.min(100, (credits / 500) * 100)}%` }}
            />
          </div>
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
              <button className="user-dropdown-item">
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
              <button className="user-dropdown-item">
                <ExternalLink size={14} /><span>Saiba mais</span>
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
            <div className="user-avatar-hex">{getInitials(user.name)}</div>
            <span className="sidebar-user-name">{firstName}</span>
            <ChevronUp
              size={14}
              className={`sidebar-user-chevron${showUserMenu ? ' open' : ''}`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
