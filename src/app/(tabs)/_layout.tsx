import { Tabs, Redirect, router } from "expo-router";
import { Pressable, View } from "react-native";
import { useStore } from "../../core/store";
import { useColors, Icon } from "../../components/ui";
export default function Layout() {
  const { mode, state } = useStore();
  const c = useColors();
  if (mode === "none") return <Redirect href="/" />;
  if (state.teamRegistered === false) return <Redirect href="/editar" />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { fontWeight: "800", fontSize: 18 },
        headerTintColor: c.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: c.orange,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.panel,
          borderTopColor: c.border,
          paddingTop: 8,
          height: 80,
          paddingBottom: 17,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerRight: () => (
          <View style={{ flexDirection: "row", gap: 8, paddingRight: 17 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              onPress={() => router.push("/notificacoes")}
              style={{ padding: 10, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            >
              <Icon name="notifications-outline" color={c.text} size={21} />
              {state.notifications.some((n) => !n.read) && (
                <View
                  style={{
                    position: "absolute",
                    top: 9,
                    right: 10,
                    width: 6,
                    height: 6,
                    backgroundColor: c.orange,
                    borderRadius: 5,
                  }}
                />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configurações"
              onPress={() => router.push("/configuracoes")}
              style={{ padding: 10, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            >
              <Icon name="options-outline" color={c.text} size={21} />
            </Pressable>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="descobrir"
        options={{
          title: "desafio aceito.",
          tabBarLabel: "Descobrir",
          tabBarIcon: ({ color }) => (
            <Icon
              name="compass-outline"
              color={typeof color === "string" ? color : c.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Meus matches",
          tabBarLabel: "Matches",
          tabBarIcon: ({ color }) => (
            <Icon
              name="heart-outline"
              color={typeof color === "string" ? color : c.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda de jogos",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => (
            <Icon
              name="calendar-outline"
              color={typeof color === "string" ? color : c.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",
          tabBarLabel: "Ranking",
          tabBarIcon: ({ color }) => (
            <Icon
              name="trophy-outline"
              color={typeof color === "string" ? color : c.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Minha equipe",
          tabBarLabel: "Equipe",
          tabBarIcon: ({ color }) => (
            <Icon
              name="shield-outline"
              color={typeof color === "string" ? color : c.muted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
