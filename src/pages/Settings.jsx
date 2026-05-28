import React, { useState } from 'react';
import useStore from '../store';
import { 
  Settings as SettingsIcon, 
  User, 
  Sparkles, 
  Trash2, 
  Plus, 
  RotateCcw, 
  Check, 
  Moon, 
  Sun
} from 'lucide-react';

function Settings() {
  const { user, theme, setTheme, credits, addCredits } = useStore();
  const [userName, setUserName] = useState(user.name);
  const [dailyQuote, setDailyQuote] = useState(user.dailyQuote);
  
  // Custom states for local edit suggestions
  const [suggestions, setSuggestions] = useState([...user.suggestions]);
  const [newSuggestionText, setNewSuggestionText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    // Update Zustand state
    useStore.setState(s => ({
      user: {
        name: userName,
        dailyQuote: dailyQuote,
        suggestions: suggestions
      }
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddSuggestion = () => {
    if (!newSuggestionText.trim()) return;
    setSuggestions([...suggestions, newSuggestionText.trim()]);
    setNewSuggestionText('');
  };

  const handleRemoveSuggestion = (index) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleResetState = () => {
    if (confirm("Deseja redefinir todo o sistema? Isso limpará todas as conversas, posts e resetará o saldo de créditos.")) {
      // Clear localStorage
      localStorage.removeItem('linage-store');
      // Reload page to reinitialize store
      window.location.reload();
    }
  };

  return (
    <div className="page-container settings-page animate-fade-in">
      <header className="page-header">
        <div className="header-icon-wrapper settings-glow">
          <SettingsIcon className="settings-star-icon" size={24} />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Configurações Locais</span>
          <h1 className="header-title">Configurações</h1>
          <p className="header-desc">Personalize sua experiência Linage. Altere as sugestões de pauta diária, edite a frase do dia e redefina os créditos.</p>
        </div>
      </header>

      <div className="settings-grid">
        {/* Main Settings Form */}
        <form onSubmit={handleSaveSettings} className="settings-form-card glass-card">
          <h3 className="settings-section-title">
            <User size={18} style={{marginRight: 8, color: 'var(--accent)'}} />
            Perfil & Tese
          </h3>
          
          <div className="form-group">
            <label className="form-label">Nome do Usuário</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="settings-text-input"
              placeholder="Digite seu nome..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Frase do Dia (Diretriz do Linage)</label>
            <textarea 
              value={dailyQuote} 
              onChange={(e) => setDailyQuote(e.target.value)}
              className="settings-textarea-input"
              placeholder="Frase inspiradora do Linage na página Home..."
            />
          </div>

          <div className="divider"></div>

          <h3 className="settings-section-title">
            <Sparkles size={18} style={{marginRight: 8, color: 'var(--accent)'}} />
            Sugestões de Pauta (Home)
          </h3>
          <p className="settings-section-desc">
            Estas pautas aparecem na sua página Home. Ao clicar nelas, você poderá iniciar chats com agentes direcionados.
          </p>

          <div className="settings-suggestions-edit-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-edit-row">
                <span className="suggestion-number">0{index + 1}</span>
                <span className="suggestion-edit-text">{suggestion}</span>
                <button 
                  type="button" 
                  className="remove-suggestion-btn"
                  onClick={() => handleRemoveSuggestion(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="add-suggestion-control-row">
            <input 
              type="text" 
              placeholder="Adicionar nova pauta de demonstração..."
              value={newSuggestionText}
              onChange={(e) => setNewSuggestionText(e.target.value)}
              className="add-suggestion-text-input"
            />
            <button 
              type="button" 
              className="add-suggestion-btn"
              onClick={handleAddSuggestion}
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="form-actions-footer">
            {saveSuccess && (
              <span className="save-success-msg">
                <Check size={14} style={{marginRight: 4}} /> Salvo com sucesso!
              </span>
            )}
            <button type="submit" className="save-settings-submit-btn">
              Salvar Alterações
            </button>
          </div>
        </form>

        {/* System controls card */}
        <div className="settings-system-card glass-card">
          <h3 className="settings-section-title">Controle do Sistema</h3>
          <p className="settings-section-desc">Ajustes globais do ambiente de demonstração local.</p>

          <div className="system-setting-row">
            <div>
              <h4>Esquema de Cores</h4>
              <p>Alternar entre aparência escura e clara</p>
            </div>
            <button 
              type="button" 
              className="system-action-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>
          </div>

          <div className="system-setting-row">
            <div>
              <h4>Créditos</h4>
              <p>Adicionar +100 créditos para testes de geração de posts</p>
            </div>
            <button 
              type="button" 
              className="system-action-btn accent"
              onClick={() => addCredits(100)}
            >
              <Plus size={16} />
              <span>Recarregar +100cr</span>
            </button>
          </div>

          <div className="divider"></div>

          <div className="system-setting-row danger">
            <div>
              <h4>Resetar Aplicação</h4>
              <p>Redefine o banco de dados local para o estado original</p>
            </div>
            <button 
              type="button" 
              className="system-action-btn danger"
              onClick={handleResetState}
            >
              <RotateCcw size={16} />
              <span>Resetar Tudo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
