import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabase } from "./db";
async function main() {
  const db = createDatabase();
  try {
    if (!db.transaction) throw Error("Banco sem suporte transacional.");
    await db.transaction(async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock(628195412)");
      await tx.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
      for (const file of readdirSync(resolve("migrations")).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()) {
        const applied = await tx.query("SELECT name FROM schema_migrations WHERE name=$1", [file]);
        if (applied.rows.length) continue;
        await tx.query(readFileSync(resolve("migrations", file), "utf8"));
        await tx.query("INSERT INTO schema_migrations(name) VALUES($1)", [file]);
        console.log(`Migração ${file} aplicada.`);
      }
    });
  } finally { await db.close?.(); }
}
main().catch(() => {
  console.error("Falha na migração. Confira conexão e permissões do PostgreSQL.");
  process.exit(1);
});
