"use client";

import React, { useEffect, useState, useRef } from "react";
import { Mono } from "./mono";

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValRef = useRef(value);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = currentValRef.current;
    const endValue = value;
    const diff = endValue - startValue;

    if (diff === 0) {
      currentValRef.current = endValue;
      return;
    }

    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOut;

      setDisplayValue(current);
      currentValRef.current = current;

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        currentValRef.current = endValue;
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <Mono className={className}>
      {prefix}
      {formatted}
      {suffix}
    </Mono>
  );
}
