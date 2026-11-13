import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.SMOKE_API_URL;
if (!base?.startsWith("https://")) throw Error("Defina SMOKE_API_URL com a URL HTTPS da API.");
const suffix = randomUUID().slice(0, 8);
const clients = [];
async function call(path, { token, body, expected = 200 } = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${path}: HTTP ${response.status}; esperado ${expected}`);
  return result;
}
async function client(label) {
  const { token } = await call("/auth/register", { expected: 201, body: {
    name: `Teste técnico ${label}`, email: `smoke-${suffix}-${label}@example.test`, password: randomUUID(),
  }});
  const person = {
    token, game: null, team: null,
    state: () => call("/state", { token }),
    async act(action, expected = 200) {
      const previous = await this.state();
      return call("/state", { token, expected, body: { version: previous.version, action } });
    },
  };
  clients.push(person);
  return person;
}
try {
  assert.equal((await call("/health")).status, "ok");
  await call("/state", { expected: 401 });
  const a = await client("A"), b = await client("B"), professional = await client("arbitro");
  for (const [person, label] of [[a, "A"], [b, "B"]]) {
    const registered = await person.act({ type: "registerTeam", name: `Teste técnico ${label} ${suffix}`, district: "Liberdade", city: "São Paulo", state: "SP", category: "Masculino", level: "Amador", bio: "Cadastro temporário de verificação do projeto acadêmico." });
    person.team = registered.currentTeamId;
  }
  await a.act({ type: "interest", id: b.team });
  await a.act({ type: "send", id: b.team, text: "Antes da reciprocidade" }, 403);
  await b.act({ type: "interest", id: a.team });
  assert.ok((await a.state()).state.matches.includes(b.team));
  await a.act({ type: "send", id: b.team, text: `Verificação HTTPS ${suffix}` });
  const received = (await b.state()).state.messages[a.team];
  assert.equal(received.at(-1).text, `Verificação HTTPS ${suffix}`);
  assert.equal(received.at(-1).own, false);
  await professional.act({ type: "registerReferee", name: `Árbitro de teste ${suffix}`, city: "São Paulo", state: "SP", kind: "arbitro", available: true, bio: "Verificação técnica acadêmica." });
  const referee = (await professional.state()).arbitration.profile.id;
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const proposal = await a.act({ type: "schedule", id: b.team, date, time: "15:00", field: `Campo técnico de teste ${suffix}`, home: a.team });
  const id = proposal.state.games[0].id;
  a.game = id;
  await a.act({ type: "acceptProposal", id }, 403);
  await b.act({ type: "acceptProposal", id });
  await a.act({ type: "pay", id });
  assert.equal((await b.state()).state.games.find((g) => g.id === id).status, "Confirmada");
  await a.act({ type: "inviteReferee", id, refereeId: referee, role: "arbitro" });
  const invitation = (await professional.state()).arbitration.invites[0];
  await professional.act({ type: "respondReferee", id: invitation.id, accept: true });
  assert.equal((await a.state()).state.games[0].refereeAssignments[0].status, "Aceito");
  await a.act({ type: "cancel", id, reason: "Finalização do teste técnico automatizado." });
  const cancelled = (await b.state()).state.games.find((g) => g.id === id);
  assert.equal(cancelled.status, "Cancelada");
  assert.equal(cancelled.payment, "Estorno simulado");
  assert.equal((await professional.state()).arbitration.invites[0].status, "Cancelado");
  console.log(JSON.stringify({ passed: true, checks: ["HTTPS", "autenticação", "persistência entre contas", "reciprocidade", "chat privado", "aceite bilateral", "caução simulada", "arbitragem privada", "cancelamento compartilhado"] }));
} finally {
  // Preserve a clear test trail while removing test teams from discovery.
  for (const person of clients) {
    try {
      if (person.game) {
        const state = await person.state();
        const game = state.state.games.find((item) => item.id === person.game);
        if (game && !["Cancelada", "Concluída"].includes(game.status)) await person.act({ type: "cancel", id: game.id, reason: "Limpeza do teste técnico." });
      }
      if (person.team) await person.act({ type: "delete" });
      else await person.act({ type: "refereeAvailable", value: false });
      await call("/auth/logout", { token: person.token, body: {}, expected: 204 });
    } catch { console.error("Um cadastro técnico não pôde ser desativado; verificar registros com prefixo Teste técnico."); }
  }
}
