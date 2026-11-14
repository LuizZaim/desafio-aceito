import { useStore } from "../core/store";
import { Screen, Section, Card, Txt, Note, Button, DemoLabel } from "../components/ui";
export default function Plans() {
  const { academic, dispatch, busy } = useStore();
  const { plan, priorityCredits } = academic.subscription;
  return <Screen>
    <DemoLabel />
    <Section eyebrow="PLANOS DO PROTÓTIPO" title="Prioridade para demonstrar." text="Explore planos ilustrativos sem preços, contratação ou cobrança real." />
    <Note>Créditos apenas destacam um interesse no aplicativo. Não garantem reciprocidade nem liberam a conversa sem match.</Note>
    <Card style={{ gap: 12, marginBottom: 18 }}>
      <Txt style={{ fontSize: 20, fontWeight: "800" }}>Gratuito</Txt>
      <Txt>Cadastro, descoberta, matches e fluxo de partidas da apresentação.</Txt>
      <Button title={plan === "gratuito" ? "Plano atual" : "Selecionar plano gratuito"} secondary disabled={busy || plan === "gratuito"} onPress={() => void dispatch({ type: "selectAcademicPlan", plan: "gratuito" })} />
    </Card>
    <Card style={{ gap: 12, marginBottom: 18 }}>
      <Txt style={{ fontSize: 20, fontWeight: "800" }}>Acadêmico demonstrativo</Txt>
      <Txt>Permite demonstrar um interesse prioritário. A primeira ativação libera um crédito fictício; alternar o plano não renova esse crédito.</Txt>
      <Button title={plan === "academico" ? "Plano atual" : "Ativar plano acadêmico sem cobrança"} disabled={busy || plan === "academico"} onPress={() => void dispatch({ type: "selectAcademicPlan", plan: "academico" })} />
    </Card>
    <Card style={{ gap: 12 }}>
      <Txt style={{ fontSize: 18, fontWeight: "800" }}>Seus créditos fictícios: {priorityCredits}</Txt>
      <Txt>Para repetir a apresentação, você pode adicionar um crédito de demonstração, até o limite de dez.</Txt>
      <Button title="Adicionar 1 crédito fictício gratuito" secondary disabled={busy || priorityCredits >= 10} onPress={() => void dispatch({ type: "addPriorityCredit" })} />
    </Card>
  </Screen>;
}
