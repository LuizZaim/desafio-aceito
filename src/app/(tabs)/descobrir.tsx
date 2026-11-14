import { useState, useCallback } from "react";
import { View, Pressable, ScrollView, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useStore } from "../../core/store";
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
  const { state: s, dispatch, busy, mode, teams, academic } = useStore();
  const c = useColors();
  const [f, F] = useState(filters);
  useFocusEffect(
    useCallback(() => {
      F({ ...filters });
    }, []),
  );
  const activeTeams = teams.filter((team) => team.active !== false);
  const available = activeTeams.filter(
    (t) =>
      !s.skipped.includes(t.id) &&
      !s.interests.includes(t.id) &&
      !s.matches.includes(t.id) &&
      (t.distance === null || t.distance <= f.radius) &&
      (f.category === "Todas" || t.category === f.category) &&
      (f.level === "Todos" || t.level === f.level) &&
      (!f.region || [t.district, t.city, t.state].filter(Boolean).join(" ").toLowerCase().includes(f.region.toLowerCase())),
  );
  const t = available[0];
  async function like(priority = false) {
    if (!t) return;
    if (await dispatch({ type: priority ? "priorityInterest" : "interest", id: t.id })) {
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
        <Row style={{ flex: 1 }}>
          <Icon name="location-outline" size={15} color={c.muted} />
          <Txt style={{ fontSize: 11, color: c.muted }}>
            {mode !== "online" ? `Distâncias ilustrativas · até ${f.radius} km` : [s.profile.city, s.profile.state].filter(Boolean).join(" · ") || "Sua região"}
          </Txt>
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros"
          onPress={() => router.push("/filtros")}
          style={{
            backgroundColor: c.panel,
            borderWidth: 1,
            borderColor: c.border,
            padding: 11,
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
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
                accessibilityRole="button"
                accessibilityLabel="Ver perfil do adversário"
                onPress={() =>
                  router.push({ pathname: "/equipe", params: { id: t.id } })
                }
                style={{
                  backgroundColor: "#ffffff30",
                  borderRadius: 20,
                  padding: 10,
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
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
                  {t.district}{t.distance === null ? " · distância não calculada" : ` · ${t.distance} km`}
                </Txt>
              </View>
            </Row>
          </View>
          <View style={{ padding: 20 }}>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <Row style={{ gap: 5, flexWrap: "wrap", flexShrink: 1 }}>
                <Chip title={t.level} />
                <Chip title={t.category} />
              </Row>
              <Row style={{ gap: 3 }}>
                <Icon name="star" size={12} color={c.muted} />
                <Txt style={{ fontSize: 11, color: c.muted }}>{(mode === "online" ? (t.reviewCount ?? (t.rating > 0 ? 1 : 0)) > 0 : t.games > 0) ? t.rating.toFixed(1) : "Sem avaliações"}</Txt>
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
                flexWrap: "wrap",
                borderBottomWidth: 1,
                borderColor: c.border,
                paddingBottom: 20,
              }}
            >
              <Row style={{ gap: 5 }}>
                <Icon name="calendar-outline" size={14} color={c.muted} />
                <Txt style={{ fontSize: 9, color: c.muted }}>
                  {mode !== "online" ? "Finais de semana" : "Combine pelo chat"}
                </Txt>
              </Row>
              <Txt style={{ fontSize: 8, color: c.muted }}>
                {mode !== "online" ? "● Disponível para jogar" : "Equipe cadastrada"}
              </Txt>
            </Row>
            <Row style={{ marginTop: 18, flexWrap: "wrap" }}>
              <Button
                title="Agora não"
                secondary
                icon="close"
                onPress={() => dispatch({ type: "skip", id: t.id })}
                disabled={busy}
                style={{ flexGrow: 1, flexBasis: 110, paddingHorizontal: 12 }}
              />
              <Button
                title="Bora jogar!"
                icon="heart-outline"
                onPress={() => like()}
                disabled={busy || s.profile.role !== "organizador"}
                style={{ flexGrow: 1.25, flexBasis: 125, paddingHorizontal: 12 }}
              />
            </Row>
            <Button
              title={academic.subscription.priorityCredits ? `Jogar com prioridade · ${academic.subscription.priorityCredits} crédito(s)` : "Conhecer créditos de prioridade"}
              secondary
              disabled={busy || s.profile.role !== "organizador"}
              style={{ marginTop: 12 }}
              onPress={() => academic.subscription.priorityCredits ? void like(true) : router.push("/assinaturas")}
            />
            {t.priority && <Txt style={{ fontSize: 11, color: c.muted, marginTop: 12 }}>Esta equipe enviou interesse prioritário para você.</Txt>}
          </View>
        </Card>
      ) : (
        <Empty
          title="O campo está livre por aqui"
          text={!activeTeams.length && mode === "online" ? "Ainda não há outras equipes cadastradas disponíveis. Atualize esta tela depois que outro organizador cadastrar um time." : "Amplie seus filtros ou reveja equipes puladas para encontrar outros adversários."}
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
      {activeTeams
        .filter((x) => x.id !== t?.id && !s.skipped.includes(x.id))
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
                    {x.district}{x.distance === null ? " · distância não calculada" : ` · ${x.distance} km`}
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
