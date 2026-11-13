import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { filters, setFilters } from "../core/filters";
import { useStore } from "../core/store";
import {
  Screen,
  Section,
  Txt,
  Chip,
  Input,
  Button,
  Note,
} from "../components/ui";
export default function Filters() {
  const [f, F] = useState({ ...filters });
  const { mode } = useStore();
  return (
    <Screen>
      <Section
        eyebrow="O ADVERSÁRIO CERTO"
        title="Qual é o seu jogo?"
        text="Defina as características da próxima resenha."
      />
      {[
        ...(mode !== "online" ? [["radius", "Distância máxima", [5, 10, 15, 25, 50]]] : []),
        [
          "level",
          "Nível técnico",
          ["Todos", "Amador", "Várzea", "Base", "Semiprofissional"],
        ],
        [
          "category",
          "Categoria",
          ["Todas", "Masculino", "Feminino", "Sub-15", "Veteranos"],
        ],
      ].map(([key, label, values]) => (
        <View key={String(key)} style={{ marginBottom: 25 }}>
          <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
            {String(label)}
          </Txt>
          <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
            {(values as (string | number)[]).map((x) => (
              <Chip
                key={x}
                title={typeof x === "number" ? `${x} km` : x}
                selected={f[key as keyof typeof f] === x}
                onPress={() => F({ ...f, [String(key)]: x })}
              />
            ))}
          </View>
        </View>
      ))}
      <Input
        label="Bairro / região"
        placeholder="Ex.: Vila Mariana"
        value={f.region}
        onChangeText={(region) => F({ ...f, region })}
      />
      <Button
        title="Encontrar adversários"
        icon="search"
        onPress={() => {
          setFilters(f);
          router.back();
        }}
      />
      <Note>
        {mode !== "online" ? "As distâncias dos times fictícios são ilustrativas, a partir da Liberdade." : "O filtro por distância ainda depende de geolocalização. Use bairro, categoria e nível para encontrar equipes cadastradas."} A integração de mapas ainda não está conectada.
      </Note>
    </Screen>
  );
}
