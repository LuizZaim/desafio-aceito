import { useLocalSearchParams } from "expo-router";
import { TeamProfile } from "../components/team-profile";
export default function Equipe() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <TeamProfile id={id} />;
}
