import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const todayKey = () => `linage_daily_${new Date().toISOString().split('T')[0]}`;

export function useDailyContent(fallbackQuote, fallbackSuggestions) {
  const key = todayKey();
  const { getToken } = useAuth();

  const [content, setContent] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (cached?.quote) return cached;
    } catch {}
    return { quote: fallbackQuote, suggestions: fallbackSuggestions };
  });

  useEffect(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('linage_daily_') && k !== key)
      .forEach(k => localStorage.removeItem(k));

    if (localStorage.getItem(key)) return;

    async function fetchContent() {
      try {
        const token = await getToken();
        const res = await fetch('/api/daily-content', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.quote) {
          localStorage.setItem(key, JSON.stringify(data));
          setContent(data);
        }
      } catch {}
    }

    fetchContent();
  }, [key]);

  return content;
}
