import test from "node:test";
import assert from "node:assert/strict";
import { freshState, transition, dateAfter, fields, reviewAverage } from "../src/core/domain.ts";

test("apresentação offline: time próprio percorre match, conversa, caução, jogo simulado e avaliação", () => {
  let state = freshState();
  const act = (action) => { state = transition(state, action).state; };
  act({ type: "registerTeam", name: "Time da Faculdade", district: "Liberdade", city: "São Paulo", state: "SP", category: "Masculino", level: "Amador" });
  assert.deepEqual(state.matches, []);
  assert.deepEqual(state.games, []);
  act({ type: "interest", id: "vila" });
  act({ type: "send", id: "vila", text: "Vamos demonstrar o agendamento?" });
  act({ type: "schedule", id: "vila", date: dateAfter(5), time: "10:00", field: fields[0], home: state.profile.name });
  const id = state.games[0].id;
  assert.throws(() => act({ type: "simulateResult", id, a: 2, b: 1 }), /confirmada/);
  act({ type: "pay", id });
  assert.equal(state.games[0].payment, "Simulada");
  assert.throws(() => act({ type: "result", id, a: 2, b: 1 }), /após o início/);
  for (const score of [-1, 100, 1.5, "inválido"]) {
    assert.throws(() => act({ type: "simulateResult", id, a: score, b: 1 }), /Placar/);
  }
  act({ type: "simulateResult", id, a: 2, b: 1 });
  assert.equal(state.games[0].status, "Concluída");
  assert.equal(state.games[0].simulated, true);
  assert.equal(state.games[0].date, dateAfter(5));
  act({ type: "review", id, skill: 4, fair: 5, punctuality: 3, organization: 4 });
  assert.equal(reviewAverage(state.games[0].review), 4);
  assert.throws(() => act({ type: "review", id, skill: 5, fair: 5, punctuality: 5, organization: 5 }), /uma vez/);
  assert.equal(state.profile.name, "Time da Faculdade");
  assert.equal(state.messages.vila[0].text, "Vamos demonstrar o agendamento?");
});
