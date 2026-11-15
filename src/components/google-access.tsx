import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { ApiError } from "../core/api";
import { useStore } from "../core/store";
import { googleNativeAvailability, nativeGoogleToken } from "../core/google-signin";
import { useAuthCapabilities } from "./auth-capabilities";
import { Button, Input, Note, Txt } from "./ui";

export function GoogleAccess({ disabled, onBusy }: { disabled: boolean; onBusy: (busy: boolean) => void }) {
  const { loginGoogle } = useStore();
  const { capabilities, error: loadingError, retry } = useAuthCapabilities();
  const [working, setWorking] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const unavailable = googleNativeAvailability();
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener("change", (next) => {
      if (next !== "active") { setIdToken(null); setPassword(""); setConfirmation(""); }
    });
    return () => { mounted.current = false; listener.remove(); };
  }, []);
  async function enter() {
    if (working) return;
    if (idToken && (password.length < 8 || password.length > 128 || password !== confirmation)) {
      setError("Informe uma senha de 8 a 128 caracteres e repita a mesma senha."); return;
    }
    setWorking(true); onBusy(true); setError("");
    let candidate: string | null = idToken;
    try {
      if (!candidate) candidate = await nativeGoogleToken(capabilities?.googleWebClientId || "");
      if (!candidate || !mounted.current) return;
      await loginGoogle(candidate, idToken ? password : undefined);
      if (mounted.current) { setIdToken(null); setPassword(""); setConfirmation(""); }
    } catch (failure) {
      if (!mounted.current) return;
      if (failure instanceof ApiError && failure.status === 428 && candidate) {
        setIdToken(candidate); setError("");
      } else {
        setError(failure instanceof Error ? failure.message : "Não foi possível entrar com Google.");
        if (failure instanceof ApiError && [401, 409].includes(failure.status)) {
          setIdToken(null); setPassword(""); setConfirmation("");
        }
      }
    } finally {
      if (mounted.current) { setWorking(false); onBusy(false); }
    }
  }
  return <View style={{ gap: 12, marginTop: 18 }}>
    {!!loadingError && <><Txt accessibilityRole="alert">{loadingError}</Txt><Button secondary title="Verificar acesso Google" disabled={disabled} onPress={retry} /></>}
    {!!idToken && <>
      <Note>Confirme o vínculo com sua senha do Desafio Aceito. Se este é seu primeiro acesso, crie uma senha para a nova conta. A senha é do aplicativo; não informe sua senha do Google.</Note>
      <Input label="Senha do aplicativo" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} editable={!working} />
      <Input label="Repita a senha do aplicativo" value={confirmation} onChangeText={setConfirmation} secureTextEntry maxLength={128} editable={!working} />
    </>}
    {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24" }}>{error}</Txt>}
    <Button title={working ? "Conectando ao Google…" : idToken ? "Confirmar vínculo e entrar" : "Continuar com Google"} secondary icon="logo-google" disabled={working || (disabled && !working) || !capabilities?.google || !!unavailable} onPress={enter} />
    {!!idToken && <Button title="Cancelar vínculo" secondary disabled={working} onPress={() => { setIdToken(null); setPassword(""); setConfirmation(""); setError(""); }} />}
    {!!unavailable && <Txt style={{ fontSize: 12, lineHeight: 18 }}>{unavailable}</Txt>}
    {!loadingError && capabilities && !capabilities.google && <Txt style={{ fontSize: 12, lineHeight: 18 }}>O provedor Google ainda não foi configurado neste ambiente.</Txt>}
  </View>;
}
