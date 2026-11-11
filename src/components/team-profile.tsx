import { useState } from "react";
import { View, Share, Alert } from "react-native";
import { router } from "expo-router";
import { teams } from "../core/domain";
import { useStore } from "../core/store";
import {
  Screen,
  Section,
  Card,
  FieldArt,
  Crest,
  Row,
  Txt,
  Button,
  Chip,
  Input,
  Line,
  Empty,
  Note,
  useColors,
} from "./ui";
import { GameCard } from "./game-card";
export function TeamProfile({ id }: { id?: string }) {
  const { state: s, dispatch, busy } = useStore();
  const c = useColors();
  const [report, R] = useState(false),
    [reason, S] = useState("");
  const own = !id,
    t = teams.find((t) => t.id === id);
  if (!own && !t)
    return (
      <Empty
        title="Equipe não encontrada"
        text="Volte à descoberta para escolher um adversário."
      />
    );
  const name = own ? s.profile.name : t!.name,
    district = own ? s.profile.district : t!.district;
  return (
    <Screen>
      <Section
        eyebrow={own ? "SEU ESCUDO, SUA HISTÓRIA" : "CONHEÇA O ADVERSÁRIO"}
        title={own ? "Sua casa no futebol." : name}
      />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ height: 155, backgroundColor: c.navy }}>
          <FieldArt />
        </View>
        <View style={{ padding: 23, paddingTop: 0 }}>
          <Row
            style={{
              marginTop: -33,
              alignItems: "flex-end",
              gap: 17,
              marginBottom: 21,
            }}
          >
            <Crest team={t} size={76} />
            <View style={{ flex: 1, paddingBottom: 2 }}>
              <Txt
                style={{
                  fontSize: 21,
                  lineHeight: 28,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                {name}
              </Txt>
              <Txt style={{ fontSize: 9, color: c.muted, marginTop: 5 }}>
                {district}, São Paulo
              </Txt>
            </View>
          </Row>
          <Row style={{ marginBottom: 20 }}>
            <Chip title={own ? s.profile.category : t!.category} />
            <Chip title={own ? s.profile.level : t!.level} />
          </Row>
          <Txt style={{ fontSize: 12, lineHeight: 22, color: c.muted }}>
            {own ? s.profile.bio : t!.bio}
          </Txt>
          <Line />
          {own ? (
            <View style={{ gap: 10 }}>
              <Button
                title="Editar minha equipe"
                icon="create-outline"
                onPress={() => router.push("/editar")}
              />
              <Button
                title="Compartilhar equipe"
                icon="share-social-outline"
                secondary
                onPress={() =>
                  Share.share({
                    message: `Conheça ${s.profile.name} no Desafio Aceito! ${s.profile.category} · ${s.profile.level} · ${s.profile.district}, São Paulo. Perfil de demonstração.`,
                  }).catch(() => Alert.alert("Compartilhamento não concluído"))
                }
              />
            </View>
          ) : s.matches.includes(id!) ? (
            <View style={{ gap: 12 }}>
              <Button
                title="Abrir conversa"
                icon="chatbubble-outline"
                onPress={() =>
                  router.push({ pathname: "/chat", params: { id } })
                }
              />
              <Button
                title="Encerrar match"
                secondary
                onPress={() =>
                  Alert.alert(
                    "Encerrar conexão?",
                    "Partidas ativas precisam ser canceladas primeiro.",
                    [
                      { text: "Voltar", style: "cancel" },
                      {
                        text: "Encerrar",
                        onPress: () => dispatch({ type: "unmatch", id }),
                      },
                    ],
                  )
                }
              />
            </View>
          ) : (
            <Button
              title={
                s.interests.includes(id!)
                  ? "Aguardando reciprocidade"
                  : "Bora jogar!"
              }
              icon="heart-outline"
              disabled={s.interests.includes(id!) || busy}
              onPress={async () => {
                if (await dispatch({ type: "interest", id }))
                  Alert.alert(
                    t!.reciprocal ? "É match!" : "Interesse enviado",
                    t!.reciprocal
                      ? "A conversa está liberada."
                      : "Aguarde o interesse da outra equipe.",
                  );
              }}
            />
          )}
        </View>
      </Card>
      {own ? (
        <>
          <Row style={{ gap: 12, marginVertical: 20 }}>
            <Card style={{ flex: 1, alignItems: "center" }}>
              <Txt style={{ fontSize: 28, lineHeight: 34, fontWeight: "900" }}>
                {s.games.filter((g) => g.status === "Concluída").length}
              </Txt>
              <Txt style={{ fontSize: 9, color: c.muted }}>jogo concluído</Txt>
            </Card>
            <Card style={{ flex: 1, alignItems: "center" }}>
              <Txt style={{ fontSize: 28, lineHeight: 34, fontWeight: "900" }}>
                {s.matches.length}
              </Txt>
              <Txt style={{ fontSize: 9, color: c.muted }}>conexões</Txt>
            </Card>
          </Row>
          <Button
            title="Central de arbitragem"
            icon="flag-outline"
            secondary
            onPress={() => router.push("/arbitragem")}
          />
          <Txt style={{ fontSize: 18, fontWeight: "800", marginVertical: 25 }}>
            Nosso histórico em campo
          </Txt>
          {s.games
            .filter((g) => g.status === "Concluída")
            .map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
        </>
      ) : (
        <View style={{ marginTop: 20, gap: 15 }}>
          <Button
            title="Denunciar equipe"
            secondary
            icon="flag-outline"
            onPress={() => R(!report)}
          />
          {report && (
            <Card>
              <Input
                label="O que aconteceu?"
                placeholder="Descreva com pelo menos 10 caracteres"
                value={reason}
                onChangeText={S}
                multiline
                maxLength={500}
              />
              <Button
                title="Registrar denúncia"
                disabled={busy}
                onPress={async () => {
                  if (await dispatch({ type: "report", id, reason })) {
                    R(false);
                    Alert.alert(
                      "Denúncia armazenada",
                      "Registro salvo na demonstração. Não há central de moderação conectada.",
                    );
                  }
                }}
              />
            </Card>
          )}
        </View>
      )}
      <Note>
        Os dados das equipes e os históricos desta versão são demonstrativos. O
        compartilhamento envia um resumo textual do perfil. Perfis públicos
        ainda não estão publicados.
      </Note>
    </Screen>
  );
}
