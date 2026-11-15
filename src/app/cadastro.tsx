import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useStore } from "../core/store";
import { nameError, emailError, passwordError } from "../core/validation";
import { Screen, Section, Input, Button, Note } from "../components/ui";
export default function Cadastro() {
  const { login } = useStore();
  const [name, N] = useState(""),
    [email, E] = useState(""),
    [pass, P] = useState(""),
    [confirm, C] = useState(""),
    [busy, B] = useState(false);
  async function submit() {
    if (busy) return;
    const invalid = nameError(name) || emailError(email) || passwordError(pass) || (pass !== confirm ? "As senhas não são iguais." : null);
    if (invalid) {
      Alert.alert("Revise o cadastro", invalid);
      return;
    }
    B(true);
    try {
      await login(email.trim(), pass, name.trim());
      router.replace("/editar");
    } catch (e) {
      Alert.alert(
        "Cadastro não concluído",
        e instanceof Error ? e.message : "Tente novamente.",
      );
    } finally {
      B(false);
    }
  }
  return (
    <Screen>
      <Section
        eyebrow="FAÇA PARTE DA RESENHA"
        title="Seu time tem lugar aqui."
        text="Crie sua conta de acesso. Depois, cadastre sua equipe ou seu perfil de árbitro/bandeirinha."
      />
      <Input
        label="Seu nome"
        value={name}
        onChangeText={N}
        placeholder="Nome completo"
        maxLength={100}
        editable={!busy}
      />
      <Input
        label="E-mail"
        value={email}
        onChangeText={E}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={254}
        editable={!busy}
      />
      <Input
        label="Senha"
        secureTextEntry
        value={pass}
        onChangeText={P}
        autoComplete="new-password"
        maxLength={128}
        editable={!busy}
        placeholder="Pelo menos 8 caracteres"
      />
      <Input
        label="Confirmar senha"
        secureTextEntry
        value={confirm}
        maxLength={128}
        editable={!busy}
        onChangeText={C}
      />
      <Button
        title={busy ? "Criando conta…" : "Criar minha conta"}
        onPress={submit}
        disabled={busy}
        icon="arrow-forward"
      />
      <Note>O servidor gratuito pode levar cerca de 1 minuto para acordar na primeira vez. Se der erro, aguarde e tente de novo.</Note>
    </Screen>
  );
}
