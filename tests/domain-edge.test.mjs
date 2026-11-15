import test from "node:test";
import assert from "node:assert/strict";
import { initialState, freshState, transition } from "../src/core/domain.ts";
const run = (s, a) => transition(s, a).state;

test("ações inválidas, nulas e desconhecidas são rejeitadas", () => {
  for (const a of [null, undefined, [], "interest", 1])
    assert.throws(() => transition(initialState(), a), /Ação inválida/);
  assert.throws(() => transition(initialState(), { type: "naoexiste" }), /desconhecida/);
  assert.throws(() => transition(initialState(), {}), /desconhecida/);
});

test("pular equipe inexistente falha e pular duas vezes não duplica", () => {
  assert.throws(() => run(initialState(), { type: "skip", id: "zzz" }), /não encontrada/);
  let s = run(initialState(), { type: "skip", id: "leste" });
  s = run(s, { type: "skip", id: "leste" });
  assert.equal(s.skipped.filter((x) => x === "leste").length, 1);
});

test("mensagem vazia, só espaços ou sem match é rejeitada; texto longo é truncado", () => {
  let s = run(initialState(), { type: "interest", id: "vila" });
  for (const text of ["", "   ", undefined, null])
    assert.throws(() => run(s, { type: "send", id: "vila", text }), /Digite uma mensagem/);
  s = run(s, { type: "send", id: "vila", text: "x".repeat(5000) });
  assert.ok(s.messages.vila.at(-1).text.length <= 1000);
});

test("denúncia curta é rejeitada e equipe desconhecida também", () => {
  assert.throws(() => run(initialState(), { type: "report", id: "vila", reason: "curto" }), /10 caracteres/);
  assert.throws(() => run(initialState(), { type: "report", id: "zzz", reason: "motivo longo o bastante" }), /não encontrada/);
});

test("equipe desativada bloqueia ações exceto restaurar; restaurar reativa", () => {
  let s = run(freshState(), { type: "delete" });
  assert.equal(s.deleted, true);
  assert.throws(() => run(s, { type: "interest", id: "vila" }), /desativada/);
  assert.throws(() => run(s, { type: "settings", push: true }), /desativada/);
  s = run(s, { type: "restore" });
  assert.equal(s.deleted, false);
});

test("equipe nova não pode buscar adversários antes do cadastro", () => {
  assert.throws(() => run(freshState(), { type: "interest", id: "vila" }), /Cadastre sua equipe/);
});

test("configurações coagem valores para booleano e transição não muta a entrada", () => {
  const before = initialState();
  const snap = JSON.stringify(before);
  const s = run(before, { type: "settings", push: "sim", email: 0, dark: undefined });
  assert.deepEqual(s.settings, { push: true, email: false, dark: false });
  assert.equal(JSON.stringify(before), snap);
});

test("marcar como lidas zera pendências e unmatch de equipe sem match falha ou é idempotente", () => {
  let s = run(initialState(), { type: "interest", id: "vila" });
  s = run(s, { type: "read" });
  assert.ok(s.notifications.every((n) => n.read));
  assert.throws(() => run(initialState(), { type: "unmatch", id: "zzz" }));
});
