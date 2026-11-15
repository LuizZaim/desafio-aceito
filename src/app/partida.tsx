import { useState } from "react";
import { View, Alert, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../core/store";
import { routeId } from "../core/navigation";
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
  DemoLabel,
} from "../components/ui";
import { formatDate } from "../components/game-card";
import { RefereeInvitation } from "../components/referee-invitation";
export default function Partida() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeId(params.id) || "";
  const { state: s, dispatch, busy, mode, teams } = useStore();
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
                "Confirmado para demonstração",
                "Caução simulada aprovada. O amistoso está confirmado no aplicativo. Nenhum valor foi cobrado.",
              );
          },
        },
      ],
    );
  }
  return (
    <Screen>
      <DemoLabel />
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
      {g.status === "Aguardando adversário" && (
        <Card style={{ marginTop: 20, gap: 16 }}>
          <Txt style={{ fontWeight: "800", fontSize: 16 }}>{g.canRespond ? "Seu time recebeu uma proposta" : "Proposta enviada ao adversário"}</Txt>
          <Txt style={{ color: c.muted, fontSize: 12 }}>
            {g.canRespond ? "Confira data, horário, local e mando antes de responder. O aceite reserva o horário na agenda do app e mantém a partida aguardando caução." : "Aguarde a outra equipe aceitar ou recusar. A resposta aparecerá nesta agenda ao atualizar."}
          </Txt>
          {g.canRespond && <>
            <Button title={busy ? "Salvando resposta…" : "Aceitar proposta"} disabled={busy} icon="checkmark" onPress={() => Alert.alert("Aceitar esta proposta?", "Depois do aceite, a caução poderá ser simulada para confirmar a partida nesta apresentação acadêmica. Nenhum valor será cobrado.", [{ text: "Voltar", style: "cancel" }, { text: "Aceitar", onPress: () => dispatch({ type: "acceptProposal", id }) }])} />
            <Button title="Recusar proposta" secondary disabled={busy} onPress={() => Alert.alert("Recusar proposta?", "As duas equipes verão a proposta como cancelada e o horário ficará disponível.", [{ text: "Voltar", style: "cancel" }, { text: "Recusar", style: "destructive", onPress: () => dispatch({ type: "rejectProposal", id }) }])} />
          </>}
        </Card>
      )}
      {g.status === "Aguardando caução" && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <Card style={{ alignItems: "center", gap: 9 }}>
            <Icon name="wallet-outline" size={35} color={c.orange} />
            <Txt style={{ fontSize: 12, color: c.muted }}>
              CAUÇÃO ILUSTRATIVA
            </Txt>
            <Txt style={{ fontSize: 39, lineHeight: 48, fontWeight: "900" }}>
              R$ 50,00
            </Txt>
          </Card>
          <Button
            title="Simular caução e confirmar"
            icon="checkmark"
            onPress={pay}
            disabled={busy}
          />
          <Note>
            Simulação para apresentação acadêmica. O valor de R$ 50 é ilustrativo e não foi fixado pelo PDF. Nenhum dado de cartão é solicitado e nenhuma cobrança real é feita.
          </Note>
        </View>
      )}
      {g.status === "Confirmada" && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <Button
            title={mode === "online" ? "Registrar resultado" : "Simular jogo e registrar resultado"}
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
                title={mode === "online" ? "Salvar placar" : "Salvar placar simulado"}
                disabled={busy || a === "" || b === ""}
                onPress={async () => {
                  if (await dispatch({ type: mode === "online" ? "result" : "simulateResult", id, a, b })) S(false);
                }}
              />
              <Note>
                {mode === "online" ? "O resultado só é aceito depois do horário de início do jogo." : "Simulação acadêmica: você pode avançar ao pós-jogo agora, mesmo com data futura, para demonstrar o placar e a avaliação. A data agendada permanece no histórico e o jogo será marcado como simulado."}
              </Note>
            </Card>
          )}
        </View>
      )}
      {mode === "online" && <RefereeInvitation game={g} />}
      {["Confirmada", "Aguardando caução", "Aguardando adversário"].includes(g.status) && (
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
                <Txt style={{ fontSize: 12 }}>Cancelamento por clima</Txt>
                <Switch
                  value={weather}
                  onValueChange={W}
                  trackColor={{ true: c.action }}
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
                      : "Taxa ilustrativa: R$ 10 antes do dia ou R$ 30 no dia, se a caução foi simulada. Nenhum valor será cobrado de verdade.",
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
          {(mode !== "online" || g.canWeatherAgree) ? <Button
            title={mode !== "online" ? "Simular concordância do adversário" : "Concordar com cancelamento por clima"}
            icon="rainy-outline"
            disabled={busy}
            onPress={() => Alert.alert("Concordar com o cancelamento?", "A partida será cancelada para as duas equipes.", [{ text: "Voltar", style: "cancel" }, { text: "Concordar", onPress: () => dispatch({ type: "weatherAgree", id }) }])}
          /> : <Txt style={{ color: c.muted, fontSize: 12 }}>Aguarde a concordância do adversário. Você não pode aprovar sua própria solicitação.</Txt>}
        </View>
      )}
      {g.status === "Cancelada" && (
        <Note>
          Cancelamento registrado. Penalidade ilustrativa: R$ {g.fee || 0},00. Nenhuma cobrança ou estorno real foi realizado.
        </Note>
      )}
      {g.status === "Concluída" && (
        <View style={{ marginTop: 20, gap: 15 }}>
          {g.simulated && <Note>Pós-jogo simulado para apresentação acadêmica. Este placar não comprova uma partida realizada.</Note>}
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
