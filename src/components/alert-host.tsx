import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Modal, Platform, ScrollView, View } from "react-native";
import { Button, Txt, useColors } from "./ui";

type AlertRequest = {
  title: string;
  message?: string;
  buttons: NonNullable<Parameters<typeof Alert.alert>[2]>;
  options?: Parameters<typeof Alert.alert>[3];
};
/** React Native Web's Alert is a no-op; keep the native dialogs on Android/iOS. */
export function AlertHost({ children }: { children: ReactNode }) {
  const c = useColors();
  const queue = useRef<AlertRequest[]>([]);
  const [current, setCurrent] = useState<AlertRequest | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const previous = Alert.alert;
    Alert.alert = (title, message, buttons, options) => {
      const request = { title: title || "Aviso", message: message || undefined, buttons: buttons?.length ? buttons : [{ text: "OK" }], options };
      queue.current.push(request);
      if (queue.current.length === 1) setCurrent(request);
    };
    return () => { Alert.alert = previous; queue.current = []; };
  }, []);
  function choose(button?: AlertRequest["buttons"][number]) {
    const request = queue.current.shift();
    setCurrent(queue.current[0] || null);
    if (button?.onPress) button.onPress();
    else if (!button) request?.options?.onDismiss?.();
  }
  function dismiss() {
    const cancel = current?.buttons.find((button) => button.style === "cancel");
    if (cancel || current?.options?.cancelable) choose(cancel);
  }
  return <>
    {children}
    {Platform.OS === "web" && <Modal transparent visible={!!current} animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: "#10231bcc", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <View accessibilityViewIsModal role="alertdialog" accessibilityLabel={current?.title} style={{ width: "100%", maxWidth: 480, maxHeight: "85%", backgroundColor: c.panel, borderRadius: 18 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18 }}>
            <Txt accessibilityRole="header" style={{ fontSize: 22, lineHeight: 29, fontWeight: "800" }}>{current?.title}</Txt>
            {!!current?.message && <Txt style={{ fontSize: 15, lineHeight: 23 }}>{current.message}</Txt>}
            {current?.buttons.map((button, index) => <Button key={index} title={button.text || "OK"} danger={button.style === "destructive"} secondary={button.style === "cancel"} onPress={() => choose(button)} />)}
          </ScrollView>
        </View>
      </View>
    </Modal>}
  </>;
}
