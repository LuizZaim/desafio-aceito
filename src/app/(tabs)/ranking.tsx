import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../core/store";
import { reviewAverage } from "../../core/domain";
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
  Empty,
  useColors,
} from "../../components/ui";
import { GameCard } from "../../components/game-card";
export default function Ranking() {
  const { state: s, mode, teams } = useStore();
  const c = useColors();
  const list = teams
    .filter((team) => team.active !== false)
    .map((t) => {
      if (mode === "online") return { ...t, value: t.rating, rated: (t.reviewCount ?? (t.rating > 0 ? 1 : 0)) > 0 };
      const reviews = s.games
        .filter((g) => g.team === t.id && g.review)
        .map((g) => reviewAverage(g.review))
        .filter((value): value is number => value !== null);
      return {
        ...t,
        rated: t.games + reviews.length > 0,
        value:
          t.games + reviews.length > 0
            ? (t.rating * t.games + reviews.reduce((a, b) => a + b, 0)) / (t.games + reviews.length)
            : 0,
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
              {mode !== "online" ? "Ranking demonstrativo de avaliações de 1 a 5." : "As equipes começam sem notas. Somente avaliações recebidas após jogos concluídos compõem o ranking."}
            </Txt>
          </View>
        </Row>
      </Card>
      {!list.length && <Empty title="O ranking começa em campo" text={mode === "local" ? "Seu time está salvo no aparelho. A demonstração mostra como funcionará o ranking após os jogos." : "As equipes cadastradas e suas avaliações aparecerão aqui. Nenhuma nota fictícia é atribuída a equipes reais."} />}
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
                  {t.rated ? t.value.toFixed(2) : "Sem notas"}
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
        {mode !== "online" ? "As notas iniciais são fictícias. Novas avaliações consideram nível técnico, fair play, pontualidade e organização. Registros antigos preservam as duas dimensões originais." : "Cada equipe avalia o adversário uma única vez por partida concluída, nos quatro critérios. O ranking conectado usa a média das avaliações recebidas, sem notas iniciais fictícias."}
      </Note>
    </Screen>
  );
}
