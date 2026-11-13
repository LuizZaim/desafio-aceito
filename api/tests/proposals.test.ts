import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";

test("agenda compartilhada: proposta bilateral, conflito de equipes/local, caução simulada e clima com concordância adversária", async () => {
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
    const a = await create("Alice"), b = await create("Bob"), c = await create("Carol"), d = await create("Dan");
    for (const [one,two] of [[a,b],[c,d],[b,c]]) {
      await one.act({type:"interest",id:two.id}); await two.act({type:"interest",id:one.id});
    }
    const date = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    const proposal = {type:"schedule",id:b.id,date,time:"10:00",field:"Arena do Bairro",home:a.id};
    await c.act({...proposal,id:a.id,home:c.id},403);
    await a.act({...proposal,date:"2090-02-30"},400);
    await a.act({...proposal,time:"25:01"},400);
    await a.act({...proposal,field:"A"},400);
    await a.act({...proposal,home:c.id},400);
    for (const metadata of [
      {latitude:-23.55}, {longitude:-46.63}, {latitude:91,longitude:10},
      {latitude:10,longitude:-181}, {latitude:"10",longitude:20},
      {latitude:null,longitude:10}, {fieldAddress:7}, {fieldAddress:"x".repeat(251)},
    ]) await a.act({...proposal,...metadata},400);
    await a.act({...proposal,fieldAddress:"Rua da Faculdade, 100",latitude:-23.55,longitude:-46.63});
    const first = (await a.state()).state.games[0];
    assert.equal(first.status,"Aguardando adversário");
    assert.equal(first.canRespond,false);
    assert.equal(first.proposerId,a.id);
    assert.equal(first.time,"10:00");
    assert.equal(first.date,date);
    assert.equal(first.fieldAddress,"Rua da Faculdade, 100");
    assert.equal(first.latitude,-23.55);
    assert.equal(first.longitude,-46.63);
    await a.act({...proposal,fieldAddress:"Outro endereço, 999"},409);
    await a.act({...proposal,latitude:-20,longitude:-46.63},409);
    const bobGame = (await b.state()).state.games[0];
    assert.equal(bobGame.id,first.id);
    assert.equal(bobGame.team,a.id);
    assert.equal(bobGame.canRespond,true);
    await a.act({type:"pay",id:first.id},409);
    await a.act({type:"acceptProposal",id:first.id},403);
    await c.act({type:"acceptProposal",id:first.id},403);
    await a.act({...proposal,time:"11:00",field:"Outro local"},409);
    await c.act({...proposal,id:d.id,time:"11:00",field:"  ARENA   DO   BAIRRO  ",home:c.id},409);
    await b.act({...proposal,id:c.id,time:"11:00",field:"Terceiro local",home:b.id},409);
    // Exactly two hours apart is available, including the same field.
    await c.act({...proposal,id:d.id,time:"12:00",home:c.id});
    await a.act({type:"unmatch",id:b.id},409);
    await b.act({type:"delete"},409);
    await b.act({type:"acceptProposal",id:first.id});
    assert.equal((await a.state()).state.games[0].status,"Aguardando caução");
    assert.equal((await b.state()).state.games[0].canRespond,false);
    await b.act({type:"acceptProposal",id:first.id},409);
    await a.act({type:"pay",id:first.id});
    assert.equal((await a.state()).state.games[0].payment,"Simulada");
    await a.act({type:"pay",id:first.id},409);
    await a.act({type:"cancel",id:first.id,reason:"Chuva forte prevista.",weather:true});
    assert.equal((await a.state()).state.games[0].status,"Clima: aguardando acordo");
    assert.equal((await a.state()).state.games[0].canWeatherAgree,false);
    assert.equal((await b.state()).state.games[0].canWeatherAgree,true);
    await a.act({type:"weatherAgree",id:first.id},403);
    await c.act({type:"weatherAgree",id:first.id},403);
    await b.act({type:"weatherAgree",id:first.id});
    assert.equal((await a.state()).state.games[0].status,"Cancelada");
    assert.equal((await b.state()).state.games[0].status,"Cancelada");
    assert.equal((await b.state()).state.games[0].payment,"Estorno simulado");
    await a.act({type:"cancel",id:first.id,reason:"novamente"},409);
    await b.act({type:"settings",push:false,email:false,dark:false});
    const notifications = (await b.state()).state.notifications.length;
    // Cancelled proposal frees its slot; preferences suppress new in-app alerts.
    const second = await a.act(proposal);
    const active = second.state.games.find((g:any)=>g.status==="Aguardando adversário");
    assert.ok(active);
    assert.equal((await b.state()).state.notifications.length,notifications);
    await b.act({type:"rejectProposal",id:active.id});
    assert.ok((await a.state()).state.games.every((g:any)=>g.status==="Cancelada"));
    await a.act({type:"unmatch",id:b.id});
    assert.deepEqual((await a.state()).state.matches,[]);
    await b.act({type:"delete"});
    const historyCatalog = (await a.state()).teams;
    assert.equal(historyCatalog.find((t:any)=>t.id===b.id)?.active,false);
    assert.ok(!(await c.state()).teams.some((t:any)=>t.id===b.id),"nonparticipant cannot retrieve inactive team");
    await request(http).get(`/teams/${b.id}`).set(a.auth).expect(200);
    await request(http).get(`/teams/${b.id}`).set(c.auth).expect(404);
    const fields = (await db.query("SELECT name FROM fields")).rows;
    assert.equal(fields.length,1,"conflicting proposal rolls its field insert back; equivalent names deduplicate");
    const pending = (await db.query("SELECT count(*)::int AS n FROM games WHERE status='Aguardando adversário'")).rows[0].n;
    assert.equal(pending,1,"only Carol/Dan proposal remains active");
  } finally { await app.close(); await pg.close(); }
});

