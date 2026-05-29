import { useEffect, useRef } from 'react';

const TILE = 200;

function GrainOverlay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    const offscreen = document.createElement('canvas');
    offscreen.width = TILE;
    offscreen.height = TILE;
    const offCtx = offscreen.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      frame++;
      if (frame % 3 !== 0) return; // ~20fps — grain não precisa de 60fps

      const img = offCtx.createImageData(TILE, TILE);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);

      const pat = ctx.createPattern(offscreen, 'repeat');
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
        opacity: 0.04,
      }}
    />
  );
}

export default GrainOverlay;
