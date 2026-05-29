import { useState, useEffect, useRef } from 'react';

const CHARS = '#%/@>_|[]=~*$!';

function DecryptText({ phrases, className = '', speed = 14, hold = 1800 }) {
  const [output, setOutput] = useState('');
  const ctrl = useRef({ active: true, timers: [], idx: 0 });

  useEffect(() => {
    const c = ctrl.current;
    c.active = true;

    const clear = () => { c.timers.forEach(clearTimeout); c.timers = []; };

    const run = () => {
      clear();
      if (!c.active) return;
      const phrase = phrases[c.idx];
      let step = 0;

      const reveal = () => {
        if (!c.active) return;
        setOutput(
          phrase.split('').map((ch, i) =>
            ch === ' ' ? ' ' : i < step ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
          ).join('')
        );
        step += 0.5;
        if (step <= phrase.length) {
          c.timers.push(setTimeout(reveal, speed));
        } else {
          setOutput(phrase);
          c.timers.push(setTimeout(() => {
            setOutput('');
            c.timers.push(setTimeout(() => {
              c.idx = (c.idx + 1) % phrases.length;
              run();
            }, 200));
          }, hold));
        }
      };

      reveal();
    };

    run();
    return () => { c.active = false; clear(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={className}>
      {output}
      <span className="decrypt-cursor" aria-hidden="true">_</span>
    </span>
  );
}

export default DecryptText;
