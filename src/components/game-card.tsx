import { View } from "react-native";
import { router } from "expo-router";
import { type Game, reviewAverage } from "../core/domain";
import { useStore } from "../core/store";
import {
  Card,
  Row,
  Txt,
  Crest,
  Chip,
  Icon,
  Button,
  Line,
  useColors,
} from "./ui";
export const formatDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
export function GameCard({ game: g }: { game: Game }) {
  const { state: s, teams, mode } = useStore();
  const c = useColors();
  const t = teams.find((t) => t.id === g.team);
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Chip title={g.status} />
        <Txt style={{ fontSize: 8, color: c.muted }}>
          {g.payment === "Simulada" ? "Caução simulada" : g.payment}
        </Txt>
      </Row>
      <Row style={{ justifyContent: "space-around", paddingVertical: 24 }}>
        <View style={{ alignItems: "center", gap: 9, width: "40%" }}>
          <Crest size={45} />
          <Txt style={{ fontWeight: "700", fontSize: 11, textAlign: "center" }}>
            {s.profile.name}
          </Txt>
        </View>
        <Txt
          style={{
            color: c.muted,
            fontSize: g.score ? 19 : 11,
            fontWeight: "700",
          }}
        >
          {g.score || "VS"}
        </Txt>
        <View style={{ alignItems: "center", gap: 9, width: "40%" }}>
          <Crest team={t} size={45} />
          <Txt style={{ fontWeight: "700", fontSize: 11, textAlign: "center" }}>
            {t?.name}
          </Txt>
        </View>
      </Row>
      <View style={{ gap: 8 }}>
        <Row style={{ gap: 6 }}>
          <Icon name="calendar-outline" size={14} color={c.muted} />
          <Txt style={{ fontSize: 10, color: c.muted }}>
            {formatDate(g.date)} · {g.time}
          </Txt>
        </Row>
        <Row style={{ gap: 6 }}>
          <Icon name="location-outline" size={14} color={c.muted} />
          <Txt style={{ fontSize: 10, color: c.muted, flex: 1 }}>{g.field}</Txt>
        </Row>
      </View>
      <Line />
      {g.status === "Concluída" && !g.review ? (
        <Button
          title="Avaliar adversário"
          icon="star-outline"
          onPress={() =>
            router.push({ pathname: "/avaliar", params: { id: g.id } })
          }
        />
      ) : g.review ? (
        <Row>
          <Icon name="checkmark-circle" color="#86a176" size={16} />
          <Txt style={{ fontSize: 11, color: c.muted }}>
            Avaliação enviada ·{" "}
            {reviewAverage(g.review)?.toFixed(1) ?? "Sem nota"}
          </Txt>
        </Row>
      ) : (
        <Button
          title={
            g.status === "Aguardando caução"
              ? mode === "demo" ? "Confirmar caução simulada" : "Ver pendência da caução"
              : g.status === "Aguardando adversário" ? g.canRespond ? "Responder proposta" : "Acompanhar proposta" : "Ver partida"
          }
          secondary={g.status !== "Aguardando caução"}
          icon={
            g.status === "Aguardando caução"
              ? "wallet-outline"
              : "arrow-forward"
          }
          onPress={() =>
            router.push({ pathname: "/partida", params: { id: g.id } })
          }
        />
      )}
    </Card>
  );
}
