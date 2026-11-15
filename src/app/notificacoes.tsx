import { View } from "react-native";
import { useStore } from "../core/store";
import {
  Screen,
  Section,
  Card,
  Row,
  Txt,
  Icon,
  Button,
  Note,
  Empty,
  useColors,
} from "../components/ui";
export default function Notifications() {
  const { state: s, dispatch, busy } = useStore();
  const c = useColors();
  return (
    <Screen>
      <Section
        eyebrow="NÃO PERCA O PRÓXIMO APITO"
        title="Aconteceu na resenha."
      />
      <Button
        title="Marcar todas como lidas"
        secondary
        disabled={busy || !s.notifications.some((notice) => !notice.read)}
        icon="checkmark-done-outline"
        onPress={() => dispatch({ type: "read" })}
      />
      <View style={{ gap: 12, marginTop: 20 }}>
        {s.notifications.map((n) => (
          <Card
            key={n.id}
            style={{ backgroundColor: n.read ? c.panel : c.soft }}
          >
            <Row>
              <Icon
                name="notifications-outline"
                color={n.read ? c.muted : c.orange}
              />
              <Txt style={{ fontSize: 12, flex: 1, lineHeight: 21 }}>
                {n.text}
              </Txt>
              {!n.read && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 5,
                    backgroundColor: c.orange,
                  }}
                />
              )}
            </Row>
          </Card>
        ))}
      </View>
      {!s.notifications.length && (
        <Empty
          title="Tudo tranquilo por aqui"
          text="Novos avisos serão exibidos nesta área."
        />
      )}
      <Note>
        As notificações são internas ao aplicativo. O envio push para o sistema
        do celular ainda não está integrado.
      </Note>
    </Screen>
  );
}
