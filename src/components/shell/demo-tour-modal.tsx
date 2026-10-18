"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import {
  Sparkles,
  ArrowRight,
  Kanban,
  FileText,
  Search,
  Scale,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  onAction: (router: any, uiStore: any) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "1. Executive KPI Bento & Analytics",
    description:
      "Welcome to Veloce ATS! The Dashboard delivers high-density executive signal: active pipeline velocity, hiring funnel conversion chips, bottleneck detection, and requisition health with live SLA breach monitoring.",
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    actionText: "Next: Pipeline Workspace",
    onAction: (router) => router.push("/dashboard"),
  },
  {
    title: "2. Kanban Board & Fluid DnD",
    description:
      "Navigate candidate cards with drag-and-drop powered by @dnd-kit. Dragging a card across stages executes transactional ACID re-orders, atomic audit logs, and triggers canvas confetti when moving to HIRED!",
    icon: <Kanban className="w-5 h-5 text-indigo-400" />,
    actionText: "Go to Pipeline",
    onAction: (router) => router.push("/pipeline"),
  },
  {
    title: "3. Superhuman Candidate Dossier",
    description:
      "Click any candidate card or press Enter in Split view to open the 720px glass drawer. Explore deterministic AI match breakdowns with radar charts, scorecards with calibration disagreement heatmaps, threaded notes, and immutable timelines.",
    icon: <FileText className="w-5 h-5 text-sky-400" />,
    actionText: "Open Sample Dossier",
    onAction: (router, uiStore) => {
      router.push("/pipeline");
      // Find a candidate or trigger first
      setTimeout(() => {
        const firstCard = document.querySelector(".spotlight-card") as HTMLElement;
        if (firstCard) firstCard.click();
      }, 300);
    },
  },
  {
    title: "4. Raycast-Grade ⌘K Command Palette",
    description:
      "Press ⌘K or '/' anywhere outside inputs to summon the glass command palette. Search candidates with fuzzy character matching, view live mini-dossier previews, execute actions, switch themes, or parse raw resumes with live scoring.",
    icon: <Search className="w-5 h-5 text-violet-400" />,
    actionText: "Open ⌘K Palette",
    onAction: (router, uiStore) => {
      uiStore.toggleCommandPalette();
    },
  },
  {
    title: "5. Calibration & Comparison Matrix",
    description:
      "Pick 2 to 4 candidates to run side-by-side rubric calibration. Compare skill matrices, compensation band deltas, radar fit overlays, and interviewer signals to eliminate hiring bias.",
    icon: <Scale className="w-5 h-5 text-emerald-400" />,
    actionText: "View Compare Matrix",
    onAction: (router) => router.push("/compare"),
  },
  {
    title: "6. Deterministic Reset & Seed Invariants",
    description:
      "Whenever you want a clean slate, open ⌘K or click Reset Demo DB in the overflow menu. It executes a full database reseed with 32 distributed candidates, 60+ transitions, and strict SLA invariants in ~180ms.",
    icon: <RotateCcw className="w-5 h-5 text-danger" />,
    actionText: "Finish Tour",
    onAction: (router, uiStore) => {
      uiStore.setTourOpen(false);
      router.push("/dashboard");
    },
  },
];

export function DemoTourModal() {
  const router = useRouter();
  const isTourOpen = useUiStore((s) => s.isTourOpen);
  const setTourOpen = useUiStore((s) => s.setTourOpen);
  const uiStore = useUiStore();

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = TOUR_STEPS[stepIndex]!;

  const handleNext = () => {
    currentStep.onAction(router, uiStore);
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setTourOpen(false);
      setStepIndex(0);
    }
  };

  return (
    <Modal
      isOpen={isTourOpen}
      onClose={() => setTourOpen(false)}
      title="Veloce ATS Guided Spotlight Tour"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-fg-muted font-mono border-b border-hairline pb-3">
          <span>
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? "w-6 bg-primary"
                    : i < stepIndex
                    ? "w-1.5 bg-emerald-500"
                    : "w-1.5 bg-hairline"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-hairline/40 border border-hairline shrink-0">
            {currentStep.icon}
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-fg">{currentStep.title}</h3>
            <p className="text-xs text-fg-muted leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-hairline">
          <button
            onClick={() => setTourOpen(false)}
            className="text-xs text-fg-muted hover:text-fg transition-colors"
          >
            Skip Tour
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            icon={stepIndex === TOUR_STEPS.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {currentStep.actionText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
