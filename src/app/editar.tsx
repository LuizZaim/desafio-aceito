import { useState } from "react";
import { View, Alert } from "react-native";
import { router } from "expo-router";
import { useStore } from "../core/store";
import { Screen, Section, Input, Txt, Chip, Button } from "../components/ui";
export default function Edit() {
  const { state: s, dispatch, busy } = useStore();
  const [name, N] = useState(s.profile.name),
    [district, D] = useState(s.profile.district),
    [category, C] = useState(s.profile.category),
    [level, L] = useState(s.profile.level),
    [bio, B] = useState(s.profile.bio);
  return (
    <Screen>
      <Section
        eyebrow="SEU TIME, DO SEU JEITO"
        title="Mostre quem vocês são."
      />
      <Input
        label="Nome da equipe"
        value={name}
        onChangeText={N}
        maxLength={80}
      />
      <Input
        label="Bairro / região"
        value={district}
        onChangeText={D}
        maxLength={80}
      />
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Categoria
      </Txt>
      <View
        style={{
          flexDirection: "row",
          gap: 7,
          flexWrap: "wrap",
          marginBottom: 23,
        }}
      >
        {["Masculino", "Feminino", "Sub-15", "Veteranos"].map((x) => (
          <Chip
            title={x}
            key={x}
            selected={x === category}
            onPress={() => C(x)}
          />
        ))}
      </View>
      <Txt style={{ fontWeight: "700", fontSize: 12, marginBottom: 12 }}>
        Nível técnico
      </Txt>
      <View
        style={{
          flexDirection: "row",
          gap: 7,
          flexWrap: "wrap",
          marginBottom: 23,
        }}
      >
        {["Amador", "Várzea", "Base", "Semiprofissional"].map((x) => (
          <Chip title={x} key={x} selected={x === level} onPress={() => L(x)} />
        ))}
      </View>
      <Input
        label="Sobre o time"
        value={bio}
        onChangeText={B}
        multiline
        maxLength={500}
      />
      <Button
        title="Salvar equipe"
        icon="checkmark"
        disabled={busy}
        onPress={async () => {
          if (
            await dispatch({
              type: "profile",
              name,
              district,
              category,
              level,
              bio,
            })
          ) {
            Alert.alert("Perfil atualizado");
            router.back();
          }
        }}
      />
    </Screen>
  );
}
