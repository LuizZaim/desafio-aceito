import { router } from "expo-router";
import { useStore } from "../core/store";
import type { Team } from "../core/domain";
import { Card, Txt, Button, Note } from "./ui";
export function TeamDetails({ id, resolvedTeam }: { id?: string; resolvedTeam?: Team }) {
  const { academic, teams } = useStore();
  const own = !id;
  const team = resolvedTeam || teams.find((item) => item.id === id);
  const players = own ? academic.players : team?.players || [];
  const field = own ? academic.preferredField : team?.preferredField;
  return <>
    <Txt style={{ fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 16 }}>Campo e elenco</Txt>
    <Card style={{ gap: 12 }}>
      <Txt style={{ fontWeight: "700" }}>Campo preferido: {field || "Não informado"}</Txt>
      <Txt style={{ fontSize: 12 }}>A preferência de local não representa uma reserva.</Txt>
      {players.length ? players.map((player) => <Txt key={player.id} style={{ fontSize: 13 }}>{player.number === null ? "—" : `#${player.number}`} · {player.name} · {player.position}</Txt>) : <Txt style={{ fontSize: 12 }}>Nenhum jogador informado no elenco.</Txt>}
      {own && <Button title="Editar campo e jogadores" secondary icon="people-outline" onPress={() => router.push("/jogadores")} />}
    </Card>
    {own && <>
      <Txt style={{ fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 16 }}>Nossas conquistas</Txt>
      {academic.achievements.length ? academic.achievements.map((item) => <Card key={item.id} style={{ marginBottom: 10, gap: 6 }}><Txt style={{ fontWeight: "800" }}>{item.title}</Txt><Txt style={{ fontSize: 12 }}>{item.description}</Txt></Card>) : <Note>Os marcos aparecem conforme seu time registra matches, partidas e avaliações no aplicativo.</Note>}
    </>}
  </>;
}
