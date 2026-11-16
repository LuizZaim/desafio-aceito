import { useEffect, useState } from "react";
import { request } from "../core/api";

export type AuthCapabilities = {
  passwordRecovery: boolean;
  emailChange: boolean;
  passwordChange: boolean;
  recoveryCodes?: boolean;
};
export function useAuthCapabilities() {
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // API gratuita dorme: tenta de novo sozinha a cada 6 s até acordar (máx. 12 vezes).
    const load = (left: number) => {
      request("/auth/capabilities").then((data) => {
        if (active) { setError(""); setCapabilities(data); }
      }).catch((failure) => {
        if (!active) return;
        if (left > 0) { timer = setTimeout(() => load(left - 1), 6000); return; }
        setError(failure instanceof Error ? failure.message : "Não foi possível verificar os métodos de recuperação.");
      });
    };
    load(12);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [attempt]);
  return { capabilities, error, retry: () => { setCapabilities(null); setError(""); setAttempt((value) => value + 1); } };
}
