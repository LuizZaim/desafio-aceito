import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Alert } from "react-native";
import { loadState, saveState } from "../storage/database";
import { initialState, transition, type State } from "./domain";
import { getToken, setToken, request, ApiError } from "./api";
interface Store {
  state: State;
  ready: boolean;
  error: string;
  busy: boolean;
  mode: "none" | "demo" | "online";
  dispatch: (action: any) => Promise<boolean>;
  demo: () => void;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}
const Context = createContext<Store>(null!);
export function Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<Store["mode"]>("none"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const version = useRef(0);
  async function reload() {
    try {
      const token = await getToken();
      setError("");
      if (token) {
        const data = await request("/state");
        setState(data.state);
        version.current = data.version;
        setMode("online");
      } else setState(await loadState());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await setToken(null);
        setState(await loadState());
        setMode("none");
      } else setError("Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    let active = true;
    async function initialize() {
      const token = await getToken();
      if (token) {
        try {
          return { ...(await request("/state")), mode: "online" as const };
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) await setToken(null);
          else throw e;
        }
      }
      return { state: await loadState(), version: 0, mode: "none" as const };
    }
    initialize()
      .then((data) => {
        if (active) {
          setState(data.state);
          version.current = data.version;
          setMode(data.mode);
        }
      })
      .catch(() => {
        if (active)
          setError("Não foi possível carregar os dados. Tente novamente.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  async function dispatch(action: any) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      if (mode === "online") {
        const data = await request("/state", "POST", {
          action,
          version: version.current,
        });
        setState(data.state);
        version.current = data.version;
        return true;
      }
      const next = transition(state, action);
      await saveState(next.state);
      setState(next.state);
      return true;
    } catch (e) {
      Alert.alert(
        "Não foi possível concluir",
        e instanceof Error ? e.message : "Tente novamente.",
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function login(email: string, password: string, name?: string) {
    const result = await request(
      name ? "/auth/register" : "/auth/login",
      "POST",
      { email, password, name },
    );
    await setToken(result.token);
    try {
      const data = await request("/state");
      setState(data.state);
      version.current = data.version;
      setMode("online");
    } catch (e) {
      await setToken(null);
      throw e;
    }
  }
  async function logout() {
    if (mode === "online") {
      try {
        await request("/auth/logout", "POST");
      } catch {
        // O logout local continua disponível mesmo sem rede. O token expira no servidor.
      } finally {
        await setToken(null);
      }
    }
    setMode("none");
    setState(await loadState());
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        error,
        busy,
        mode,
        dispatch,
        demo: () => setMode("demo"),
        login,
        logout,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
