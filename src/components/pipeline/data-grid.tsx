"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ApplicationListItem } from "@/lib/services/applications";
import { useSelectionStore } from "@/stores/selection-store";
import { useUiStore } from "@/stores/ui-store";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { StagePill } from "../ui/stage-pill";
import { ScoreBadge } from "../ui/score-badge";
import { SlaBadge } from "../ui/sla-badge";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
} from "lucide-react";
import { format } from "date-fns";

export interface DataGridProps {
  applications: ApplicationListItem[];
}

const columnHelper = createColumnHelper<ApplicationListItem>();

export function DataGrid({ applications }: DataGridProps) {
  const { selectedIds, toggle, selectRange, selectAll, clear } = useSelectionStore();
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const { filters, updateFilters } = useUrlFilters();
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const handleSortToggle = useCallback(
    (field: string) => {
      const current = filters.sort;
      if (current === `${field}:desc`) {
        updateFilters({ sort: `${field}:asc` });
      } else if (current === `${field}:asc`) {
        updateFilters({ sort: "" });
      } else {
        updateFilters({ sort: `${field}:desc` });
      }
    },
    [filters.sort, updateFilters]
  );

  const getSortIcon = useCallback(
    (field: string) => {
      if (filters.sort === `${field}:desc`) {
        return <ArrowDown className="w-3.5 h-3.5 text-primary ml-1" />;
      }
      if (filters.sort === `${field}:asc`) {
        return <ArrowUp className="w-3.5 h-3.5 text-primary ml-1" />;
      }
      return <ArrowUpDown className="w-3 h-3 text-fg-muted/40 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    },
    [filters.sort]
  );

  const handleCheckboxClick = useCallback(
    (appId: string, index: number, event: React.MouseEvent) => {
      event.stopPropagation();
      if (event.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        const rangeIds = applications.slice(start, end + 1).map((a) => a.id);
        selectRange(rangeIds);
      } else {
        toggle(appId);
      }
      setLastClickedIndex(index);
    },
    [applications, lastClickedIndex, selectRange, toggle]
  );

  const allVisibleSelected =
    applications.length > 0 &&
    applications.every((a) => selectedIds.includes(a.id));

  const someVisibleSelected =
    applications.some((a) => selectedIds.includes(a.id)) && !allVisibleSelected;

  const handleHeaderCheckbox = useCallback(() => {
    if (allVisibleSelected) {
      clear();
    } else {
      selectAll(applications.map((a) => a.id));
    }
  }, [allVisibleSelected, applications, clear, selectAll]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <div className="w-5 flex items-center justify-center">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(el) => {
                if (el) el.indeterminate = someVisibleSelected;
              }}
              onChange={handleHeaderCheckbox}
              className="rounded border-hairline bg-canvas text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => {
          const isSelected = selectedIds.includes(row.original.id);
          return (
            <div className="w-5 flex items-center justify-center">
              <input
                type="checkbox"
                checked={isSelected}
                onClick={(e) =>
                  handleCheckboxClick(row.original.id, row.index, e)
                }
                onChange={() => {}}
                className="rounded border-hairline bg-canvas text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
            </div>
          );
        },
      }),

      columnHelper.accessor("candidate.fullName", {
        id: "candidate",
        header: () => (
          <button
            onClick={() => handleSortToggle("candidate.fullName")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            Candidate
            {getSortIcon("candidate.fullName")}
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              name={row.original.candidate.fullName}
              src={row.original.candidate.avatarUrl}
              size="xs"
            />
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-xs font-medium text-fg truncate">
                {row.original.candidate.fullName}
              </span>
              <Mono className="text-[10px] text-fg-muted font-normal">
                {row.original.candidate.publicCode}
              </Mono>
            </div>
          </div>
        ),
      }),

      columnHelper.accessor("job.code", {
        id: "job",
        header: "Requisition",
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-fg truncate">
              {row.original.job.title}
            </span>
            <span className="text-[10px] font-mono text-fg-muted truncate">
              {row.original.job.code} • {row.original.job.department}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("currentStage", {
        id: "stage",
        header: () => (
          <button
            onClick={() => handleSortToggle("currentStage")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            Stage
            {getSortIcon("currentStage")}
          </button>
        ),
        cell: ({ row }) => <StagePill stage={row.original.currentStage} size="sm" />,
      }),

      columnHelper.accessor("aiMatchScore", {
        id: "aiMatchScore",
        header: () => (
          <button
            onClick={() => handleSortToggle("aiMatchScore")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            AI Match
            {getSortIcon("aiMatchScore")}
          </button>
        ),
        cell: ({ row }) => (
          <ScoreBadge score={row.original.aiMatchScore} size="sm" />
        ),
      }),

      columnHelper.display({
        id: "sla",
        header: () => (
          <button
            onClick={() => handleSortToggle("stageEnteredAt")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            SLA Time
            {getSortIcon("stageEnteredAt")}
          </button>
        ),
        cell: ({ row }) => (
          <SlaBadge
            slaState={row.original.slaState}
            daysInStage={row.original.daysInStage}
            slaDays={row.original.slaDays}
          />
        ),
      }),

      columnHelper.accessor("candidate.experienceYears", {
        id: "experience",
        header: () => (
          <button
            onClick={() => handleSortToggle("candidate.experienceYears")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            Exp
            {getSortIcon("candidate.experienceYears")}
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-xs text-fg flex items-center gap-1">
            <Mono>{row.original.candidate.experienceYears}y</Mono>
            <span className="text-fg-muted text-[11px] truncate max-w-[120px]">
              {row.original.candidate.currentTitle}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("candidate.expectedSalary", {
        id: "expectedSalary",
        header: () => (
          <button
            onClick={() => handleSortToggle("candidate.expectedSalary")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            Target Comp
            {getSortIcon("candidate.expectedSalary")}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-fg-muted">
            {row.original.candidate.expectedSalary
              ? `$${(row.original.candidate.expectedSalary / 1000).toFixed(0)}k`
              : "—"}
          </span>
        ),
      }),

      columnHelper.accessor("candidate.source", {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-[11px] px-2 py-0.5 rounded bg-hairline text-fg-muted font-medium truncate max-w-[90px] inline-block">
            {row.original.candidate.source}
          </span>
        ),
      }),

      columnHelper.display({
        id: "scorecards",
        header: "Scorecards",
        cell: ({ row }) => {
          if (row.original.scorecardCount === 0) {
            return <span className="text-xs text-fg-muted/40">—</span>;
          }
          return (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{row.original.avgScorecard}</span>
              </span>
              <span className="text-[10px] text-fg-muted">
                ({row.original.scorecardCount})
              </span>
            </div>
          );
        },
      }),

      columnHelper.accessor("appliedAt", {
        id: "appliedAt",
        header: () => (
          <button
            onClick={() => handleSortToggle("appliedAt")}
            className="group flex items-center text-xs font-semibold text-fg hover:text-primary transition-colors"
          >
            Applied
            {getSortIcon("appliedAt")}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-fg-muted">
            {format(new Date(row.original.appliedAt), "MMM d, yyyy")}
          </span>
        ),
      }),
    ],
    [
      selectedIds,
      allVisibleSelected,
      someVisibleSelected,
      getSortIcon,
      handleCheckboxClick,
      handleHeaderCheckbox,
      handleSortToggle,
    ]
  );

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex-1 overflow-auto border-t border-hairline bg-panel select-none">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm border-b border-hairline">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="h-9">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-1.5 text-[11px] font-semibold text-fg-muted tracking-wider uppercase border-r border-hairline/30 last:border-r-0"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-hairline">
          {table.getRowModel().rows.map((row) => {
            const isSelected = selectedIds.includes(row.original.id);
            return (
              <tr
                key={row.id}
                onClick={() => setActiveDossierId(row.original.id)}
                className={`h-9 hover:bg-hairline/40 transition-colors cursor-pointer ${
                  isSelected ? "bg-primary/10 hover:bg-primary/15" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-1 text-xs border-r border-hairline/20 last:border-r-0 truncate max-w-[200px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}

          {applications.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="h-48 text-center text-xs text-fg-muted"
              >
                No applications match your current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
