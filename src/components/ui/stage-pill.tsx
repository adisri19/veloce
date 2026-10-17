import React from "react";
import { clsx } from "clsx";
import { Stage } from "@/lib/validations/common";

const STAGE_CONFIG: Record<
  Stage,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  SOURCED: {
    label: "Sourced",
    bg: "bg-slate-500/10 dark:bg-slate-400/10",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  },
  APPLIED: {
    label: "Applied",
    bg: "bg-sky-500/10 dark:bg-sky-400/10",
    text: "text-sky-600 dark:text-sky-300",
    border: "border-sky-500/20",
    dot: "bg-sky-400",
  },
  SCREENING: {
    label: "Screening",
    bg: "bg-purple-500/10 dark:bg-purple-400/10",
    text: "text-purple-600 dark:text-purple-300",
    border: "border-purple-500/20",
    dot: "bg-purple-400",
  },
  TECHNICAL_INTERVIEW: {
    label: "Technical",
    bg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    text: "text-indigo-600 dark:text-indigo-300",
    border: "border-indigo-500/20",
    dot: "bg-indigo-400",
  },
  SYSTEM_DESIGN: {
    label: "System Design",
    bg: "bg-cyan-500/10 dark:bg-cyan-400/10",
    text: "text-cyan-600 dark:text-cyan-300",
    border: "border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  OFFER: {
    label: "Offer",
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
    text: "text-amber-600 dark:text-amber-300",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  HIRED: {
    label: "Hired",
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    text: "text-emerald-600 dark:text-emerald-300",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-500/10 dark:bg-rose-400/10",
    text: "text-rose-600 dark:text-rose-300",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-zinc-500/10 dark:bg-zinc-400/10",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/20",
    dot: "bg-zinc-400",
  },
};

export interface StagePillProps {
  stage: Stage;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function StagePill({
  stage,
  size = "md",
  showDot = true,
  className,
}: StagePillProps) {
  const conf = STAGE_CONFIG[stage] || STAGE_CONFIG.APPLIED;

  const sizeStyles = {
    xs: "text-[9px] px-1 py-0.2 gap-1",
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded border tracking-tight select-none",
        conf.bg,
        conf.text,
        conf.border,
        sizeStyles[size],
        className
      )}
    >
      {showDot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", conf.dot)} />}
      <span>{conf.label}</span>
    </span>
  );
}
