import { useState } from "react";
import { View, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../core/store";
import { routeId } from "../core/navigation";
import { fields, dateAfter } from "../core/domain";
import {
  Screen,
  Section,
  Input,
  Button,
  Chip,
  Txt,
  Note,
  Empty,
  DemoLabel,
} from "../components/ui";
export default function Schedule() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestedId = routeId(params.id);
  const { state: s, dispatch, busy, mode, teams, currentTeamId, academic } = useStore();
  const [id, I] = useState(requestedId || s.matches[0]),
    [date, D] = useState(dateAfter(5).split("-").reverse().join("/")),
    [time, T] = useState("10:00"),
    [field, F] = useState(mode !== "online" ? fields[0] : academic.preferredField.slice(0, 100)),
    [home, H] = useState(mode === "online" ? currentTeamId || "" : s.profile.name);
  const team = teams.find((t) => t.id === id);
  if (params.id !== undefined && !requestedId) return <Screen><Empty title="Link de agendamento inválido" text="Escolha uma equipe na aba Matches para criar uma proposta." /></Screen>;
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
    if (busy) return;
    if (!team || team.active === false || !s.matches.includes(id)) {
      Alert.alert("Adversário indisponível", "Escolha uma equipe com match ativo antes de criar a proposta.");
      return;
    }
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      Alert.alert("Confira a data e o horário", "Use DD/MM/AAAA e HH:MM.");
      return;
    }
    if (mode === "online" && (field.trim().length < 3 || field.trim().length > 100)) {
      Alert.alert("Informe o local", "Use entre 3 e 100 caracteres para identificar o campo ou a quadra, incluindo endereço ou região para evitar confusão.");
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
        mode === "online" ? "A outra equipe precisa aceitar a proposta na agenda. Depois, simule a caução para confirmar o amistoso na apresentação. Nenhum valor será cobrado." : "Simule a caução para confirmar seu amistoso.",
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
      <DemoLabel />
      <Section
        eyebrow="DO MATCH AO CAMPO"
        title="Vamos marcar esse jogo?"
        text={mode === "online" ? "Envie os detalhes para o adversário aceitar ou recusar. A proposta não confirma a partida." : "Combine os detalhes e confirme a caução da demonstração."}
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
          .filter((t) => t.active !== false && s.matches.includes(t.id))
          .map((t) => (
            <Chip
              key={t.id}
              title={t.name}
              selected={t.id === id}
              onPress={() => {
                if (!busy) {
                  I(t.id);
                  H(mode === "online" ? currentTeamId || "" : s.profile.name);
                }
              }}
            />
          ))}
      </View>
      <Input
        label="Data · DD/MM/AAAA"
        value={date}
        onChangeText={maskedDate}
        keyboardType="number-pad"
        editable={!busy}
        maxLength={10}
      />
      <Input
        label={mode === "online" ? "Horário de Brasília · HH:MM" : "Horário · HH:MM"}
        value={time}
        onChangeText={(v) => {
          const n = v.replace(/\D/g, "").slice(0, 4);
          T(n.length > 2 ? n.slice(0, 2) + ":" + n.slice(2) : n);
        }}
        keyboardType="number-pad"
        editable={!busy}
        maxLength={5}
      />
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Local da partida
      </Txt>
      {mode === "online" ? <Input label="Nome e endereço do campo ou quadra" placeholder="Ex.: Campo União, Rua das Flores 100, Tatuapé" value={field} onChangeText={F} maxLength={100} editable={!busy} /> : <View style={{ gap: 8, marginBottom: 22 }}>
        {fields.map((x) => (
          <Chip key={x} title={x} selected={field === x} onPress={() => !busy && F(x)} />
        ))}
      </View>}
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Mando de campo
      </Txt>
      <View style={{ gap: 8, marginBottom: 22 }}>
        {[
          { id: mode === "online" ? currentTeamId || "" : s.profile.name, label: `${s.profile.name} (seu time)` },
          { id: mode === "online" ? team?.id || "" : team?.name || "", label: `${team?.name || "Adversário"} (adversário)` },
        ].map((option) => (
          <Chip key={option.id} title={option.label} selected={home === option.id} onPress={() => !busy && H(option.id)} />
        ))}
      </View>
      <Button
        title={busy ? "Criando proposta…" : "Criar proposta"}
        disabled={busy || !team || team.active === false || !s.matches.includes(id)}
        icon="arrow-forward"
        onPress={submit}
      />
      <Note>
        {mode === "online" ? "A agenda verifica sobreposição de 2 horas das duas equipes e do local informado entre as propostas deste aplicativo. Isso não reserva o campo junto ao estabelecimento. Após o aceite adversário, simule a caução para confirmar a partida no aplicativo. Nenhum valor será cobrado." : "A agenda bloqueia conflitos com intervalo de 2 horas entre seus jogos. A disponibilidade do campo e a confirmação adversária são demonstrativas nesta versão."}
      </Note>
    </Screen>
  );
}
