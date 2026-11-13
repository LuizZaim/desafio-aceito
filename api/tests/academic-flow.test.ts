import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";

test("demonstração acadêmica: caução simulada, placar orientado ao participante, avaliação única e ranking consolidado", async () => {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    query: async (sql: string, args?: any[]) => { const r = await pg.query(sql,args); return {rows:r.rows as any[],rowCount:r.affectedRows}; },
    transaction: async (run: any) => pg.transaction(async (tx) => run({query: async (sql: string, args?: any[]) => { const r = await tx.query(sql,args); return {rows:r.rows,rowCount:r.affectedRows}; }})),
  };
  const app = await createApp(db), http = app.getHttpServer();
  try {
    const create = async (name: string) => {
      const registered = await request(http).post("/auth/register").send({name:`Organizador ${name}`,email:`${name}@example.com`,password:"senha-segura-123"}).expect(201);
      const auth = {Authorization:`Bearer ${registered.body.token}`};
      const state = async () => (await request(http).get("/state").set(auth).expect(200)).body;
      const act = async (action: any, status = 200) => (await request(http).post("/state").set(auth).send({version:(await state()).version,action}).expect(status)).body;
      await act({type:"registerTeam",name:`Time ${name}`,district:"Liberdade",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:""});
      return {auth,state,act,id:(await state()).currentTeamId};
    };
    const a = await create("Alice"), b = await create("Bob"), outsider = await create("Terceiro");
    await a.act({type:"interest",id:b.id}); await b.act({type:"interest",id:a.id});
    const date = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    const proposal = {type:"schedule",id:b.id,date,time:"10:00",field:"Quadra da Faculdade",home:a.id};
    const created = await a.act(proposal), id = created.state.games[0].id;
    await a.act({type:"pay",id},409);
    await outsider.act({type:"pay",id},403);
    await b.act({type:"acceptProposal",id});
    await a.act({type:"pay",id,amount:0,simulated:false});
    const deposit = (await db.query("SELECT * FROM simulated_deposits WHERE game_id=$1",[id])).rows[0];
    assert.equal(deposit.simulated,true);
    assert.equal(deposit.amount_cents,5000,"financial amount and simulation are controlled by the server");
    assert.equal(deposit.paid,true);
    assert.equal(deposit.reversed,false);
    assert.equal((await a.state()).state.games[0].status,"Confirmada");
    assert.equal((await b.state()).state.games[0].payment,"Simulada");
    await b.act({type:"pay",id},409);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM simulated_deposits WHERE game_id=$1",[id])).rows[0].n,1);
    await a.act({type:"result",id,a:"3",b:"1"},409);
    await a.act({type:"review",id,skill:5,fair:4,punctuality:3,organization:4},409);
    // Advance only the test fixture. No client action can alter the server clock or game start.
    await db.query("UPDATE games SET starts_at=CURRENT_TIMESTAMP - INTERVAL '1 minute' WHERE id=$1",[id]);
    await outsider.act({type:"result",id,a:1,b:0},403);
    await b.act({type:"result",id,a:"",b:"3"},400);
    await b.act({type:"result",id,a:true,b:3},400);
    await b.act({type:"result",id,a:100,b:3},400);
    await b.act({type:"result",id,a:"1",b:"3"});
    const ga = (await a.state()).state.games[0], gb = (await b.state()).state.games[0];
    assert.equal(ga.status,"Concluída");
    assert.equal(ga.score,"3 × 1");
    assert.equal(gb.score,"1 × 3");
    await a.act({type:"result",id,a:0,b:0},409);
    await a.act({type:"cancel",id,reason:"já concluída"},409);
    await outsider.act({type:"review",id,skill:5,fair:5,punctuality:5,organization:5},403);
    await a.act({type:"review",id,skill:5,fair:4},400);
    await a.act({type:"review",id,skill:5,fair:4,punctuality:3.5,organization:4},400);
    await a.act({type:"review",id,skill:5,fair:4,punctuality:3,organization:4});
    assert.deepEqual((await a.state()).state.games[0].review,{skill:5,fair:4,punctuality:3,organization:4});
    assert.equal((await b.state()).state.games[0].review,undefined,"opponent review does not count as viewer's own submission");
    await a.act({type:"review",id,skill:1,fair:1,punctuality:1,organization:1},409);
    await b.act({type:"review",id,skill:1,fair:2,punctuality:3,organization:4});
    const bob = (await a.state()).teams.find((t:any)=>t.id===b.id), alice = (await b.state()).teams.find((t:any)=>t.id===a.id);
    assert.equal(bob.rating,4);
    assert.equal(bob.reviewCount,1);
    assert.equal(bob.games,1);
    assert.equal(alice.rating,2.5);
    assert.equal(alice.reviewCount,1);
    assert.equal((await outsider.state()).teams.find((t:any)=>t.id===b.id).rating,4);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM game_reviews")).rows[0].n,2);
    // Finished games no longer prevent a new proposal, ending a match, or account deactivation.
    await a.act({type:"unmatch",id:b.id});
    await a.act({type:"interest",id:b.id}); await b.act({type:"interest",id:a.id});
    const paidCancel = async (sameDay: boolean) => {
      const next = await a.act(proposal);
      const game = next.state.games.find((g:any)=>g.status==="Aguardando adversário");
      await b.act({type:"acceptProposal",id:game.id});
      await b.act({type:"pay",id:game.id});
      if (sameDay) await db.query("UPDATE games SET starts_at=CURRENT_TIMESTAMP WHERE id=$1",[game.id]);
      await a.act({type:"cancel",id:game.id,reason:"Cancelamento para apresentação acadêmica"});
      const d = (await db.query("SELECT * FROM simulated_deposits WHERE game_id=$1",[game.id])).rows[0];
      assert.equal(d.reversed,true);
      assert.equal(d.penalty_cents,sameDay?3000:1000);
      const ownGame = (await a.state()).state.games.find((g:any)=>g.id===game.id);
      assert.equal(ownGame.payment,"Estorno simulado");
      assert.equal(ownGame.fee,sameDay?30:10);
    };
    await paidCancel(false);
    await paidCancel(true);
    await a.act({type:"delete"});
    assert.equal((await a.state()).state.deleted,true);
    await assert.rejects(() => db.query("UPDATE simulated_deposits SET simulated=FALSE WHERE game_id=$1",[id]), /check constraint/i);
  } finally { await app.close(); await pg.close(); }
});
