import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Redirect, router } from "expo-router";
import { useStore } from "../core/store";
import { brazilianStates, teamCategories, teamLevels } from "../core/domain";
import { Screen, Section, Input, Txt, Chip, Button, Note, useColors } from "../components/ui";
export default function Edit() {
  const { state: s, dispatch, busy, mode, logout } = useStore();
  const c = useColors();
  const [creating] = useState(s.teamRegistered === false);
  const [name, N] = useState(s.profile.name),
    [district, D] = useState(s.profile.district),
    [city, Y] = useState(s.profile.city || ""),
    [uf, U] = useState(s.profile.state || ""),
    [category, C] = useState(s.profile.category),
    [level, L] = useState(s.profile.level),
    [bio, B] = useState(s.profile.bio),
    [errors, E] = useState<Record<string, string>>({}),
    [saved, S] = useState(false);
  if (mode === "none") return <Redirect href="/" />;
  const error = (key: string) => errors[key] ? <Txt accessibilityRole="alert" style={{ color: "#b74828", marginTop: -8, marginBottom: 16 }}>{errors[key]}</Txt> : null;
  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Informe um nome com pelo menos 3 caracteres.";
    if (!district.trim()) next.district = "Informe o bairro ou a região do time.";
    if ((creating || city || uf) && city.trim().length < 2) next.city = "Informe a cidade do time.";
    if ((creating || city || uf) && !(brazilianStates as readonly string[]).includes(uf.trim().toUpperCase())) next.uf = "Informe uma UF válida, como SP ou RJ.";
    if (!(teamCategories as readonly string[]).includes(category)) next.category = "Escolha uma categoria.";
    if (!(teamLevels as readonly string[]).includes(level)) next.level = "Escolha o nível técnico.";
    E(next);
    if (Object.keys(next).length) return;
    const ok = await dispatch({ type: creating ? "registerTeam" : "profile", name: name.trim(), district: district.trim(), city: city.trim(), state: uf.trim().toUpperCase(), category, level, bio: bio.trim() });
    if (ok) S(true);
  }
  if (saved) return <Screen><Section eyebrow="TUDO CERTO" title={creating ? "Seu time está cadastrado!" : "Equipe atualizada!"} text={`${name.trim()} já tem seu espaço no Desafio Aceito.`} /><Note>{mode === "online" ? "Seu cadastro foi salvo na sua conta." : mode === "local" ? "Seu time foi salvo neste aparelho e estará aqui quando você reabrir o app. Não há sincronização com outros aparelhos." : "Alterações salvas na demonstração."}</Note><Button title="Ver minha equipe" icon="shield-checkmark-outline" onPress={() => router.replace("/(tabs)/perfil")} style={{ marginTop: 20 }} /><Note>{mode === "online" ? "Outras equipes cadastradas podem encontrar seu time. O interesse mútuo libera a conversa." : mode === "local" ? "Seu time não é publicado neste modo. Para conhecer os demais fluxos com equipes fictícias, escolha a demonstração na tela de entrada." : "Os adversários, as conversas e as partidas desta demonstração são fictícios."}</Note></Screen>;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen>
      <Section eyebrow={creating ? "SUA EQUIPE • DADOS DO TIME" : "SEU TIME, DO SEU JEITO"} title={creating ? "Cadastre seu time." : "Mostre quem vocês são."} text={creating ? "Preencha os dados para criar o perfil da sua equipe. Os campos com * são obrigatórios." : "Mantenha os dados da equipe atualizados."} />
      <Note>{mode === "local" ? "Cadastro neste aparelho. Você poderá voltar e editar seus dados depois." : mode === "online" ? "Este cadastro fica vinculado à sua conta." : "Você está editando a equipe da demonstração."}</Note>
      <View style={{ marginTop: 20 }}>
      <Input label="Nome da equipe *" value={name} onChangeText={N} maxLength={80} placeholder="Ex.: União do Bairro FC" editable={!busy} />{error("name")}
      <Input label="Bairro / região *" value={district} onChangeText={D} maxLength={80} placeholder="Ex.: Tatuapé" editable={!busy} />{error("district")}
      <Input label={creating ? "Cidade *" : "Cidade"} value={city} onChangeText={Y} maxLength={80} placeholder="Ex.: São Paulo" editable={!busy} />{error("city")}
      <Input label={creating ? "Estado (UF) *" : "Estado (UF)"} value={uf} onChangeText={x => U(x.toUpperCase())} maxLength={2} autoCapitalize="characters" placeholder="Ex.: SP" editable={!busy} />{error("uf")}
      <Txt style={{ fontWeight: "700", marginBottom: 12 }}>Categoria *</Txt>
      <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginBottom: 23 }}>{teamCategories.map(x => <Chip title={x} key={x} selected={x === category} onPress={() => !busy && C(x)} />)}</View>{error("category")}
      <Txt style={{ fontWeight: "700", marginBottom: 12 }}>Nível técnico *</Txt>
      <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap", marginBottom: 23 }}>{teamLevels.map(x => <Chip title={x} key={x} selected={x === level} onPress={() => !busy && L(x)} />)}</View>{error("level")}
      <Input label="Sobre o time (opcional)" value={bio} onChangeText={B} multiline maxLength={500} placeholder="Conte a história do time e quando vocês costumam jogar." editable={!busy} />
      <Txt style={{ color: c.muted, fontSize: 11, marginBottom: 20 }}>{bio.length}/500 caracteres</Txt>
      <Button title={busy ? "Salvando equipe…" : creating ? "Cadastrar meu time" : "Salvar alterações"} icon="checkmark" disabled={busy} onPress={submit} />
      {creating && <Button title="Continuar depois" secondary disabled={busy} style={{ marginTop: 12 }} onPress={async () => { await logout(); router.replace("/"); }} />}
      </View>
    </Screen>
    </KeyboardAvoidingView>
  );
}
