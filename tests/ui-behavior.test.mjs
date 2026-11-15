import test from "node:test";
import assert from "node:assert/strict";
import { AlertQueue } from "../src/components/alert-queue.ts";
import { teamShareMessage } from "../src/components/team-sharing.ts";
import { normalizeIncomingPath } from "../src/core/navigation.ts";

test("duplo clique em diálogo antigo não repete a ação nem consome o próximo aviso", () => {
  const queue = new AlertQueue();
  const pay = { name: "confirmar caução" }, next = { name: "partida confirmada" };
  assert.equal(queue.enqueue(pay), true);
  assert.equal(queue.enqueue(next), false);
  let callbacks = 0;
  for (let click = 0; click < 2; click++) if (queue.consume(pay)) callbacks++;
  assert.equal(callbacks, 1);
  assert.equal(queue.current, next);
  assert.equal(queue.consume(next), next);
  assert.equal(queue.current, null);
});
test("fila preserva avisos existentes e invalida ações antigas após fechar", () => {
  const queue = new AlertQueue();
  const a = {}, b = {}, nested = {};
  queue.enqueue(a); queue.enqueue(b);
  queue.consume(a); queue.enqueue(nested);
  assert.equal(queue.consume(b), b);
  assert.equal(queue.current, nested);
  queue.clear();
  assert.equal(queue.consume(nested), null);
  assert.equal(queue.current, null);
});
const profile = { name: "União FC", category: "Masculino", level: "Amador", location: "São Paulo", teamId: "team-123" };
test("perfil conectado compartilha link que o aplicativo consegue resolver", () => {
  const message = teamShareMessage({ ...profile, mode: "online" });
  const link = message.match(/desafioaceito:\/\/[^\s]+/)?.[0];
  assert.equal(normalizeIncomingPath(link), "/equipe?id=team-123");
});
test("perfil local ou identidade inválida não fabrica endereço de equipe publicada", () => {
  for (const mode of ["local", "demo", "none"]) {
    const text = teamShareMessage({ ...profile, mode });
    assert.doesNotMatch(text, /desafioaceito:\/\//);
    assert.match(text, /não está publicado/);
  }
  for (const teamId of [null, "", "team/../admin", "team?id=other", "a".repeat(101)])
    assert.doesNotMatch(teamShareMessage({ ...profile, mode: "online", teamId }), /desafioaceito:\/\//);
});
