import { useEffect, useRef } from 'react';

const CHARS = '#%/@>_|[]=~*$!';

export function useDecryptPlaceholder(phrases, { speed = 14, hold = 1800 } = {}) {
  const inputRef = useRef(null);
  const ctrl = useRef({ active: true, timers: [], idx: 0, restart: null });

  useEffect(() => {
    const c = ctrl.current;
    c.active = true;

    const setP = (text) => { if (inputRef.current) inputRef.current.placeholder = text; };
    const clear = () => { c.timers.forEach(clearTimeout); c.timers = []; };

    const run = () => {
      clear();
      if (!c.active) return;
      const phrase = phrases[c.idx];
      let step = 0;

      const reveal = () => {
        if (!c.active) return;
        setP(
          phrase.split('').map((ch, i) =>
            ch === ' ' ? ' ' : i < step ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
          ).join('')
        );
        step += 0.5;
        if (step <= phrase.length) {
          c.timers.push(setTimeout(reveal, speed));
        } else {
          setP(phrase);
          c.timers.push(setTimeout(() => {
            setP('');
            c.timers.push(setTimeout(() => {
              c.idx = (c.idx + 1) % phrases.length;
              run();
            }, 200));
          }, hold));
        }
      };

      reveal();
    };

    c.restart = run;
    run();

    return () => { c.active = false; clear(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFocus = () => {
    const c = ctrl.current;
    c.active = false;
    c.timers.forEach(clearTimeout);
    c.timers = [];
    if (inputRef.current) inputRef.current.placeholder = '';
  };

  const onBlur = () => {
    const c = ctrl.current;
    if (inputRef.current?.value) return; // has content — don't restart
    c.active = true;
    c.idx = 0;
    c.timers.push(setTimeout(c.restart, 600));
  };

  return { ref: inputRef, onFocus, onBlur };
}
