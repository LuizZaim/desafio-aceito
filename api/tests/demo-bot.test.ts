import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";

async function harness() {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    query: async (sql: string, args?: any[]) => { const r = await pg.query(sql,args); return {rows:r.rows as any[],rowCount:r.affectedRows}; },
    transaction: async (run: any) => pg.transaction(async (tx) => run({query: async (sql: string, args?: any[]) => { const r = await tx.query(sql,args); return {rows:r.rows,rowCount:r.affectedRows}; }})),
  };
  const app = await createApp(db), http = app.getHttpServer();
  const create = async (slug: string, opts: {email?: string; teamName?: string} = {}) => {
    const registered = await request(http).post("/auth/register").send({name:`Organizador ${slug}`,email:opts.email ?? `${slug}@example.com`,password:"senha-segura-123"}).expect(201);
    const auth = {Authorization:`Bearer ${registered.body.token}`};
    const state = async () => (await request(http).get("/state").set(auth).expect(200)).body;
    const act = async (action: any, status = 200) => (await request(http).post("/state").set(auth).send({version:(await state()).version,action}).expect(status)).body;
    await act({type:"registerTeam",name:opts.teamName ?? `Time ${slug}`,district:"Liberdade",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:""});
    return {auth,state,act,id:(await state()).currentTeamId as string};
  };
  const demo = (slug: string) => create(slug, {email:`${slug}@desafioaceito.test`, teamName:`[Demo] ${slug}`});
  const close = async () => { await app.close(); await pg.close(); };
  return {http,create,demo,close};
}
const future = (days = 7) => new Date(Date.now()+days*86400000).toISOString().slice(0,10);
const chat = (res: any, team: string) => res.state.messages[team] as {text:string;own:boolean}[];

test("equipe Demo: interesse gera match automático; equipes normais ou imitações não reagem", async () => {
  const { create, demo, close } = await harness();
  try {
    const user = await create("user"), bot = await demo("bot");
    const res = await user.act({type:"interest",id:bot.id});
    assert.ok(res.message.startsWith("É match!"));
    assert.deepEqual(res.state.matches,[bot.id]);
    assert.deepEqual((await bot.state()).state.matches,[user.id]);
    assert.ok(res.state.notifications.some((n:any)=>n.text.includes("É match!")));
    // interesse repetido continua idempotente
    await user.act({type:"interest",id:bot.id});
    assert.deepEqual((await user.state()).state.matches,[bot.id]);

    const normal = await create("normal"), fakeName = await create("fakename", {teamName:"[Demo] Falso"}),
      fakeMail = await create("fakemail", {email:"semprefixo@desafioaceito.test"});
    for (const other of [normal, fakeName, fakeMail]) {
      const r = await user.act({type:"interest",id:other.id});
      assert.ok(r.message.startsWith("Interesse enviado"), "equipe normal não retribui interesse");
      assert.ok(!r.state.matches.includes(other.id));
    }
  } finally { await close(); }
});

test("equipe Demo responde no chat por palavra-chave; normal não responde; sem match segue 403", async () => {
  const { create, demo, close } = await harness();
  try {
    const user = await create("user"), bot = await demo("bot"), normal = await create("normal"), fake = await create("fake", {teamName:"[Demo] Falso"});
    await user.act({type:"send",id:bot.id,text:"oi"},403); // sem match
    await user.act({type:"interest",id:bot.id});
    await user.act({type:"send",id:bot.id,text:"   "},400);
    await user.act({type:"send",id:bot.id,text:"x".repeat(1001)},400);
    const cases: [string, RegExp][] = [
      ["Qual o melhor horário?", /Qualquer horário/],
      ["Onde vai ser o jogo?", /campo de vocês/],
      ["Como funciona o pagamento?", /caução simulada/],
      ["Quantos jogadores vocês têm?", /time completo/],
      ["Olá, tudo bem?", /Bora marcar/],
      ["Bom dia!", /Bora marcar/],
      ["Depois a gente combina", /Fechado!/],
      ["Vamos jogar sábado", /^\[Demonstração\] Fechado!/],
    ];
    for (const [text, re] of cases) {
      await user.act({type:"send",id:bot.id,text});
      const msgs = chat(await user.state(), bot.id), reply = msgs[msgs.length-1];
      assert.equal(reply.own, false);
      assert.ok(reply.text.startsWith("[Demonstração] "));
      assert.match(reply.text, re);
      assert.ok(msgs.some((m) => m.own && m.text === text));
      await new Promise((r) => setTimeout(r, 1100)); // resposta usa created_at +1s; evita intercalar com a próxima mensagem
    }
    assert.equal(chat(await user.state(), bot.id).length, cases.length*2);
    assert.ok((await user.state()).state.notifications.some((n:any)=>n.text.includes("respondeu no chat")));
    // o lado do bot vê a mesma conversa com own invertido
    assert.equal(chat(await bot.state(), user.id)[0].own, false);

    // normais e imitações não respondem
    for (const other of [normal, fake]) {
      await user.act({type:"interest",id:other.id}); await other.act({type:"interest",id:user.id});
      await user.act({type:"send",id:other.id,text:"Olá!"});
      const m = chat(await user.state(), other.id);
      assert.equal(m.length, 1); assert.equal(m[0].own, true);
    }
  } finally { await close(); }
});

