"use client";

import React from "react";
import { Avatar } from "./avatar";
import { clsx } from "clsx";

export interface AvatarStackItem {
  id?: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AvatarStackProps {
  users: AvatarStackItem[];
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function AvatarStack({
  users,
  max = 3,
  size = "xs",
  className,
}: AvatarStackProps) {
  const visible = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className={clsx("flex items-center -space-x-1.5", className)}>
      {visible.map((u, i) => (
        <div key={u.id || `${u.name}-${i}`} className="ring-2 ring-canvas rounded-full shrink-0">
          <Avatar name={u.name} src={u.avatarUrl} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <span
          className={clsx(
            "flex items-center justify-center rounded-full bg-hairline font-mono font-bold text-fg-muted ring-2 ring-canvas shrink-0",
            size === "xs" ? "w-5 h-5 text-[9px]" : size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
          )}
          title={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
