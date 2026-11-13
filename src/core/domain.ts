function uniqueId() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12)
  );
}
export type Team = {
  id: string;
  name: string;
  short: string;
  color: string;
  district: string;
  distance: number | null;
  city?: string;
  state?: string;
  level: string;
  category: string;
  rating: number;
  games: number;
  bio: string;
  reciprocal?: boolean;
  active?: boolean;
  reviewCount?: number;
};
export type Game = {
  id: string;
  team: string;
  date: string;
  time: string;
  field: string;
  home: string;
  status: string;
  payment: string;
  referee: string;
  proposerId?: string;
  canRespond?: boolean;
  canWeatherAgree?: boolean;
  simulated?: boolean;
  refereeAssignments?: {
    id: string;
    refereeId: string;
    name: string;
    role: "arbitro" | "bandeirinha1" | "bandeirinha2";
    status: "Pendente" | "Aceito" | "Recusado" | "Cancelado";
  }[];
  score?: string;
  review?: {
    skill: number;
    fair: number;
    punctuality?: number;
    organization?: number;
  };
  fee?: number;
  reason?: string;
};
/** Older saved reviews have two dimensions; do not manufacture missing ratings. */
export function reviewAverage(review: Game["review"]): number | null {
  if (!review) return null;
  const values = [review.skill, review.fair, review.punctuality, review.organization]
    .filter((value): value is number =>
      typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5,
    );
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}
export type State = {
  teamRegistered?: boolean;
  profile: {
    city?: string;
    state?: string;
    name: string;
    district: string;
    category: string;
    level: string;
    bio: string;
    role: string;
    available: boolean;
  };
  interests: string[];
  skipped: string[];
  matches: string[];
  messages: Record<string, { text: string; own: boolean; at: string }[]>;
  games: Game[];
  notifications: { id: string; text: string; read: boolean }[];
  settings: { push: boolean; email: boolean; dark: boolean };
  reports: { team: string; reason: string }[];
  deleted?: boolean;
};
export const teams: Team[] = [
  {
    id: "vila",
    name: "Vila União FC",
    short: "VU",
    color: "#ea6429",
    district: "Vila Mariana",
    distance: 4.2,
    level: "Amador",
    category: "Masculino",
    rating: 4.9,
    games: 32,
    reciprocal: true,
    bio: "Futebol de domingo, amizade de sempre. Somos um time da zona sul em busca de bons jogos e novas histórias dentro de campo.",
  },
  {
    id: "mooca",
    name: "Atlético da Mooca",
    short: "AM",
    color: "#8d3340",
    district: "Mooca",
    distance: 6.8,
    level: "Amador",
    category: "Masculino",
    rating: 4.8,
    games: 45,
    reciprocal: true,
    bio: "Tradição de bairro e respeito ao adversário. Nosso futebol é competitivo e o pós-jogo é sempre de resenha.",
  },
  {
    id: "leste",
    name: "Resenha da Leste",
    short: "RL",
    color: "#38756a",
    district: "Tatuapé",
    distance: 8.5,
    level: "Várzea",
    category: "Masculino",
    rating: 4.7,
    games: 21,
    bio: "A várzea vive aqui. Disponíveis aos sábados à tarde e aos domingos pela manhã.",
  },
  {
    id: "aurora",
    name: "Aurora Futebol Clube",
    short: "AF",
    color: "#6956aa",
    district: "Ipiranga",
    distance: 5.3,
    level: "Amador",
    category: "Feminino",
    rating: 4.9,
    games: 18,
    reciprocal: true,
    bio: "Um time unido pelo futebol. Buscamos equipes para amistosos aos finais de semana.",
  },
  {
    id: "base",
    name: "Academia do Futuro",
    short: "AF",
    color: "#3064a0",
    district: "Saúde",
    distance: 11.2,
    level: "Base",
    category: "Sub-15",
    rating: 4.6,
    games: 12,
    bio: "Formando atletas e amizades. Partidas da categoria sub-15 com acompanhamento dos responsáveis.",
  },
  {
    id: "veteranos",
    name: "Raízes do Futebol",
    short: "RF",
    color: "#a37b25",
    district: "Liberdade",
    distance: 2.1,
    level: "Amador",
    category: "Veteranos",
    rating: 4.8,
    games: 52,
    reciprocal: true,
    bio: "A experiência entra em campo. Futebol de veteranos com muito respeito e fair play.",
  },
  {
    id: "norte",
    name: "Estrela do Norte",
    short: "EN",
    color: "#22556b",
    district: "Santana",
    distance: 15.4,
    level: "Semiprofissional",
    category: "Masculino",
    rating: 4.5,
    games: 37,
    bio: "Treinos durante a semana e amistosos competitivos aos domingos. Venha fazer um bom jogo.",
  },
];
export const fields = [
  "Arena da Vila • Vila Mariana",
  "Campo da Mooca • Mooca",
  "Arena FutTech • Liberdade",
  "Centro Esportivo Tatuapé",
];
export function dateAfter(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function initialState(): State {
  return {
    teamRegistered: true,
    profile: {
      name: "FutTech FC",
      district: "Liberdade",
      category: "Masculino",
      level: "Amador",
      bio: "Mais que um time, uma resenha. Procuramos adversários que jogam com vontade e respeito.",
      role: "organizador",
      available: true,
    },
    interests: [],
    skipped: [],
    matches: ["mooca"],
    messages: {
      mooca: [
        {
          text: "Fala, pessoal! Vamos marcar um amistoso? Nosso time está disponível no fim de semana.",
          own: false,
          at: "09:41",
        },
      ],
    },
    games: [
      {
        id: "game-demo-1",
        team: "mooca",
        date: dateAfter(3),
        time: "09:00",
        field: fields[1],
        home: "FutTech FC",
        status: "Confirmada",
        payment: "Simulada",
        referee: "Pendente",
      },
      {
        id: "game-demo-2",
        team: "leste",
        date: dateAfter(-7),
        time: "10:00",
        field: fields[3],
        home: "Resenha da Leste",
        status: "Concluída",
        payment: "Simulada",
        referee: "Carlos Silva",
        score: "2 × 1",
      },
    ],
    notifications: [
      {
        id: "n1",
        text: "É match! O Atlético da Mooca quer entrar em campo com você.",
        read: false,
      },
      {
        id: "n2",
        text: "Seu amistoso com o Atlético da Mooca está confirmado na agenda de demonstração.",
        read: false,
      },
    ],
    settings: { push: true, email: false, dark: false },
    reports: [],
  };
}
/** Empty workspace for a real account or a team registered on this device. */
export function freshState(): State {
  const state = initialState();
  return {
    ...state,
    teamRegistered: false,
    profile: {
      name: "", district: "", city: "", state: "", category: "", level: "",
      bio: "", role: "organizador", available: true,
    },
    interests: [], skipped: [], matches: [], messages: {}, games: [],
    notifications: [], reports: [],
  };
}
export const teamCategories = ["Masculino", "Feminino", "Sub-15", "Veteranos"];
export const teamLevels = ["Amador", "Várzea", "Base", "Semiprofissional"];
export const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];
function need(condition: any, message: string): asserts condition {
  if (!condition) throw Error(message);
}
function clean(v: any, max = 250) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}
export function transition(
  input: State,
  action: any,
): { state: State; message: string } {
  need(action && typeof action === "object" && !Array.isArray(action), "Ação inválida.");
  const s: State = structuredClone(input);
  let message = "Alterações salvas.";
  const id = clean(action.id, 100);
  const team = teams.find((t) => t.id === id);
  const notify = (text: string) => {
    if (s.settings.push)
      s.notifications.unshift({ id: uniqueId(), text, read: false });
  };
  need(
    !s.deleted || action.type === "restore",
    "Sua equipe está desativada. Restaure-a nas configurações.",
  );
  switch (action.type) {
    case "interest":
      need(s.teamRegistered !== false, "Cadastre sua equipe antes de buscar adversários.");
      need(
        s.profile.role === "organizador",
        "A descoberta é exclusiva do organizador.",
      );
      need(team, "Equipe não encontrada.");
      need(!s.interests.includes(id), "Interesse já registrado.");
      s.interests.push(id);
      if (team.reciprocal) {
        s.matches = Array.from(new Set([...s.matches, id]));
        s.messages[id] ??= [];
        notify(`É match! Você e ${team.name} demonstraram interesse.`);
        message = "É match! A conversa está liberada.";
      } else
        message =
          "Interesse enviado! A conversa será liberada quando houver reciprocidade.";
      break;
    case "skip":
      need(team, "Equipe não encontrada.");
      s.skipped.push(id);
      message = "Equipe pulada. Continue descobrindo.";
      break;
    case "resetDiscovery":
      s.skipped = [];
      message = "Equipes puladas disponíveis novamente.";
      break;
    case "send":
      need(s.matches.includes(id), "O chat exige interesse mútuo.");
      need(clean(action.text, 1000), "Digite uma mensagem.");
      (s.messages[id] ??= []).push({
        text: clean(action.text, 1000),
        own: true,
        at: new Date().toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      message = "Mensagem salva nesta demonstração.";
      break;
    case "schedule": {
      need(s.teamRegistered !== false, "Cadastre sua equipe antes de agendar.");
      need(
        s.profile.role === "organizador",
        "Somente o organizador pode agendar.",
      );
      need(s.matches.includes(id), "Agende somente com equipes com match.");
      const date = clean(action.date, 10),
        time = clean(action.time, 5),
        field = clean(action.field, 100);
      need(
        /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time),
        "Data ou horário inválido.",
      );
      const start = new Date(`${date}T${time}:00-03:00`).getTime();
      need(
        Number.isFinite(start) && start > Date.now(),
        "Escolha uma data e um horário futuros.",
      );
      need(
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time) &&
          new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date,
        "Data ou horário inválido.",
      );
      need(fields.includes(field), "Selecione um local válido.");
      need(
        [s.profile.name, team?.name].includes(action.home),
        "Selecione o mando de campo.",
      );
      need(
        !s.games.some(
          (g) =>
            !["Cancelada", "Concluída"].includes(g.status) &&
            Math.abs(
              new Date(`${g.date}T${g.time}:00-03:00`).getTime() - start,
            ) < 7200000,
        ),
        "Há conflito com outra partida na sua agenda (intervalo de 2 horas).",
      );
      s.games.unshift({
        id: uniqueId(),
        team: id,
        date,
        time,
        field,
        home: clean(action.home, 80),
        status: "Aguardando caução",
        payment: "Pendente",
        referee: "Pendente",
      });
      notify(
        `Proposta de amistoso com ${team?.name} criada. Falta a caução de demonstração.`,
      );
      message = "Proposta criada. Simule a caução para confirmar.";
      break;
    }
    case "pay": {
      const g = s.games.find((g) => g.id === id);
      need(
        g && g.status === "Aguardando caução",
        "Esta partida não aguarda caução.",
      );
      need(s.profile.role === "organizador", "Ação exclusiva do organizador.");
      g.payment = "Simulada";
      g.status = "Confirmada";
      notify(
        "Caução simulada aprovada. Seu amistoso está confirmado na demonstração.",
      );
      message = "Pagamento simulado. Nenhum valor foi cobrado.";
      break;
    }
    case "cancel": {
      const g = s.games.find((g) => g.id === id);
      need(
        g &&
          [
            "Confirmada",
            "Aguardando caução",
            "Clima: aguardando acordo",
          ].includes(g.status),
        "Partida não disponível para cancelamento.",
      );
      need(s.profile.role === "organizador", "Ação exclusiva do organizador.");
      const reason = clean(action.reason, 250);
      need(reason, "Informe o motivo do cancelamento.");
      if (action.weather) {
        g.status = "Clima: aguardando acordo";
        g.reason = reason;
        message =
          "Solicitação registrada. O cancelamento sem taxa depende da concordância adversária.";
      } else {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        g.fee = g.payment === "Pendente" ? 0 : g.date === today ? 30 : 10;
        g.status = "Cancelada";
        g.reason = reason;
        g.payment =
          g.payment === "Pendente" ? "Não cobrada" : "Estorno simulado";
        message = `Cancelamento registrado. Penalidade ilustrativa: R$ ${g.fee},00.`;
      }
      break;
    }
    case "weatherAgree": {
      const g = s.games.find((g) => g.id === id);
      need(
        g && g.status === "Clima: aguardando acordo",
        "Não há acordo climático pendente.",
      );
      g.status = "Cancelada";
      g.fee = 0;
      g.payment = "Estorno simulado";
      message = "Acordo adversário simulado. Cancelamento sem penalidade.";
      break;
    }
    case "simulateResult":
    case "result": {
      const g = s.games.find((g) => g.id === id);
      need(g && g.status === "Confirmada", "Partida precisa estar confirmada.");
      need(
        action.type === "simulateResult" || new Date(`${g.date}T${g.time}:00-03:00`).getTime() < Date.now(),
        "O resultado só pode ser registrado após o início da partida.",
      );
      need(
        Number.isInteger(+action.a) &&
          +action.a >= 0 &&
          +action.a <= 99 &&
          Number.isInteger(+action.b) &&
          +action.b >= 0 &&
          +action.b <= 99,
        "Placar inválido.",
      );
      g.score = `${+action.a} × ${+action.b}`;
      g.status = "Concluída";
      if (action.type === "simulateResult") g.simulated = true;
      message = action.type === "simulateResult"
        ? "Jogo simulado para apresentação. A avaliação está liberada."
        : "Resultado registrado. A avaliação está liberada.";
      break;
    }
    case "review": {
      const g = s.games.find((g) => g.id === id);
      need(
        g && g.status === "Concluída" && !g.review,
        "Avaliação disponível uma vez por partida concluída.",
      );
      need(
        [action.skill, action.fair, action.punctuality, action.organization].every(
          (n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5,
        ),
        "As notas devem ser de 1 a 5.",
      );
      g.review = {
        skill: action.skill,
        fair: action.fair,
        punctuality: action.punctuality,
        organization: action.organization,
      };
      message = "Avaliação registrada no histórico e no ranking.";
      break;
    }
    case "unmatch":
      need(s.matches.includes(id), "Match não encontrado.");
      need(
        !s.games.some(
          (g) =>
            g.team === id && !["Cancelada", "Concluída"].includes(g.status),
        ),
        "Cancele a partida ativa antes de encerrar o match.",
      );
      s.matches = s.matches.filter((x) => x !== id);
      delete s.messages[id];
      message = "Match encerrado.";
      break;
    case "registerTeam":
    case "profile": {
      const creating = action.type === "registerTeam";
      need(
        creating ? s.teamRegistered === false : s.teamRegistered !== false,
        creating ? "Você já possui uma equipe cadastrada. Edite seu perfil." : "Cadastre sua equipe primeiro.",
      );
      const validText = (value: unknown, min: number, max: number) =>
        typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
      need(validText(action.name, 3, 80), "O nome precisa ter de 3 a 80 caracteres.");
      need(teamCategories.includes(action.category), "Categoria inválida.");
      need(teamLevels.includes(action.level), "Nível inválido.");
      need(validText(action.district, 2, 80), "Informe o bairro com 2 a 80 caracteres.");
      const city = action.city ?? s.profile.city ?? "";
      const region = action.state ?? s.profile.state ?? "";
      if (creating || city || region) {
        need(validText(city, 2, 80), "Informe a cidade com 2 a 80 caracteres.");
        need(typeof region === "string" && brazilianStates.includes(region), "Selecione uma UF válida.");
      }
      need(action.bio === undefined || (typeof action.bio === "string" && action.bio.trim().length <= 500), "A descrição deve ter no máximo 500 caracteres.");
      s.profile = {
        ...s.profile,
        name: clean(action.name, 80), district: clean(action.district, 80),
        city: clean(city, 80), state: region,
        category: action.category, level: action.level, bio: clean(action.bio, 500),
      };
      s.teamRegistered = true;
      message = creating ? "Equipe cadastrada com sucesso." : "Equipe atualizada.";
      break;
    }
    case "role":
      need(
        ["organizador", "arbitro"].includes(action.role),
        "Perfil inválido.",
      );
      s.profile.role = action.role;
      message = "Perfil de demonstração alterado.";
      break;
    case "available":
      s.profile.available = !!action.value;
      break;
    case "referee": {
      need(
        s.profile.role === "arbitro",
        "Apenas o perfil de árbitro pode responder.",
      );
      need(s.profile.available, "Ative sua disponibilidade antes de aceitar.");
      const g = s.games.find((g) => g.id === id);
      need(
        g && g.status === "Confirmada" && g.referee === "Pendente",
        "Convite indisponível.",
      );
      g.referee = action.accept ? "Você (demonstração)" : "Recusado";
      message = action.accept
        ? "Atuação confirmada na demonstração."
        : "Convite recusado.";
      break;
    }
    case "read":
      s.notifications.forEach((n) => (n.read = true));
      break;
    case "settings":
      s.settings = {
        push: !!action.push,
        email: !!action.email,
        dark: !!action.dark,
      };
      break;
    case "report":
      need(team, "Equipe não encontrada.");
      need(
        clean(action.reason, 500).length >= 10,
        "Descreva a denúncia com pelo menos 10 caracteres.",
      );
      s.reports.push({ team: id, reason: clean(action.reason, 500) });
      message =
        "Denúncia salva para demonstração. Não há equipe de moderação conectada.";
      break;
    case "delete":
      need(
        !s.games.some((g) => !["Cancelada", "Concluída"].includes(g.status)),
        "Cancele as partidas ativas antes de desativar a equipe.",
      );
      s.deleted = true;
      message = "Equipe desativada. O histórico foi preservado.";
      break;
    case "restore":
      s.deleted = false;
      message = "Equipe restaurada.";
      break;
    default:
      throw Error("Operação desconhecida.");
  }
  return { state: s, message };
}
