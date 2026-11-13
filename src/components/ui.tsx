import React from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../core/store";
import { type Team } from "../core/domain";
export const light = {
  bg: "#f7f8f3",
  panel: "#ffffff",
  text: "#20372f",
  muted: "#82907d",
  border: "#e6eadf",
  soft: "#eef1e7",
  orange: "#ee6a3b",
  navy: "#193a32",
};
export const dark = {
  bg: "#142a24",
  panel: "#20382f",
  text: "#eef2e5",
  muted: "#a6b79e",
  border: "#355043",
  soft: "#2a4437",
  orange: "#f58151",
  navy: "#193a32",
};
export const useColors = () => (useStore().state.settings.dark ? dark : light);
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color || light.text} />;
}
export function Txt({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  const c = useColors();
  return (
    <Text
      {...props}
      style={[{ color: c.text, fontSize: 14, lineHeight: 21 }, style]}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 50,
          backgroundColor: danger ? "#fff0e8" : secondary ? c.soft : c.orange,
          borderRadius: 12,
          paddingHorizontal: 18,
          paddingVertical: 13,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={danger ? "#be674e" : secondary ? c.text : "white"}
          size={19}
        />
      )}
      <Text
        style={{
          color: danger ? "#be674e" : secondary ? c.text : "white",
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        backgroundColor: selected ? c.navy : c.soft,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 9,
        minHeight: 44,
        justifyContent: "center",
      }}
    >
      <Txt
        style={{
          fontSize: 11,
          lineHeight: 16,
          color: selected ? "#fff" : c.muted,
          fontWeight: "600",
        }}
      >
        {title}
      </Txt>
    </Pressable>
  );
}
export function Crest({ team, size = 65 }: { team?: Team; size?: number }) {
  const ownName = useStore().state.profile.name;
  const initials = ownName.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size * 1.12,
        backgroundColor: team?.color || "#264b40",
        borderRadius: 12,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff3cc66",
        gap: 2,
      }}
    >
      <Icon name="star" size={size * 0.15} color="#ffe3a0" />
      <Text
        style={{
          fontWeight: "900",
          color: "#fff3cc",
          fontSize: size * 0.32,
          letterSpacing: -1,
        }}
      >
        {team?.short || initials || "DA"}
      </Text>
      <Text
        style={{ fontSize: size * 0.075, color: "#fff3cc", letterSpacing: 1 }}
      >
        FUTEBOL CLUBE
      </Text>
    </View>
  );
}
export function FieldArt() {
  return (
    <LinearGradient
      colors={["#46695a", "#b9a178", "#173b31"]}
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
    >
      <View
        style={{
          height: "38%",
          marginTop: "25%",
          backgroundColor: "#2d4b36",
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: -15,
          right: -15,
          bottom: -80,
          height: 240,
          backgroundColor: "#2e604a",
          transform: [{ perspective: 500 }, { rotateX: "55deg" }],
          borderWidth: 2,
          borderColor: "#eef2cb80",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            borderLeftWidth: 2,
            borderColor: "#eef2cb70",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: "36%",
            top: "25%",
            width: "28%",
            height: "50%",
            borderWidth: 2,
            borderColor: "#eef2cb70",
            borderRadius: 100,
          }}
        />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: `${i * 15}%`,
              width: "7%",
              top: 0,
              bottom: 0,
              backgroundColor: "#aec695",
              opacity: 0.12,
            }}
          />
        ))}
      </View>
      <LinearGradient
        colors={["transparent", "#102a23f5"]}
        style={StyleSheet.absoluteFill}
      />
      {[20, 85].map((x) => (
        <View
          key={x}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: 28,
            height: 95,
            width: 2,
            backgroundColor: "#d0c99e",
            opacity: 0.5,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -2,
              left: -12,
              width: 26,
              height: 4,
              backgroundColor: "#fff6c8",
            }}
          />
        </View>
      ))}
    </LinearGradient>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: c.panel,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 17,
          padding: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Section({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 10, marginBottom: 24 }}>
      {eyebrow && (
        <Txt
          style={{
            fontSize: 9,
            fontWeight: "800",
            letterSpacing: 2,
            color: c.orange,
          }}
        >
          {eyebrow}
        </Txt>
      )}
      <Txt
        accessibilityRole="header"
        style={{
          fontSize: 30,
          lineHeight: 37,
          fontWeight: "900",
          letterSpacing: -1,
        }}
      >
        {title}
      </Txt>
      {text && (
        <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>
          {text}
        </Txt>
      )}
      {children}
    </View>
  );
}
export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const c = useColors();
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 21,
            paddingBottom: 40,
            width: "100%",
            maxWidth: 800,
            alignSelf: "center",
          }}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}
    >
      {children}
    </View>
  );
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 8, marginBottom: 17 }}>
      <Txt style={{ fontSize: 11, fontWeight: "700" }}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            backgroundColor: c.panel,
            color: c.text,
            minHeight: 49,
            paddingHorizontal: 15,
            paddingVertical: 12,
            fontSize: 14,
          },
          props.multiline && { minHeight: 92, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Note({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 10,
        backgroundColor: c.soft,
        flexDirection: "row",
        gap: 9,
        marginVertical: 18,
      }}
    >
      <Icon name="information-circle-outline" size={18} color={c.muted} />
      <Txt style={{ fontSize: 10, lineHeight: 17, color: c.muted, flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}
export function Empty({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Card style={{ alignItems: "center", gap: 15, paddingVertical: 40 }}>
      <Icon name="football-outline" color={c.muted} size={40} />
      <Txt style={{ fontWeight: "800", fontSize: 19, textAlign: "center" }}>
        {title}
      </Txt>
      <Txt
        style={{
          fontSize: 12,
          color: c.muted,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {text}
      </Txt>
      {children}
    </Card>
  );
}
export function Busy() {
  const c = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <ActivityIndicator size="large" color={c.orange} />
      <Text style={{ color: c.muted }}>Preparando o campo…</Text>
    </View>
  );
}
export function Line() {
  const c = useColors();
  return (
    <View
      style={{ height: 1, backgroundColor: c.border, marginVertical: 18 }}
    />
  );
}
export function DemoLabel() {
  const c = useColors();
  const { mode, syncing, syncError, lastSyncedAt, reload } = useStore();
  const text = mode === "online"
    ? "Conta conectada · apresentação acadêmica · caução simulada"
    : mode === "local"
      ? "Meu time local · adversários e respostas fictícios · caução simulada"
      : "Demonstração · equipes fictícias · sem cobranças reais";
  return (
    <View style={{ marginBottom: 20, gap: 9 }}>
      <Row style={{ gap: 6 }}>
        <View style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: mode === "online" ? "#73975d" : c.orange }} />
        <Txt style={{ fontSize: 10, color: c.muted, flex: 1 }}>{text}</Txt>
      </Row>
      {mode === "online" && (
        <>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt style={{ fontSize: 10, color: c.muted, flex: 1 }}>
              {syncing ? "Atualizando equipes e mensagens…" : lastSyncedAt ? `Atualizado às ${new Date(lastSyncedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Aguardando atualização"}
            </Txt>
            <Pressable accessibilityRole="button" accessibilityLabel="Atualizar equipes e conversas" disabled={syncing} onPress={reload} style={{ padding: 10, minHeight: 44, justifyContent: "center" }}>
              <Txt style={{ color: c.orange, fontSize: 11, fontWeight: "700" }}>{syncing ? "Atualizando…" : "Atualizar"}</Txt>
            </Pressable>
          </Row>
          {!!syncError && <Txt accessibilityRole="alert" style={{ fontSize: 11, color: "#ba573b" }}>{syncError} Seus dados exibidos podem estar desatualizados. Toque em Atualizar para tentar novamente.</Txt>}
        </>
      )}
    </View>
  );
}
