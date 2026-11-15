import React from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../core/store";
import { type Team } from "../core/domain";
export const light = {
  bg: "#f3f0e6",
  panel: "#fbfaf4",
  text: "#10261e",
  muted: "#57614f",
  border: "#dad6c3",
  soft: "#e8e4d2",
  orange: "#a63a12",
  action: "#0b5d3f",
  navy: "#0c2e23",
  yellow: "#f2c230",
};
export const dark = {
  bg: "#0d1f18",
  panel: "#16302a",
  text: "#f1efe2",
  muted: "#a9b7a0",
  border: "#2b4a3d",
  soft: "#1f3d33",
  orange: "#f4a259",
  action: "#14805a",
  navy: "#0c2e23",
  yellow: "#f2c230",
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
  return <Ionicons accessible={false} accessibilityElementsHidden importantForAccessibility="no" name={name} size={size} color={color || light.text} />;
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
      style={[{ color: c.text, fontSize: 15, lineHeight: 22, flexShrink: 1 }, style]}
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
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          backgroundColor: danger ? "#fbe3d8" : secondary ? "transparent" : c.action,
          borderWidth: secondary ? 1.5 : 0,
          borderColor: secondary ? c.text : "transparent",
          maxWidth: "100%",
          minWidth: 0,
          borderRadius: 10,
          paddingHorizontal: 20,
          paddingVertical: 13,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.45 : 1,
          transform: [{ translateY: pressed ? 1 : 0 }],
          ...(pressed && !secondary ? { backgroundColor: danger ? "#f3cdbb" : c.navy } : null),
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={danger ? "#a23d24" : secondary ? c.text : "white"}
          size={19}
        />
      )}
      <Text
        style={{
          color: danger ? "#a23d24" : secondary ? c.text : "white",
          fontWeight: "800",
          fontSize: 15,
          letterSpacing: 0.2,
          flexShrink: 1,
          textAlign: "center",
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
        maxWidth: "100%",
        flexShrink: 1,
        backgroundColor: selected ? c.navy : "transparent",
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: selected ? c.navy : c.border,
        minHeight: 44,
        justifyContent: "center",
      }}
    >
      <Txt
        style={{
          fontSize: 13,
          lineHeight: 18,
          color: selected ? "#fff" : c.text,
          fontWeight: "700",
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
      {size * 0.075 >= 12 && (
        <Text
          style={{ fontSize: size * 0.075, color: "#fff3cc", letterSpacing: 1 }}
        >
          FUTEBOL CLUBE
        </Text>
      )}
    </View>
  );
}
export function FieldArt() {
  const line = "#f3f0e6aa";
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: "#0f4a35" }]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: `${i * 12.5}%`,
            width: "12.5%",
            top: 0,
            bottom: 0,
            backgroundColor: i % 2 ? "#0c3f2d" : "#115238",
          }}
        />
      ))}
      <View style={{ position: "absolute", left: 16, right: 16, top: 70, bottom: -2, borderWidth: 2, borderColor: line }}>
        <View style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTopWidth: 2, borderColor: line }} />
        <View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 110,
            height: 110,
            marginLeft: -55,
            marginTop: -55,
            borderRadius: 55,
            borderWidth: 2,
            borderColor: line,
          }}
        />
        <View style={{ position: "absolute", left: "28%", right: "28%", top: 0, height: 44, borderWidth: 2, borderTopWidth: 0, borderColor: line }} />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, backgroundColor: "#0c2e23", opacity: 0.55 }} />
    </View>
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
          borderRadius: 14,
          padding: 18,
          minWidth: 0,
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
    <View style={{ gap: 8, marginBottom: 24 }}>
      {eyebrow && (
        <Row style={{ gap: 8 }}>
          <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: c.yellow }} />
          <Txt
            style={{
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1.6,
              color: c.orange,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Txt>
        </Row>
      )}
      <Txt
        accessibilityRole="header"
        style={{
          fontSize: 28,
          lineHeight: 33,
          fontWeight: "800",
          letterSpacing: -0.6,
        }}
      >
        {title}
      </Txt>
      {text && (
        <Txt style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>
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
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            padding: width < 360 ? 16 : 21,
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
      style={[{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 }, style]}
    >
      {children}
    </View>
  );
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 8, marginBottom: 17 }}>
      <Txt style={{ fontSize: 13, fontWeight: "700", letterSpacing: 0.2 }}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={props.secureTextEntry ? "none" : undefined}
        autoCorrect={props.secureTextEntry ? false : undefined}
        underlineColorAndroid="transparent"
        placeholderTextColor={c.muted}
        {...props}
        style={[
          {
            borderWidth: 1.5,
            borderColor: c.muted,
            borderRadius: 8,
            backgroundColor: c.panel,
            color: c.text,
            minHeight: 52,
            paddingHorizontal: 15,
            paddingVertical: 12,
            fontSize: 16,
            width: "100%",
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
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: c.yellow,
        backgroundColor: c.soft,
        flexDirection: "row",
        gap: 9,
        marginVertical: 18,
      }}
    >
      <Icon name="information-circle-outline" size={18} color={c.muted} />
      <Txt style={{ fontSize: 13, lineHeight: 20, color: c.text, flex: 1 }}>
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
    <Card style={{ alignItems: "flex-start", gap: 12, paddingVertical: 28, borderStyle: "dashed", borderWidth: 1.5, backgroundColor: "transparent" }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
        <Icon name="football-outline" color={c.action} size={28} />
      </View>
      <Txt style={{ fontWeight: "800", fontSize: 20, lineHeight: 25 }}>
        {title}
      </Txt>
      <Txt
        style={{
          fontSize: 14,
          color: c.muted,
          maxWidth: 340,
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
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
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
      <ActivityIndicator size="large" color={c.action} />
      <Text style={{ color: c.muted, fontSize: 15, fontWeight: "600" }}>Preparando o campo…</Text>
      {seconds >= 5 && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: c.muted, textAlign: "center", maxWidth: 300, fontSize: 14 }}
        >
          {`Acordando o servidor gratuito (${seconds} s). Na primeira vez do dia isso pode levar cerca de 1 minuto. Não feche o app.`}
        </Text>
      )}
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
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mode === "online" ? "#3f9a5f" : c.yellow }} />
        <Txt style={{ fontSize: 12, fontWeight: "600", color: c.muted, flex: 1 }}>{text}</Txt>
      </Row>
      {mode === "online" && (
        <>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt style={{ fontSize: 12, color: c.muted, flex: 1 }}>
              {syncing ? "Atualizando equipes e mensagens…" : lastSyncedAt ? `Atualizado às ${new Date(lastSyncedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Aguardando atualização"}
            </Txt>
            <Pressable accessibilityRole="button" accessibilityLabel="Atualizar equipes e conversas" disabled={syncing} onPress={reload} style={{ padding: 10, minHeight: 44, justifyContent: "center" }}>
              <Txt style={{ color: c.orange, fontSize: 13, fontWeight: "800" }}>{syncing ? "Atualizando…" : "Atualizar"}</Txt>
            </Pressable>
          </Row>
          {!!syncError && <Txt accessibilityRole="alert" style={{ fontSize: 12, color: "#ba573b" }}>{syncError} Seus dados exibidos podem estar desatualizados. Toque em Atualizar para tentar novamente.</Txt>}
        </>
      )}
    </View>
  );
}
