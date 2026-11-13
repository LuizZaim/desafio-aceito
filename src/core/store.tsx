import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Alert, AppState } from "react-native";
import {
  loadState,
  saveState,
  getLocalSession,
  setLocalSession,
  hasLocalTeam,
} from "../storage/database";
import { initialState, freshState, transition, teams as demoTeams, type State, type Team } from "./domain";
import { getToken, setToken, request, ApiError } from "./api";
import { WorkspaceSession, type WorkspaceSnapshot } from "./workspace-session";
import type { ArbitrationState } from "./arbitration";

type Mode = "none" | "demo" | "online" | "local";
interface Store {
  state: State;
  teams: Team[];
  arbitration: ArbitrationState;
  currentTeamId: string | null;
  ready: boolean;
  error: string;
  syncError: string;
  syncing: boolean;
  lastSyncedAt: number | null;
  busy: boolean;
  mode: Mode;
  dispatch: (action: any) => Promise<boolean>;
  demo: () => Promise<void>;
  local: () => Promise<void>;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}
const Context = createContext<Store>(null!);
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Não foi possível atualizar os dados. Tente novamente.";

export function Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState),
    [onlineTeams, setOnlineTeams] = useState<Team[]>([]),
    [arbitration, setArbitration] = useState<ArbitrationState>({ profile: null, professionals: [], invites: [] }),
    [currentTeamId, setCurrentTeamId] = useState<string | null>(null),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<Mode>("none"),
    [error, setError] = useState(""),
    [syncError, setSyncError] = useState(""),
    [syncing, setSyncing] = useState(false),
    [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const stateRef = useRef(state);
  const modeRef = useRef<Mode>("none");
  const sessionEpoch = useRef(0);
  const mounted = useRef(true);
  const online = useRef<WorkspaceSession | null>(null);
  const commitOnline = useCallback((data: WorkspaceSnapshot) => {
      if (!mounted.current) return;
      stateRef.current = data.state;
      setState(data.state);
      setOnlineTeams(data.teams);
      setArbitration(data.arbitration);
      setCurrentTeamId(data.currentTeamId);
      setLastSyncedAt(Date.now());
      setSyncError("");
      setError("");
    }, []);
  const changeMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
  }, []);
  const invalidateEpoch = useCallback(() => {
    sessionEpoch.current++;
  }, []);
  const resetSession = useCallback(() => {
    invalidateEpoch();
    online.current!.reset();
    setOnlineTeams([]);
    setArbitration({ profile: null, professionals: [], invites: [] });
    setCurrentTeamId(null);
    setLastSyncedAt(null);
    setSyncError("");
    setSyncing(false);
    setError("");
  }, [invalidateEpoch]);
  const applyLocal = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const refreshOnline = useCallback(async () => {
    const epoch = sessionEpoch.current;
    setSyncing(true);
    try {
      await online.current!.refresh();
    } catch (failure) {
      if (epoch !== sessionEpoch.current || !mounted.current) return;
      if (failure instanceof ApiError && failure.status === 401) {
        resetSession();
        await setToken(null);
        await setLocalSession(false);
        if (mounted.current) {
          changeMode("none");
          applyLocal(freshState());
        }
      } else {
        setSyncError(errorText(failure));
        throw failure;
      }
    } finally {
      if (epoch === sessionEpoch.current && mounted.current) setSyncing(false);
    }
  }, [applyLocal, changeMode, resetSession]);

  async function reload() {
    if (lock.current) return;
    const epoch = sessionEpoch.current;
    try {
      setError("");
      if (await getToken()) {
        if (epoch !== sessionEpoch.current) return;
        await refreshOnline();
        const token = await getToken();
        if (epoch === sessionEpoch.current && token) changeMode("online");
      } else {
        const isLocal = await getLocalSession();
        const next = await loadState(isLocal ? "team-local-v1" : "demo-v1");
        if (epoch !== sessionEpoch.current) return;
        applyLocal(next);
        changeMode(isLocal ? "local" : modeRef.current === "demo" ? "demo" : "none");
      }
    } catch (failure) {
      // Keep the last successful screen available during a temporary outage.
      if (epoch === sessionEpoch.current && modeRef.current !== "online")
        setError(errorText(failure));
    } finally {
      if (epoch === sessionEpoch.current) setReady(true);
    }
  }

  useEffect(() => {
    const workspace = new WorkspaceSession(request, commitOnline);
    online.current = workspace;
    mounted.current = true;
    const epoch = sessionEpoch.current;
    let active = true;
    async function initialize() {
      const token = await getToken();
      if (!active) return;
      if (token) {
        await refreshOnline();
        const currentToken = await getToken();
        if (active && epoch === sessionEpoch.current && currentToken)
          changeMode("online");
        return;
      }
      const isLocal = await getLocalSession();
      const next = await loadState(isLocal ? "team-local-v1" : "demo-v1");
      if (active && epoch === sessionEpoch.current) {
        applyLocal(next);
        changeMode(isLocal ? "local" : "none");
      }
    }
    initialize()
      .catch((failure) => {
        if (active && epoch === sessionEpoch.current) setError(errorText(failure));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      mounted.current = false;
      invalidateEpoch();
      workspace.reset();
    };
  }, [applyLocal, changeMode, commitOnline, invalidateEpoch, refreshOnline]);

  useEffect(() => {
    if (mode !== "online") return;
    const refresh = () => {
      if (!lock.current && AppState.currentState === "active")
        void refreshOnline().catch(() => {});
    };
    const timer = setInterval(refresh, 8000);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [mode, refreshOnline]);

  async function dispatch(action: any) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    const epoch = sessionEpoch.current;
    try {
      if (modeRef.current === "online") {
        const updated = await online.current!.update(action);
        return updated !== null;
      }
      if (modeRef.current === "none")
        throw Error("Abra sua equipe ou entre na demonstração para continuar.");
      const next = transition(stateRef.current, action);
      await saveState(next.state, modeRef.current === "local" ? "team-local-v1" : "demo-v1");
      if (epoch !== sessionEpoch.current) return false;
      applyLocal(next.state);
      return true;
    } catch (failure) {
      if (epoch !== sessionEpoch.current) return false;
      if (failure instanceof ApiError && failure.status === 401) {
        resetSession();
        await setToken(null);
        await setLocalSession(false);
        changeMode("none");
        applyLocal(freshState());
      } else if (failure instanceof ApiError && failure.status === 409) {
        // Refresh conflicting data, but never repeat a possibly committed write.
        await refreshOnline().catch(() => {});
      }
      Alert.alert("Não foi possível concluir", errorText(failure));
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function login(email: string, password: string, name?: string) {
    if (lock.current) throw Error("Aguarde a operação anterior terminar.");
    lock.current = true;
    setBusy(true);
    resetSession();
    const epoch = sessionEpoch.current;
    try {
      const result = await request(
        name ? "/auth/register" : "/auth/login",
        "POST",
        { email, password, name },
      );
      if (epoch !== sessionEpoch.current) throw Error("Operação cancelada. Entre novamente.");
      await setToken(result.token);
      await refreshOnline();
      if (!await getToken()) throw Error("Sua sessão expirou. Entre novamente.");
      await setLocalSession(false);
      if (epoch !== sessionEpoch.current) throw Error("Operação cancelada. Entre novamente.");
      changeMode("online");
    } catch (failure) {
      if (epoch === sessionEpoch.current) {
        await setToken(null);
        resetSession();
      }
      throw failure;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function logout() {
    if (lock.current) throw Error("Aguarde a operação anterior terminar.");
    lock.current = true;
    setBusy(true);
    const wasOnline = modeRef.current === "online";
    resetSession();
    try {
      if (wasOnline) await request("/auth/logout", "POST");
    } catch {
      // Local sign-out still works offline; server sessions expire independently.
    } finally {
      await setToken(null);
      await setLocalSession(false);
      changeMode("none");
      applyLocal(freshState());
      lock.current = false;
      setBusy(false);
    }
  }
  async function local() {
    if (lock.current) throw Error("Aguarde a operação anterior terminar.");
    lock.current = true;
    setBusy(true);
    resetSession();
    const epoch = sessionEpoch.current;
    try {
      await setToken(null);
      const next = await hasLocalTeam() ? await loadState("team-local-v1") : freshState();
      if (epoch !== sessionEpoch.current) return;
      await saveState(next, "team-local-v1");
      await setLocalSession(true);
      if (epoch !== sessionEpoch.current) return;
      applyLocal(next);
      changeMode("local");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function demo() {
    if (lock.current) throw Error("Aguarde a operação anterior terminar.");
    lock.current = true;
    setBusy(true);
    resetSession();
    const epoch = sessionEpoch.current;
    try {
      await setToken(null);
      const next = await loadState();
      await setLocalSession(false);
      if (epoch !== sessionEpoch.current) return;
      applyLocal(next);
      changeMode("demo");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{
      state,
      teams: mode === "demo" || mode === "local" ? demoTeams : mode === "online" ? onlineTeams : [],
      arbitration,
      currentTeamId,
      ready,
      error,
      syncError,
      syncing,
      lastSyncedAt,
      busy,
      mode,
      dispatch,
      demo,
      local,
      login,
      logout,
      reload,
    }}>
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
