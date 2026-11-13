import { View, Switch } from "react-native";
import { useStore } from "../core/store";
import {
  Screen,
  Section,
  Card,
  Row,
  Txt,
  Button,
  Icon,
  Chip,
  Empty,
  Note,
  useColors,
} from "../components/ui";
import { formatDate } from "../components/game-card";
import { ConnectedReferee } from "../components/connected-referee";
export default function Referee() {
  const { state: s, dispatch, busy, mode, teams } = useStore();
  const c = useColors();
  if (mode === "online") return <ConnectedReferee />;
  return (
    <Screen>
      <Section
        eyebrow="QUEM GARANTE O JOGO LIMPO"
        title="O campo precisa do seu apito."
        text="Sua disponibilidade, seus convites e seu histórico."
      />
      {s.profile.role !== "arbitro" ? (
        <Card style={{ alignItems: "center", gap: 20, paddingVertical: 35 }}>
          <Icon name="flag-outline" size={45} color={c.muted} />
          <Txt style={{ fontWeight: "800", textAlign: "center", fontSize: 19 }}>
            Um perfil para quem{`\n`}comanda o jogo.
          </Txt>
          <Txt style={{ fontSize: 12, textAlign: "center", color: c.muted }}>
            Alterne o perfil para conhecer a área de arbitragem na demonstração.
          </Txt>
          <Button
            title="Explorar como árbitro"
            icon="arrow-forward"
            onPress={() => dispatch({ type: "role", role: "arbitro" })}
          />
        </Card>
      ) : (
        <>
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: "700", fontSize: 13 }}>
                  Disponível para apitar
                </Txt>
                <Txt style={{ color: c.muted, fontSize: 10, marginTop: 6 }}>
                  Ative para aceitar convites.
                </Txt>
              </View>
              <Switch
                value={s.profile.available}
                onValueChange={async (value) => {
                  await dispatch({ type: "available", value });
                }}
                trackColor={{ true: c.orange }}
              />
            </Row>
          </Card>
          <Txt style={{ fontWeight: "800", fontSize: 17, marginVertical: 24 }}>
            Convites de partidas
          </Txt>
          {s.games
            .filter((g) => g.status === "Confirmada")
            .map((g) => (
              <Card key={g.id} style={{ marginBottom: 17 }}>
                <Chip
                  title={
                    g.referee === "Pendente" ? "Convite disponível" : g.referee
                  }
                />
                <Txt
                  style={{
                    fontWeight: "800",
                    fontSize: 17,
                    lineHeight: 25,
                    marginTop: 20,
                  }}
                >
                  {s.profile.name} × {teams.find((t) => t.id === g.team)?.name}
                </Txt>
                <Txt style={{ fontSize: 11, color: c.muted, marginTop: 15 }}>
                  {formatDate(g.date)} · {g.time}
                </Txt>
                <Txt style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>
                  {g.field}
                </Txt>
                {g.referee === "Pendente" && (
                  <Row style={{ marginTop: 20 }}>
                    <Button
                      title="Recusar"
                      secondary
                      style={{ flex: 1 }}
                      disabled={busy}
                      onPress={() =>
                        dispatch({ type: "referee", id: g.id, accept: false })
                      }
                    />
                    <Button
                      title="Aceitar"
                      icon="checkmark"
                      style={{ flex: 1 }}
                      disabled={busy}
                      onPress={() =>
                        dispatch({ type: "referee", id: g.id, accept: true })
                      }
                    />
                  </Row>
                )}
              </Card>
            ))}
          {!s.games.some((g) => g.status === "Confirmada") && (
            <Empty
              title="Sem convites disponíveis"
              text="Partidas confirmadas da demonstração serão exibidas aqui."
            />
          )}
          <Button
            title="Voltar ao perfil de organizador"
            secondary
            onPress={() => dispatch({ type: "role", role: "organizador" })}
          />
          <Note>
            O papel pode ser alternado apenas porque este é um ambiente de
            demonstração. A habilitação profissional para produção ainda precisa
            de verificação.
          </Note>
        </>
      )}
    </Screen>
  );
}
