"use client";

import React from "react";
import Link from "next/link";
import { X, Scale, ArrowRight } from "lucide-react";
import { useCompareStore } from "@/stores/compare-store";
import { Avatar } from "../ui/avatar";
import { Button, IconButton } from "../ui/button";

export function CompareTray() {
  const { candidates, removeCandidate, clear, isCompareTrayOpen } = useCompareStore();

  if (!isCompareTrayOpen || candidates.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 bg-panel border border-hairline rounded-lg shadow-2xl p-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-150">
      <div className="flex items-center gap-2 pr-3 border-r border-hairline">
        <Scale className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-fg">
          Compare ({candidates.length}/4)
        </span>
      </div>

      <div className="flex items-center gap-2">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-1.5 px-2 py-1 bg-canvas border border-hairline rounded-md text-xs"
          >
            <Avatar name={c.name} src={c.avatarUrl} size="xs" />
            <span className="font-medium text-fg truncate max-w-[100px]">{c.name}</span>
            <IconButton
              size="sm"
              icon={<X className="w-3 h-3 text-fg-muted" />}
              onClick={() => removeCandidate(c.id)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={clear}
          className="text-xs text-fg-muted hover:text-fg underline cursor-pointer"
        >
          Clear
        </button>
        <Link href={`/compare?ids=${candidates.map((c) => c.id).join(",")}`}>
          <Button
            variant="primary"
            size="sm"
            disabled={candidates.length < 2}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Compare Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
