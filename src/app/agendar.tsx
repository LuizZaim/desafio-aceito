import { useState } from "react";
import { View, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../core/store";
import { teams, fields, dateAfter } from "../core/domain";
import {
  Screen,
  Section,
  Input,
  Button,
  Chip,
  Txt,
  Note,
  Empty,
} from "../components/ui";
export default function Schedule() {
  const params = useLocalSearchParams<{ id: string }>();
  const { state: s, dispatch, busy } = useStore();
  const [id, I] = useState(params.id || s.matches[0]),
    [date, D] = useState(dateAfter(5).split("-").reverse().join("/")),
    [time, T] = useState("10:00"),
    [field, F] = useState(fields[0]),
    [home, H] = useState(s.profile.name);
  const team = teams.find((t) => t.id === id);
  if (!s.matches.length)
    return (
      <Screen>
        <Empty
          title="Primeiro, um match"
          text="O agendamento é liberado após interesse mútuo entre as equipes."
        />
      </Screen>
    );
  async function submit() {
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      Alert.alert("Confira a data e o horário", "Use DD/MM/AAAA e HH:MM.");
      return;
    }
    const iso = date.split("/").reverse().join("-");
    if (
      !Number.isFinite(new Date(iso + "T12:00:00").getTime()) ||
      new Date(iso + "T12:00:00").toISOString().slice(0, 10) !== iso
    ) {
      Alert.alert(
        "Data inválida",
        "Informe uma data que exista no calendário.",
      );
      return;
    }
    if (
      await dispatch({ type: "schedule", id, date: iso, time, field, home })
    ) {
      Alert.alert(
        "Proposta criada",
        "Simule a caução para confirmar seu amistoso.",
      );
      router.replace("/(tabs)/agenda");
    }
  }
  function maskedDate(x: string) {
    const n = x.replace(/\D/g, "").slice(0, 8);
    D(
      n.length > 4
        ? n.slice(0, 2) + "/" + n.slice(2, 4) + "/" + n.slice(4)
        : n.length > 2
          ? n.slice(0, 2) + "/" + n.slice(2)
          : n,
    );
  }
  return (
    <Screen>
      <Section
        eyebrow="DO MATCH AO CAMPO"
        title="Vamos marcar esse jogo?"
        text="Combine os detalhes e confirme a caução da demonstração."
      />
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Adversário
      </Txt>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        {teams
          .filter((t) => s.matches.includes(t.id))
          .map((t) => (
            <Chip
              key={t.id}
              title={t.name}
              selected={t.id === id}
              onPress={() => {
                I(t.id);
                H(s.profile.name);
              }}
            />
          ))}
      </View>
      <Input
        label="Data · DD/MM/AAAA"
        value={date}
        onChangeText={maskedDate}
        keyboardType="number-pad"
        maxLength={10}
      />
      <Input
        label="Horário · HH:MM"
        value={time}
        onChangeText={(v) => {
          const n = v.replace(/\D/g, "").slice(0, 4);
          T(n.length > 2 ? n.slice(0, 2) + ":" + n.slice(2) : n);
        }}
        keyboardType="number-pad"
        maxLength={5}
      />
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Local da partida
      </Txt>
      <View style={{ gap: 8, marginBottom: 22 }}>
        {fields.map((x) => (
          <Chip key={x} title={x} selected={field === x} onPress={() => F(x)} />
        ))}
      </View>
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Mando de campo
      </Txt>
      <View style={{ gap: 8, marginBottom: 22 }}>
        {[s.profile.name, team?.name || ""].map((x) => (
          <Chip key={x} title={x} selected={home === x} onPress={() => H(x)} />
        ))}
      </View>
      <Button
        title={busy ? "Criando proposta…" : "Criar proposta"}
        disabled={busy}
        icon="arrow-forward"
        onPress={submit}
      />
      <Note>
        A agenda bloqueia conflitos com intervalo de 2 horas entre seus jogos. A
        disponibilidade do campo e a confirmação adversária são demonstrativas
        nesta versão.
      </Note>
    </Screen>
  );
}
