import React from "react";
import { clsx } from "clsx";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SlaState } from "@/lib/sla";
import { Mono } from "./mono";

export interface SlaBadgeProps {
  slaState: SlaState;
  daysInStage: number;
  slaDays: number;
  className?: string;
}

export function SlaBadge({
  slaState,
  daysInStage,
  slaDays,
  className,
}: SlaBadgeProps) {
  if (slaDays === 0) {
    return (
      <span className={clsx("inline-flex items-center gap-1 text-[11px] text-fg-muted", className)}>
        <CheckCircle2 className="w-3 h-3 text-success" />
        <span>Done</span>
      </span>
    );
  }

  const remaining = slaDays - daysInStage;
  const isBreached = slaState === "BREACHED";
  const isWarning = slaState === "WARNING";

  let styles = "bg-panel text-fg-muted border-hairline";
  let icon = <Clock className="w-3 h-3" />;
  let text = `${Math.max(0, Math.round(remaining * 10) / 10)}d left`;

  if (isBreached) {
    styles = "bg-danger-surface text-danger border-danger/30 font-semibold";
    icon = <AlertTriangle className="w-3 h-3 text-danger animate-pulse" />;
    const overDays = Math.round(Math.abs(remaining) * 10) / 10;
    text = `${overDays}d over`;
  } else if (isWarning) {
    styles = "bg-warn-surface text-warn border-warn/30";
    icon = <Clock className="w-3 h-3 text-warn" />;
    text = `${Math.round(remaining * 10) / 10}d left`;
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border select-none tracking-tight",
        styles,
        className
      )}
    >
      {icon}
      <Mono className="text-[10px]">{text}</Mono>
    </span>
  );
}
