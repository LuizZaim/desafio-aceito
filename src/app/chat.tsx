import { useState, useRef } from "react";
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../core/store";
import { routeId } from "../core/navigation";
import {
  Txt,
  Row,
  Crest,
  Icon,
  Button,
  Empty,
  useColors,
  DemoLabel,
} from "../components/ui";
export default function Chat() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeId(params.id) || "";
  const { state: s, dispatch, busy, mode, teams } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [text, T] = useState("");
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const t = teams.find((t) => t.id === id);
  if (!t || t.active === false || !s.matches.includes(id))
    return (
      <Empty
        title="Conversa indisponível"
        text="A conversa exige interesse mútuo entre as equipes."
      />
    );
  async function send() {
    if (!text.trim()) return;
    if (await dispatch({ type: "send", id, text })) {
      T("");
      scroll.current?.scrollToEnd({ animated: true });
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={95}
    >
      <Row
        style={{
          padding: 20,
          width: "100%",
          maxWidth: 800,
          alignSelf: "center",
          borderBottomWidth: 1,
          borderColor: c.border,
          backgroundColor: c.panel,
        }}
      >
        <Crest team={t} size={40} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 14, fontWeight: "800" }}>{t.name}</Txt>
          <Txt style={{ fontSize: 9, color: c.muted }}>
            {mode === "online" ? "Conversa entre equipes · match confirmado" : "Conversa de demonstração · match confirmado"}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver perfil da equipe"
          onPress={() => router.push({ pathname: "/equipe", params: { id } })}
          style={{ padding: 10, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="information-circle-outline" color={c.muted} />
        </Pressable>
      </Row>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, gap: 14, width: "100%", maxWidth: 800, alignSelf: "center" }}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: true })
        }
      >
        <DemoLabel />
        <Txt
          style={{
            textAlign: "center",
            fontSize: 9,
            color: c.muted,
            marginBottom: 12,
          }}
        >
          O respeito também faz parte da conversa.
        </Txt>
        {(s.messages[id] || []).map((m, i) => (
          <View
            key={i}
            style={{
              maxWidth: "86%",
              alignSelf: m.own ? "flex-end" : "flex-start",
              backgroundColor: m.own ? c.action : c.panel,
              padding: 15,
              borderRadius: 15,
              borderBottomLeftRadius: m.own ? 15 : 2,
              borderBottomRightRadius: m.own ? 2 : 15,
              borderWidth: m.own ? 0 : 1,
              borderColor: c.border,
            }}
          >
            <Txt
              style={{
                fontSize: 12,
                color: m.own ? "white" : c.text,
                lineHeight: 21,
              }}
            >
              {m.text}
            </Txt>
            <Txt
              style={{
                fontSize: 8,
                color: m.own ? "#ffe4cf" : c.muted,
                textAlign: "right",
                marginTop: 5,
              }}
            >
              {m.at} {m.own ? "✓" : ""}
            </Txt>
          </View>
        ))}
        <View style={{ alignItems: "center", padding: 27, gap: 14 }}>
          <Icon name="calendar-outline" size={30} color={c.muted} />
          <Txt style={{ fontSize: 14, textAlign: "center", fontWeight: "700" }}>
            {mode === "online" ? "Combine com a outra equipe pelo chat." : <>A resenha já tem adversário.{`\n`}Agora só falta marcar.</>}
          </Txt>
          <Button
            title="Propor amistoso"
            icon="arrow-forward"
            onPress={() =>
              router.push({ pathname: "/agendar", params: { id } })
            }
          />
          {mode === "online" && <Txt style={{ color: c.muted, fontSize: 11, textAlign: "center" }}>A proposta será enviada à outra equipe. Depois do aceite, a caução é simulada para confirmar o jogo. Nenhum valor é cobrado.</Txt>}
        </View>
      </ScrollView>
      <Row
        style={{
          padding: 14,
          width: "100%",
          maxWidth: 800,
          alignSelf: "center",
          paddingBottom: Math.max(14, insets.bottom),
          borderTopWidth: 1,
          borderColor: c.border,
          backgroundColor: c.panel,
        }}
      >
        <TextInput
          accessibilityLabel="Mensagem"
          value={text}
          onChangeText={T}
          placeholder="Bora marcar esse jogo?"
          placeholderTextColor={c.muted}
          maxLength={1000}
          style={{
            flex: 1,
            backgroundColor: c.bg,
            borderRadius: 11,
            padding: 14,
            color: c.text,
            fontSize: 16,
            maxHeight: 150,
            minHeight: 48,
          }}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{ disabled: busy || !text.trim() }}
          disabled={busy || !text.trim()}
          onPress={send}
          style={{
            backgroundColor: c.action,
            borderRadius: 12,
            padding: 14,
            opacity: busy || !text.trim() ? 0.5 : 1,
          }}
        >
          <Icon name="send" color="white" size={20} />
        </Pressable>
      </Row>
    </KeyboardAvoidingView>
  );
}
