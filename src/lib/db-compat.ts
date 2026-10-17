import { isSqlite } from "./db";

/**
 * Normalizes array data from either Postgres (native array) or SQLite (JSON string).
 */
export function toList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v as string[];
  }
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Prepares array data for writing to either Postgres or SQLite.
 */
export function fromList(a: string[]): any {
  if (isSqlite) {
    return JSON.stringify(a || []);
  }
  return a || [];
}

/**
 * Normalizes input JSON object/data for either Postgres or SQLite.
 */
export function jsonIn(v: unknown): any {
  if (v === null || v === undefined) {
    return null;
  }
  if (isSqlite) {
    return typeof v === "string" ? v : JSON.stringify(v);
  }
  return v;
}

/**
 * Normalizes output JSON object from either Postgres or SQLite.
 */
export function jsonOut<T = any>(v: unknown): T {
  if (v === null || v === undefined) {
    return v as T;
  }
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  }
  return v as T;
}
