import { useState } from "react";
import { Alert, Switch } from "react-native";
import { router } from "expo-router";
import { useStore } from "../core/store";
import { brazilianStates } from "../core/domain";
import type { RefereeKind } from "../core/arbitration";
import { formatDate } from "./game-card";
import { RefereeMerits } from "./referee-merits";
import {
  Screen, Section, Card, Row, Txt, Button, Chip, Empty, Note,
  Input, DemoLabel, useColors,
} from "./ui";

const roleTitle = (role: string) => role === "arbitro" ? "Árbitro" : role === "bandeirinha1" ? "Bandeirinha 1" : "Bandeirinha 2";

export function ConnectedReferee() {
  const { arbitration, dispatch, busy, state, logout } = useStore();
  const { profile, invites } = arbitration;
  const c = useColors();
  const [editing, setEditing] = useState(!profile);
  const [name, setName] = useState(profile?.name || "");
  const [city, setCity] = useState(profile?.city || "");
  const [uf, setUf] = useState(profile?.state || "");
  const [kind, setKind] = useState<RefereeKind>(profile?.kind || "arbitro");
  const [bio, setBio] = useState(profile?.bio || "");
  const [available, setAvailable] = useState(profile?.available ?? true);

  function edit() {
    if (profile) {
      setName(profile.name);
      setCity(profile.city);
      setUf(profile.state);
      setKind(profile.kind);
      setBio(profile.bio);
      setAvailable(profile.available);
    }
    setEditing(true);
  }
  async function save() {
    if (name.trim().length < 3 || city.trim().length < 2 || !(brazilianStates as readonly string[]).includes(uf.trim().toUpperCase())) {
      Alert.alert("Confira seu perfil", "Informe nome com pelo menos 3 caracteres, cidade e uma UF válida.");
      return;
    }
    if (await dispatch({ type: profile ? "refereeProfile" : "registerReferee", name: name.trim(), city: city.trim(), state: uf.trim().toUpperCase(), kind, bio: bio.trim(), available })) {
      setEditing(false);
      Alert.alert("Perfil de arbitragem salvo", "Outros organizadores podem convidar você quando sua disponibilidade estiver ativada.");
    }
  }
  return (
    <Screen>
      <DemoLabel />
      <Section eyebrow="ARBITRAGEM ENTRE CONTAS" title="Seu apito também conecta." text="Cadastre seu perfil, informe disponibilidade e responda aos convites destinados a você." />
      <Note>Perfil autodeclarado para apresentação acadêmica. Este cadastro é separado da sua equipe e não comprova habilitação profissional externa.</Note>
      {editing ? (
        <Card style={{ marginTop: 20, gap: 8 }}>
          <Input label="Nome público *" value={name} onChangeText={setName} maxLength={100} editable={!busy} />
          <Input label="Cidade *" value={city} onChangeText={setCity} maxLength={80} editable={!busy} />
          <Input label="Estado (UF) *" value={uf} onChangeText={(value) => setUf(value.replace(/[^a-z]/gi, "").toUpperCase())} maxLength={2} autoCapitalize="characters" editable={!busy} />
          <Txt style={{ fontWeight: "700", marginBottom: 6 }}>Atuação *</Txt>
          <Row style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <Chip title="Árbitro" selected={kind === "arbitro"} onPress={() => !busy && setKind("arbitro")} />
            <Chip title="Bandeirinha" selected={kind === "bandeirinha"} onPress={() => !busy && setKind("bandeirinha")} />
          </Row>
          <Input label="Apresentação (opcional)" value={bio} onChangeText={setBio} maxLength={500} multiline editable={!busy} />
          <Row style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <Txt style={{ flex: 1, fontSize: 12 }}>Disponível para receber convites</Txt>
            <Switch accessibilityLabel="Disponível para receber convites" value={available} disabled={busy} onValueChange={setAvailable} trackColor={{ true: c.orange }} />
          </Row>
          <Button title={busy ? "Salvando perfil…" : "Salvar perfil de arbitragem"} disabled={busy} onPress={save} />
          {!!profile && <Button title="Cancelar edição" secondary disabled={busy} onPress={() => setEditing(false)} />}
        </Card>
      ) : profile && (
        <Card style={{ marginTop: 20, gap: 14 }}>
          <Txt style={{ fontSize: 20, fontWeight: "800" }}>{profile.name}</Txt>
          <Txt style={{ color: c.muted, fontSize: 12 }}>{profile.city} · {profile.state} · {profile.kind === "arbitro" ? "Árbitro" : "Bandeirinha"}</Txt>
          {!!profile.bio && <Txt style={{ fontSize: 12 }}>{profile.bio}</Txt>}
          <Row style={{ justifyContent: "space-between" }}>
            <Txt style={{ flex: 1, fontSize: 12 }}>Disponível para apitar</Txt>
            <Switch accessibilityLabel="Disponível para apitar" value={profile.available} disabled={busy} onValueChange={(value) => void dispatch({ type: "refereeAvailable", value })} trackColor={{ true: c.orange }} />
          </Row>
          <Button title="Editar perfil de arbitragem" secondary disabled={busy} onPress={edit} />
        </Card>
      )}
      <Txt style={{ fontSize: 18, fontWeight: "800", marginVertical: 24 }}>Seus convites e atuações</Txt>
      {!invites.length ? <Empty title="Nenhum convite recebido" text="Organizadores de outras contas podem convidar seu perfil para partidas confirmadas futuras. Sua própria equipe não pode contratar você." /> : invites.map((invite) => (
        <Card key={invite.id} style={{ marginBottom: 16, gap: 13 }}>
          <Row style={{ flexWrap: "wrap" }}><Chip title={roleTitle(invite.role)} /><Chip title={invite.status} /></Row>
          <Txt style={{ fontWeight: "800", fontSize: 17 }}>{invite.teamAName} × {invite.teamBName}</Txt>
          <Txt style={{ fontSize: 12, color: c.muted }}>{formatDate(invite.date)} · {invite.time} · Brasília</Txt>
          <Txt style={{ fontSize: 12, color: c.muted }}>{invite.field}</Txt>
          <Txt style={{ fontSize: 11, color: c.muted }}>Partida: {invite.gameStatus}</Txt>
          {invite.canRespond && <>
            {!profile?.available && <Txt style={{ color: c.muted, fontSize: 11 }}>Ative sua disponibilidade para aceitar este convite.</Txt>}
            <Button title="Aceitar atuação" disabled={busy || !profile?.available} icon="checkmark" onPress={() => Alert.alert("Aceitar este convite?", "Seu horário será verificado para evitar conflito com outra atuação.", [{ text: "Voltar", style: "cancel" }, { text: "Aceitar", onPress: () => dispatch({ type: "respondReferee", id: invite.id, accept: true }) }])} />
            <Button title="Recusar convite" secondary disabled={busy} onPress={() => Alert.alert("Recusar convite?", "O organizador poderá convidar outro profissional.", [{ text: "Voltar", style: "cancel" }, { text: "Recusar", onPress: () => dispatch({ type: "respondReferee", id: invite.id, accept: false }) }])} />
          </>}
        </Card>
      ))}
      <RefereeMerits />
      <Button title="Dados de acesso e recuperação" secondary onPress={() => router.push("/conta")} />
      {state.teamRegistered === false && <>
        <Button title="Cadastrar uma equipe também" secondary disabled={busy} onPress={() => router.push("/editar")} />
        <Button title="Sair da conta" secondary disabled={busy} style={{ marginTop: 12 }} onPress={async () => {
          try { await logout(); router.replace("/"); }
          catch { Alert.alert("Não foi possível sair", "Tente novamente."); }
        }} />
      </>}
    </Screen>
  );
}
