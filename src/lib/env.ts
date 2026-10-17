import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  DIRECT_URL: z.string().optional(),
  WEBHOOK_SIGNING_SECRET: z.string().default("veloce_default_secret_key_2026"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const isServer = typeof window === "undefined";
const parsed = envSchema.safeParse(isServer ? process.env : {});

if (!parsed.success) {
  if (isServer) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: "file:./dev.db",
      WEBHOOK_SIGNING_SECRET: "veloce_default_secret_key_2026",
      NODE_ENV: "development" as const,
    };
