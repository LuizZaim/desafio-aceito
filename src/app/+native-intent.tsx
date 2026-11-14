import { normalizeIncomingPath } from "../core/navigation";
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return normalizeIncomingPath(path) || "/";
}