test("cadastro legado incompleto permanece como rascunho editável até concluir região", async () => {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    query: async (sql: string, args?: any[]) => { const r = await pg.query(sql,args); return {rows:r.rows as any[],rowCount:r.affectedRows}; },
    transaction: async (run: any) => pg.transaction(async (tx) => run({query: async (sql: string, args?: any[]) => { const r = await tx.query(sql,args); return {rows:r.rows,rowCount:r.affectedRows}; }})),
  };
  const app = await createApp(db), http = app.getHttpServer();
  try {
    const registered = await request(http).post("/auth/register").send({name:"Organizador Antigo",email:"legado@example.com",password:"senha-segura-123"}).expect(201);
    const auth = {Authorization:`Bearer ${registered.body.token}`};
    await db.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2)",[registered.body.user.id,JSON.stringify({teamRegistered:true,profile:{name:"Time Preservado",district:"Tatuapé",category:"Masculino",level:"Amador",bio:"Descrição antiga"},matches:["vila"],messages:{vila:[{text:"Ficcional"}]},games:[{id:"demo"}]})]);
    let res = (await request(http).get("/state").set(auth).expect(200)).body;
    assert.equal(res.state.teamRegistered,false);
    assert.equal(res.state.profile.name,"Time Preservado");
    assert.deepEqual(res.state.matches,[]);
    assert.deepEqual(res.state.games,[]);
    await request(http).post("/state").set(auth).send({version:res.version,action:{type:"settings",push:false,email:false,dark:false}}).expect(200);
    res = (await request(http).get("/state").set(auth).expect(200)).body;
    assert.equal(res.state.profile.bio,"Descrição antiga");
    await request(http).post("/state").set(auth).send({version:res.version,action:{type:"registerTeam",...res.state.profile,city:"São Paulo",state:"SP"}}).expect(200);
    res = (await request(http).get("/state").set(auth).expect(200)).body;
    assert.equal(res.state.teamRegistered,true);
    assert.equal(res.state.profile.name,"Time Preservado");
  } finally { await app.close(); await pg.close(); }
});
