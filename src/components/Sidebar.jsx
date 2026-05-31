import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store';
import {
  Home,
  Sparkles,
  FileText,
  Settings as SettingsIcon,
  Coins,
  Plus,
  ChevronRight,
} from 'lucide-react';

function Sidebar() {
  const { credits, addCredits, agents } = useStore();
  const navigate = useNavigate();

  const handleAddCredits = (e) => {
    e.stopPropagation();
    addCredits(100);
  };

  // Archetype badge colors
  const agentBadges = {
    linage: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', char: 'L' },
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
            to="/posts" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Meus Posts</span>
          </NavLink>
        </nav>

        {/* Agents Group */}
        <nav className="sidebar-group">
          <div className="group-label">Agente</div>
          <div className="agents-list">
            <NavLink
              to="/agent/linage"
              className={({ isActive }) => `sidebar-agent-link ${isActive ? 'active' : ''}`}
            >
              <div
                className="agent-avatar-badge"
                style={{
                  backgroundColor: agentBadges.linage.bg,
                  color: agentBadges.linage.color,
                  border: `1px solid ${agentBadges.linage.border}`
                }}
              >
                L
              </div>
              <div className="agent-link-info">
                <span className="agent-link-name">Linage</span>
                <span className="agent-link-archetype">O Magnético</span>
              </div>
              <ChevronRight className="arrow-icon" size={14} />
            </NavLink>
          </div>
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
          <button 
            className="add-credits-btn" 
            onClick={handleAddCredits}
            title="Recarregar créditos de demonstração"
          >
            <Plus size={14} />
          </button>
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
        <div className="credits-footer">
          Demonstração Ilimitada
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
