import { useEffect, useRef } from 'react';

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

function CustomCursor() {
  if (isTouch) return null;
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const scale = useRef(1);
  const hover = useRef(false);
  const hidden = useRef(false);
  const isMagnetic = useRef(false);
  const currentMagnetic = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      const el = e.target.closest('.magnetic');
      if (el) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'transform 0.2s ease';
        currentMagnetic.current = el;
        isMagnetic.current = true;
      } else {
        if (currentMagnetic.current) {
          currentMagnetic.current.style.transform = '';
          currentMagnetic.current.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          currentMagnetic.current = null;
        }
        isMagnetic.current = false;
      }
    };

    const onOver = (e) => {
      hidden.current = !!e.target.closest('input, textarea, select');
      hover.current = !!e.target.closest('a, button, [role="button"]');
    };

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;

      const targetScale = isMagnetic.current ? 2.5 : hover.current ? 1.7 : 1;
      scale.current += (targetScale - scale.current) * 0.15;

      const dot = dotRef.current;
      const ringEl = ringRef.current;
      if (!dot || !ringEl) return;

      const opacity = hidden.current ? '0' : '1';
      dot.style.opacity = opacity;
      ringEl.style.opacity = opacity;

      dot.style.transform = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`;
      ringEl.style.transform = `translate(${ring.current.x - 14}px, ${ring.current.y - 14}px) scale(${scale.current})`;
      ringEl.style.borderColor = isMagnetic.current
        ? 'rgba(0, 255, 136, 0.8)'
        : hover.current
        ? 'rgba(0, 255, 136, 0.5)'
        : 'rgba(0, 255, 136, 0.4)';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

export default CustomCursor;
