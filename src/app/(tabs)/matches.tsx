import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../core/store";
import {
  Screen,
  Section,
  Card,
  Row,
  Crest,
  Txt,
  Icon,
  Empty,
  Button,
  DemoLabel,
  useColors,
} from "../../components/ui";
export default function Matches() {
  const { state: s, teams } = useStore();
  const c = useColors();
  const list = teams.filter((t) => t.active !== false && s.matches.includes(t.id));
  return (
    <Screen>
      <DemoLabel />
      <Section
        eyebrow="INTERESSE MÚTUO, JOGO CERTO"
        title="Deu match. E agora?"
        text="Converse com os organizadores e marque o próximo amistoso."
      />
      {!list.length ? (
        <Empty
          title="Seu próximo match está por vir"
          text="Explore os times e demonstre interesse por um adversário."
        >
          <Button
            title="Descobrir equipes"
            onPress={() => router.push("/(tabs)/descobrir")}
          />
        </Empty>
      ) : (
        list.map((t) => (
          <Pressable
            key={t.id}
            onPress={() =>
              router.push({ pathname: "/chat", params: { id: t.id } })
            }
            style={{ marginBottom: 13 }}
          >
            <Card style={{ padding: 18 }}>
              <Row>
                <Crest team={t} size={48} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontWeight: "800", fontSize: 13 }}>
                    {t.name}
                  </Txt>
                  <Txt
                    numberOfLines={2}
                    style={{ color: c.muted, fontSize: 10, marginTop: 5 }}
                  >
                    {s.messages[t.id]?.at(-1)?.text ||
                      "É match! Comece a conversa."}
                  </Txt>
                  <Txt style={{ fontSize: 8, color: c.orange, marginTop: 6 }}>
                    INTERESSE MÚTUO CONFIRMADO
                  </Txt>
                </View>
                <Icon name="chevron-forward" color={c.muted} size={17} />
              </Row>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
