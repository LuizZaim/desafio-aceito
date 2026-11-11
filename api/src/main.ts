import { createApp } from "./app";
import { createDatabase } from "./db";
async function main() {
  const db = createDatabase();
  const app = await createApp(db);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
  console.log("Desafio Aceito API iniciada.");
}
main().catch(() => {
  console.error(
    "Falha ao iniciar API. Confira as variáveis de ambiente e o banco de dados.",
  );
  process.exit(1);
});
