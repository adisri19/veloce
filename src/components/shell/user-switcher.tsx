"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Check, UserCircle2 } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { useUiStore } from "@/stores/ui-store";

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  department: string;
}

export function UserSwitcher() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const activeActorId = useUiStore((s) => s.activeActorId);
  const setActiveActorId = useUiStore((s) => s.setActiveActorId);

  const { data: users = [] } = useQuery<UserItem[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const currentUser =
    users.find((u) => u.id === activeActorId) ||
    users.find((u) => u.role === "RECRUITER") ||
    users[0];

  const handleSelectUser = (user: UserItem) => {
    setActiveActorId(user.id);
    document.cookie = `veloce_uid=${encodeURIComponent(user.id)}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    queryClient.invalidateQueries();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-hairline/40 border border-hairline/60 transition-colors text-left"
      >
        <Avatar name={currentUser?.name || "User"} src={currentUser?.avatarUrl} size="sm" />
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-fg leading-none truncate max-w-[120px]">
            {currentUser?.name || "Elena Sokolova"}
          </span>
          <span className="text-[10px] text-fg-muted uppercase tracking-wider font-mono mt-0.5">
            {currentUser?.role?.replace("_", " ") || "RECRUITER"}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-fg-muted shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 bg-panel border border-hairline rounded-md shadow-xl py-1 z-50 flex flex-col">
            <div className="px-3 py-1.5 border-b border-hairline text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              Switch Persona (RBAC Demo)
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {users.map((u) => {
                const isSelected = u.id === currentUser?.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-hairline/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-medium text-fg">{u.name}</span>
                        <span className="text-[10px] text-fg-muted font-mono">
                          {u.role.replace("_", " ")} • {u.department}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
