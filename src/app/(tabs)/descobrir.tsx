import { useState, useCallback } from "react";
import { View, Pressable, ScrollView, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useStore } from "../../core/store";
import { teams } from "../../core/domain";
import { filters, setFilters } from "../../core/filters";
import {
  Screen,
  Txt,
  Section,
  DemoLabel,
  Button,
  Card,
  Row,
  Crest,
  FieldArt,
  Icon,
  Chip,
  Empty,
  useColors,
} from "../../components/ui";
export default function Discover() {
  const { state: s, dispatch, busy } = useStore();
  const c = useColors();
  const [f, F] = useState(filters);
  useFocusEffect(
    useCallback(() => {
      F({ ...filters });
    }, []),
  );
  const available = teams.filter(
    (t) =>
      !s.skipped.includes(t.id) &&
      !s.interests.includes(t.id) &&
      !s.matches.includes(t.id) &&
      t.distance <= f.radius &&
      (f.category === "Todas" || t.category === f.category) &&
      (f.level === "Todos" || t.level === f.level) &&
      (!f.region || t.district.toLowerCase().includes(f.region.toLowerCase())),
  );
  const t = available[0];
  async function like() {
    if (!t) return;
    if (await dispatch({ type: "interest", id: t.id })) {
      if (t.reciprocal)
        Alert.alert(
          "É match! 🤝",
          `${t.name} também quer jogar. Comece a conversa!`,
          [
            { text: "Continuar descobrindo" },
            {
              text: "Abrir conversa",
              onPress: () =>
                router.push({ pathname: "/chat", params: { id: t.id } }),
            },
          ],
        );
      else
        Alert.alert(
          "Interesse enviado",
          "A conversa será liberada se a equipe também demonstrar interesse.",
        );
    }
  }
  return (
    <Screen>
      <DemoLabel />
      <Section
        eyebrow="A RESENHA COMEÇA AQUI"
        title={"Seu próximo rival.\nUma nova história."}
        text="Encontre equipes, dê o match e leve a resenha para o campo."
      />
      <Row style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <Row>
          <Icon name="location-outline" size={15} color={c.muted} />
          <Txt style={{ fontSize: 11, color: c.muted }}>
            São Paulo · até {f.radius} km
          </Txt>
        </Row>
        <Pressable
          accessibilityLabel="Abrir filtros"
          onPress={() => router.push("/filtros")}
          style={{
            backgroundColor: c.panel,
            borderWidth: 1,
            borderColor: c.border,
            padding: 11,
            borderRadius: 9,
          }}
        >
          <Icon name="options-outline" size={19} color={c.text} />
        </Pressable>
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 22 }}
        contentContainerStyle={{ gap: 7 }}
      >
        {["Todas", "Masculino", "Feminino", "Sub-15", "Veteranos"].map((x) => (
          <Chip
            title={x === "Todas" ? "Todos os times" : x}
            key={x}
            selected={f.category === x}
            onPress={() => {
              const next = { ...f, category: x };
              setFilters(next);
              F(next);
            }}
          />
        ))}
      </ScrollView>
      {s.deleted ? (
        <Empty
          title="Equipe desativada"
          text="Restaure sua equipe para voltar à descoberta."
        >
          <Button
            title="Restaurar equipe"
            onPress={() => dispatch({ type: "restore" })}
          />
        </Empty>
      ) : t ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <View style={{ height: 265, backgroundColor: "#264a3d" }}>
            <FieldArt />
            <Row
              style={{
                position: "absolute",
                top: 19,
                left: 19,
                right: 19,
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  backgroundColor: "#ffffee",
                  padding: 7,
                  borderRadius: 5,
                }}
              >
                <Txt
                  style={{
                    fontSize: 7,
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: "#3b6c45",
                  }}
                >
                  ● BUSCANDO AMISTOSO
                </Txt>
              </View>
              <Pressable
                accessibilityLabel="Ver perfil do adversário"
                onPress={() =>
                  router.push({ pathname: "/equipe", params: { id: t.id } })
                }
                style={{
                  backgroundColor: "#ffffff30",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Icon name="arrow-up-right-box" color="white" size={17} />
              </Pressable>
            </Row>
            <Row
              style={{
                position: "absolute",
                left: 21,
                right: 21,
                bottom: 23,
                gap: 15,
              }}
            >
              <Crest team={t} size={68} />
              <View style={{ flex: 1 }}>
                <Txt
                  style={{ fontSize: 7, letterSpacing: 1.7, color: "#d3d9b7" }}
                >
                  FUTEBOL QUE CONECTA
                </Txt>
                <Txt
                  style={{
                    fontSize: 24,
                    lineHeight: 31,
                    fontWeight: "900",
                    color: "white",
                    letterSpacing: -0.8,
                    marginTop: 5,
                  }}
                >
                  {t.name}
                </Txt>
                <Txt style={{ fontSize: 10, color: "#d4dfc7", marginTop: 5 }}>
                  {t.district} · {t.distance} km
                </Txt>
              </View>
            </Row>
          </View>
          <View style={{ padding: 20 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Row style={{ gap: 5 }}>
                <Chip title={t.level} />
                <Chip title={t.category} />
              </Row>
              <Row style={{ gap: 3 }}>
                <Icon name="star" size={12} color="#b99b52" />
                <Txt style={{ fontSize: 11, color: "#b99b52" }}>{t.rating}</Txt>
              </Row>
            </Row>
            <Txt
              style={{
                fontSize: 12,
                color: c.muted,
                lineHeight: 22,
                marginTop: 17,
                marginBottom: 20,
              }}
            >
              {t.bio}
            </Txt>
            <Row
              style={{
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderColor: c.border,
                paddingBottom: 20,
              }}
            >
              <Row style={{ gap: 5 }}>
                <Icon name="calendar-outline" size={14} color={c.muted} />
                <Txt style={{ fontSize: 9, color: c.muted }}>
                  Finais de semana
                </Txt>
              </Row>
              <Txt style={{ fontSize: 8, color: "#7e9b6c" }}>
                ● Disponível para jogar
              </Txt>
            </Row>
            <Row style={{ marginTop: 18 }}>
              <Button
                title="Agora não"
                secondary
                icon="close"
                onPress={() => dispatch({ type: "skip", id: t.id })}
                disabled={busy}
                style={{ flex: 1, paddingHorizontal: 12 }}
              />
              <Button
                title="Bora jogar!"
                icon="heart-outline"
                onPress={like}
                disabled={busy || s.profile.role !== "organizador"}
                style={{ flex: 1.25, paddingHorizontal: 12 }}
              />
            </Row>
          </View>
        </Card>
      ) : (
        <Empty
          title="O campo está livre por aqui"
          text="Amplie seus filtros ou reveja equipes puladas para encontrar outros adversários."
        >
          <Button
            title="Ampliar busca"
            icon="refresh-outline"
            onPress={() => {
              const x = {
                category: "Todas",
                level: "Todos",
                radius: 50,
                region: "",
              };
              setFilters(x);
              F(x);
              dispatch({ type: "resetDiscovery" });
            }}
          />
        </Empty>
      )}
      <Row style={{ justifyContent: "center", marginVertical: 20, gap: 5 }}>
        <Icon name="shield-checkmark-outline" size={14} color={c.muted} />
        <Txt style={{ fontSize: 9, color: c.muted }}>
          O chat é liberado somente com interesse mútuo.
        </Txt>
      </Row>
      <Row
        style={{
          justifyContent: "space-between",
          marginTop: 9,
          marginBottom: 16,
        }}
      >
        <Txt style={{ fontWeight: "800", fontSize: 15 }}>
          Mais times, mais resenha
        </Txt>
        <Txt style={{ fontSize: 9, color: c.muted }}>Comunidade</Txt>
      </Row>
      {teams
        .filter((x) => x.id !== t?.id)
        .slice(0, 3)
        .map((x) => (
          <Pressable
            key={x.id}
            onPress={() =>
              router.push({ pathname: "/equipe", params: { id: x.id } })
            }
            style={{ marginBottom: 10 }}
          >
            <Card style={{ padding: 17 }}>
              <Row>
                <Crest team={x} size={39} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt style={{ fontSize: 12, fontWeight: "800" }}>
                    {x.name}
                  </Txt>
                  <Txt style={{ fontSize: 9, color: c.muted }}>
                    {x.district} · {x.distance} km
                  </Txt>
                </View>
                <Icon name="arrow-up-right-box" size={18} color={c.muted} />
              </Row>
            </Card>
          </Pressable>
        ))}
    </Screen>
  );
}
