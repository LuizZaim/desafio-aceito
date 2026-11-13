import { View, Switch, Alert } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useStore } from "../core/store";
import {
  Screen,
  Section,
  Card,
  Txt,
  Row,
  Button,
  Note,
  useColors,
} from "../components/ui";
export default function Settings() {
  const { state: s, dispatch, logout, mode, busy } = useStore();
  const c = useColors();
  return (
    <Screen>
      <Section
        eyebrow="DO SEU JEITO"
        title="Tudo no seu controle."
        text="Preferências, perfil e informações do aplicativo."
      />
      <Card>
        <Txt style={{ fontWeight: "800", fontSize: 17, marginBottom: 6 }}>
          Preferências
        </Txt>
        {[
          [
            "push",
            "Avisos no aplicativo",
            mode === "online" ? "Matches e mensagens ao atualizar o aplicativo." : "Matches e mensagens da demonstração.",
          ],
          [
            "email",
            "Preferência de e-mail",
            "Envio externo ainda não conectado.",
          ],
          ["dark", "Modo escuro", "Conforto para a sua navegação."],
        ].map(([key, title, desc]) => (
          <Row
            key={key}
            style={{
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderColor: c.border,
              paddingTop: 18,
              marginTop: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: "700", fontSize: 12 }}>{title}</Txt>
              <Txt style={{ fontSize: 10, color: c.muted, marginTop: 5 }}>
                {desc}
              </Txt>
            </View>
            <Switch
              accessibilityLabel={title}
              value={s.settings[key as keyof typeof s.settings]}
              onValueChange={async (value) => {
                await dispatch({
                  type: "settings",
                  ...s.settings,
                  [key]: value,
                });
              }}
              trackColor={{ true: c.orange }}
            />
          </Row>
        ))}
      </Card>
      <Card style={{ marginTop: 18, gap: 15 }}>
        <Txt style={{ fontWeight: "800", fontSize: 17 }}>Conta e perfil</Txt>
        <Txt style={{ fontSize: 11, color: c.muted }}>
          Acesso atual:{" "}
          {mode === "demo"
            ? "demonstração offline · dados neste aparelho"
            : mode === "local" ? "meu time · salvo neste aparelho" : "conta conectada · dados por conta"}
        </Txt>
        <Txt style={{ fontSize: 11, color: c.muted }}>
          Perfil: {s.profile.role === "organizador" ? "Organizador" : "Árbitro"}
        </Txt>
        <Button
          title="Central de arbitragem"
          secondary
          onPress={() => router.push("/arbitragem")}
        />
        <Button
          title={mode === "online" ? "Sair da conta" : "Voltar à tela de entrada"}
          secondary
          icon="log-out-outline"
          onPress={async () => {
            try {
              await logout();
              router.replace("/");
            } catch {
              Alert.alert("Não foi possível sair", "Tente novamente.");
            }
          }}
        />
      </Card>
      <Card style={{ marginTop: 18, gap: 13 }}>
        <Txt style={{ fontWeight: "800", fontSize: 17 }}>
          Desafio Aceito · FutTech
        </Txt>
        <Txt style={{ fontSize: 11, color: c.muted, lineHeight: 20 }}>
          Aplicativo React Native para organizar amistosos, inspirado no projeto
          da FECAP. Versão {Constants.expoConfig?.version || "não informada"}.
        </Txt>
        <Txt style={{ fontSize: 11, color: c.muted, lineHeight: 20 }}>
          {mode === "online" ? "Equipes cadastradas, interesses mútuos e mensagens são compartilhados entre contas conectadas ao mesmo servidor. Propostas compartilhadas exigem aceite do adversário e ficam aguardando caução. As cobranças ainda estão em preparação." : mode === "local" ? "Seu cadastro permanece neste aparelho e não é publicado para outros usuários. A demonstração separada permite experimentar o fluxo com equipes fictícias." : "Os adversários, as respostas mútuas e as cauções desta demonstração são fictícios."} Google, recuperação por e-mail, geolocalização e push ainda dependem de integrações.
        </Txt>
      </Card>
      <View style={{ marginTop: 22 }}>
        <Button
          title={s.deleted ? "Restaurar equipe" : "Desativar minha equipe"}
          danger={!s.deleted}
          onPress={() =>
            s.deleted
              ? dispatch({ type: "restore" })
              : Alert.alert(
                  "Desativar a equipe?",
                  "O histórico permanece salvo. Partidas ativas devem ser canceladas primeiro.",
                  [
                    { text: "Voltar", style: "cancel" },
                    {
                      text: "Desativar",
                      style: "destructive",
                      onPress: () => dispatch({ type: "delete" }),
                    },
                  ],
                )
          }
          disabled={busy}
        />
      </View>
      <Note>
        Regras de cancelamento demonstrativas: R$ 10 antes do dia e R$ 30 no
        dia, sobre uma caução ilustrativa de R$ 50. O documento não fixa esses
        valores.
      </Note>
    </Screen>
  );
}
