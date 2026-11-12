// Adapter exclusivo da prévia web de QA. Android/iOS usam SQLite em database.ts.
import { initialState, freshState, type State } from "../core/domain";
export async function loadState(space = "demo-v1"): Promise<State> {
  const data =
    typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(space === "demo-v1" ? "da-demo-state" : space);
  return data ? JSON.parse(data) : space === "team-local-v1" ? freshState() : initialState();
}
export async function saveState(state: State, space = "demo-v1") {
  localStorage.setItem(space === "demo-v1" ? "da-demo-state" : space, JSON.stringify(state));
}

export const getLocalSession = async () => localStorage.getItem("da-active-local") === "true";
export const setLocalSession = async (active: boolean) => { localStorage.setItem("da-active-local", String(active)); };
export const hasLocalTeam = async () => !!localStorage.getItem("team-local-v1");
