import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 800,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = isNaN(value) ? 0 : value;
    const range = endVal - startVal;

    if (range === 0) {
      setDisplayValue(endVal);
      return;
    }

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out exponential
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + range * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
        startTimeRef.current = null;
      }
    };

    startTimeRef.current = null;
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, durationMs]);

  const formattedNumber = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`inline-block tabular-nums transition-transform duration-150 ${className}`}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
