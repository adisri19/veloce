import { PrismaClient as PostgresPrismaClient } from "@prisma/client";

// Global declaration to prevent multiple client instances during dev hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __veloce_prisma__: PostgresPrismaClient | undefined;
}

export const isSqlite =
  process.env.DATABASE_URL?.startsWith("file:") ||
  process.env.DATABASE_URL?.includes(".db");

export function createPrismaClient(): PostgresPrismaClient {
  if (isSqlite) {
    try {
      // Dynamic require of generated sqlite client
      // eslint-disable-next-line
      const { PrismaClient: SqlitePrismaClient } = require(".prisma/client-sqlite");
      return new SqlitePrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      }) as unknown as PostgresPrismaClient;
    } catch {
      // Fallback if client-sqlite is not yet generated or imported differently
      return new PostgresPrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    }
  }

  return new PostgresPrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrismaClient(): PostgresPrismaClient {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!global.__veloce_prisma__) {
    global.__veloce_prisma__ = createPrismaClient();
  }

  return global.__veloce_prisma__;
}

export const prisma: PostgresPrismaClient = getPrismaClient();
