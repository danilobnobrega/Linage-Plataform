import { useEffect, useRef } from 'react';

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const scale = useRef(1);
  const hover = useRef(false);
  const hidden = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e) => {
      hidden.current = !!e.target.closest('input, textarea, select');
      hover.current = !!e.target.closest('a, button, [role="button"]');
    };

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      // Lerp ring position and scale
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      scale.current += ((hover.current ? 1.7 : 1) - scale.current) * 0.15;

      const dot = dotRef.current;
      const ringEl = ringRef.current;
      if (!dot || !ringEl) return;

      const opacity = hidden.current ? '0' : '1';
      dot.style.opacity = opacity;
      ringEl.style.opacity = opacity;

      // Dot centered: subtract half of its 6px size
      dot.style.transform = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`;
      // Ring centered: subtract half of its 28px size
      ringEl.style.transform = `translate(${ring.current.x - 14}px, ${ring.current.y - 14}px) scale(${scale.current})`;
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
