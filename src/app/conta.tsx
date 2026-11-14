import { useEffect, useState } from "react";
import { router } from "expo-router";
import { request } from "../core/api";
import { useStore } from "../core/store";
import { useAuthCapabilities } from "../components/auth-capabilities";
import { Screen, Section, Card, Txt, Input, Note, Button, Empty } from "../components/ui";
export default function Account() {
  const { mode, logout } = useStore();
  const { capabilities, error: capabilitiesError, retry } = useAuthCapabilities();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    if (mode === "online") request("/account").then((data) => { if (active) setUser(data.user); }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Não foi possível carregar sua conta."); });
    return () => { active = false; };
  }, [mode]);
  async function change(kind: "password" | "email" | "codes") {
    setError(""); setMessage("");
    if (!currentPassword) { setError("Informe sua senha atual para autorizar a alteração."); return; }
    if (kind === "password" && (newPassword.length < 8 || newPassword !== confirmPassword)) { setError("Use uma nova senha com pelo menos 8 caracteres e confirme com a mesma senha."); return; }
    if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setError("Informe um novo e-mail válido."); return; }
    setBusy(true);
    try {
      if (kind === "password") {
        await request("/account/password", "POST", { currentPassword, newPassword });
        await logout(); router.replace({ pathname: "/", params: { aviso: "senha-alterada" } });
      } else if (kind === "email") {
        await request("/account/email", "POST", { currentPassword, newEmail: newEmail.trim() });
        setMessage("Enviamos um link de confirmação para o novo endereço. O e-mail atual continua válido até a confirmação.");
        setCurrentPassword("");
      } else {
        const data = await request("/account/recovery-codes", "POST", { currentPassword });
        setCodes(data.codes); setCurrentPassword("");
        setMessage("Guarde os códigos abaixo agora. Eles não serão exibidos novamente após sair desta tela.");
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível concluir a alteração."); }
    finally { setBusy(false); }
  }
  if (mode !== "online") return <Screen><Empty title="Seu acesso está neste aparelho" text="O cadastro local não usa e-mail ou senha. Entre com uma conta conectada para alterar credenciais e gerar códigos de recuperação." /></Screen>;
  return <Screen>
    <Section eyebrow="SEUS DADOS DE ACESSO" title="Minha conta" text={user ? `${user.name} · ${user.email}` : "Carregando os dados da conta…"} />
    <Input label="Senha atual para autorizar alterações" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" maxLength={128} editable={!busy} />
    {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24", marginBottom: 18 }}>{error}</Txt>}
    {!!message && <Note>{message}</Note>}
    {!!capabilitiesError && <><Txt accessibilityRole="alert">{capabilitiesError}</Txt><Button title="Verificar métodos disponíveis" secondary onPress={retry} /></>}
    <Card style={{ marginBottom: 18, gap: 10 }}>
      <Txt style={{ fontWeight: "800", fontSize: 17 }}>Alterar senha</Txt>
      <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" maxLength={128} editable={!busy} />
      <Input label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry maxLength={128} editable={!busy} />
      <Button title={busy ? "Aguarde…" : "Alterar senha e entrar novamente"} disabled={busy} onPress={() => change("password")} />
    </Card>
    <Card style={{ marginBottom: 18, gap: 10 }}>
      <Txt style={{ fontWeight: "800", fontSize: 17 }}>Alterar e-mail</Txt>
      <Input label="Novo endereço de e-mail" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" maxLength={254} editable={!busy} />
      {!capabilities?.emailChange && <Txt style={{ fontSize: 12 }}>O envio de confirmação por e-mail está indisponível neste ambiente.</Txt>}
      <Button title="Enviar confirmação para o novo e-mail" disabled={busy || !capabilities?.emailChange} onPress={() => change("email")} />
    </Card>
    <Card style={{ gap: 12 }}>
      <Txt style={{ fontWeight: "800", fontSize: 17 }}>Códigos de recuperação</Txt>
      <Txt style={{ fontSize: 12 }}>Guarde os códigos antes de precisar deles. Cada código só pode ser usado uma vez para recuperar sua conta. Gerar novos códigos invalida todos os anteriores.</Txt>
      <Button title={busy ? "Aguarde…" : "Gerar novos códigos de recuperação"} disabled={busy} secondary onPress={() => change("codes")} />
      {codes.map((code) => <Txt key={code} selectable style={{ fontFamily: "monospace", fontSize: 15 }}>{code}</Txt>)}
      {!!codes.length && <Button title="Já salvei — ocultar códigos" secondary onPress={() => { setCodes([]); setMessage("Códigos ocultados. Guarde sua cópia para recuperar o acesso quando necessário."); }} />}
    </Card>
  </Screen>;
}
