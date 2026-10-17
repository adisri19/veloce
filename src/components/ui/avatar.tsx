import React, { useState } from "react";
import { clsx } from "clsx";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeStyles = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "bg-rose-500/20 text-rose-400 border-rose-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  ];
  const colorClass = colors[Math.abs(hash) % colors.length]!;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full font-semibold border overflow-hidden shrink-0 select-none",
        sizeStyles[size],
        colorClass,
        className
      )}
      title={name}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export interface AvatarStackProps {
  users: { name: string; avatarUrl?: string | null }[];
  limit?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function AvatarStack({ users, limit = 3, size = "sm", className }: AvatarStackProps) {
  const visible = users.slice(0, limit);
  const extra = users.length - limit;

  return (
    <div className={clsx("inline-flex items-center -space-x-1.5", className)}>
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.avatarUrl} size={size} className="ring-2 ring-canvas" />
      ))}
      {extra > 0 && (
        <div
          className={clsx(
            "relative inline-flex items-center justify-center rounded-full font-mono font-medium bg-panel text-fg-muted border border-hairline ring-2 ring-canvas",
            size === "xs" ? "w-5 h-5 text-[8px]" : size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
