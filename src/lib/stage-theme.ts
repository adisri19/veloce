import { Stage } from "./validations/common";

export interface StageStyle {
  label: string;
  shortLabel: string;
  color: string;
  lightColor: string;
  border: string;
  bgSurface: string;
  text: string;
  gradient: string;
}

export const STAGE_THEME: Record<Stage, StageStyle> = {
  SOURCED: {
    label: "Sourced",
    shortLabel: "Sourced",
    color: "#64748B",
    lightColor: "#94A3B8",
    border: "border-slate-500/30",
    bgSurface: "bg-slate-500/10",
    text: "text-slate-400",
    gradient: "from-slate-500/20 to-slate-600/10",
  },
  APPLIED: {
    label: "Applied",
    shortLabel: "Applied",
    color: "#38BDF8",
    lightColor: "#7DD3FC",
    border: "border-sky-500/30",
    bgSurface: "bg-sky-500/10",
    text: "text-sky-400",
    gradient: "from-sky-500/20 to-sky-600/10",
  },
  SCREENING: {
    label: "Screening",
    shortLabel: "Screen",
    color: "#6366F1",
    lightColor: "#818CF8",
    border: "border-indigo-500/30",
    bgSurface: "bg-indigo-500/10",
    text: "text-indigo-400",
    gradient: "from-indigo-500/20 to-indigo-600/10",
  },
  TECHNICAL_INTERVIEW: {
    label: "Technical Interview",
    shortLabel: "Tech",
    color: "#A78BFA",
    lightColor: "#C4B5FD",
    border: "border-violet-500/30",
    bgSurface: "bg-violet-500/10",
    text: "text-violet-400",
    gradient: "from-violet-500/20 to-violet-600/10",
  },
  SYSTEM_DESIGN: {
    label: "System Design",
    shortLabel: "Sys Design",
    color: "#E879F9",
    lightColor: "#F0ABFC",
    border: "border-fuchsia-500/30",
    bgSurface: "bg-fuchsia-500/10",
    text: "text-fuchsia-400",
    gradient: "from-fuchsia-500/20 to-fuchsia-600/10",
  },
  OFFER: {
    label: "Offer",
    shortLabel: "Offer",
    color: "#FBBF24",
    lightColor: "#FDE68A",
    border: "border-amber-500/30",
    bgSurface: "bg-amber-500/10",
    text: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-600/10",
  },
  HIRED: {
    label: "Hired",
    shortLabel: "Hired",
    color: "#34D399",
    lightColor: "#6EE7B7",
    border: "border-emerald-500/30",
    bgSurface: "bg-emerald-500/10",
    text: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-600/10",
  },
  REJECTED: {
    label: "Rejected",
    shortLabel: "Rejected",
    color: "#FB7185",
    lightColor: "#FDA4AF",
    border: "border-rose-500/30",
    bgSurface: "bg-rose-500/10",
    text: "text-rose-400",
    gradient: "from-rose-500/20 to-rose-600/10",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    shortLabel: "Withdrawn",
    color: "#71717A",
    lightColor: "#A1A1AA",
    border: "border-zinc-500/30",
    bgSurface: "bg-zinc-500/10",
    text: "text-zinc-400",
    gradient: "from-zinc-500/20 to-zinc-600/10",
  },
};

export function getScoreTheme(score: number) {
  if (score >= 85) {
    return {
      tier: "exceptional",
      color: "#34D399",
      textClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.35)]",
    };
  }
  if (score >= 75) {
    return {
      tier: "strong",
      color: "#6366F1",
      textClass: "text-indigo-400",
      bgClass: "bg-indigo-500/10",
      borderClass: "border-indigo-500/30",
      glowClass: "",
    };
  }
  if (score >= 60) {
    return {
      tier: "moderate",
      color: "#FBBF24",
      textClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      glowClass: "",
    };
  }
  return {
    tier: "low",
    color: "#FB7185",
    textClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
    glowClass: "",
  };
}
