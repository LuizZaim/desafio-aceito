import test from "node:test";
import assert from "node:assert/strict";
import { WorkspaceSession } from "../src/core/workspace-session.ts";
import { freshState } from "../src/core/domain.ts";
import { createApiClient, ApiError } from "../src/core/api-client.ts";

const snapshot = (version, text = "") => ({
  state: { ...freshState(), messages: { other: text ? [{ text, own: true, at: "10:00" }] : [] } },
  version, teams: [{ id: "other", name: "Outro FC" }], currentTeamId: "own",
});
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("atualização aguarda polling e usa a versão recebida, sem perder mensagem", async () => {
  const poll = deferred();
  const calls = [], commits = [];
  const session = new WorkspaceSession(async (path, method, body) => {
    calls.push({ path, method, body });
    return method === "POST" ? snapshot(8, body.action.text) : poll.promise;
  }, (data) => commits.push(data));
  const refresh = session.refresh();
  const write = session.update({ type: "send", id: "other", text: "Bora jogar?" });
  assert.equal(calls.length, 1);
  poll.resolve(snapshot(7));
  await Promise.all([refresh, write]);
  assert.equal(calls[1].body.version, 7);
  assert.equal(commits.at(-1).state.messages.other[0].text, "Bora jogar?");
  assert.deepEqual(commits.map((data) => data.version), [7, 8]);
});

test("pollings simultâneos compartilham leitura e polling durante envio não repete requisição", async () => {
  let reads = 0, writes = 0;
  const sending = deferred();
  const session = new WorkspaceSession(async (_path, method) => {
    if (method === "POST") { writes++; return sending.promise; }
    reads++; return snapshot(1);
  }, () => {});
  const first = session.refresh();
  assert.equal(session.refresh(), first);
  await first;
  const write = session.update({ type: "send", text: "Oi" });
  assert.equal(session.refresh(), write);
  await assert.rejects(session.update({ type: "send", text: "Duplicada" }), /Aguarde/);
  sending.resolve(snapshot(2, "Oi"));
  await write;
  assert.equal(reads, 1);
  assert.equal(writes, 1);
});

test("respostas atrasadas de outra sessão não voltam após logout ou troca de conta", async () => {
  const old = deferred();
  const commits = [];
  let requests = 0;
  const session = new WorkspaceSession(async () => {
    requests++;
    return requests === 1 ? old.promise : snapshot(0, "Conta nova");
  }, (data) => commits.push(data));
  const previous = session.refresh();
  session.reset();
  await session.refresh();
  old.resolve(snapshot(99, "Conta anterior"));
  assert.equal(await previous, null);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].state.messages.other[0].text, "Conta nova");
});

test("falha no envio preserva snapshot anterior e não repete automaticamente a mutação", async () => {
  const commits = [];
  let writes = 0;
  const session = new WorkspaceSession(async (_path, method) => {
    if (method === "POST") { writes++; throw Error("Sem rede"); }
    return snapshot(3, "Anterior");
  }, (data) => commits.push(data));
  await session.refresh();
  await assert.rejects(session.update({ type: "send", text: "Nova" }), /Sem rede/);
  assert.equal(writes, 1);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].state.messages.other[0].text, "Anterior");
});

test("serviço antigo não injeta equipes fictícias e snapshot inválido não é aplicado", async () => {
  const commits = [];
  let invalid = false;
  const session = new WorkspaceSession(async () => invalid ? { version: 4 } : {
    state: freshState(), version: 1,
  }, (data) => commits.push(data));
  await session.refresh();
  assert.deepEqual(commits[0].teams, []);
  assert.equal(commits[0].currentTeamId, null);
  assert.deepEqual(commits[0].arbitration, { profile: null, professionals: [], invites: [] });
  invalid = true;
  await assert.rejects(session.refresh(), /incompletos/);
  assert.equal(commits.length, 1);
});

test("arbitragem conectada usa apenas os dados privados do snapshot da sessão atual", async () => {
  const commits = [];
  const professional = {
    id: "referee-account-one", name: "Profissional de teste", city: "São Paulo",
    state: "SP", kind: "arbitro", bio: "Perfil acadêmico", available: true,
  };
  const invite = {
    id: "invite-private", gameId: "game-one", role: "arbitro", status: "Pendente",
    gameStatus: "Confirmada", teamAName: "Time A", teamBName: "Time B",
    date: "2099-11-20", time: "10:00", field: "Campo de teste", canRespond: true,
  };
  let next = { ...snapshot(1), arbitration: { profile: professional, professionals: [professional], invites: [invite] } };
  const session = new WorkspaceSession(async () => next, (data) => commits.push(data));
  await session.refresh();
  assert.deepEqual(commits[0].arbitration.profile, professional);
  assert.equal(commits[0].arbitration.invites[0].id, "invite-private");
  assert.equal(commits[0].state.profile.role, "organizador", "professional capability does not switch the team role");
  session.reset();
  next = snapshot(0);
  await session.refresh();
  assert.deepEqual(commits[1].arbitration, { profile: null, professionals: [], invites: [] });
  next = { ...snapshot(1), arbitration: { profile: {}, professionals: null, invites: "inválido" } };
  await session.refresh();
  assert.deepEqual(commits[2].arbitration, { profile: null, professionals: [], invites: [] });
});

test("transporte envia token por cabeçalho, respeita status e nunca faz retry de POST", async () => {
  const calls = [];
  const request = createApiClient({
    baseURL: "https://api.example/", getToken: async () => "session-secret",
    fetch: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ message: "O chat exige interesse mútuo." }), { status: 403 });
    },
  });
  await assert.rejects(request("/state", "POST", { action: "send" }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 403);
    assert.match(error.message, /interesse mútuo/);
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.example/state");
  assert.equal(calls[0].options.headers.Authorization, "Bearer session-secret");
  assert.equal(calls[0].options.body, '{"action":"send"}');
  await assert.rejects(request("//other.example"), /inválido/);
  assert.equal(calls.length, 1);
});

test("transporte trata timeout e erro de rede com mensagem legível", async () => {
  const request = createApiClient({
    baseURL: "https://api.example", getToken: async () => null, timeoutMs: 5,
    fetch: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(Error("AbortError")));
    }),
  });
  await assert.rejects(request("/state"), /demorou/);
  const offline = createApiClient({
    baseURL: "https://api.example", getToken: async () => null,
    fetch: async () => { throw new TypeError("Failed to fetch"); },
  });
  await assert.rejects(offline("/state"), /Confira sua internet/);
});

test("respostas inválidas e erros 500 não expõem detalhes internos; logout 204 funciona", async () => {
  for (const [response, expected] of [
    [new Response("<html>proxy error</html>", { status: 502 }), /resposta inválida/],
    [new Response('{"message":"SQL stack trace secret"}', { status: 500 }), /Não foi possível/],
  ]) {
    const request = createApiClient({ baseURL: "https://api.example", getToken: async () => null, fetch: async () => response });
    await assert.rejects(request("/state"), expected);
  }
  const logout = createApiClient({ baseURL: "https://api.example", getToken: async () => null, fetch: async () => new Response(null, { status: 204 }) });
  assert.equal(await logout("/auth/logout", "POST"), null);
});