test("equipe Demo: proposta aceita automaticamente, resultado antes do horário, avaliação atualiza o rating", async () => {
  const { create, demo, close } = await harness();
  try {
    const user = await create("user"), bot = await demo("bot");
    const proposal = {type:"schedule",id:bot.id,date:future(),time:"10:00",field:"Arena Demo",home:user.id};
    await user.act(proposal,403); // sem match
    await user.act({type:"interest",id:bot.id});
    await user.act({...proposal,date:"2020-01-01"},400);
    await user.act({...proposal,field:""},400);
    const res = await user.act(proposal);
    assert.match(res.message, /aceita automaticamente/);
    const game = res.state.games[0];
    assert.equal(game.status, "Aguardando caução");
    assert.equal(game.canRespond, false);
    assert.ok(res.state.notifications.some((n:any)=>n.text.includes("resposta automática")));
    await user.act({type:"result",id:game.id,a:1,b:0},409); // ainda não confirmada
    await user.act({type:"pay",id:game.id});
    await user.act({type:"result",id:game.id,a:100,b:0},400);
    await user.act({type:"result",id:game.id,a:"x",b:0},400);
    await user.act({type:"review",id:game.id,skill:5,fair:5,punctuality:5,organization:5},409); // não concluída
    const done = await user.act({type:"result",id:game.id,a:"3",b:2});
    assert.equal(done.state.games[0].status, "Concluída");
    assert.equal(done.state.games[0].score, "3 × 2");
    await user.act({type:"review",id:game.id,skill:6,fair:5,punctuality:5,organization:5},400);
    const reviewed = await user.act({type:"review",id:game.id,skill:5,fair:4,punctuality:5,organization:4});
    assert.deepEqual(reviewed.state.games[0].review, {skill:5,fair:4,punctuality:5,organization:4});
    await user.act({type:"review",id:game.id,skill:5,fair:4,punctuality:5,organization:4},409);
    const botTeam = (await user.state()).teams.find((t:any)=>t.id===bot.id);
    assert.equal(botTeam.rating, 4.5);
    assert.equal(botTeam.reviewCount, 1);
    assert.equal(botTeam.games, 1);
  } finally { await close(); }
});

test("equipe normal: proposta aguarda adversário, resultado antes do horário é 409, cancelamento depois de confirmada", async () => {
  const { create, close } = await harness();
  try {
    const a = await create("alice"), b = await create("bob");
    await a.act({type:"interest",id:b.id}); await b.act({type:"interest",id:a.id});
    const res = await a.act({type:"schedule",id:b.id,date:future(),time:"10:00",field:"Arena Normal",home:a.id});
    assert.doesNotMatch(res.message, /automaticamente/);
    const game = res.state.games[0];
    assert.equal(game.status, "Aguardando adversário");
    await a.act({type:"pay",id:game.id},409);
    await a.act({type:"result",id:game.id,a:1,b:0},409);
    assert.equal((await a.state()).state.games[0].status, "Aguardando adversário");
    assert.ok((await b.state()).state.notifications.some((n:any)=>n.text.includes("Nova proposta")));
    await b.act({type:"acceptProposal",id:game.id});
    await a.act({type:"pay",id:game.id});
    assert.equal((await a.state()).state.games[0].status, "Confirmada");
    await a.act({type:"result",id:game.id,a:1,b:0},409);
    await b.act({type:"result",id:game.id,a:1,b:0},409);
    assert.equal((await a.state()).state.games[0].status, "Confirmada");
    await a.act({type:"cancel",id:game.id,reason:""},400);
    const cancelled = await a.act({type:"cancel",id:game.id,reason:"Imprevisto no elenco."});
    assert.equal(cancelled.state.games[0].status, "Cancelada");
    assert.equal(cancelled.state.games[0].payment, "Estorno simulado");
    assert.equal(cancelled.state.games[0].fee, 10);
    assert.match(cancelled.message, /R\$ 10/);
  } finally { await close(); }
});

test("equipe Demo: cancelamento depois de confirmada e entradas inválidas", async () => {
  const { create, demo, close } = await harness();
  try {
    const user = await create("user"), bot = await demo("bot");
    await user.act({type:"interest",id:bot.id});
    const game = (await user.act({type:"schedule",id:bot.id,date:future(),time:"09:00",field:"Campo Demo",home:bot.id})).state.games[0];
    await user.act({type:"pay",id:game.id});
    const cancelled = await user.act({type:"cancel",id:game.id,reason:"Chuva."});
    assert.equal(cancelled.state.games[0].status, "Cancelada");
    await user.act({type:"cancel",id:game.id,reason:"de novo"},409);
    await user.act({type:"result",id:game.id,a:1,b:0},409);
    await user.act({type:"schedule",id:bot.id,date:"2021-05-05",time:"10:00",field:"Campo Demo",home:bot.id},400);
    await user.act({type:"schedule",id:bot.id,date:future(),time:"10:00",field:"Campo Demo",home:user.id});
    await user.act({type:"send",id:bot.id,text:""},400);
    await user.act({type:"send",id:user.id,text:"oi"},400); // para si mesmo
    await user.act({type:"send",id:"inexistente",text:"oi"},404);
  } finally { await close(); }
});
