import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const canonicalPath = path.join(rootDir, "prisma", "schema.prisma");
const sqlitePath = path.join(rootDir, "prisma", "schema.sqlite.prisma");

export function generateSqliteSchema(): void {
  const content = fs.readFileSync(canonicalPath, "utf-8");

  // 1. Find all enums
  const enumMatches = [...content.matchAll(/enum\s+(\w+)\s*\{([^}]+)\}/g)];
  const enumNames = new Set(enumMatches.map((m) => m[1]));

  // Build enum values map if needed for default value replacement
  const enumDefaults: Record<string, string[]> = {};
  for (const m of enumMatches) {
    const name = m[1];
    const vals = (m[2] || "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("//"));
    if (name) {
      enumDefaults[name] = vals;
    }
  }

  let result = content;

  // 2. Adjust generator client
  result = result.replace(
    /generator\s+client\s*\{[\s\S]*?\}/,
    `generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-sqlite"
}`
  );

  // 3. Adjust datasource db
  result = result.replace(
    /datasource\s+db\s*\{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );

  // 4. Strip @db.* annotations
  result = result.replace(/@db\.\w+/g, "");

  // 5. Replace String[] with String @default("[]")
  result = result.replace(/(\w+)\s+String\[\]/g, '$1 String @default("[]")');

  // 6. Replace Json? with String? and Json with String @default("{}")
  result = result.replace(/(\w+)\s+Json\?/g, "$1 String?");
  result = result.replace(/(\w+)\s+Json/g, '$1 String @default("{}")');

  // 7. Replace enum fields with String and convert @default(ENUM_VAL) to @default("ENUM_VAL")
  for (const enumName of enumNames) {
    // Optional enum field with default or without
    // Regex for field using enum: name EnumName? or name EnumName @default(...)
    const enumFieldWithDefaultRegex = new RegExp(
      `(\\b\\w+\\s+)${enumName}\\b(\\??)\\s+@default\\((\\w+)\\)`,
      "g"
    );
    result = result.replace(
      enumFieldWithDefaultRegex,
      `$1String$2 @default("$3")`
    );

    const enumFieldRegex = new RegExp(`(\\b\\w+\\s+)${enumName}\\b(\\??)`, "g");
    result = result.replace(enumFieldRegex, `$1String$2`);
  }

  // 8. Remove all enum definitions
  result = result.replace(/enum\s+\w+\s*\{[\s\S]*?\}/g, "");

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(sqlitePath, result.trim() + "\n", "utf-8");
  console.log(`Successfully generated ${sqlitePath} from ${canonicalPath}`);
}

if (require.main === module || process.argv[1]?.endsWith("make-sqlite-schema.ts")) {
  generateSqliteSchema();
}
