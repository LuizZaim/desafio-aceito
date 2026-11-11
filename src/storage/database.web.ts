// Adapter exclusivo da prévia web de QA. Android/iOS usam SQLite em database.ts.
import { initialState, type State } from "../core/domain";
export async function loadState(): Promise<State> {
  const data =
    typeof localStorage === "undefined"
      ? null
      : localStorage.getItem("da-demo-state");
  return data ? JSON.parse(data) : initialState();
}
export async function saveState(state: State) {
  localStorage.setItem("da-demo-state", JSON.stringify(state));
}
