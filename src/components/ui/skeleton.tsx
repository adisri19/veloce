import React from "react";
import { clsx } from "clsx";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("animate-pulse bg-hairline/60 rounded", className)}
      {...props}
    />
  );
}

export function CandidateCardSkeleton() {
  return (
    <div className="p-3 bg-card border border-hairline rounded-md flex flex-col gap-2.5 h-[126px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-16 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-10 h-5 rounded" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="w-14 h-4 rounded" />
        <Skeleton className="w-12 h-4 rounded" />
        <Skeleton className="w-10 h-4 rounded" />
      </div>
      <div className="flex items-center justify-between mt-auto">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-14 h-4 rounded" />
      </div>
    </div>
  );
}

export function DataGridRowSkeleton() {
  return (
    <div className="flex items-center px-4 py-2 border-b border-hairline h-[36px] gap-4">
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-32 h-3" />
      <Skeleton className="w-28 h-3" />
      <Skeleton className="w-16 h-3" />
      <Skeleton className="w-12 h-4 rounded" />
      <Skeleton className="w-14 h-4 rounded" />
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="p-5 bg-panel border border-hairline rounded-lg flex flex-col gap-3 min-h-[130px]">
      <div className="flex items-center justify-between">
        <Skeleton className="w-28 h-3.5" />
        <Skeleton className="w-14 h-5 rounded" />
      </div>
      <Skeleton className="w-20 h-8" />
      <Skeleton className="w-36 h-3" />
    </div>
  );
}
