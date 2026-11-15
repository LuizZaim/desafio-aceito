import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIncomingPath, protectedDestination, destinationPath, postLoginDestination, routeToken } from "../src/core/navigation.ts";
import { freshState } from "../src/core/domain.ts";
const arbitration = { profile: null, professionals: [], invites: [] };
const token = "A".repeat(43);

test("entradas não-string, vazias e gigantes são rejeitadas", () => {
  for (const v of [undefined, null, 5, {}, [], "", " ", "a".repeat(2049), "/\u0000equipe", "/equipe\n"])
    assert.equal(normalizeIncomingPath(v), null);
});

test("barra final, abas com prefixo e query extra são normalizadas", () => {
  assert.equal(normalizeIncomingPath("/configuracoes/"), "/configuracoes");
  assert.equal(normalizeIncomingPath("/(tabs)/ranking"), "/(tabs)/ranking");
  assert.equal(normalizeIncomingPath("/agenda?x=1#frag"), "/(tabs)/agenda");
  assert.equal(normalizeIncomingPath("/equipe"), "/equipe");
  assert.equal(normalizeIncomingPath("/equipe?id=a&id=b"), null);
  assert.equal(normalizeIncomingPath("/Equipe?id=vila"), null);
  assert.equal(normalizeIncomingPath("ftp://x/equipe?id=a"), null);
});

test("token com tamanho ou caracteres errados é rejeitado; duplicado também", () => {
  for (const v of ["A".repeat(42), "A".repeat(44), "A".repeat(42) + "+", undefined, 1])
    assert.equal(routeToken(v), undefined);
  assert.equal(normalizeIncomingPath(`/recuperar?token=${token}`), `/recuperar?token=${token}`);
  assert.equal(normalizeIncomingPath(`/recuperar?token=${token}&token=${token}`), null);
  assert.equal(normalizeIncomingPath("/recuperar?token=curto"), null);
  assert.equal(protectedDestination(`/confirmar-email?token=${token}`), null);
  assert.equal(protectedDestination("/"), null);
  assert.equal(protectedDestination("/cadastro"), null);
});

test("destinationPath remove query e grupo de abas", () => {
  assert.equal(destinationPath("/(tabs)/agenda"), "/agenda");
  assert.equal(destinationPath("/chat?id=vila"), "/chat");
});

test("postLoginDestination: sem sessão vai ao início; /conta só online; destino público ignorado", () => {
  const registered = { ...freshState(), teamRegistered: true };
  const unregistered = { ...freshState(), teamRegistered: false };
  assert.equal(postLoginDestination({ mode: "none", state: registered, arbitration, pendingDestination: "/chat?id=a" }), "/");
  assert.equal(postLoginDestination({ mode: "demo", state: registered, arbitration, pendingDestination: "/conta" }), "/(tabs)/descobrir");
  assert.equal(postLoginDestination({ mode: "online", state: registered, arbitration, pendingDestination: "/conta" }), "/conta");
  assert.equal(postLoginDestination({ mode: "local", state: registered, arbitration, pendingDestination: "/cadastro" }), "/(tabs)/descobrir");
  assert.equal(postLoginDestination({ mode: "local", state: unregistered, arbitration, pendingDestination: "/chat?id=a" }), "/editar");
  assert.equal(postLoginDestination({ mode: "online", state: unregistered, arbitration: { ...arbitration, profile: { id: "p" } } }), "/arbitragem");
});
