// Carga inicial para teste: conta do avaliador + 5 equipes "[Demo]" na API real.
// Usa só os endpoints públicos (mesmas regras de validação do app). Idempotente.
// Uso: SEED_API_URL=https://desafio-aceito-api.onrender.com node api/scripts/seed-demo.mjs
import { createHash } from "node:crypto";

const base = process.env.SEED_API_URL;
if (!base?.startsWith("https://")) throw Error("Defina SEED_API_URL com a URL HTTPS da API.");
const EVALUATOR = { email: "avaliador@desafioaceito.test", password: "Avaliador2026", name: "Avaliador Demo" };

async function call(path, { token, body } = {}) {
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  const json = r.status === 204 ? null : await r.json().catch(() => null);
  return { status: r.status, json };
}
async function account({ email, password, name }) {
  let r = await call("/auth/login", { body: { email, password } });
  if (r.status !== 200) r = await call("/auth/register", { body: { name, email, password } });
  if (!r.json?.token) throw Error(`${email}: HTTP ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.token;
}
async function act(token, action) {
  const s = await call("/state", { token });
  const r = await call("/state", { token, body: { version: s.json.version, action } });
  if (r.status !== 200) throw Error(`${action.type}: HTTP ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
async function team(token, data) {
  const s = (await call("/state", { token })).json;
  if (s.currentTeamId) return s.currentTeamId;
  return (await act(token, { type: "registerTeam", ...data })).currentTeamId;
}

const DEMOS = [
  ["Tigres do Bixiga", "Bela Vista", "Masculino", "Amador"],
  ["Estrela da Mooca", "Mooca", "Masculino", "Várzea"],
  ["Leoas da Liberdade", "Liberdade", "Feminino", "Amador"],
  ["Real Pinheiros", "Pinheiros", "Masculino", "Semiprofissional"],
  ["Unidos do Tatuapé", "Tatuapé", "Veteranos", "Várzea"],
];
const bio = "Equipe fictícia criada para demonstração do projeto acadêmico.";

const evalToken = await account(EVALUATOR);
const evalTeam = await team(evalToken, { name: "[Demo] Avaliador FC", district: "Liberdade", city: "São Paulo", state: "SP", category: "Masculino", level: "Amador", bio });
const ids = [];
for (const [n, district, category, level] of DEMOS) {
  const email = `demo-${n.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@desafioaceito.test`;
  const password = "Dm1" + createHash("sha256").update(EVALUATOR.password + email).digest("hex").slice(0, 12);
  const token = await account({ email, password, name: `Responsável ${n}` });
  const id = await team(token, { name: `[Demo] ${n}`, district, city: "São Paulo", state: "SP", category, level, bio });
  ids.push(id);
  // As 3 primeiras já demonstram interesse no time do avaliador (basta curtir de volta para dar match).
  if (ids.length <= 3) { try { await act(token, { type: "interest", id: evalTeam }); } catch {} }
}
console.log(JSON.stringify({ avaliador: EVALUATOR.email, equipes: ids.length + 1 }));
