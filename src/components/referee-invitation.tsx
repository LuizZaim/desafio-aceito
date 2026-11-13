import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import type { Game } from "../core/domain";
import type { RefereeRole } from "../core/arbitration";
import { useStore } from "../core/store";
import { Button, Card, Chip, Note, Row, Txt, useColors } from "./ui";

const roles: { id: RefereeRole; label: string }[] = [
  { id: "arbitro", label: "Árbitro" },
  { id: "bandeirinha1", label: "Bandeirinha 1" },
  { id: "bandeirinha2", label: "Bandeirinha 2" },
];
export function RefereeInvitation({ game }: { game: Game }) {
  const { arbitration, dispatch, busy } = useStore();
  const c = useColors();
  const [role, setRole] = useState<RefereeRole>("arbitro");
  const [selected, setSelected] = useState("");
  const [openedAt] = useState(() => Date.now());
  const future = new Date(`${game.date}T${game.time}:00-03:00`).getTime() > openedAt;
  const occupied = game.refereeAssignments?.some((assignment) => assignment.role === role && ["Pendente", "Aceito"].includes(assignment.status));
  const professionals = arbitration.professionals.filter((profile) => profile.available && profile.id !== arbitration.profile?.id && profile.kind === (role === "arbitro" ? "arbitro" : "bandeirinha"));
  async function invite() {
    if (new Date(`${game.date}T${game.time}:00-03:00`).getTime() <= Date.now()) {
      Alert.alert("Horário de início alcançado", "Novos convites são permitidos apenas antes do início da partida.");
      return;
    }
    if (await dispatch({ type: "inviteReferee", id: game.id, refereeId: selected, role })) {
      setSelected("");
      Alert.alert("Convite enviado", "O profissional precisa aceitar a atuação pela própria conta.");
    }
  }
  return (
    <Card style={{ marginTop: 20, gap: 15 }}>
      <Txt style={{ fontSize: 18, fontWeight: "800" }}>Arbitragem da partida</Txt>
      {(game.refereeAssignments || []).map((assignment) => (
        <View key={assignment.id} style={{ gap: 5 }}>
          <Txt style={{ fontSize: 12, fontWeight: "700" }}>{assignment.name}</Txt>
          <Txt style={{ fontSize: 11, color: c.muted }}>{roles.find((item) => item.id === assignment.role)?.label} · {assignment.status}</Txt>
        </View>
      ))}
      {game.status === "Confirmada" && future ? <>
        <Txt style={{ fontSize: 12 }}>Escolha a função e envie um convite a outro profissional disponível.</Txt>
        <Row style={{ flexWrap: "wrap" }}>
          {roles.map((item) => <Chip key={item.id} title={item.label} selected={role === item.id} onPress={() => { if (!busy) { setRole(item.id); setSelected(""); } }} />)}
        </Row>
        {occupied ? <Note>Esta função já tem um convite pendente ou aceito.</Note> : <>
          {!professionals.length && <Txt style={{ fontSize: 12, color: c.muted }}>Nenhum profissional disponível nesta função. Cadastros de outras contas aparecerão ao atualizar a tela.</Txt>}
          {professionals.map((profile) => <Chip key={profile.id} title={`${profile.name} · ${profile.city}/${profile.state}`} selected={selected === profile.id} onPress={() => !busy && setSelected(profile.id)} />)}
          <Button title={busy ? "Enviando convite…" : "Convidar profissional"} disabled={busy || !selected || !professionals.some((profile) => profile.id === selected)} onPress={invite} />
        </>}
      </> : <Note>Convites podem ser enviados em partidas confirmadas antes do horário de início.</Note>}
      <Button title="Meu perfil e convites de arbitragem" secondary onPress={() => router.push("/arbitragem")} />
      <Txt style={{ fontSize: 10, color: c.muted }}>Perfis autodeclarados para apresentação acadêmica. A própria equipe não pode contratar seu organizador como árbitro.</Txt>
    </Card>
  );
}
