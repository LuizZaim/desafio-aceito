import { router } from "expo-router";
import { useStore } from "../core/store";
import { Screen, Section, Note, Card, Txt, Button, DemoLabel, Empty } from "../components/ui";
export default function Payments() {
  const { state, academic } = useStore();
  return <Screen>
    <DemoLabel />
    <Section eyebrow="ETAPA FINANCEIRA ACADÊMICA" title="Pagamentos demonstrativos" text="Acompanhe as cauções simuladas e conheça os identificadores e planos do projeto." />
    <Note>Todos os valores, cartões e créditos desta área são fictícios. Nenhum pagamento, assinatura ou estorno real é realizado.</Note>
    <Card style={{ gap: 14, marginBottom: 18 }}>
      <Txt style={{ fontWeight: "800" }}>{academic.cards.length} identificador(es) de cartão</Txt>
      <Button title="Gerenciar cartões fictícios" icon="card-outline" secondary onPress={() => router.push("/cartoes")} />
      <Txt>Plano: {academic.subscription.plan === "academico" ? "Acadêmico demonstrativo" : "Gratuito"}</Txt>
      <Button title="Planos e créditos de prioridade" icon="star-outline" secondary onPress={() => router.push("/assinaturas")} />
    </Card>
    <Txt style={{ fontSize: 18, fontWeight: "800", marginVertical: 18 }}>Cauções das partidas</Txt>
    {!state.games.length ? <Empty title="Sem registros de caução" text="Agende uma partida para demonstrar a caução e os possíveis cancelamentos." /> : state.games.map((game) => <Card key={game.id} style={{ gap: 9, marginBottom: 12 }}>
      <Txt style={{ fontWeight: "700" }}>{game.date.split("-").reverse().join("/")} · {game.time}</Txt>
      <Txt>{game.status} · {game.payment}</Txt>
      {!!game.fee && <Txt>Penalidade ilustrativa: R$ {game.fee.toFixed(2).replace(".", ",")}</Txt>}
      <Button title="Ver detalhes da partida" secondary onPress={() => router.push({ pathname: "/partida", params: { id: game.id } })} />
    </Card>)}
  </Screen>;
}
