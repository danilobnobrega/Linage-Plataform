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
  Lock
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
    ashe:   { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', char: 'A' },
    jace:   { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', char: 'J' },
    aiden:  { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', char: 'N' },
    venn:   { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)', char: 'V' },
    dexter: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', char: 'D' },
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

        {/* Agents Group */}
        <nav className="sidebar-group">
          <div className="group-label">Os 5 Agentes</div>
          <div className="agents-list">
            {agents.map((agent) => {
              const badge = agentBadges[agent.id] || { bg: '#888', color: '#fff', char: 'A' };
              const locked = agent.id !== 'dexter';
              if (locked) {
                return (
                  <div key={agent.id} className="sidebar-agent-link sidebar-agent-locked">
                    <div
                      className="agent-avatar-badge"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}
                    >
                      {badge.char}
                    </div>
                    <div className="agent-link-info">
                      <span className="agent-link-name">{agent.name}</span>
                      <span className="agent-link-archetype">Em breve</span>
                    </div>
                    <Lock size={12} className="lock-icon" />
                  </div>
                );
              }
              return (
                <NavLink
                  key={agent.id}
                  to={`/agent/${agent.id}`}
                  className={({ isActive }) => `sidebar-agent-link ${isActive ? 'active' : ''}`}
                >
                  <div
                    className="agent-avatar-badge"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}
                  >
                    {badge.char}
                  </div>
                  <div className="agent-link-info">
                    <span className="agent-link-name">{agent.name}</span>
                    <span className="agent-link-archetype">O Magnético</span>
                  </div>
                  <ChevronRight className="arrow-icon" size={14} />
                </NavLink>
              );
            })}
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
