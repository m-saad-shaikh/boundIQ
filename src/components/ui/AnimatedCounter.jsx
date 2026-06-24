/**
 * AnimatedCounter.jsx — Smooth count-up animation for numbers
 */

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export default function AnimatedCounter({ value, duration = 1.5, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const target    = parseFloat(value) || 0;
    const startTime = performance.now();

    function step(now) {
      const elapsed  = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
