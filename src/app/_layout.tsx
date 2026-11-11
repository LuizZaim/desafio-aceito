import React from "react";
import { Stack } from "expo-router";
import { Provider, useStore } from "../core/store";
import { useColors, Busy, Empty, Button } from "../components/ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
function Navigator() {
  const { ready, error, reload } = useStore();
  const c = useColors();
  if (!ready) return <Busy />;
  if (error)
    return (
      <Empty title="Não carregamos seu espaço" text={error}>
        <Button title="Tentar novamente" onPress={reload} />
      </Empty>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitleStyle: { fontSize: 15, fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: "Criar minha conta" }} />
      <Stack.Screen name="recuperar" options={{ title: "Recuperar acesso" }} />
      <Stack.Screen name="chat" options={{ title: "Conversa" }} />
      <Stack.Screen name="agendar" options={{ title: "Agendar amistoso" }} />
      <Stack.Screen name="equipe" options={{ title: "Perfil da equipe" }} />
      <Stack.Screen name="editar" options={{ title: "Editar minha equipe" }} />
      <Stack.Screen
        name="arbitragem"
        options={{ title: "Central de arbitragem" }}
      />
      <Stack.Screen name="configuracoes" options={{ title: "Configurações" }} />
      <Stack.Screen name="notificacoes" options={{ title: "Notificações" }} />
      <Stack.Screen
        name="filtros"
        options={{ title: "Busca personalizada", presentation: "modal" }}
      />
      <Stack.Screen name="partida" options={{ title: "Detalhes da partida" }} />
      <Stack.Screen name="avaliar" options={{ title: "Avaliar adversário" }} />
    </Stack>
  );
}
export default function Root() {
  return (
    <SafeAreaProvider>
      <Provider>
        <Navigator />
      </Provider>
    </SafeAreaProvider>
  );
}
