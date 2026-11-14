import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync,readdirSync } from "node:fs";
import { AcademicExtras } from "../src/academic-extras";
import type { Database } from "../src/db";
import request from "supertest";
import { createApp } from "../src/app";

test("extras acadêmicos: privacidade, elenco, plano sem cobrança, crédito atômico e conquistas verificáveis",async()=>{
 const pg=new PGlite();
 for(const file of readdirSync("migrations").filter((f)=>f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`,"utf8"));
 const query=async(sql:string,args?:any[])=>{const result=await pg.query(sql,args);return{rows:result.rows as any[],rowCount:result.affectedRows}};
 const db:Database={query,transaction:async(run)=>pg.transaction(async(tx)=>run({query:async(sql,args)=>{const r=await tx.query(sql,args);return{rows:r.rows as any[],rowCount:r.affectedRows}}}))};
 try{
  for(const id of["alice","bob"]){
   await query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,'fixturehash')",[id,id,`${id}@example.test`]);
   await query("INSERT INTO teams(id,organizer_id,name,district,city,state,category,level) VALUES($1,$2,$3,'Tatuapé','São Paulo','SP','Masculino','Amador')",[`team-${id}`,id,`Time ${id}`]);
  }
  const own={id:"team-alice",active:true};
  const act=(action:any,user="alice",team:any=own)=>db.transaction!(async(tx)=>new AcademicExtras(tx).action(user,team,action));
  const extras=new AcademicExtras(db);
  assert.deepEqual((await extras.snapshot("alice")).achievements,[]);
  await assert.rejects(()=>act({type:"addDemoCard",label:"Cartão",last4:"4111111111111111"}),/quatro/);
  await assert.rejects(()=>act({type:"addDemoCard",label:"Cartão",last4:"1234",cvv:"123"}),/Não envie/);
  await act({type:"addDemoCard",label:"Identificador fictício",last4:"1234"});
  const card=(await extras.snapshot("alice")).cards[0];
  assert.deepEqual(Object.keys(card).sort(),["id","label","last4"]);
  assert.deepEqual((await extras.snapshot("bob")).cards,[]);
  await assert.rejects(()=>act({type:"removeDemoCard",id:card.id},"bob",{id:"team-bob",active:true}),/sua conta/);
  await act({type:"savePlayer",name:"Capitão",position:"Meio-campo",number:10});
  const player=(await extras.snapshot("alice")).players[0];
  await assert.rejects(()=>act({type:"savePlayer",id:player.id,name:"Invasão",position:"Atacante",number:9},"bob",{id:"team-bob",active:true}),/sua equipe/);
  await assert.rejects(()=>act({type:"savePlayer",name:"Duplicado",position:"Atacante",number:10}),/em uso/);
  await act({type:"teamField",field:"Campo do Bairro, Rua A 100"});
  const publicTeams=await extras.publicTeams([{id:"team-alice"}],"team-bob");
  assert.equal(publicTeams[0].players[0].name,"Capitão");
  assert.equal(publicTeams[0].preferredField,"Campo do Bairro, Rua A 100");
  assert.ok(!JSON.stringify(publicTeams).includes(card.last4));
  await act({type:"selectAcademicPlan",plan:"academico"});
  assert.equal((await extras.snapshot("alice")).subscription.priorityCredits,1);
  await act({type:"selectAcademicPlan",plan:"gratuito"});await act({type:"selectAcademicPlan",plan:"academico"});
  assert.equal((await extras.snapshot("alice")).subscription.priorityCredits,1,"plan toggles do not mint credits");
  await assert.rejects(()=>db.transaction!(async(tx)=>{await new AcademicExtras(tx).consumePriority("alice",own,"team-bob");throw Error("later interest failed")}),/interest failed/);
  assert.equal((await extras.snapshot("alice")).subscription.priorityCredits,1,"failed shared action rolls credit back");
  await db.transaction!(async(tx)=>{await new AcademicExtras(tx).consumePriority("alice",own,"team-bob");await tx.query("INSERT INTO team_interests(from_team_id,to_team_id) VALUES($1,$2)",[own.id,"team-bob"])});
  assert.equal((await extras.snapshot("alice")).subscription.priorityCredits,0);
  assert.equal((await extras.publicTeams([{id:"team-alice"}],"team-bob"))[0].priority,true);
  await assert.rejects(()=>db.transaction!(async(tx)=>new AcademicExtras(tx).consumePriority("alice",own,"team-bob")),/já possui prioridade/);
  assert.deepEqual((await extras.snapshot("alice")).achievements,[],"one-sided interest is not a match");
  await query("INSERT INTO team_matches(id,team_a_id,team_b_id) VALUES('matched','team-alice','team-bob')");
  assert.deepEqual((await extras.snapshot("alice")).achievements.map((row)=>row.id),["first-match"]);
  await act({type:"removePlayer",id:player.id});
  await act({type:"removeDemoCard",id:card.id});
  assert.deepEqual((await extras.snapshot("alice")).cards,[]);
  assert.deepEqual((await extras.snapshot("alice")).players,[]);
 }finally{await pg.close()}
});

test("HTTP extras: prioridade preserva reciprocidade e reverte crédito quando a gravação do match falha", async () => {
 const pg=new PGlite();
 for(const file of readdirSync("migrations").filter((f)=>f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`,"utf8"));
 let failNotification=false;
 const db:Database={
  query:async(sql,args)=>{const result=await pg.query(sql,args);return{rows:result.rows as any[],rowCount:result.affectedRows}},
  transaction:async(run)=>pg.transaction(async(tx)=>run({query:async(sql,args)=>{
   if(failNotification && sql.startsWith("INSERT INTO notifications")) throw Error("test-only storage outage");
   const result=await tx.query(sql,args);return{rows:result.rows as any[],rowCount:result.affectedRows};
  }})),
 };
 const app=await createApp(db),http=app.getHttpServer();
 try{
  const create=async(name:string)=>{
   const registered=await request(http).post("/auth/register").send({name:`Organizador ${name}`,email:`${name}@extras.example`,password:"senha-segura-123"}).expect(201);
   const auth={Authorization:`Bearer ${registered.body.token}`};
   const state=async()=>(await request(http).get("/state").set(auth).expect(200)).body;
   const act=async(action:any,status=200)=>(await request(http).post("/state").set(auth).send({version:(await state()).version,action}).expect(status)).body;
   await act({type:"registerTeam",name:`Time ${name}`,district:"Tatuapé",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:""});
   return{auth,state,act,id:(await state()).currentTeamId};
  };
  const alice=await create("Alice"),bob=await create("Bob");
  await alice.act({type:"priorityInterest",id:bob.id},409);
  assert.deepEqual((await alice.state()).state.matches,[]);
  await alice.act({type:"selectAcademicPlan",plan:"academico"});
  await alice.act({type:"addDemoCard",label:"Cartão de demonstração",last4:"9876"});
  await alice.act({type:"addDemoCard",label:"Cartão",last4:"1111",pan:"4111111111111111"},400);
  await alice.act({type:"savePlayer",name:"Capitão",number:10,position:"Meio-campo"});
  const a=(await alice.state()).academic;
  assert.equal(a.cards.length,1);
  await bob.act({type:"removeDemoCard",id:a.cards[0].id},404);
  await bob.act({type:"savePlayer",id:a.players[0].id,name:"Invasão",number:9,position:"Atacante"},404);
  const publicProfile=(await request(http).get(`/teams/${alice.id}`).set(bob.auth).expect(200)).body;
  assert.equal(publicProfile.players[0].name,"Capitão");
  assert.ok(!JSON.stringify(publicProfile).includes("9876"));
  await bob.act({type:"interest",id:alice.id});
  const before=(await alice.state()).version;
  failNotification=true;
  const failed=await alice.act({type:"priorityInterest",id:bob.id},500);
  assert.ok(!JSON.stringify(failed).includes("storage outage"));
  failNotification=false;
  const rolledBack=await alice.state();
  assert.equal(rolledBack.version,before);
  assert.equal(rolledBack.academic.subscription.priorityCredits,1);
  assert.deepEqual(rolledBack.state.interests,[]);
  assert.deepEqual(rolledBack.state.matches,[]);
  const success=await alice.act({type:"priorityInterest",id:bob.id});
  assert.equal(success.academic.subscription.priorityCredits,0);
  assert.deepEqual(success.state.matches,[bob.id]);
  const counterpart=await bob.state();
  assert.deepEqual(counterpart.academic.cards,[]);
  assert.deepEqual(counterpart.state.matches,[alice.id]);
  assert.equal(counterpart.teams.find((team:any)=>team.id===alice.id).priority,true);
  await alice.act({type:"priorityInterest",id:bob.id},409);
  assert.equal((await alice.state()).academic.subscription.priorityCredits,0);
 }finally{await app.close();await pg.close()}
});
