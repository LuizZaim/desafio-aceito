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
import { FieldArt, Button, Input, Note, useColors } from "../components/ui";
import { GoogleAccess } from "../components/google-access";
export default function Login() {
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const { mode, demo, login, state, arbitration, pendingDestination } = useStore();
  const c = useColors();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  if (mode !== "none") return <Redirect href={postLoginDestination({ mode, state, arbitration, pendingDestination })} />;
  async function submit() {
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) {
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
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={{ minHeight: 300, backgroundColor: "#0c2e23", overflow: "hidden" }}>
          <FieldArt />
          <SafeAreaView edges={["top"]} style={{ padding: 24, paddingTop: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "#f2c230",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 19, fontWeight: "900", color: "#0c2e23" }}>d</Text>
              </View>
              <Text style={{ fontSize: 17, flexShrink: 1, fontWeight: "800", color: "#f3f0e6", letterSpacing: 0.2 }}>
                desafio aceito
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 38,
                lineHeight: 40,
                color: "#fbfaf4",
                fontWeight: "900",
                marginTop: 56,
                letterSpacing: -1.2,
              }}
            >
              Marque o jogo.{`
`}Bata o desafio.
            </Text>
            <Text style={{ color: "#dfe6d2", fontSize: 15, lineHeight: 21, marginTop: 10 }}>
              Encontre o adversário, combine data e campo.
            </Text>
          </SafeAreaView>
        </View>
        <View
          style={{
            padding: 24,
            maxWidth: 530,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {aviso === "senha-alterada" && <Note>Senha alterada. Suas sessões anteriores foram encerradas; entre novamente com a nova senha.</Note>}
          {aviso === "email-confirmado" && <Note>E-mail confirmado. Entre novamente com o novo endereço.</Note>}
          <Text
            style={{
              fontSize: 24,
              color: c.text,
              fontWeight: "800",
              letterSpacing: -0.4,
              marginBottom: 6,
            }}
          >
            Bora entrar em campo?
          </Text>
          <Text style={{ color: c.muted, fontSize: 14, marginBottom: 22 }}>
            Entre na sua conta ou crie uma nova.
          </Text>
          <Input
            label="E-mail"
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            maxLength={254}
            editable={!busy}
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Senha"
            placeholder="Sua senha"
            secureTextEntry
            autoComplete="current-password"
            maxLength={128}
            editable={!busy}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <Pressable
            onPress={() => router.push("/recuperar")}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
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
            <Text style={{ fontSize: 13, fontWeight: "600", color: c.muted }}>
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
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            accessibilityRole="button"
            style={{ alignItems: "center", padding: 16, minHeight: 48 }}
          >
            <Text style={{ fontSize: 14, color: c.muted }}>
              Ainda não tem conta?{" "}
              <Text style={{ color: c.orange, fontWeight: "800" }}>
                Cadastre-se
              </Text>
            </Text>
          </Pressable>
          <GoogleAccess disabled={busy} onBusy={setBusy} />
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
              fontSize: 12,
              color: c.muted,
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
