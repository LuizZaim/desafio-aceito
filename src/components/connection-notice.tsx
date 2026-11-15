import { useSyncExternalStore } from "react";
import { View } from "react-native";
import { connectionWait } from "../core/connection-wait";
import { useStore } from "../core/store";
import { Txt, useColors } from "./ui";
export function ConnectionNotice() {
  const waiting = useSyncExternalStore(connectionWait.subscribe, connectionWait.snapshot, () => false);
  const c = useColors();
  const { mode } = useStore();
  if (!waiting || mode === "local" || mode === "demo") return null;
  return <View pointerEvents="none" style={{ position: "absolute", bottom: 24, left: 16, right: 16, zIndex: 1000, alignItems: "center" }}>
    <View style={{ maxWidth: 560, backgroundColor: c.panel, padding: 16, borderRadius: 12, borderColor: c.border, borderWidth: 1 }}>
      <Txt accessibilityLiveRegion="polite">A conexão está demorando. O servidor gratuito pode estar iniciando; aguarde um pouco.</Txt>
    </View>
  </View>;
}
