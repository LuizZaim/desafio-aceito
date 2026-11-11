import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabase } from "./db";
async function main() {
  const db = createDatabase();
  try {
    await db.query(readFileSync(resolve("migrations/001_initial.sql"), "utf8"));
    console.log("Migração 001 aplicada.");
  } finally {
    await db.close?.();
  }
}
main().catch(() => {
  console.error(
    "Falha na migração. Confira conexão e permissões do PostgreSQL.",
  );
  process.exit(1);
});
