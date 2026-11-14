import test from "node:test";
import assert from "node:assert/strict";
import { routeId, routeToken, normalizeIncomingPath, protectedDestination, postLoginDestination } from "../src/core/navigation.ts";
import { freshState } from "../src/core/domain.ts";
const arbitration = { profile: null, professionals: [], invites: [] };

test("parâmetros repetidos, vazios e IDs contendo caminhos não selecionam entidades", () => {
  for (const value of [undefined, null, [], ["vila"], ["vila", "mooca"], "", "../vila", "vila/mooca", "vila?admin=1", "a".repeat(101)])
    assert.equal(routeId(value), undefined);
  assert.equal(routeId("team-123_456"), "team-123_456");
  assert.equal(normalizeIncomingPath("/chat?id=vila&id=mooca"), null);
  assert.equal(normalizeIncomingPath("/chat?id=%2fadmin"), null);
  assert.equal(normalizeIncomingPath("/chat"), null);
});

test("links nativos só apontam para rotas conhecidas e nunca seguem redirects externos", () => {
  assert.equal(normalizeIncomingPath("desafioaceito://chat?id=vila&next=https://evil.example"), "/chat?id=vila");
  assert.equal(normalizeIncomingPath("desafioaceito:///partida?id=game-demo-1"), "/partida?id=game-demo-1");
  assert.equal(normalizeIncomingPath("desafioaceito://agenda"), "/(tabs)/agenda");
  for (const value of ["javascript:alert(1)", "https://evil.example/chat?id=vila", "//evil.example/chat", "/chat/../equipe?id=vila", "/%2e%2e/equipe?id=vila", "/admin", "desafioaceito://user:secret@chat?id=vila", "/chat\\anything?id=vila", "/chat?id=vil a"])
    assert.equal(normalizeIncomingPath(value), null);
});

test("prévia web confia apenas na origem configurada, inclusive porta", () => {
  assert.equal(normalizeIncomingPath("http://localhost:8081/equipe?id=vila", "http://localhost:8081"), "/equipe?id=vila");
  assert.equal(normalizeIncomingPath("http://localhost:8082/equipe?id=vila", "http://localhost:8081"), null);
  assert.equal(normalizeIncomingPath("https://localhost:8081/equipe?id=vila", "http://localhost:8081"), null);
});

test("tokens de recuperação válidos são públicos e nunca viram destino pós-login", () => {
  const token = "A".repeat(43);
  assert.equal(routeToken(token), token);
  for (const bad of [[token], "A".repeat(42), "A".repeat(44), "a".repeat(42) + "/", " " + token]) assert.equal(routeToken(bad), undefined);
  assert.equal(normalizeIncomingPath(`desafioaceito://recuperar?token=${token}`), `/recuperar?token=${token}`);
  assert.equal(normalizeIncomingPath(`desafioaceito://confirmar-email?token=${token}`), `/confirmar-email?token=${token}`);
  assert.equal(protectedDestination(`/recuperar?token=${token}`), null);
  assert.equal(normalizeIncomingPath(`/recuperar?token=${token}&token=${token}`), null);
});

test("retomada após login respeita cadastro de equipe e perfil de arbitragem", () => {
  const state = freshState();
  assert.equal(postLoginDestination({ mode: "none", state, arbitration, pendingDestination: "/chat?id=vila" }), "/");
  assert.equal(postLoginDestination({ mode: "online", state, arbitration, pendingDestination: "/chat?id=vila" }), "/editar");
  assert.equal(postLoginDestination({ mode: "online", state, arbitration, pendingDestination: "/arbitragem" }), "/arbitragem");
  assert.equal(postLoginDestination({ mode: "online", state, arbitration: { ...arbitration, profile: { id: "ref" } } }), "/arbitragem");
  state.teamRegistered = true;
  assert.equal(postLoginDestination({ mode: "online", state, arbitration, pendingDestination: "/chat?id=vila" }), "/chat?id=vila");
  assert.equal(postLoginDestination({ mode: "online", state, arbitration, pendingDestination: "https://evil.example" }), "/(tabs)/descobrir");
  assert.equal(postLoginDestination({ mode: "local", state, arbitration, pendingDestination: "/conta" }), "/(tabs)/descobrir");
});
