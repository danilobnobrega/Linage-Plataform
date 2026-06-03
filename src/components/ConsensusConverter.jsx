import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';

const EXAMPLE = {
  consensus: 'A renda fixa está pagando 12% ao ano sem risco, então investir em renda variável agora é loucura.',
  outlier: '12% sem risco é o prêmio pelo privilégio de não pensar. Quando o ciclo virar — e ele sempre vira — quem ficou confortável na renda fixa vai entender que trocou crescimento por ilusão de segurança. Risco zero no curto prazo é risco máximo no longo.',
};

function ConsensusConverter() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const rectRef = useRef(null);   // cached when card is flat; never updated while tilted
  const textFocusedRef = useRef(false);
  const tiltActiveRef = useRef(false);

  const resetTilt = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    tiltActiveRef.current = false;
    rectRef.current = null;       // clear so next entry re-caches at neutral position
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (textFocusedRef.current) return;
      const card = cardRef.current;
      if (!card) return;

      if (!tiltActiveRef.current) {
        // Card is flat — use live rect to detect entry, then cache it
        const liveRect = card.getBoundingClientRect();
        const ex = (e.clientX - liveRect.left) / liveRect.width;
        const ey = (e.clientY - liveRect.top) / liveRect.height;
        if (ex < 0 || ex > 1 || ey < 0 || ey > 1) return;
        rectRef.current = liveRect;   // cache while card is still neutral
        tiltActiveRef.current = true;
      }

      // Use the cached (flat) rect — unaffected by the tilt transform
      const rect = rectRef.current;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) {
        resetTilt();
        return;
      }

      const cx = Math.max(0, Math.min(1, x));
      const cy = Math.max(0, Math.min(1, y));

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        card.style.transition = 'none';
        card.style.transform = `perspective(900px) rotateX(${-(cy - 0.5) * 14}deg) rotateY(${(cx - 0.5) * 30}deg)`;
      });
    };

    document.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resetTilt]);

  const { getToken } = useAuth();
  const { credits } = useStore();
  const [text, setText] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [flippedText, setFlippedText] = useState('');

  const handleFocus = () => {
    textFocusedRef.current = true;
    resetTilt();
    if (isDefault) setIsDefault(false);
  };

  const handleBlur = () => {
    textFocusedRef.current = false;
  };

  const handleTextChange = (value) => {
    setText(value);
    if (flipped) setFlipped(false);
  };

  const currentText = isDefault ? EXAMPLE.consensus : text;

  const handleFlip = async () => {
    if (credits < 450) {
      alert('Saldo insuficiente. Você precisa de pelo menos 450 créditos para usar o Conversor de Senso Comum. Recarregue em Planos & Créditos.');
      return;
    }
    if (flipped || flipping || !currentText.trim()) return;
    setFlipping(true);
    if (isDefault) {
      setTimeout(() => { setFlipped(true); setFlipping(false); }, 900);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch('/api/agent/flip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await res.json();
      setFlippedText(data.text || 'Não foi possível gerar a tese. Tente novamente.');
    } catch {
      setFlippedText('Erro de conexão. Tente novamente.');
    }
    setFlipped(true);
    setFlipping(false);
  };

  return (
    <div className="consensus-converter glass-card" ref={cardRef}>
      {/* Header */}
      <div className="consensus-header">
        <div className="consensus-header-left">
          <span className="consensus-badge">
            <span className="consensus-badge-dot" />
            RADAR DE TESES INUSITADAS
          </span>
          <h2 className="consensus-title">Conversor de Senso Comum</h2>
        </div>
        <p className="consensus-description">
          Transformar o senso comum do mercado em teses contrárias e inusitadas é a forma mais rápida de capturar atenção orgânica no LinkedIn.
        </p>
      </div>

      {/* Main flipper */}
      <div className="consensus-flipper">
        {/* Left — Consenso Morno (editable) */}
        <div className="consensus-col">
          <span className="consensus-col-label consensus-col-label--warm">SENSO COMUM</span>
          <textarea
            className={`consensus-text-box consensus-text-editable${isDefault ? ' consensus-text-dimmed' : ''}`}
            value={currentText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Digite o senso comum que quer flipar..."
          />
        </div>

        {/* Center — Flip button */}
        <div className="consensus-center">
          <button
            className={`flip-btn ${flipping ? 'flip-btn--loading' : ''} ${flipped ? 'flip-btn--done' : ''}`}
            onClick={handleFlip}
            disabled={flipped || flipping}
          >
            <Zap size={22} />
          </button>
          <span className="flip-label">FLIPAR</span>
        </div>

        {/* Right — Ângulo Outlier */}
        <div className="consensus-col">
          <span className="consensus-col-label consensus-col-label--outlier">ÂNGULO INUSITADO (POSICIONAMENTO)</span>
          <div className={`consensus-text-box consensus-text-box--outlier ${flipped ? 'consensus-text-box--visible' : ''}`}>
            {flipped ? (
              <span style={{ whiteSpace: 'pre-line' }}>
                {isDefault ? EXAMPLE.outlier : flippedText}
              </span>
            ) : (
              <span className="consensus-placeholder">Clique no raio central para flipar e desbloquear a tese contrária de alto impacto...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsensusConverter;
