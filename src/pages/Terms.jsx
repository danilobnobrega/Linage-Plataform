import React from 'react';
import { FileText, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Terms() {
  const navigate = useNavigate();
  return (
    <div className="page-container terms-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <FileText size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Legal</span>
          <h1 className="header-title">Termos & Privacidade</h1>
          <p className="header-desc">Documentos que regem o uso da plataforma Linage.</p>
        </div>
      </header>

      <div className="terms-cards">
        <button className="terms-card glass-card" onClick={() => navigate('/terms/uso')}>
          <div className="terms-card-icon">
            <FileText size={22} />
          </div>
          <div className="terms-card-text">
            <h3 className="terms-card-title">Política de Uso</h3>
            <p className="terms-card-desc">Regras e condições para uso da plataforma Linage.</p>
          </div>
          <ChevronRight size={16} className="terms-card-chevron" />
        </button>

        <button className="terms-card glass-card" onClick={() => navigate('/terms/privacidade')}>
          <div className="terms-card-icon">
            <Shield size={22} />
          </div>
          <div className="terms-card-text">
            <h3 className="terms-card-title">Política de Privacidade</h3>
            <p className="terms-card-desc">Como coletamos, usamos e protegemos seus dados.</p>
          </div>
          <ChevronRight size={16} className="terms-card-chevron" />
        </button>
      </div>
    </div>
  );
}

export default Terms;
