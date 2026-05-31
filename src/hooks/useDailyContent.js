import { useState, useEffect } from 'react';
import { anthropic, MODELS, LINAGE_SYSTEM_PROMPT } from '../lib/anthropic';

const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const todayKey = () => `linage_daily_${new Date().toISOString().split('T')[0]}`;

async function fetchDailyContent() {
  // Busca notícias do mercado financeiro via Tavily
  const tavilyRes = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query: 'mercado financeiro investimentos Brasil',
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
    }),
  });

  const tavilyData = await tavilyRes.json();
  const headlines = tavilyData.results?.map(r => r.title).join('\n') || '';

  // Gera perspectiva do dia + sugestões de pauta com a voz e personalidade do Linage
  const response = await anthropic.messages.create({
    model: MODELS.agent,
    max_tokens: 400,
    system: LINAGE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Notícias do mercado financeiro de hoje:\n${headlines}\n\nCom base nisso, gere o conteúdo do dia para a plataforma:\n1. PERSPECTIVA: Uma frase sua — como você vê o posicionamento profissional no contexto de hoje. Máx 25 palavras. Com sua voz, sem fórmula.\n2. PAUTA_1: Um tema para post no LinkedIn baseado nas notícias (máx 15 palavras, formulado como pergunta ou provocação)\n3. PAUTA_2: Outro ângulo diferente (máx 15 palavras)\n4. PAUTA_3: Mais um tema diferente (máx 15 palavras)\n\nRetorne exatamente neste formato, sem mais nada:\nPERSPECTIVA: [texto]\nPAUTA_1: [texto]\nPAUTA_2: [texto]\nPAUTA_3: [texto]`
    }]
  });

  const text = response.content[0].text;
  const get = (label) => text.match(new RegExp(`${label}:\\s*(.+)`))?.[1]?.trim() || '';

  return {
    quote: get('PERSPECTIVA'),
    suggestions: [get('PAUTA_1'), get('PAUTA_2'), get('PAUTA_3')],
  };
}

export function useDailyContent(fallbackQuote, fallbackSuggestions) {
  const key = todayKey();

  const [content, setContent] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (cached?.quote) return cached;
    } catch {}
    return { quote: fallbackQuote, suggestions: fallbackSuggestions };
  });

  useEffect(() => {
    // Limpa cache de dias anteriores
    Object.keys(localStorage)
      .filter(k => k.startsWith('linage_daily_') && k !== key)
      .forEach(k => localStorage.removeItem(k));

    if (localStorage.getItem(key)) return; // já tem cache de hoje

    fetchDailyContent()
      .then(data => {
        if (data.quote) {
          localStorage.setItem(key, JSON.stringify(data));
          setContent(data);
        }
      })
      .catch(() => {}); // mantém fallback em caso de erro
  }, [key]);

  return content;
}
