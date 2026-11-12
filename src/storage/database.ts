import * as SQLite from "expo-sqlite";
import { initialState, freshState, type State } from "../core/domain";
let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;
const database = () =>
  (dbPromise ??= SQLite.openDatabaseAsync("desafio-aceito.db"));
export async function loadState(space = "demo-v1") {
  const db = await database();
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_state (id TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);",
  );
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM local_state WHERE id = ?",
    space,
  );
  return row ? (JSON.parse(row.value) as State) : space === "team-local-v1" ? freshState() : initialState();
}
export async function saveState(state: State, space = "demo-v1") {
  const db = await database();
  await db.runAsync(
    "INSERT INTO local_state (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, version=local_state.version+1",
    space,
    JSON.stringify(state),
  );
}

export async function getLocalSession() {
  await loadState();
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM local_state WHERE id = ?", "active-local");
  return row?.value === "true";
}
export async function setLocalSession(active: boolean) {
  await loadState();
  const db = await database();
  await db.runAsync("INSERT INTO local_state (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value", "active-local", String(active));
}
export async function hasLocalTeam() {
  await loadState();
  const db = await database();
  return !!(await db.getFirstAsync("SELECT id FROM local_state WHERE id = ?", "team-local-v1"));
}
