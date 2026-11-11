import { useState } from "react";
import { View, Alert, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
  Input,
  Note,
  Empty,
  useColors,
} from "../components/ui";
import { formatDate } from "../components/game-card";
export default function Partida() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state: s, dispatch, busy } = useStore();
  const c = useColors();
  const [reason, R] = useState(""),
    [weather, W] = useState(false),
    [cancel, C] = useState(false),
    [result, S] = useState(false),
    [a, A] = useState(""),
    [b, B] = useState("");
  const g = s.games.find((g) => g.id === id);
  if (!g)
    return (
      <Empty
        title="Partida não encontrada"
        text="Volte à agenda para selecionar outro jogo."
      />
    );
  const t = teams.find((t) => t.id === g.team);
  async function pay() {
    Alert.alert(
      "Simular aprovação?",
      "Caução ilustrativa de R$ 50. Nenhum valor será cobrado.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Simular",
          onPress: async () => {
            if (await dispatch({ type: "pay", id }))
              Alert.alert(
                "Confirmado na demonstração",
                "Caução simulada aprovada. O amistoso está confirmado.",
              );
          },
        },
      ],
    );
  }
  return (
    <Screen>
      <Section
        eyebrow={g.status.toUpperCase()}
        title={`${s.profile.name}\n× ${t?.name}`}
        text="Seu compromisso dentro e fora das quatro linhas."
      />
      <Card>
        <View style={{ gap: 16 }}>
          {[
            ["calendar-outline", `${formatDate(g.date)} · ${g.time}`],
            ["location-outline", g.field],
            ["flag-outline", `Mandante: ${g.home}`],
            ["person-outline", `Arbitragem: ${g.referee}`],
            ["wallet-outline", `Caução: ${g.payment}`],
          ].map(([icon, text]) => (
            <Row key={icon}>
              <Icon name={icon as any} color={c.muted} size={18} />
              <Txt style={{ fontSize: 12, flex: 1 }}>{text}</Txt>
            </Row>
          ))}
        </View>
      </Card>
      {g.status === "Aguardando caução" && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <Card style={{ alignItems: "center", gap: 9 }}>
            <Icon name="wallet-outline" size={35} color={c.orange} />
            <Txt style={{ fontSize: 11, color: c.muted }}>
              CAUÇÃO ILUSTRATIVA
            </Txt>
            <Txt style={{ fontSize: 39, lineHeight: 48, fontWeight: "900" }}>
              R$ 50,00
            </Txt>
          </Card>
          <Button
            title="Simular aprovação da caução"
            icon="checkmark"
            onPress={pay}
            disabled={busy}
          />
          <Note>
            O valor é um exemplo e não foi fixado pelo PDF. Nenhum dado de
            cartão é solicitado. A integração financeira real ainda está
            pendente.
          </Note>
        </View>
      )}
      {g.status === "Confirmada" && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <Button
            title="Registrar resultado"
            icon="football-outline"
            secondary
            onPress={() => S(!result)}
          />
          {result && (
            <Card>
              <Input
                label="Gols do seu time"
                keyboardType="number-pad"
                value={a}
                onChangeText={A}
                maxLength={2}
              />
              <Input
                label="Gols do adversário"
                keyboardType="number-pad"
                value={b}
                onChangeText={B}
                maxLength={2}
              />
              <Button
                title="Salvar placar"
                disabled={busy || a === "" || b === ""}
                onPress={async () => {
                  if (await dispatch({ type: "result", id, a, b })) S(false);
                }}
              />
              <Note>
                O resultado só é aceito depois do horário de início do jogo.
              </Note>
            </Card>
          )}
        </View>
      )}
      {["Confirmada", "Aguardando caução"].includes(g.status) && (
        <View style={{ marginTop: 14 }}>
          <Button
            title="Solicitar cancelamento"
            secondary
            icon="close-circle-outline"
            onPress={() => C(!cancel)}
          />
          {cancel && (
            <Card style={{ marginTop: 15 }}>
              <Input
                label="Motivo do cancelamento"
                value={reason}
                onChangeText={R}
                maxLength={250}
                multiline
              />
              <Row
                style={{ justifyContent: "space-between", marginBottom: 20 }}
              >
                <Txt style={{ fontSize: 11 }}>Cancelamento por clima</Txt>
                <Switch
                  value={weather}
                  onValueChange={W}
                  trackColor={{ true: c.orange }}
                />
              </Row>
              <Button
                title="Confirmar solicitação"
                danger
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "Confirmar cancelamento?",
                    weather
                      ? "A solicitação aguarda acordo adversário para isentar a penalidade."
                      : "Taxa ilustrativa: R$ 10 antes do dia ou R$ 30 no dia, se a caução foi simulada.",
                    [
                      { text: "Voltar", style: "cancel" },
                      {
                        text: "Confirmar",
                        onPress: () =>
                          dispatch({ type: "cancel", id, reason, weather }),
                      },
                    ],
                  )
                }
              />
            </Card>
          )}
        </View>
      )}
      {g.status === "Clima: aguardando acordo" && (
        <View style={{ marginTop: 20 }}>
          <Note>
            Condição climática informada: {g.reason}. A isenção depende da
            concordância adversária.
          </Note>
          <Button
            title="Simular concordância do adversário"
            icon="rainy-outline"
            onPress={() => dispatch({ type: "weatherAgree", id })}
          />
        </View>
      )}
      {g.status === "Cancelada" && (
        <Note>
          Cancelamento registrado. Penalidade ilustrativa: R$ {g.fee || 0},00.
          Nenhuma cobrança ou estorno real foi realizado.
        </Note>
      )}
      {g.status === "Concluída" && (
        <View style={{ marginTop: 20, gap: 15 }}>
          <Txt
            style={{
              fontSize: 40,
              lineHeight: 50,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            {g.score}
          </Txt>
          <Button
            title={g.review ? "Avaliação já enviada" : "Avaliar adversário"}
            disabled={!!g.review}
            onPress={() =>
              router.push({ pathname: "/avaliar", params: { id } })
            }
            icon="star-outline"
          />
        </View>
      )}
    </Screen>
  );
}
