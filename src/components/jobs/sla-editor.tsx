"use client";

import React from "react";
import { ACTIVE_STAGES, Stage, DEFAULT_SLA_DAYS } from "@/lib/validations/common";
import { StagePill } from "../ui/stage-pill";
import { Mono } from "../ui/mono";
import { Minus, Plus, RotateCcw } from "lucide-react";

export interface SlaEditorProps {
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}

export function SlaEditor({ value, onChange }: SlaEditorProps) {
  const currentSlas = { ...DEFAULT_SLA_DAYS, ...value };

  const handleStep = (stage: Stage, delta: number) => {
    const cur = currentSlas[stage] || DEFAULT_SLA_DAYS[stage] || 5;
    const next = Math.max(1, Math.min(30, cur + delta));
    onChange({
      ...currentSlas,
      [stage]: next,
    });
  };

  const handleResetDefaults = () => {
    onChange(DEFAULT_SLA_DAYS);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-panel border border-hairline rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-fg">Service Level Agreements (SLA)</h4>
          <p className="text-[11px] text-fg-muted">
            Target dwell time per evaluation stage (1–30 days)
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-[11px] text-fg-muted hover:text-primary flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ACTIVE_STAGES.map((stage) => {
          const days = currentSlas[stage] ?? DEFAULT_SLA_DAYS[stage];
          return (
            <div
              key={stage}
              className="p-2.5 bg-canvas border border-hairline rounded-md flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <StagePill stage={stage} size="xs" />
              </div>

              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={() => handleStep(stage, -1)}
                  disabled={days <= 1}
                  className="w-6 h-6 rounded bg-hairline/60 hover:bg-hairline flex items-center justify-center text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <div className="font-mono text-xs font-bold text-fg flex items-baseline gap-1">
                  <Mono>{days}</Mono>
                  <span className="text-[10px] text-fg-muted font-normal">days</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStep(stage, 1)}
                  disabled={days >= 30}
                  className="w-6 h-6 rounded bg-hairline/60 hover:bg-hairline flex items-center justify-center text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
