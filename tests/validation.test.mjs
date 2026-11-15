import test from "node:test";
import assert from "node:assert/strict";
import { emailError, passwordError, nameError } from "../src/core/validation.ts";
import { initialState as freshState, transition as applyLocalAction } from "../src/core/domain.ts";

test("e-mail fraco é recusado", () => {
  for (const e of ["a@b.c", "letra@", "@x.com", "a b@x.com", ""]) assert.ok(emailError(e), e);
  assert.equal(emailError("time@exemplo.com.br"), null);
});
test("senha exige letra, número e 8+", () => {
  for (const p of ["curta1", "somenteletras", "12345678"]) assert.ok(passwordError(p), p);
  assert.equal(passwordError("senha-segura-123"), null);
});
test("nome exige 3 chars e 2 letras", () => {
  for (const n of ["", "ab", "12345"]) assert.ok(nameError(n), n);
  assert.equal(nameError("Time FC"), null);
});
test("sim_reply adiciona mensagem do adversário marcada como demonstração", () => {
  const s = freshState();
  const id = s.matches[0];
  if (!id) return;
  const { state } = applyLocalAction(s, { type: "sim_reply", id });
  const last = state.messages[id].at(-1);
  assert.equal(last.own, false);
  assert.match(last.text, /\[Demonstração\]/);
});
