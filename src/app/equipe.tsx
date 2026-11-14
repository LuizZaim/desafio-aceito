import { useLocalSearchParams } from "expo-router";
import { routeId } from "../core/navigation";
import { TeamProfile } from "../components/team-profile";
import { Screen, Empty } from "../components/ui";
export default function Equipe() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = routeId(params.id);
  if (params.id !== undefined && !id) return <Screen><Empty title="Link de equipe inválido" text="Volte à descoberta e escolha um adversário." /></Screen>;
  return <TeamProfile id={id} />;
}
