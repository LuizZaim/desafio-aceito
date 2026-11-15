import test from "node:test";
import assert from "node:assert/strict";
import { emailError, passwordError, nameError } from "../src/validation.ts";

test("servidor recusa e-mail, senha e nome fracos", () => {
  assert.ok(emailError("a@b.c"));
  assert.ok(emailError("letra@"));
  assert.ok(passwordError("12345678"));
  assert.ok(passwordError("somenteletras"));
  assert.ok(nameError("ab"));
  assert.equal(emailError("time@exemplo.com.br"), null);
  assert.equal(passwordError("senha-segura-123"), null);
  assert.equal(nameError("Time FC"), null);
});
