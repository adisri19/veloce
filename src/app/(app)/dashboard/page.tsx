"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { DateScopeFilter } from "@/components/dashboard/date-scope-filter";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { DwellChart } from "@/components/dashboard/dwell-chart";
import { SourceChart } from "@/components/dashboard/source-chart";
import { RequisitionHealth } from "@/components/dashboard/requisition-health";
import { NeedsAttentionQueue } from "@/components/dashboard/needs-attention-queue";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const paramFrom = searchParams.get("from") || undefined;
  const paramTo = searchParams.get("to") || undefined;
  const paramJobs = searchParams.get("jobIds") ? searchParams.get("jobIds")!.split(",") : [];
  const paramPreset = searchParams.get("preset") || "90d";

  const [filterState, setFilterState] = useState<{
    from?: string;
    to?: string;
    jobIds: string[];
    preset: string;
  }>({
    from: paramFrom,
    to: paramTo,
    jobIds: paramJobs,
    preset: paramPreset,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboard({
    from: filterState.from,
    to: filterState.to,
    jobIds: filterState.jobIds,
  });

  // Handle filter changes and sync to URL
  const handleFilterChange = (newFilters: {
    from?: string;
    to?: string;
    jobIds: string[];
    preset?: string;
  }) => {
    const updated = {
      from: newFilters.from,
      to: newFilters.to,
      jobIds: newFilters.jobIds,
      preset: newFilters.preset || "90d",
    };
    setFilterState(updated);

    const params = new URLSearchParams();
    if (updated.from) params.set("from", updated.from);
    if (updated.to) params.set("to", updated.to);
    if (updated.jobIds.length > 0) params.set("jobIds", updated.jobIds.join(","));
    if (updated.preset) params.set("preset", updated.preset);

    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Derive greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Derive dynamic insight from active dashboard data
  const bottleneck = dashboard?.velocity.find((v) => v.isBottleneck);
  const slaBreaches = dashboard?.kpis.activeSlaBreaches.total ?? 0;

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              {mounted ? `${getGreeting()}, Elena` : "Good afternoon, Elena"}
            </h1>
            {isFetching && (
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-fg-muted mt-1 font-mono">
            {mounted ? format(new Date(), "EEEE, MMMM d, yyyy") : "Recruiting Command Center"}
          </p>
        </div>

        <DateScopeFilter
          from={filterState.from}
          to={filterState.to}
          jobIds={filterState.jobIds}
          activePreset={filterState.preset}
          onChange={handleFilterChange}
        />
      </div>

      {/* Data-Derived Insight Hero Callout */}
      {dashboard && bottleneck && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500/[0.08] via-indigo-500/[0.05] to-transparent border border-rose-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-fg">
              <strong className="text-rose-400 font-semibold">
                {bottleneck.stage.replace(/_/g, " ")}
              </strong>{" "}
              is your primary bottleneck: avg{" "}
              <strong className="font-mono text-fg">{bottleneck.avgDays}d</strong> vs{" "}
              <strong className="font-mono text-sky-400">{bottleneck.slaTargetDays}d SLA</strong>.{" "}
              {slaBreaches > 0 && (
                <span>
                  <strong className="font-mono text-rose-400">{slaBreaches}</strong> candidate
                  {slaBreaches > 1 ? "s are" : " is"} overdue.
                </span>
              )}
            </span>
          </div>

          <Link
            href={`/pipeline?stages=${bottleneck.stage}&slaBreachedOnly=true`}
            className="hidden sm:flex items-center gap-1.5 font-medium text-primary hover:underline shrink-0 ml-4"
          >
            <span>Review overdue candidates in pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Content */}
      {isLoading && !dashboard ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-84 rounded-xl" />
            <Skeleton className="h-84 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : isError || !dashboard ? (
        <div className="p-12 border border-hairline rounded-xl bg-panel flex flex-col items-center justify-center gap-3">
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

          {/* 2. Charts Row: Funnel Waterfall & Velocity Bullet Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FunnelChart stages={dashboard.funnel.stages} />
            <DwellChart velocity={dashboard.velocity} />
          </div>

          {/* 3. Acquisition Quality Composed Chart */}
          <SourceChart sources={dashboard.sourceAttribution} />

          {/* 4. Requisition Health Rows */}
          <RequisitionHealth requisitions={dashboard.requisitionHealth} />

          {/* 5. Live Needs Attention Card Queue */}
          <NeedsAttentionQueue items={dashboard.needsAttention} />
        </div>
      )}
    </div>
  );
}
