import { build } from "esbuild";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";

// Packages are external; only our compiled NestJS code and SQL are packed.
// This keeps the reviewed multi-file source and deploys it without a GitHub repo.
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(readFileSync(resolve(apiRoot, "package-lock.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(apiRoot, "package.json"), "utf8"));
const migrations = readdirSync(resolve(apiRoot, "migrations"))
  .filter((name) => /^\d+_.+\.sql$/.test(name)).sort()
  .map((name) => [name, readFileSync(resolve(apiRoot, "migrations", name), "utf8")]);
const source = `
import {createApp} from "./dist/api/src/app.js";
import {createDatabase} from "./dist/api/src/db.js";
async function start() {
  const db = createDatabase();
  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(628195412)");
    await tx.query("CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    for (const [name, sql] of ${JSON.stringify(migrations)}) {
      const previous = await tx.query("SELECT name FROM schema_migrations WHERE name=$1",[name]);
      if (!previous.rows.length) {
        await tx.query(sql);
        await tx.query("INSERT INTO schema_migrations(name) VALUES($1)",[name]);
      }
    }
  });
  const app = await createApp(db);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000),"0.0.0.0");
  console.log("Desafio Aceito API iniciada.");
}
start().catch(() => { console.error("Falha ao iniciar API; verifique banco e configuração do serviço."); process.exit(1); });
`;
const result = await build({
  stdin: { contents: source, resolveDir: apiRoot, sourcefile: "railway-entry.js" },
  bundle: true, packages: "external", format: "cjs", platform: "node", target: "node22",
  minify: true, keepNames: true, write: false,
});
const imports = Object.keys(manifest.dependencies).map((name) => {
  const version = lock.packages[`node_modules/${name}`].version;
  return `import ${JSON.stringify(`${name}@${version}`)};`;
}).join("\n");
const compiled = result.outputFiles[0].text;
let output = `// Generated from the reviewed NestJS source. No credentials included.\n${imports}\n${compiled}`;
let compressed = false;
if (Buffer.byteLength(output) > 96 * 1024) {
  // Keep all package imports visible to Railway's dependency scanner. Only our
  // compiled source and migrations are compressed, without external downloads.
  const payload = gzipSync(Buffer.from(compiled), { level: 9 });
  if (gunzipSync(payload).toString("utf8") !== compiled) throw Error("Falha ao verificar o pacote da API.");
  output = `// Generated from the reviewed NestJS source. Gzip is packaging, not encryption. No credentials included.\n${imports}\nimport {gunzipSync} from "node:zlib";\nimport {createRequire} from "node:module";\nconst source = gunzipSync(Buffer.from(${JSON.stringify(payload.toString("base64"))},"base64")).toString("utf8");\nconst module = {exports:{}};\nnew Function("require","module","exports",source)(createRequire(import.meta.url),module,module.exports);\n`;
  compressed = true;
}
if (Buffer.byteLength(output) > 96 * 1024) throw Error("O pacote excede o limite de 96 KiB da função Railway.");
const outputDir = resolve(apiRoot, "../outputs/railway");
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "api.ts"), output);
writeFileSync(resolve(outputDir, "api.cjs"), result.outputFiles[0].text);
console.log(JSON.stringify({ file: "outputs/railway/api.ts", bytes: Buffer.byteLength(output), sourceBytes: Buffer.byteLength(compiled), compressed, migrations: migrations.length }));
