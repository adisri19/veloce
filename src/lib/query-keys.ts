export const queryKeys = {
  applications: {
    all: ["applications"] as const,
    list: (filters: Record<string, unknown>) => ["applications", "list", filters] as const,
    detail: (id: string) => ["applications", "detail", id] as const,
  },
  candidates: {
    all: ["candidates"] as const,
    list: (filters: Record<string, unknown>) => ["candidates", "list", filters] as const,
    detail: (id: string) => ["candidates", "detail", id] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (filters?: Record<string, unknown>) => ["jobs", "list", filters] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    dashboard: (filters: Record<string, unknown>) => ["analytics", "dashboard", filters] as const,
  },
  notes: {
    list: (applicationId: string) => ["notes", applicationId] as const,
  },
  interviews: {
    list: (applicationId: string) => ["interviews", applicationId] as const,
  },
  users: {
    all: ["users"] as const,
  },
  search: {
    global: (query: string) => ["search", "global", query] as const,
  },
};
