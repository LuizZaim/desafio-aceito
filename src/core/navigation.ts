import type { State } from "./domain";
import type { ArbitrationState } from "./arbitration";

/** Route params are untrusted: duplicate keys must not silently select an identity. */
export function routeId(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value)
    ? value : undefined;
}

export function routeToken(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value)
    ? value : undefined;
}

const publicPaths = new Set(["/", "/cadastro", "/recuperar", "/confirmar-email"]);
const plainPaths = new Set([
  ...publicPaths, "/editar", "/arbitragem", "/configuracoes", "/conta",
  "/notificacoes", "/filtros", "/pagamentos", "/cartoes", "/assinaturas", "/jogadores",
]);
const entityPaths = new Set(["/equipe", "/chat", "/agendar", "/partida", "/avaliar"]);
const tabs = new Set(["descobrir", "matches", "agenda", "ranking", "perfil"]);

/** Only return app-owned paths; never trust next/redirect URLs from an incoming link. */
export function normalizeIncomingPath(value: unknown, trustedWebOrigin?: string): string | null {
  if (typeof value !== "string" || value.length > 2048 || /[\\\u0000-\u0020]/.test(value)) return null;
  try {
    const beforeQuery = value.split(/[?#]/)[0];
    const decoded = decodeURIComponent(beforeQuery);
    if (decoded.split("/").some((part) => part === "." || part === "..")) return null;
    let url: URL;
    let pathname: string;
    if (value.startsWith("/") && !value.startsWith("//")) {
      url = new URL(value, "https://app.invalid");
      pathname = url.pathname;
    } else {
      url = new URL(value);
      if (url.protocol === "desafioaceito:") {
        if (url.username || url.password || url.port) return null;
        pathname = (url.hostname ? "/" + url.hostname : "") + url.pathname;
      } else if (
        trustedWebOrigin && ["https:", "http:"].includes(url.protocol) &&
        url.origin === new URL(trustedWebOrigin).origin && !url.username && !url.password
      ) pathname = url.pathname;
      else return null;
    }
    pathname = decodeURIComponent(pathname).replace(/\/$/, "") || "/";
    const tab = pathname.replace(/^\/\(tabs\)\//, "").replace(/^\//, "");
    if (tabs.has(tab)) return "/(tabs)/" + tab;
    if (entityPaths.has(pathname)) {
      const values = url.searchParams.getAll("id");
      if (!values.length && ["/equipe", "/agendar"].includes(pathname)) return pathname;
      const id = values.length === 1 ? routeId(values[0]) : undefined;
      return id ? `${pathname}?id=${encodeURIComponent(id)}` : null;
    }
    if (!plainPaths.has(pathname)) return null;
    if (["/recuperar", "/confirmar-email"].includes(pathname)) {
      const values = url.searchParams.getAll("token");
      if (!values.length) return pathname;
      const token = values.length === 1 ? routeToken(values[0]) : undefined;
      return token ? `${pathname}?token=${encodeURIComponent(token)}` : null;
    }
    return pathname;
  } catch {
    return null;
  }
}

/** Pending destinations never retain recovery/confirmation credentials. */
export function protectedDestination(value: unknown, trustedWebOrigin?: string): string | null {
  const path = normalizeIncomingPath(value, trustedWebOrigin);
  return path && !publicPaths.has(path.split("?")[0]) ? path : null;
}

export function destinationPath(value: string): string {
  return value.split("?")[0].replace(/^\/\(tabs\)/, "");
}

export function postLoginDestination(input: {
  mode: "none" | "online" | "local" | "demo";
  state: State;
  arbitration: ArbitrationState;
  pendingDestination?: string | null;
}): string {
  if (input.mode === "none") return "/";
  const pending = protectedDestination(input.pendingDestination);
  if (input.state.teamRegistered === false) {
    if (pending === "/arbitragem" || pending === "/editar" ||
      (input.mode === "online" && pending === "/conta")) return pending;
    return input.mode === "online" && input.arbitration.profile ? "/arbitragem" : "/editar";
  }
  if (pending && !(pending === "/conta" && input.mode !== "online")) return pending;
  return "/(tabs)/descobrir";
}
