"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelectionStore } from "@/stores/selection-store";
import { useBulkMutation } from "@/hooks/use-bulk-mutation";
import { useCompareStore } from "@/stores/compare-store";
import { Stage } from "@/lib/validations/common";
import { Button } from "../ui/button";
import { Mono } from "../ui/mono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRightCircle,
  Tag,
  Scale,
  Archive,
  Download,
  X,
  ChevronDown,
} from "lucide-react";

const STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

export function BulkActionBar() {
  const router = useRouter();
  const { selectedIds, clear } = useSelectionStore();
  const bulkMutation = useBulkMutation();
  const { setCompareTrayOpen } = useCompareStore();

  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  if (selectedIds.length === 0) return null;

  const handleMoveStage = (stage: Stage) => {
    bulkMutation.mutate({
      ids: selectedIds,
      op: "MOVE_STAGE",
      payload: { toStage: stage },
    });
    setIsStageMenuOpen(false);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    bulkMutation.mutate({
      ids: selectedIds,
      op: "ADD_TAGS",
      payload: { tags: [tagInput.trim().toLowerCase()] },
    });
    setTagInput("");
    setIsTagInputOpen(false);
  };

  const handleArchive = () => {
    bulkMutation.mutate({
      ids: selectedIds,
      op: "ARCHIVE",
      payload: {},
    });
  };

  const handleCompare = () => {
    if (selectedIds.length < 2 || selectedIds.length > 4) {
      toast.error("Select 2 to 4 candidates to compare");
      return;
    }
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  };

  const handleExportCsv = () => {
    const url = `/api/v1/export/applications.csv?ids=${encodeURIComponent(selectedIds.join(","))}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-panel border border-hairline shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 pr-3 border-r border-hairline">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-fg whitespace-nowrap">
            <Mono>{selectedIds.length}</Mono> candidate{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={clear}
            className="text-fg-muted hover:text-fg p-1 rounded-full hover:bg-hairline transition-colors ml-1"
            title="Deselect all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* Move Stage Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsStageMenuOpen(!isStageMenuOpen);
                setIsTagInputOpen(false);
              }}
              className="gap-1.5 rounded-full text-xs"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" />
              <span>Move Stage</span>
              <ChevronDown className="w-3 h-3 text-fg-muted" />
            </Button>

            {isStageMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-48 bg-panel border border-hairline rounded-lg shadow-xl py-1 z-50 flex flex-col max-h-60 overflow-y-auto">
                {STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleMoveStage(st)}
                    className="text-left px-3 py-1.5 text-xs text-fg hover:bg-hairline hover:text-primary transition-colors"
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Tag Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsTagInputOpen(!isTagInputOpen);
                setIsStageMenuOpen(false);
              }}
              className="gap-1.5 rounded-full text-xs"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </Button>

            {isTagInputOpen && (
              <form
                onSubmit={handleAddTag}
                className="absolute bottom-full mb-2 left-0 w-60 bg-panel border border-hairline rounded-lg shadow-xl p-2 z-50 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tag name..."
                  autoFocus
                  className="flex-1 bg-canvas border border-hairline rounded px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" type="submit" variant="primary" className="text-xs py-1 px-2.5">
                  Add
                </Button>
              </form>
            )}
          </div>

          {/* Compare */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || selectedIds.length > 4}
            className="gap-1.5 rounded-full text-xs"
            title={
              selectedIds.length < 2 || selectedIds.length > 4
                ? "Select 2 to 4 candidates to compare"
                : "Compare candidates side-by-side"
            }
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare</span>
          </Button>

          {/* Archive */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="gap-1.5 rounded-full text-xs hover:text-danger hover:border-danger/40"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </Button>

          {/* Export CSV */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 rounded-full text-xs"
            title="Export selected candidates to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
