import { useState } from "react";
import { Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "../core/store";
import { teams } from "../core/domain";
import {
  Screen,
  Section,
  Card,
  Txt,
  Row,
  Icon,
  Button,
  Crest,
  Empty,
  useColors,
} from "../components/ui";
export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: s, dispatch, busy } = useStore();
  const c = useColors();
  const [skill, S] = useState(5),
    [fair, F] = useState(5);
  const g = s.games.find((g) => g.id === id);
  if (!g || g.status !== "Concluída" || g.review)
    return (
      <Screen>
        <Empty
          title="Avaliação indisponível"
          text="Você pode avaliar uma única vez cada partida concluída."
        />
      </Screen>
    );
  const t = teams.find((t) => t.id === g.team);
  return (
    <Screen>
      <Section
        eyebrow="O RESPEITO TAMBÉM VALE PONTO"
        title="Como foi o jogo?"
        text="Sua avaliação ajuda a construir uma comunidade melhor."
      />
      <Card style={{ alignItems: "center", gap: 15, marginBottom: 25 }}>
        <Crest team={t} size={74} />
        <Txt style={{ fontSize: 20, fontWeight: "800" }}>{t?.name}</Txt>
        <Txt style={{ color: c.muted }}>Placar: {g.score}</Txt>
      </Card>
      {[
        ["Nível técnico", skill, S],
        ["Fair play e disciplina", fair, F],
      ].map(([title, value, setter]) => (
        <Card key={String(title)} style={{ marginBottom: 16 }}>
          <Txt style={{ fontWeight: "700", fontSize: 13, marginBottom: 17 }}>
            {String(title)}
          </Txt>
          <Row style={{ justifyContent: "space-between" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${n} de 5`}
                key={n}
                onPress={() => {
                  (setter as (v: number) => void)(n);
                }}
                style={{ padding: 5 }}
              >
                <Icon
                  name={n <= Number(value) ? "star" : "star-outline"}
                  size={33}
                  color="#d7a84f"
                />
              </Pressable>
            ))}
          </Row>
        </Card>
      ))}
      <Button
        title="Enviar avaliação"
        disabled={busy}
        icon="star-outline"
        onPress={async () => {
          if (await dispatch({ type: "review", id, skill, fair })) {
            Alert.alert(
              "Avaliação registrada",
              "Sua nota foi incluída no histórico e no ranking da demonstração.",
            );
            router.back();
          }
        }}
      />
    </Screen>
  );
}
