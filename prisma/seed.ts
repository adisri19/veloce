import { runSeed } from "../src/lib/seed/run-seed";

async function main() {
  const isReset = process.argv.includes("--reset");
  await runSeed({ reset: isReset });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
