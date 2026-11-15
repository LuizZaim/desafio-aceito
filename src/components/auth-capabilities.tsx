import { useEffect, useState } from "react";
import { request } from "../core/api";

export type AuthCapabilities = {
  google?: boolean;
  googleWebClientId?: string;
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
    request("/auth/capabilities").then((data) => {
      if (active) setCapabilities(data);
    }).catch((failure) => {
      if (active) setError(failure instanceof Error ? failure.message : "Não foi possível verificar os métodos de recuperação.");
    });
    return () => { active = false; };
  }, [attempt]);
  return { capabilities, error, retry: () => { setCapabilities(null); setError(""); setAttempt((value) => value + 1); } };
}
