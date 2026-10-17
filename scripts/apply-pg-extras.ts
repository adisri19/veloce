import fs from "fs";
import path from "path";
import { getPrismaClient, isSqlite } from "../src/lib/db";

async function main() {
  if (isSqlite) {
    console.log("SQLite mode detected. Skipping Postgres-only SQL extras.");
    return;
  }

  const sqlFile = path.join(process.cwd(), "prisma", "sql", "001_search.sql");
  if (!fs.existsSync(sqlFile)) {
    console.log("No 001_search.sql file found. Skipping.");
    return;
  }

  const sql = fs.readFileSync(sqlFile, "utf-8");
  const prisma = getPrismaClient();

  console.log("Applying Postgres SQL extensions, indexes, and immutability triggers...");
  // Split statements by semicolon or execute as block
  await (prisma as any).$executeRawUnsafe(sql);
  console.log("Successfully applied Postgres extras.");
}

if (require.main === module || process.argv[1]?.endsWith("apply-pg-extras.ts")) {
  main()
    .catch((err) => {
      console.error("Error applying PG extras:", err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
