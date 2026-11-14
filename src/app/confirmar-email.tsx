import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../core/store";
import { request } from "../core/api";
import { routeToken } from "../core/navigation";
import { Screen, Section, Input, Note, Txt, Button } from "../components/ui";
export default function ConfirmEmail() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const supplied = routeToken(params.token);
  const { logout } = useStore();
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  async function confirm() {
    const token = supplied || routeToken(manual.trim());
    if (!token) { setError("Abra o link completo recebido no novo endereço de e-mail ou informe um token válido."); return; }
    setBusy(true); setError("");
    try { await request("/auth/confirm-email", "POST", { token }); await logout(); setComplete(true); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível confirmar o e-mail."); }
    finally { setBusy(false); }
  }
  return <Screen>
    <Section title={complete ? "E-mail confirmado." : "Confirmar novo e-mail"} text={complete ? "Suas sessões anteriores foram encerradas. Entre usando o novo endereço e sua senha." : "Confirme a alteração solicitada na sua conta. O endereço só será trocado após esta confirmação."} />
    {complete ? <Button title="Ir para entrar" onPress={() => router.replace("/")} /> : <>
      {supplied ? <Note>Link de confirmação identificado. Confirme abaixo para concluir a alteração.</Note> : <Input label="Token do link recebido no novo e-mail" value={manual} onChangeText={setManual} autoCapitalize="none" autoCorrect={false} maxLength={43} editable={!busy} />}
      {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24", marginBottom: 18 }}>{error}</Txt>}
      <Button title={busy ? "Confirmando…" : "Confirmar alteração de e-mail"} disabled={busy} onPress={confirm} />
    </>}
  </Screen>;
}
