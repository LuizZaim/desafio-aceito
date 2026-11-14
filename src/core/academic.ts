import type { State } from "./domain";

export type DemoCard = { id: string; label: string; last4: string };
export type TeamPlayer = { id: string; name: string; number: number | null; position: string };
export type Achievement = { id: string; title: string; description: string };
export type AcademicState = {
  cards: DemoCard[];
  subscription: { plan: "gratuito" | "academico"; priorityCredits: number };
  players: TeamPlayer[];
  preferredField: string;
  achievements: Achievement[];
  refereeMerits: Achievement[];
  planCreditGranted?: boolean;
};
export const ACADEMIC_ACTIONS = ["addDemoCard", "removeDemoCard", "selectAcademicPlan", "addPriorityCredit", "savePlayer", "removePlayer", "teamField", "priorityInterest"];
export const emptyAcademic = (): AcademicState => ({
  cards: [], subscription: { plan: "gratuito", priorityCredits: 0 }, players: [],
  preferredField: "", achievements: [], refereeMerits: [],
});
export function academicInput(action: any) {
  const valid = (value: unknown, min: number, max: number) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
  if (!action || typeof action !== "object" || Array.isArray(action)) throw Error("Operação inválida.");
  switch (action.type) {
    case "addDemoCard":
      if (["pan", "cvv", "cvc", "cardNumber", "expiry"].some((key) => key in action)) throw Error("Informe somente o apelido e os quatro últimos dígitos fictícios. Não envie dados de um cartão real.");
      if (!valid(action.label, 3, 40) || typeof action.last4 !== "string" || !/^\d{4}$/.test(action.last4)) throw Error("Informe um apelido de 3 a 40 caracteres e exatamente quatro dígitos fictícios.");
      break;
    case "selectAcademicPlan":
      if (!["gratuito", "academico"].includes(action.plan)) throw Error("Plano acadêmico inválido.");
      break;
    case "savePlayer":
      if (!valid(action.name, 2, 60) || !valid(action.position, 2, 30) || !(action.number === null || (Number.isInteger(action.number) && action.number >= 0 && action.number <= 99))) throw Error("Informe nome de 2 a 60 caracteres, posição e número de 0 a 99 (ou deixe sem número).");
      if (action.id !== undefined && !valid(action.id, 1, 100)) throw Error("Jogador inválido.");
      break;
    case "teamField":
      if (!valid(action.field, 0, 120)) throw Error("O campo preferido deve ter até 120 caracteres.");
      break;
    case "removeDemoCard":
    case "removePlayer":
    case "priorityInterest":
      if (!valid(action.id, 1, 100)) throw Error("Registro inválido.");
      break;
    case "addPriorityCredit": break;
    default: throw Error("Operação acadêmica desconhecida.");
  }
}

/** Offline equivalent of the academic, nonfinancial features. */
export function academicTransition(input: AcademicState, action: any): AcademicState {
  academicInput(action);
  const state = structuredClone(input);
  switch (action.type) {
    case "addDemoCard":
      if (state.cards.length >= 5) throw Error("A demonstração permite até cinco identificadores de cartão.");
      state.cards.push({ id: "card-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), label: action.label.trim(), last4: action.last4 });
      break;
    case "removeDemoCard":
      if (!state.cards.some((row) => row.id === action.id)) throw Error("Identificador de cartão não encontrado.");
      state.cards = state.cards.filter((row) => row.id !== action.id);
      break;
    case "selectAcademicPlan":
      state.subscription.plan = action.plan;
      if (action.plan === "academico" && !state.planCreditGranted) {
        if (state.subscription.priorityCredits >= 10) throw Error("Use um crédito de demonstração antes de ativar o benefício acadêmico.");
        state.subscription.priorityCredits++;
        state.planCreditGranted = true;
      }
      break;
    case "addPriorityCredit":
      if (state.subscription.priorityCredits >= 10) throw Error("Use os créditos de demonstração antes de adicionar mais (máximo de dez).");
      state.subscription.priorityCredits++;
      break;
    case "priorityInterest":
      if (state.subscription.priorityCredits < 1) throw Error("Adicione um crédito de demonstração antes de enviar interesse prioritário.");
      state.subscription.priorityCredits--;
      break;
    case "savePlayer": {
      const previous = action.id ? state.players.find((row) => row.id === action.id) : undefined;
      if (action.id && !previous) throw Error("Jogador não encontrado.");
      if (!previous && state.players.length >= 40) throw Error("O elenco permite até quarenta jogadores.");
      if (action.number !== null && state.players.some((row) => row.id !== action.id && row.number === action.number)) throw Error("Este número já está em uso no elenco.");
      const player = { id: previous?.id || "player-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name: action.name.trim(), position: action.position.trim(), number: action.number };
      state.players = [...state.players.filter((row) => row.id !== player.id), player];
      break;
    }
    case "removePlayer":
      if (!state.players.some((row) => row.id === action.id)) throw Error("Jogador não encontrado.");
      state.players = state.players.filter((row) => row.id !== action.id);
      break;
    case "teamField": state.preferredField = action.field.trim(); break;
  }
  return state;
}

export function academicAchievements(counts: { matches: number; games: number; reviews: number }): Achievement[] {
  return [
    ...(counts.matches > 0 ? [{ id: "first-match", title: "Primeiro match", description: "Um interesse mútuo foi registrado no aplicativo." }] : []),
    ...(counts.games > 0 ? [{ id: "first-game", title: "Entramos em campo", description: "Uma partida foi marcada como concluída no aplicativo." }] : []),
    ...(counts.reviews > 0 ? [{ id: "first-review", title: "Respeito avaliado", description: "Uma avaliação de partida foi registrada no aplicativo." }] : []),
  ];
}
export function localAcademic(state: State): AcademicState {
  const academic = { ...emptyAcademic(), ...state.academic };
  academic.achievements = academicAchievements({ matches: state.matches.length, games: state.games.filter((game) => game.status === "Concluída").length, reviews: state.games.filter((game) => game.review).length });
  academic.refereeMerits = state.games.some((game) => game.referee === "Você (demonstração)")
    ? [{ id: "first-acceptance", title: "Primeira atuação aceita", description: "Um convite de arbitragem foi aceito nesta demonstração." }] : [];
  return academic;
}
