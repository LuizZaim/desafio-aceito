import { useStore } from "../core/store";
import { Card, Txt, Note } from "./ui";
export function RefereeMerits() {
  const { academic } = useStore();
  return <>
    <Txt style={{ fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 16 }}>Méritos e atuações</Txt>
    {academic.refereeMerits.length ? academic.refereeMerits.map((item) => <Card key={item.id} style={{ marginBottom: 12, gap: 8 }}><Txt style={{ fontWeight: "800" }}>{item.title}</Txt><Txt style={{ fontSize: 12 }}>{item.description}</Txt></Card>) : <Note>Seus méritos aparecem a partir dos convites de arbitragem aceitos no aplicativo.</Note>}
    <Txt style={{ fontSize: 12, marginBottom: 20 }}>Os registros demonstram sua participação no aplicativo. Nenhuma nota ou certificação profissional externa é atribuída automaticamente.</Txt>
  </>;
}
