import { useState } from "react";
import { Alert } from "react-native";
import { Screen, Section, Input, Button, Note } from "../components/ui";
export default function Recover() {
  const [email, E] = useState("");
  return (
    <Screen>
      <Section
        eyebrow="VOLTE PARA O JOGO"
        title="Recuperar acesso"
        text="O envio de links de recuperação depende de um serviço de e-mail conectado."
      />
      <Input
        label="E-mail da conta"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={E}
      />
      <Button
        title="Verificar recuperação"
        onPress={() =>
          Alert.alert(
            "Integração pendente",
            "O serviço de e-mail de recuperação ainda não está conectado. Suas credenciais não foram alteradas.",
          )
        }
      />
      <Note>
        Esta funcionalidade permanece pendente na auditoria. O app não informa
        que enviou um e-mail sem realizar o envio.
      </Note>
    </Screen>
  );
}
