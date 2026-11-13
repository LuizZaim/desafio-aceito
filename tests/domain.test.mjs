import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  freshState,
  transition,
  dateAfter,
  fields,
  reviewAverage,
} from "../src/core/domain.ts";
const run = (s, a) => transition(s, a).state;
test("média das avaliações considera quatro dimensões e mantém histórico antigo", () => {
  assert.equal(reviewAverage(undefined), null);
  assert.equal(reviewAverage({ skill: 4, fair: 5 }), 4.5);
  assert.equal(reviewAverage({ skill: 4, fair: 5, punctuality: 3, organization: 2 }), 3.5);
  assert.equal(reviewAverage({ skill: 0, fair: 6 }), null);
});
test("interesse sem reciprocidade não libera chat", () => {
  const s = run(initialState(), { type: "interest", id: "leste" });
  assert.ok(s.interests.includes("leste"));
  assert.ok(!s.matches.includes("leste"));
  assert.throws(
    () => run(s, { type: "send", id: "leste", text: "Oi" }),
    /interesse mútuo/,
  );
});
test("interesse recíproco cria match uma vez e libera conversa", () => {
  let s = run(initialState(), { type: "interest", id: "vila" });
  assert.ok(s.matches.includes("vila"));
  assert.throws(
    () => run(s, { type: "interest", id: "vila" }),
    /já registrado/,
  );
  s = run(s, { type: "send", id: "vila", text: "Bora jogar?" });
  assert.equal(s.messages.vila[0].text, "Bora jogar?");
});
const proposal = {
  type: "schedule",
  id: "mooca",
  date: dateAfter(6),
  time: "15:00",
  field: fields[0],
  home: "FutTech FC",
};
test("fluxo proposta, caução e cancelamento", () => {
  let s = run(initialState(), proposal);
  const id = s.games[0].id;
  assert.equal(s.games[0].status, "Aguardando caução");
  s = run(s, { type: "pay", id });
  assert.equal(s.games[0].status, "Confirmada");
  assert.throws(() => run(s, { type: "pay", id }), /não aguarda/);
  s = run(s, { type: "cancel", id, reason: "Indisponibilidade da equipe" });
  assert.equal(s.games[0].status, "Cancelada");
  assert.equal(s.games[0].fee, 10);
  assert.equal(s.games[0].payment, "Estorno simulado");
});
test("agendamento rejeita falta de match, passado e conflito de agenda", () => {
  assert.throws(
    () => run(initialState(), { ...proposal, id: "base" }),
    /match/,
  );
  assert.throws(
    () => run(initialState(), { ...proposal, date: dateAfter(-2) }),
    /futuros/,
  );
  assert.throws(
    () =>
      run(initialState(), { ...proposal, date: dateAfter(3), time: "10:00" }),
    /conflito/,
  );
  assert.throws(
    () => run(initialState(), { ...proposal, field: "campo falso" }),
    /local válido/,
  );
});
test("clima exige acordo antes de cancelar sem taxa", () => {
  let s = run(initialState(), {
    type: "cancel",
    id: "game-demo-1",
    reason: "Campo alagado",
    weather: true,
  });
  assert.equal(s.games[0].status, "Clima: aguardando acordo");
  s = run(s, { type: "weatherAgree", id: "game-demo-1" });
  assert.equal(s.games[0].status, "Cancelada");
  assert.equal(s.games[0].fee, 0);
});
test("avaliação só aceita uma por partida concluída e notas válidas", () => {
  let s = initialState();
  assert.throws(
    () => run(s, { type: "review", id: "game-demo-1", skill: 5, fair: 5, punctuality: 5, organization: 5 }),
    /concluída/,
  );
  assert.throws(
    () => run(s, { type: "review", id: "game-demo-2", skill: 6, fair: 5, punctuality: 5, organization: 5 }),
    /1 a 5/,
  );
  s = run(s, { type: "review", id: "game-demo-2", skill: 4, fair: 5, punctuality: 3, organization: 2 });
  assert.deepEqual(s.games[1].review, { skill: 4, fair: 5, punctuality: 3, organization: 2 });
  assert.throws(
    () => run(s, { type: "review", id: "game-demo-2", skill: 5, fair: 5, punctuality: 5, organization: 5 }),
    /uma vez/,
  );
});
test("árbitro precisa de papel e disponibilidade para aceitar", () => {
  let s = initialState();
  assert.throws(
    () => run(s, { type: "referee", id: "game-demo-1", accept: true }),
    /perfil de árbitro/,
  );
  s = run(s, { type: "role", role: "arbitro" });
  s = run(s, { type: "available", value: false });
  assert.throws(
    () => run(s, { type: "referee", id: "game-demo-1", accept: true }),
    /disponibilidade/,
  );
  s = run(s, { type: "available", value: true });
  s = run(s, { type: "referee", id: "game-demo-1", accept: true });
  assert.equal(s.games[0].referee, "Você (demonstração)");
});
test("integridade protege match e equipe com partida ativa", () => {
  assert.throws(
    () => run(initialState(), { type: "unmatch", id: "mooca" }),
    /partida ativa/,
  );
  assert.throws(
    () => run(initialState(), { type: "delete" }),
    /partidas ativas/,
  );
});
test("resultado antes do jogo é rejeitado", () => {
  assert.throws(
    () =>
      run(initialState(), { type: "result", id: "game-demo-1", a: 2, b: 1 }),
    /após o início/,
  );
});
test("campos obrigatórios e equipe desconhecida são validados", () => {
  assert.throws(
    () =>
      run(initialState(), {
        type: "profile",
        name: "",
        district: "",
        category: "x",
        level: "x",
      }),
    /3 a 80 caracteres/,
  );
  assert.throws(
    () => run(initialState(), { type: "interest", id: "not-a-team" }),
    /não encontrada/,
  );
  assert.throws(
    () => run(initialState(), { type: "send", id: "mooca", text: " " }),
    /Digite/,
  );
});
test("transição não modifica estado original", () => {
  const s = initialState();
  run(s, { type: "interest", id: "vila" });
  assert.deepEqual(s.interests, []);
});

