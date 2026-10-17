"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 15,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--panel)",
            color: "var(--fg)",
            border: "1px solid var(--hairline)",
            fontSize: "13px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
