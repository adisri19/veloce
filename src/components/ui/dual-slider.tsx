"use client";

import React, { useCallback, useRef } from "react";
import { Mono } from "./mono";
import { clsx } from "clsx";

export interface DualSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export function DualSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unit = "",
  className,
}: DualSliderProps) {
  const [minVal, maxVal] = value;
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(e.target.value), maxVal - step);
    onChange([nextMin, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(e.target.value), minVal + step);
    onChange([minVal, nextMax]);
  };

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className={clsx("flex flex-col gap-2 w-full select-none", className)}>
      {(label || unit) && (
        <div className="flex items-center justify-between text-xs text-fg-muted font-medium">
          {label && <span>{label}</span>}
          <div className="flex items-center gap-1 font-mono text-fg font-bold">
            <Mono>{minVal}{unit}</Mono>
            <span>–</span>
            <Mono>{maxVal}{unit}</Mono>
          </div>
        </div>
      )}

      <div className="relative flex items-center h-5 w-full" ref={trackRef}>
        {/* Background track */}
        <div className="absolute w-full h-1.5 bg-hairline rounded-full" />

        {/* Selected highlighted segment */}
        <div
          className="absolute h-1.5 bg-primary rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Dual range inputs overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-1.5 opacity-0 cursor-pointer pointer-events-auto z-20"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-1.5 opacity-0 cursor-pointer pointer-events-auto z-20"
        />

        {/* Visual thumb for min */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none -translate-x-1/2 z-10 transition-transform"
          style={{ left: `${minPercent}%` }}
        />

        {/* Visual thumb for max */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none -translate-x-1/2 z-10 transition-transform"
          style={{ left: `${maxPercent}%` }}
        />
      </div>
    </div>
  );
}
