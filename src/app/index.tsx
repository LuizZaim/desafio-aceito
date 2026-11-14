import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useStore } from "../core/store";
import { postLoginDestination } from "../core/navigation";
import { FieldArt, Button, Input, Note } from "../components/ui";
export default function Login() {
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const { mode, demo, local, login, state, arbitration, pendingDestination } = useStore();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  if (mode !== "none") return <Redirect href={postLoginDestination({ mode, state, arbitration, pendingDestination })} />;
  async function submit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      Alert.alert(
        "Confira seus dados",
        "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
      );
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert(
        "Acesso não concluído",
        e instanceof Error ? e.message : "Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f7f8f3" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View
          style={{
            minHeight: 330,
            backgroundColor: "#193a32",
            overflow: "hidden",
          }}
        >
          <FieldArt />
          <SafeAreaView edges={["top"]} style={{ padding: 27 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 35,
                  height: 39,
                  borderRadius: 11,
                  backgroundColor: "#ee6a3b",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 29, fontWeight: "900", color: "white" }}
                >
                  d
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  flexShrink: 1,
                  fontWeight: "900",
                  color: "white",
                  letterSpacing: -0.8,
                }}
              >
                desafio aceito.
              </Text>
            </View>
            <Text
              style={{
                fontSize: 36,
                lineHeight: 42,
                color: "#f9f4de",
                fontWeight: "900",
                marginTop: 38,
                letterSpacing: -1,
              }}
            >
              Seu próximo jogo{`\n`}começa aqui.
            </Text>
            <Text style={{ color: "#d5dec4", fontSize: 12, marginTop: 13 }}>
              Encontre o adversário. Conecte seu time.
            </Text>
          </SafeAreaView>
        </View>
        <View
          style={{
            padding: 26,
            maxWidth: 530,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {aviso === "senha-alterada" && <Note>Senha alterada. Suas sessões anteriores foram encerradas; entre novamente com a nova senha.</Note>}
          {aviso === "email-confirmado" && <Note>E-mail confirmado. Entre novamente com o novo endereço.</Note>}
          <Text
            style={{
              fontSize: 23,
              color: "#20372f",
              fontWeight: "800",
              marginBottom: 7,
            }}
          >
            Bora entrar em campo?
          </Text>
          <Text style={{ color: "#5e6d59", fontSize: 12, marginBottom: 25 }}>
            Cadastre seu time neste aparelho ou entre na sua conta.
          </Text>
          <Button
            title="Cadastrar ou abrir meu time neste aparelho"
            icon="shield-outline"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try { await local(); }
              catch { Alert.alert("Não foi possível abrir seu time", "Tente novamente."); }
              finally { setBusy(false); }
            }}
          />
          <Text style={{ color: "#5e6d59", fontSize: 11, marginVertical: 18, lineHeight: 18 }}>Seu time e seu progresso ficam salvos neste celular. Você pode apresentar os fluxos com adversários fictícios, sem internet e sem cobranças reais. O acesso por conta abaixo conecta equipes entre usuários quando o servidor está disponível.</Text>
          <Input
            label="E-mail"
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Senha"
            placeholder="Sua senha"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <Pressable
            onPress={() => router.push("/recuperar")}
            accessibilityRole="button"
            style={{
              alignSelf: "flex-end",
              minHeight: 44,
              justifyContent: "center",
              padding: 9,
              marginTop: -8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: "#5e6d59" }}>
              Esqueci minha senha
            </Text>
          </Pressable>
          <Button
            title={busy ? "Entrando…" : "Entrar"}
            disabled={busy}
            onPress={submit}
            icon="arrow-forward"
          />
          <Pressable
            onPress={() => router.push("/cadastro")}
            accessibilityRole="button"
            style={{ alignItems: "center", padding: 19, minHeight: 44 }}
          >
            <Text style={{ fontSize: 12, color: "#5e6d59" }}>
              Ainda não tem conta?{" "}
              <Text style={{ color: "#b74a22", fontWeight: "700" }}>
                Cadastre-se
              </Text>
            </Text>
          </Pressable>
          <Button
            title="Explorar demonstração"
            secondary
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try { await demo(); }
              catch { Alert.alert("Não foi possível abrir a demonstração"); }
              finally { setBusy(false); }
            }}
            icon="football-outline"
          />
          <Text
            style={{
              textAlign: "center",
              fontSize: 9,
              color: "#5e6d59",
              marginTop: 15,
              lineHeight: 17,
            }}
          >
            Demonstração offline com equipes fictícias e caução simulada.{`\n`}
            FUTTECH • FECAP • 2026
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
