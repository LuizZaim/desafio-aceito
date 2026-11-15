import React from "react";
import { Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { useStore } from "../core/store";
import { Icon, useColors } from "./ui";

export function LogoutButton() {
  const { logout, busy } = useStore();
  const c = useColors();
  function ask() {
    Alert.alert("Sair da conta?", "Você volta para a tela de entrada.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/");
          } catch {
            Alert.alert("Não foi possível sair", "Tente novamente.");
          }
        },
      },
    ]);
  }
  return (
    <Pressable
      onPress={ask}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Sair da conta"
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <Icon name="log-out-outline" size={22} color={c.text} />
    </Pressable>
  );
}
