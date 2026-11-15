import { Pool } from "pg";
export interface Database {
  query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number | null }>;
  transaction?<T>(run: (tx: Database) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
export function createDatabase(): Database {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL precisa estar configurada.");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX) || 5, connectionTimeoutMillis: 20000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
  // O Neon derruba conexões ociosas; sem este listener o erro derrubaria o processo.
  pool.on("error", (error) => console.error("pool-idle-error", (error as any)?.code || error.name));
  return {
    query: (sql, p) => pool.query(sql, p), close: () => pool.end(),
    transaction: async (run) => {
      const client = await pool.connect();
      let broken = false;
      try {
        await client.query("BEGIN");
        const result = await run({ query: (sql, p) => client.query(sql, p) });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch { broken = true; }
        throw error;
      } finally { client.release(broken || undefined); }
    },
  };
}
