import { useState, useCallback } from 'react';

export default function useHearts() {
  const [hearts, setHearts] = useState([]);

  const spawnHeart = useCallback(() => {
    const id = Date.now() + Math.random();
    const newHeart = {
      id,
      x: Math.random() * 100, // percentage
      size: Math.random() * (20 - 10) + 10,
      duration: Math.random() * (3 - 2) + 2,
    };

    setHearts((prev) => [...prev, newHeart]);

    // Cleanup after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3000);
  }, []);

  return { hearts, spawnHeart };
}
