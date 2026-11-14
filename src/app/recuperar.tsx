import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "../core/store";
import { request } from "../core/api";
import { routeToken } from "../core/navigation";
import { useAuthCapabilities } from "../components/auth-capabilities";
import { Screen, Section, Input, Button, Note, Row, Chip, Txt } from "../components/ui";

export default function Recover() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const linkToken = routeToken(params.token);
  const { logout } = useStore();
  const { capabilities, error: capabilitiesError, retry } = useAuthCapabilities();
  const [choice, setChoice] = useState<"email" | "code" | "link">("code");
  const method = linkToken ? "link" : choice;
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  function choose(next: "email" | "code" | "link") { if (!busy) { setChoice(next); setError(""); setMessage(""); } }
  async function submit() {
    setError(""); setMessage("");
    if ((method === "email" || method === "code") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido."); return;
    }
    if (method !== "email" && (password.length < 8 || password !== confirm)) {
      setError("Use uma nova senha com pelo menos 8 caracteres e confirme com a mesma senha."); return;
    }
    if (method === "code" && !/^[A-Za-z0-9_-]{22}$/.test(code.trim())) {
      setError("Informe um dos códigos de recuperação de 22 caracteres que você salvou anteriormente."); return;
    }
    const token = linkToken || routeToken(manualToken.trim());
    if (method === "link" && !token) { setError("O token do link é inválido. Abra o link completo recebido no seu e-mail."); return; }
    setBusy(true);
    try {
      if (method === "email") {
        await request("/auth/forgot-password", "POST", { email: email.trim() });
        setMessage("Se o endereço estiver cadastrado, você receberá as instruções de recuperação. Confira também a pasta de spam.");
      } else {
        await request(method === "code" ? "/auth/recover-code" : "/auth/reset-password", "POST", method === "code" ? { email: email.trim(), code: code.trim(), password } : { token, password });
        await logout();
        setComplete(true);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível recuperar seu acesso."); }
    finally { setBusy(false); }
  }
  if (complete) return <Screen><Section title="Senha atualizada." text="Suas sessões anteriores foram encerradas. Entre novamente com a nova senha." /><Button title="Ir para entrar" onPress={() => router.replace("/")} /></Screen>;
  return (
    <Screen>
      <Section eyebrow="VOLTE PARA O JOGO" title="Recuperar acesso" text="Use um código salvo anteriormente ou um link de recuperação recebido por e-mail." />
      {!linkToken && <Row style={{ flexWrap: "wrap", marginBottom: 22 }}>
        <Chip title="Código salvo" selected={method === "code"} onPress={() => choose("code")} />
        <Chip title="Pedir e-mail" selected={method === "email"} onPress={() => choose("email")} />
        <Chip title="Token do link" selected={method === "link"} onPress={() => choose("link")} />
      </Row>}
      {!!linkToken && <Button title="Usar outro método de recuperação" secondary disabled={busy} style={{ marginBottom: 18 }} onPress={() => router.replace("/recuperar")} />}
      {!!params.token && !linkToken && <Note>O link informado é inválido. Você pode usar um código de recuperação salvo ou solicitar outro e-mail.</Note>}
      {method !== "link" && <Input label="E-mail da conta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} editable={!busy} />}
      {method === "code" && <><Input label="Código de recuperação salvo" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} maxLength={22} editable={!busy} /><Note>Cada código só pode ser usado uma vez. Eles são gerados dentro da sua conta e precisam ter sido salvos antes de perder o acesso.</Note></>}
      {method === "link" && (linkToken ? <Note>Link de recuperação identificado. Defina a nova senha abaixo.</Note> : <Input label="Token recebido no link de recuperação" value={manualToken} onChangeText={setManualToken} autoCapitalize="none" autoCorrect={false} maxLength={43} editable={!busy} />)}
      {method !== "email" && <>
        <Input label="Nova senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" maxLength={128} editable={!busy} />
        <Input label="Confirmar nova senha" value={confirm} onChangeText={setConfirm} secureTextEntry maxLength={128} editable={!busy} />
      </>}
      {method === "email" && !capabilities?.passwordRecovery && <Note>{capabilities ? "O envio de e-mails está indisponível neste ambiente. Use um código de recuperação que você já tenha salvo." : "Verificando a disponibilidade do envio por e-mail…"}</Note>}
      {!!capabilitiesError && <><Txt accessibilityRole="alert">{capabilitiesError}</Txt><Button title="Verificar disponibilidade novamente" secondary onPress={retry} /></>}
      {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24", marginVertical: 14 }}>{error}</Txt>}
      {!!message && <Txt accessibilityLiveRegion="polite" style={{ marginVertical: 14 }}>{message}</Txt>}
      <Button title={busy ? "Aguarde…" : method === "email" ? "Solicitar recuperação por e-mail" : "Salvar nova senha"} disabled={busy || method === "email" && !capabilities?.passwordRecovery} onPress={submit} />
    </Screen>
  );
}
