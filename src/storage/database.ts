import * as SQLite from "expo-sqlite";
import { initialState, type State } from "../core/domain";
let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;
const database = () =>
  (dbPromise ??= SQLite.openDatabaseAsync("desafio-aceito.db"));
export async function loadState() {
  const db = await database();
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_state (id TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);",
  );
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM local_state WHERE id = ?",
    "demo-v1",
  );
  return row ? (JSON.parse(row.value) as State) : initialState();
}
export async function saveState(state: State) {
  const db = await database();
  await db.runAsync(
    "INSERT INTO local_state (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, version=local_state.version+1",
    "demo-v1",
    JSON.stringify(state),
  );
}
