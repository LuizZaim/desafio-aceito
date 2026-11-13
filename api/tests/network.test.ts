import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";

test("rede real: duas contas, reciprocidade, chat privado, notificações, denúncias e encerramento", async () => {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    query: async (sql: string, args?: any[]) => { const r = await pg.query(sql, args); return {rows: r.rows as any[], rowCount: r.affectedRows}; },
    transaction: async (run: any) => pg.transaction(async (tx) => run({query: async (sql: string, args?: any[]) => { const r = await tx.query(sql,args); return {rows:r.rows,rowCount:r.affectedRows}; }})),
  };
  const app = await createApp(db), http = app.getHttpServer();
  try {
    const create = async (email: string) => {
      const r = await request(http).post("/auth/register").send({name:"Organizador de Teste", email,password:"senha-segura-123"}).expect(201);
      const auth = {Authorization:`Bearer ${r.body.token}`};
      return {
        auth,
        state: async () => (await request(http).get("/state").set(auth).expect(200)).body,
        act: async (action: any, status = 200) => {
          const before = (await request(http).get("/state").set(auth).expect(200)).body;
          return (await request(http).post("/state").set(auth).send({version:before.version,action}).expect(status)).body;
        },
      };
    };
    const alice = await create("alice@example.com"), bob = await create("bob@example.com"), outsider = await create("outsider@example.com");
    const profile = {type:"registerTeam",name:"Time da Alice",district:"Tatuapé",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:"Equipe de teste"};
    await alice.act(profile);
    await bob.act({...profile,name:"Time do Bob"});
    await outsider.act({...profile,name:"Terceiro Time"});
    const a = (await alice.state()).currentTeamId, b = (await bob.state()).currentTeamId, c = (await outsider.state()).currentTeamId;
    assert.ok(a && b && a !== b);
    await request(http).get("/teams").expect(401);
    const catalog = await request(http).get("/teams").set(alice.auth).expect(200);
    assert.deepEqual(catalog.body.teams.map((t:any)=>t.id).sort(), [b,c].sort());
    assert.equal(catalog.body.teams[0].distance,null);
    assert.ok(!JSON.stringify(catalog.body).includes("example.com"));
    const pub = await request(http).get(`/teams/${b}`).set(alice.auth).expect(200);
    assert.equal(pub.body.name,"Time do Bob");
    assert.ok(!("organizer_id" in pub.body));
    await alice.act({type:"send",id:b,text:"sem reciprocidade"},403);
    await alice.act({type:"interest",id:"vila"},404);
    await alice.act({type:"interest",id:a},400);
    await alice.act({type:"role",role:"arbitro"},403);
    await alice.act({type:"pay",id:b},409);
    const first = await alice.act({type:"interest",id:b});
    assert.deepEqual(first.state.matches,[]);
    assert.deepEqual((await bob.state()).state.matches,[]);
    assert.equal((await bob.state()).teams.find((t:any)=>t.id===a).reciprocal,true);
    await bob.act({type:"interest",id:a});
    assert.deepEqual((await alice.state()).state.matches,[b]);
    assert.deepEqual((await bob.state()).state.matches,[a]);
    assert.equal((await alice.state()).state.notifications.length,1);
    assert.equal((await bob.state()).state.notifications.length,1);
    await alice.act({type:"interest",id:b});
    assert.equal((await alice.state()).state.notifications.length,1,"retry does not duplicate match notification");
    await outsider.act({type:"send",id:a,text:"tentar entrar na conversa"},403);
    await alice.act({type:"send",id:b,text:"   "},400);
    await alice.act({type:"send",id:b,text:"x".repeat(1001)},400);
    await alice.act({type:"send",id:b,text:"Vamos jogar no domingo?",sender_team_id:c});
    const received = (await bob.state()).state.messages[a];
    assert.equal(received[0].text,"Vamos jogar no domingo?");
    assert.equal(received[0].own,false);
    assert.equal((await alice.state()).state.messages[b][0].own,true);
    assert.deepEqual((await outsider.state()).state.messages,{});
    assert.equal((await bob.state()).state.notifications.length,2);
    await bob.act({type:"send",id:a,text:"Sim, vamos combinar!"});
    assert.equal((await alice.state()).state.messages[b].length,2);
    await alice.act({type:"read"});
    assert.ok((await alice.state()).state.notifications.every((n:any)=>n.read));
    assert.ok((await bob.state()).state.notifications.some((n:any)=>!n.read));
    await alice.act({type:"report",id:b,reason:"Conduta inadequada no perfil."});
    assert.equal((await alice.state()).state.reports.length,1);
    const previousBob = (await bob.state()).state.profile.name;
    await alice.act({...profile,type:"profile",name:"Time da Alice Editado",id:b,organizer_id:"outro"});
    assert.equal((await bob.state()).state.profile.name,previousBob);
    assert.equal((await alice.state()).currentTeamId,a);
    await outsider.act({type:"unmatch",id:a},404);
    await alice.act({type:"unmatch",id:b});
    assert.deepEqual((await bob.state()).state.matches,[]);
    await bob.act({type:"send",id:a,text:"encerrado"},403);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM team_matches")).rows[0].n,1);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM messages")).rows[0].n,2);
    await alice.act({type:"delete"});
    assert.ok(!(await bob.state()).teams.some((t:any)=>t.id===a));
    await alice.act({type:"interest",id:b},403);
    await alice.act({type:"restore"});
    assert.ok((await bob.state()).teams.some((t:any)=>t.id===a));
    await assert.rejects(() => db.query("INSERT INTO team_interests(from_team_id,to_team_id) VALUES($1,$1)",[a]));
    await assert.rejects(() => db.query("INSERT INTO messages(id,match_id,sender_team_id,text) VALUES('invalid','missing',$1,'teste')",[a]));
    const privateData = (await db.query("SELECT data FROM workspaces WHERE user_id=(SELECT organizer_id FROM teams WHERE id=$1)",[a])).rows[0].data;
    assert.deepEqual(Object.keys(privateData).sort(),["settings","skipped"]);
  } finally { await app.close(); await pg.close(); }
});
