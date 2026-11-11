import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../core/store";
import { teams } from "../../core/domain";
import {
  Screen,
  Section,
  Card,
  Txt,
  Row,
  Icon,
  Crest,
  DemoLabel,
  Note,
  useColors,
} from "../../components/ui";
import { GameCard } from "../../components/game-card";
export default function Ranking() {
  const { state: s } = useStore();
  const c = useColors();
  const list = teams
    .map((t) => {
      const reviews = s.games
        .filter((g) => g.team === t.id && g.review)
        .map((g) => (g.review!.fair + g.review!.skill) / 2);
      return {
        ...t,
        value:
          (t.rating * t.games + reviews.reduce((a, b) => a + b, 0)) /
          (t.games + reviews.length),
      };
    })
    .sort((a, b) => b.value - a.value);
  return (
    <Screen>
      <DemoLabel />
      <Section
        eyebrow="JOGUE JUNTO. JOGUE LIMPO."
        title="Quem joga limpo, sobe."
        text="Desempenho, respeito e compromisso também fazem parte do placar."
      />
      <Card style={{ backgroundColor: c.soft, marginBottom: 24 }}>
        <Row>
          <Icon name="trophy-outline" color="#9aac72" size={32} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, fontWeight: "800" }}>
              A rivalidade fica só no campo.
            </Txt>
            <Txt style={{ fontSize: 10, color: c.muted, marginTop: 7 }}>
              Ranking demonstrativo de avaliações de 1 a 5.
            </Txt>
          </View>
        </Row>
      </Card>
      <View style={{ gap: 9 }}>
        {list.map((t, i) => (
          <Pressable
            key={t.id}
            onPress={() =>
              router.push({ pathname: "/equipe", params: { id: t.id } })
            }
          >
            <Card style={{ padding: 16 }}>
              <Row>
                <Txt
                  style={{
                    fontWeight: "800",
                    color: i < 3 ? "#b7a166" : c.muted,
                    fontSize: 12,
                    width: 23,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Txt>
                <Crest team={t} size={33} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt style={{ fontSize: 11, fontWeight: "800" }}>
                    {t.name}
                  </Txt>
                  <Txt style={{ fontSize: 8, color: c.muted }}>
                    {t.district} · {t.level}
                  </Txt>
                </View>
                <Icon name="star" size={12} color="#ba9c53" />
                <Txt
                  style={{ fontSize: 12, fontWeight: "800", color: "#ba9c53" }}
                >
                  {t.value.toFixed(2)}
                </Txt>
              </Row>
            </Card>
          </Pressable>
        ))}
      </View>
      <Txt style={{ fontSize: 18, fontWeight: "800", marginVertical: 25 }}>
        Seu pós-jogo
      </Txt>
      {s.games
        .filter((g) => g.status === "Concluída")
        .map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      <Note>
        As notas iniciais são fictícias. Sua avaliação após um jogo concluído
        compõe a média exibida nesta demonstração.
      </Note>
    </Screen>
  );
}
