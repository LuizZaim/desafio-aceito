import { transition, type State } from "./domain";
import { ACADEMIC_ACTIONS, academicTransition, localAcademic } from "./academic";

/** Compute the entire local operation before persisting any debit or match. */
export function applyLocalAction(input: State, action: any): { state: State; message: string } {
  if (!ACADEMIC_ACTIONS.includes(action?.type)) return transition(input, action);
  if (["savePlayer", "removePlayer", "teamField", "priorityInterest"].includes(action.type) &&
    (input.teamRegistered === false || input.deleted))
    throw Error("Cadastre uma equipe ativa antes de continuar.");
  const academic = academicTransition(localAcademic(input), action);
  const base = action.type === "priorityInterest"
    ? transition(input, { type: "interest", id: action.id }).state : input;
  return {
    state: { ...base, academic },
    message: "Demonstração atualizada. Nenhuma cobrança foi realizada.",
  };
}
