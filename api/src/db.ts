import { Pool } from "pg";
export interface Database {
  query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number | null }>;
  transaction?<T>(run: (tx: Database) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
export function createDatabase(): Database {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL precisa estar configurada.");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
  return {
    query: (sql, p) => pool.query(sql, p), close: () => pool.end(),
    transaction: async (run) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await run({ query: (sql, p) => client.query(sql, p) });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    },
  };
}
