import { useEffect } from 'react';

function PlatformStyles() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/platform.css';
    link.id = 'platform-styles';
    document.head.appendChild(link);
    return () => document.getElementById('platform-styles')?.remove();
  }, []);
  return null;
}

export default PlatformStyles;
