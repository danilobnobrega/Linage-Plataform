import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store';
import {
  Home,
  Sparkles,
  FileText,
  Settings as SettingsIcon,
  Coins,
} from 'lucide-react';

function Sidebar() {
  const { credits, addCredits } = useStore();
  const navigate = useNavigate();

  const handleAddCredits = (e) => {
    e.stopPropagation();
    addCredits(100);
  };

  return (
    <aside className="sidebar">
      {/* Logo Header */}
      <div className="sidebar-logo-container" onClick={() => navigate('/home')}>
        <div className="logo-glow"></div>
        <div className="logo-icon-wrapper">
          <Sparkles className="logo-sparkle" size={22} />
        </div>
        <span className="logo-text">LINAGE</span>
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-nav-scroll">
        <nav className="sidebar-group">
          <div className="group-label">Navegação</div>
          <NavLink
            to="/home"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/advisor"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Sparkles size={18} className="advisor-spark" />
            <span>Falar com Linage</span>
          </NavLink>

          <NavLink
            to="/posts"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Meus Posts</span>
          </NavLink>
        </nav>

        {/* Utility Group */}
        <nav className="sidebar-group">
          <div className="group-label">Sistema</div>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <SettingsIcon size={18} />
            <span>Configurações</span>
          </NavLink>

        </nav>
      </div>

      {/* Credit Balance Card */}
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
          ></div>
        </div>
        <button className="credits-recharge-link" onClick={handleAddCredits}>
          + Recarregar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
