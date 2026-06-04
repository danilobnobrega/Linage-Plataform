import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';

const todayKey = () => `linage_daily_${new Date().toISOString().split('T')[0]}`;

export function useDailyContent(fallbackQuote, fallbackSuggestions) {
  const key = todayKey();
  const { getToken } = useAuth();
  const setDailyContent = useStore((s) => s.setDailyContent);

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

    let cancelled = false;
    let retryTimer = null;

    async function fetchContent(attempt = 1) {
      if (cancelled) return;
      try {
        const token = await getToken();
        const res = await fetch('/api/daily-content', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('[daily-content] erro na API:', res.status, errText);
          scheduleRetry(attempt);
          return;
        }
        const data = await res.json();
        if (data.quote) {
          localStorage.setItem(key, JSON.stringify(data));
          setContent(data);
          setDailyContent(data.quote, data.suggestions);
        } else {
          scheduleRetry(attempt);
        }
      } catch (err) {
        console.error('[daily-content] falha na requisição:', err);
        scheduleRetry(attempt);
      }
    }

    function scheduleRetry(attempt) {
      if (cancelled) return;
      const delay = Math.min(5000 * attempt, 60000);
      retryTimer = setTimeout(() => fetchContent(attempt + 1), delay);
    }

    fetchContent();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [key]);

  return content;
}
