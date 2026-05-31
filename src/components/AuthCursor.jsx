import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Clerk's button class prefixes to apply magnetic effect to
const MAGNETIC_SELECTORS = [
  '.cl-formButtonPrimary',
  '.cl-socialButtonsBlockButton',
  '.cl-footerActionLink',
];

function applyMagnetic(btn, follower) {
  const onMove = (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
    gsap.to(follower, { width: 80, height: 80, borderColor: 'rgba(0, 255, 136, 0.5)' });
  };
  const onLeave = () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
    gsap.to(follower, { width: 40, height: 40, borderColor: 'rgba(255, 255, 255, 0.5)' });
  };
  btn.addEventListener('mousemove', onMove);
  btn.addEventListener('mouseleave', onLeave);
  btn._magneticCleanup = () => {
    btn.removeEventListener('mousemove', onMove);
    btn.removeEventListener('mouseleave', onLeave);
  };
}

function AuthCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

    gsap.set([cursor, follower], { opacity: 0 });

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set([cursor, follower], { opacity: 1 });
      gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1, ease: 'power2.out' });
    };
    document.addEventListener('mousemove', onMove);

    const ticker = gsap.ticker.add(() => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      gsap.set(follower, { x: followerX, y: followerY });
    });

    // Apply magnetic to any already-rendered buttons + watch for Clerk's async render
    const attached = new WeakSet();

    function attachMagnetic() {
      MAGNETIC_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((btn) => {
          if (!attached.has(btn)) {
            attached.add(btn);
            applyMagnetic(btn, follower);
          }
        });
      });
    }

    attachMagnetic();

    const observer = new MutationObserver(attachMagnetic);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      gsap.ticker.remove(ticker);
      observer.disconnect();
      MAGNETIC_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((btn) => {
          btn._magneticCleanup?.();
        });
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="auth-cursor" />
      <div ref={followerRef} className="auth-cursor-follower" />
    </>
  );
}

export default AuthCursor;
