import React from 'react';
import { FileText, Shield } from 'lucide-react';

function Terms() {
  return (
    <div className="page-container terms-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <FileText size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Legal</span>
          <h1 className="header-title">Termos e Privacidade</h1>
          <p className="header-desc">
            Documentos que regem o uso da plataforma Linage.
          </p>
        </div>
      </header>

      <div className="terms-cards">
        <a href="#" className="terms-card glass-card">
          <div className="terms-card-icon">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="terms-card-title">Termos de Uso</h3>
            <p className="terms-card-desc">Regras e condições para uso da plataforma Linage.</p>
          </div>
        </a>

        <a href="#" className="terms-card glass-card">
          <div className="terms-card-icon">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="terms-card-title">Política de Privacidade</h3>
            <p className="terms-card-desc">Como coletamos, usamos e protegemos seus dados.</p>
          </div>
        </a>
      </div>
    </div>
  );
}

export default Terms;
