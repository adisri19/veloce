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
  
  const statements = [
    `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
    `CREATE INDEX IF NOT EXISTS candidate_fts_idx ON "Candidate" USING GIN (to_tsvector('english', coalesce("fullName",'') || ' ' || coalesce("email",'') || ' ' || coalesce("currentTitle",'') || ' ' || coalesce("currentCompany",'') || ' ' || coalesce("parsedResumeText",'')));`,
    `CREATE INDEX IF NOT EXISTS candidate_name_trgm_idx ON "Candidate" USING GIN ("fullName" gin_trgm_ops);`,
    `CREATE INDEX IF NOT EXISTS note_fts_idx ON "CandidateNote" USING GIN (to_tsvector('english', "content"));`,
    `CREATE OR REPLACE FUNCTION forbid_audit_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END; $$ LANGUAGE plpgsql;`,
    `DROP TRIGGER IF EXISTS audit_no_update ON "AuditLog";`,
    `CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();`,
  ];

  for (const stmt of statements) {
    try {
      await (prisma as any).$executeRawUnsafe(stmt);
    } catch (err: any) {
      console.warn("Notice executing statement:", err.message);
    }
  }
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
