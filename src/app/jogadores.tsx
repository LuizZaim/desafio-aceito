import { useState } from "react";
import { useStore } from "../core/store";
import { Screen, Section, Card, Input, Button, Note, Txt, Empty, DemoLabel } from "../components/ui";
export default function Players() {
  const { academic, dispatch, busy, mode } = useStore();
  const [field, setField] = useState(academic.preferredField);
  const [id, setId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  function clear() { setId(undefined); setName(""); setNumber(""); setPosition(""); setError(""); }
  async function savePlayer() {
    setSaved("");
    if (name.trim().length < 2 || position.trim().length < 2 || number !== "" && !/^\d{1,2}$/.test(number)) { setError("Informe nome e posição com pelo menos 2 caracteres. O número pode ficar vazio ou ser de 0 a 99."); return; }
    if (await dispatch({ type: "savePlayer", id, name: name.trim(), position: position.trim(), number: number === "" ? null : Number(number) })) { clear(); setSaved("Jogador salvo no elenco."); }
  }
  return <Screen>
    <DemoLabel />
    <Section eyebrow="A CASA E O ELENCO DO TIME" title="Quem entra em campo." text="Informe o local preferido e mantenha seu elenco atualizado." />
    <Card style={{ marginBottom: 22 }}>
      <Input label="Campo ou quadra preferidos (opcional)" value={field} onChangeText={setField} maxLength={120} editable={!busy} placeholder="Nome e região do local" />
      <Button title="Salvar campo preferido" secondary disabled={busy} onPress={async () => { if (await dispatch({ type: "teamField", field: field.trim() })) setSaved("Campo preferido salvo."); }} />
      <Note>Informar o campo não faz uma reserva. A proposta de amistoso continua definindo data e local.</Note>
    </Card>
    {!!saved && <Txt accessibilityLiveRegion="polite" style={{ marginBottom: 20 }}>{saved}</Txt>}
    <Card style={{ marginBottom: 20 }}>
      <Txt style={{ fontSize: 18, fontWeight: "800", marginBottom: 18 }}>{id ? "Editar jogador" : "Adicionar jogador"}</Txt>
      <Input label="Nome do jogador" value={name} onChangeText={setName} maxLength={60} editable={!busy} />
      <Input label="Número (opcional)" value={number} onChangeText={(value) => setNumber(value.replace(/\D/g, "").slice(0, 2))} keyboardType="number-pad" maxLength={2} editable={!busy} />
      <Input label="Posição" value={position} onChangeText={setPosition} maxLength={30} editable={!busy} placeholder="Ex.: Goleiro, defesa, meio-campo" />
      {!!error && <Txt accessibilityRole="alert" style={{ color: "#a23d24", marginBottom: 14 }}>{error}</Txt>}
      <Button title={busy ? "Salvando…" : id ? "Salvar jogador" : "Adicionar ao elenco"} disabled={busy} onPress={savePlayer} />
      {!!id && <Button title="Cancelar edição" secondary disabled={busy} style={{ marginTop: 10 }} onPress={clear} />}
    </Card>
    <Note>{mode === "online" ? "O elenco e o campo preferido aparecem no perfil público da equipe para outras contas." : "Seu elenco fica salvo neste aparelho. Os dados não são enviados a outros usuários."}</Note>
    {!academic.players.length ? <Empty title="O elenco começa aqui" text="Cadastre os primeiros jogadores. O limite é de quarenta, sem números repetidos." /> : academic.players.map((player) => <Card key={player.id} style={{ marginBottom: 14, gap: 12 }}>
      <Txt style={{ fontWeight: "800", fontSize: 17 }}>{player.number === null ? "Sem número" : `#${player.number}`} · {player.name}</Txt>
      <Txt>{player.position}</Txt>
      <Button title={`Editar ${player.name}`} secondary disabled={busy} onPress={() => { setId(player.id); setName(player.name); setNumber(player.number === null ? "" : String(player.number)); setPosition(player.position); setError(""); setSaved(""); }} />
      <Button title={`Remover ${player.name}`} secondary disabled={busy} onPress={async () => { if (await dispatch({ type: "removePlayer", id: player.id }) && id === player.id) clear(); }} />
    </Card>)}
  </Screen>;
}