test("data inexistente e horário fora do relógio são rejeitados", () => {
  assert.throws(
    () => run(initialState(), { ...proposal, date: "2099-02-31" }),
    /inválido/,
  );
  assert.throws(
    () => run(initialState(), { ...proposal, time: "25:00" }),
    /futuros|inválido/,
  );
});
test("cancelamento sem caução não aplica penalidade", () => {
  let s = run(initialState(), proposal);
  const id = s.games[0].id;
  s = run(s, { type: "cancel", id, reason: "Sem jogadores suficientes" });
  assert.equal(s.games[0].fee, 0);
  assert.equal(s.games[0].payment, "Não cobrada");
});

const newTeam = {
  type: "registerTeam", name: "Tatuapé FC", district: "Tatuapé",
  city: "São Paulo", state: "SP", category: "Masculino", level: "Amador",
  bio: "Amistosos aos domingos",
};
test("equipe nova começa sem dados demonstrativos e precisa de cadastro", () => {
  const s = freshState();
  assert.equal(s.teamRegistered, false);
  assert.equal(s.profile.name, "");
  assert.deepEqual(s.matches, []);
  assert.deepEqual(s.games, []);
  assert.deepEqual(s.messages, {});
  assert.deepEqual(s.notifications, []);
  assert.throws(() => run(s, { type: "interest", id: "vila" }), /Cadastre/);
  assert.throws(() => run(s, proposal), /Cadastre/);
  assert.throws(() => run(s, { ...newTeam, type: "profile" }), /Cadastre/);
});
test("cadastro valida localização e campos, registra sem criar histórico, permite edição", () => {
  const s = freshState();
  for (const invalid of [
    { name: " A " }, { name: "A".repeat(81) }, { name: {} },
    { district: " " }, { category: "Qualquer" }, { level: "Inválido" },
    { city: "" }, { state: "XX" }, { bio: "a".repeat(501) },
  ]) {
    assert.throws(() => run(s, { ...newTeam, ...invalid }));
    assert.equal(s.teamRegistered, false);
  }
  const registered = run(s, { ...newTeam, name: "  Tatuapé FC  " });
  assert.equal(registered.teamRegistered, true);
  assert.equal(registered.profile.name, "Tatuapé FC");
  assert.equal(registered.profile.city, "São Paulo");
  assert.deepEqual(registered.games, []);
  assert.deepEqual(registered.matches, []);
  assert.throws(() => run(registered, newTeam), /já possui/);
  const edited = run(registered, { ...newTeam, type: "profile", name: "Novo FC" });
  assert.equal(edited.profile.name, "Novo FC");
  assert.equal(edited.teamRegistered, true);
  assert.equal(run(edited, { type: "interest", id: "vila" }).matches[0], "vila");
  assert.throws(() => transition(s, null), /inválida/);
});

// UC-R03/R05: every new rating must cover all four documented dimensions.
test("avaliação exige pontualidade e organização e preserva notas antigas", () => {
  const state = initialState();
  const valid = { type: "review", id: "game-demo-2", skill: 4, fair: 5, punctuality: 3, organization: 2 };
  for (const key of ["skill", "fair", "punctuality", "organization"]) {
    for (const invalid of [undefined, null, "5", 0, 6, 2.5, true]) {
      assert.throws(() => run(state, { ...valid, [key]: invalid }), /1 a 5/);
    }
  }
  state.games[1].review = { skill: 4, fair: 5 };
  const saved = run(state, { type: "settings", push: true, email: false, dark: false });
  assert.deepEqual(saved.games[1].review, { skill: 4, fair: 5 });
  assert.throws(() => run(saved, valid), /uma vez/);
});
