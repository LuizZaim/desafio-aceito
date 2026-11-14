import { useState } from "react";
import { useStore } from "../core/store";
import { Screen, Section, Card, Input, Button, Note, Txt, Empty, DemoLabel } from "../components/ui";
export default function Cards() {
  const { academic, dispatch, busy } = useStore();
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [error, setError] = useState("");
  async function add() {
    if (label.trim().length < 3 || !/^\d{4}$/.test(last4)) { setError("Informe um apelido de pelo menos 3 caracteres e quatro dígitos fictícios."); return; }
    setError("");
    if (await dispatch({ type: "addDemoCard", label: label.trim(), last4 })) { setLabel(""); setLast4(""); }
  }
  return <Screen>
    <DemoLabel />
    <Section eyebrow="SEM COBRANÇAS REAIS" title="Cartões fictícios" text="Salve somente um apelido e quatro dígitos inventados para apresentar esta tela." />
    <Note>Estes registros não são cartões de pagamento. O aplicativo não pede número completo, validade ou código de segurança.</Note>
    <Card style={{ marginBottom: 20 }}>
      <Input label="Apelido fictício" placeholder="Ex.: Cartão da apresentação" value={label} onChangeText={setLabel} maxLength={40} editable={!busy} />
      <Input label="Quatro dígitos fictícios" placeholder="Ex.: 1234" value={last4} onChangeText={(value) => setLast4(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" maxLength={4} editable={!busy} />
      {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24", marginBottom: 14 }}>{error}</Txt>}
      <Button title={busy ? "Salvando…" : "Adicionar identificador fictício"} disabled={busy || academic.cards.length >= 5} onPress={add} />
    </Card>
    {!academic.cards.length ? <Empty title="Nenhum identificador salvo" text="Você pode cadastrar até cinco identificadores para a demonstração." /> : academic.cards.map((card) => <Card key={card.id} style={{ gap: 12, marginBottom: 14 }}>
      <Txt style={{ fontSize: 17, fontWeight: "800" }}>{card.label}</Txt>
      <Txt>•••• {card.last4} · Fictício</Txt>
      <Button title={`Remover ${card.label}`} secondary disabled={busy} onPress={() => void dispatch({ type: "removeDemoCard", id: card.id })} />
    </Card>)}
  </Screen>;
}
