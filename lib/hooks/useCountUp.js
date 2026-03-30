import { useEffect, useState } from 'react';

export default function useCountUp(target = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 700;
    const stepTime = 20;
    const increment = target / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return Math.round(value);
}
