import { useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../core/store";
import {
  Screen,
  Section,
  Button,
  Chip,
  Empty,
  Note,
  DemoLabel,
} from "../../components/ui";
import { GameCard } from "../../components/game-card";
export default function Agenda() {
  const { state: s, mode } = useStore();
  const [tab, T] = useState("Próximos");
  const list = s.games.filter((g) =>
    tab === "Próximos"
      ? !["Concluída", "Cancelada"].includes(g.status)
      : g.status === (tab === "Histórico" ? "Concluída" : "Cancelada"),
  );
  return (
    <Screen>
      <DemoLabel />
      <Section
        eyebrow="COMPROMISSO COM O JOGO"
        title="A resenha tem dia e hora."
        text="Acompanhe propostas, amistosos e seu histórico em campo."
      />
      <Button
        title="Agendar amistoso"
        icon="add"
        onPress={() =>
          s.matches.length
            ? router.push({
                pathname: "/agendar",
                params: { id: s.matches[0] },
              })
            : router.push("/(tabs)/descobrir")
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 22 }}
      >
        {["Próximos", "Histórico", "Cancelados"].map((x) => (
          <Chip key={x} title={x} selected={x === tab} onPress={() => T(x)} />
        ))}
      </ScrollView>
      {list.length ? (
        list.map((g) => <GameCard key={g.id} game={g} />)
      ) : (
        <Empty
          title="Nenhuma partida por aqui"
          text={mode === "online" ? "As propostas enviadas e recebidas, as partidas e os cancelamentos aparecerão nesta área." : "Demonstre interesse por uma equipe fictícia para obter um match e agendar seu primeiro amistoso simulado."}
        />
      )}
      <Note>
        {mode === "online" ? "Propostas exigem aceite adversário. A caução e as taxas são simuladas para a apresentação acadêmica: nenhuma cobrança ou estorno real é processado." : "A caução e as taxas de cancelamento da demonstração são simuladas. Nenhum pagamento ou estorno real é processado."}
      </Note>
    </Screen>
  );
}
