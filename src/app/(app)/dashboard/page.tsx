"use client";

import React, { useState } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { DateScopeFilter } from "@/components/dashboard/date-scope-filter";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { DwellChart } from "@/components/dashboard/dwell-chart";
import { SourceChart } from "@/components/dashboard/source-chart";
import { RequisitionHealth } from "@/components/dashboard/requisition-health";
import { NeedsAttentionQueue } from "@/components/dashboard/needs-attention-queue";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [filterState, setFilterState] = useState<{
    from?: string;
    to?: string;
    jobIds: string[];
  }>({
    jobIds: [],
  });

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboard(filterState);

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-fg">
              Executive Recruiting Command Center
            </h1>
            {isFetching && (
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Real-time pipeline analytics, SLA tracking, and hiring velocity metrics
          </p>
        </div>

        <DateScopeFilter
          from={filterState.from}
          to={filterState.to}
          jobIds={filterState.jobIds}
          onChange={(newFilters) => setFilterState(newFilters)}
        />
      </div>

      {isLoading && !dashboard ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : isError || !dashboard ? (
        <div className="p-8 border border-hairline rounded-lg bg-panel flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-danger" />
          <span className="text-sm font-semibold text-fg">
            Failed to load recruiting analytics
          </span>
          <span className="text-xs text-fg-muted">
            {(error as Error)?.message || "Please check database connection"}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 1. Top KPI Bento Grid */}
          <KpiGrid kpis={dashboard.kpis} />

          {/* 2. Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FunnelChart stages={dashboard.funnel.stages} />
            <DwellChart velocity={dashboard.velocity} />
          </div>

          <SourceChart sources={dashboard.sourceAttribution} />

          {/* 3. Requisition Health Table */}
          <RequisitionHealth requisitions={dashboard.requisitionHealth} />

          {/* 4. Live Needs Attention Queue */}
          <NeedsAttentionQueue items={dashboard.needsAttention} />
        </div>
      )}
    </div>
  );
}
