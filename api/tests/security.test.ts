import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app";
import { createEmailDelivery, type EmailDelivery, type SecurityMail } from "../src/mail";
async function setup(mail?: EmailDelivery) {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f)=>f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`,"utf8"));
  const db = {
    query: async (sql: string,args?: any[]) => {const r=await pg.query(sql,args);return {rows:r.rows as any[],rowCount:r.affectedRows};},
    transaction: async (run:any)=>pg.transaction(async(tx)=>run({query:async(sql:string,args?:any[])=>{const r=await tx.query(sql,args);return {rows:r.rows,rowCount:r.affectedRows};}})),
  };
  const app=await createApp(db,{emailDelivery:mail||{available:false,send:async()=>{throw Error("disabled");}}});
  const http=app.getHttpServer();
  const register=async(email:string)=> (await request(http).post("/auth/register").send({name:"Pessoa de Teste",email,password:"senha-original-123"}).expect(201)).body;
  return {pg,db,app,http,register,close:async()=>{await app.close();await pg.close();}};
}
const auth=(token:string)=>({Authorization:`Bearer ${token}`});
const tokenInMail=(message:SecurityMail)=> {
  const match=message.text.match(/desafioaceito:\/\/[^\s]+/);
  assert.ok(match);
  const token=new URL(match[0]).searchParams.get("token");
  assert.match(token||"",/^[A-Za-z0-9_-]{43}$/);
  return token!;
};

test("segurança sem SMTP: códigos privados de uso único e alteração de senha revogam sessões sem expor segredos",async()=>{
  const f=await setup();
  try {
    const a=await f.register("alice@example.com"), b=await f.register("bob@example.com");
    const caps=await request(f.http).get("/auth/capabilities").expect(200);
    assert.deepEqual(caps.body,{passwordRecovery:false,emailChange:false,passwordChange:true,recoveryCodes:true,google:false});
    const unavailable=await request(f.http).post("/auth/forgot-password").send({email:"alice@example.com"}).expect(503);
    const unknown=await request(f.http).post("/auth/forgot-password").send({email:"unknown@example.com"}).expect(503);
    assert.deepEqual(unavailable.body,unknown.body);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM security_tokens")).rows[0].n,0);
    await request(f.http).get("/account").expect(401);
    const account=await request(f.http).get("/account").set(auth(a.token)).expect(200);
    assert.deepEqual(Object.keys(account.body.user).sort(),["email","id","name"]);
    await request(f.http).post("/account/recovery-codes").set(auth(a.token)).send({currentPassword:"errada"}).expect(401);
    const first=await request(f.http).post("/account/recovery-codes").set(auth(a.token)).send({currentPassword:"senha-original-123"}).expect(200);
    assert.equal(first.body.codes.length,6);
    assert.equal(new Set(first.body.codes).size,6);
    for(const code of first.body.codes) assert.match(code,/^[A-Za-z0-9_-]{22}$/);
    const stored=await f.db.query("SELECT code_hash,used_at FROM account_recovery_codes");
    assert.ok(stored.rows.every(r=>/^[a-f0-9]{64}$/.test(r.code_hash)&&!first.body.codes.includes(r.code_hash)&&r.used_at===null));
    const regenerated=await request(f.http).post("/account/recovery-codes").set(auth(a.token)).send({currentPassword:"senha-original-123"}).expect(200);
    await request(f.http).post("/auth/recover-code").send({email:"alice@example.com",code:first.body.codes[0],password:"senha-nova-123"}).expect(400);
    const invalidOther=await request(f.http).post("/auth/recover-code").send({email:"bob@example.com",code:regenerated.body.codes[0],password:"senha-nova-123"}).expect(400);
    const invalidUnknown=await request(f.http).post("/auth/recover-code").send({email:"unknown@example.com",code:regenerated.body.codes[0],password:"senha-nova-123"}).expect(400);
    assert.deepEqual(invalidOther.body,invalidUnknown.body);
    const success=await request(f.http).post("/auth/recover-code").send({email:"alice@example.com",code:regenerated.body.codes[0],password:"senha-nova-123"}).expect(200);
    assert.equal("token" in success.body,false);
    await request(f.http).get("/state").set(auth(a.token)).expect(401);
    await request(f.http).get("/state").set(auth(b.token)).expect(200);
    await request(f.http).post("/auth/recover-code").send({email:"alice@example.com",code:regenerated.body.codes[0],password:"outra-senha-123"}).expect(400);
    await request(f.http).post("/auth/login").send({email:"alice@example.com",password:"senha-original-123"}).expect(401);
    const login=(await request(f.http).post("/auth/login").send({email:"alice@example.com",password:"senha-nova-123"}).expect(200)).body;
    await request(f.http).post("/account/password").set(auth(login.token)).send({currentPassword:"errada",newPassword:"ultima-senha-123"}).expect(401);
    await request(f.http).post("/account/password").set(auth(login.token)).send({currentPassword:"senha-nova-123",newPassword:"curta"}).expect(400);
    await request(f.http).post("/account/password").set(auth(login.token)).send({currentPassword:"senha-nova-123",newPassword:"ultima-senha-123",user_id:b.user.id}).expect(200);
    await request(f.http).get("/state").set(auth(login.token)).expect(401);
    await request(f.http).get("/state").set(auth(b.token)).expect(200);
    await request(f.http).post("/auth/login").send({email:"alice@example.com",password:"ultima-senha-123"}).expect(200);
    const hash=(await f.db.query("SELECT password_hash FROM users WHERE id=$1",[a.user.id])).rows[0].password_hash;
    assert.ok(!hash.includes("ultima-senha"));
  } finally {await f.close();}
});

test("recuperação por e-mail: resposta genérica, token hash expirável, único e revogação das sessões",async()=>{
  const inbox:SecurityMail[]=[];
  const f=await setup({available:true,send:async(message)=>{inbox.push(message);}});
  try {
    const a=await f.register("alice@example.com");
    const known=await request(f.http).post("/auth/forgot-password").send({email:"alice@example.com"}).expect(202);
    const unknown=await request(f.http).post("/auth/forgot-password").send({email:"missing@example.com"}).expect(202);
    assert.deepEqual(known.body,unknown.body);
    assert.deepEqual(Object.keys(known.body),["message"]);
    assert.equal(inbox.length,1);
    assert.equal(inbox[0].to,"alice@example.com");
    const first=tokenInMail(inbox[0]);
    const stored=(await f.db.query("SELECT token_hash,user_id,expires_at,used_at FROM security_tokens")).rows[0];
    assert.equal(stored.token_hash,createHash("sha256").update(first).digest("hex"));
    assert.notEqual(stored.token_hash,first);
    assert.ok(new Date(stored.expires_at).getTime()>Date.now());
    await request(f.http).post("/auth/forgot-password").send({email:"alice@example.com"}).expect(202);
    const second=tokenInMail(inbox[1]);
    await request(f.http).post("/auth/reset-password").send({token:first,password:"nova-senha-123"}).expect(400);
    await f.db.query("UPDATE security_tokens SET expires_at=CURRENT_TIMESTAMP-INTERVAL '1 minute' WHERE token_hash=$1",[createHash("sha256").update(second).digest("hex")]);
    await request(f.http).post("/auth/reset-password").send({token:second,password:"nova-senha-123"}).expect(400);
    await request(f.http).post("/auth/forgot-password").send({email:"alice@example.com"}).expect(202);
    const third=tokenInMail(inbox[2]);
    await request(f.http).post("/auth/reset-password").send({token:third,password:"nova-senha-123"}).expect(200);
    await request(f.http).post("/auth/reset-password").send({token:third,password:"nova-outra-123"}).expect(400);
    await request(f.http).get("/state").set(auth(a.token)).expect(401);
    await request(f.http).post("/auth/login").send({email:"alice@example.com",password:"nova-senha-123"}).expect(200);
    assert.ok((await f.db.query("SELECT used_at FROM security_tokens")).rows.every(r=>r.used_at!==null));
  } finally {await f.close();}
});

test("alteração de e-mail exige senha e confirmação no novo endereço, preservando identidade e revogando sessões",async()=>{
  const inbox:SecurityMail[]=[];
  const f=await setup({available:true,send:async(message)=>{inbox.push(message);}});
  try {
    const a=await f.register("alice@example.com"), b=await f.register("bob@example.com");
    await request(f.http).post("/account/email").set(auth(a.token)).send({currentPassword:"errada",newEmail:"nova@example.com"}).expect(401);
    await request(f.http).post("/account/email").set(auth(a.token)).send({currentPassword:"senha-original-123",newEmail:"bob@example.com"}).expect(409);
    const change=await request(f.http).post("/account/email").set(auth(a.token)).send({currentPassword:"senha-original-123",newEmail:"nova@example.com"}).expect(202);
    assert.equal("token" in change.body,false);
    assert.equal(inbox[0].to,"nova@example.com");
    const before=(await request(f.http).get("/account").set(auth(a.token)).expect(200)).body;
    assert.equal(before.user.email,"alice@example.com");
    const token=tokenInMail(inbox[0]);
    await request(f.http).post("/auth/reset-password").send({token,password:"nao-pode-usar"}).expect(400);
    await request(f.http).post("/auth/confirm-email").send({token}).expect(200);
    await request(f.http).post("/auth/confirm-email").send({token}).expect(400);
    await request(f.http).get("/state").set(auth(a.token)).expect(401);
    await request(f.http).get("/state").set(auth(b.token)).expect(200);
    await request(f.http).post("/auth/login").send({email:"alice@example.com",password:"senha-original-123"}).expect(401);
    const login=(await request(f.http).post("/auth/login").send({email:"nova@example.com",password:"senha-original-123"}).expect(200)).body;
    assert.equal(login.user.id,a.user.id);
  } finally {await f.close();}
});

test("recuperação limita tentativas por endereço e configuração SMTP não ativa transporte sem credenciais",async()=>{
  const f=await setup({available:true,send:async()=>{}});
  try {
    for(let i=0;i<5;i++) await request(f.http).post("/auth/forgot-password").send({email:"missing@example.com"}).expect(202);
    await request(f.http).post("/auth/forgot-password").send({email:"missing@example.com"}).expect(429);
    const limits=await f.db.query("SELECT key_hash FROM security_rate_limits");
    assert.ok(limits.rows.every(r=>/^[a-f0-9]{64}$/.test(r.key_hash)&&!r.key_hash.includes("missing")));
    assert.equal(createEmailDelivery({SMTP_HOST:"smtp.example.test",SMTP_FROM:"noreply@example.test"}).available,false);
    assert.equal(createEmailDelivery({SMTP_HOST:"smtp.example.test",SMTP_USER:"u",SMTP_PASS:"p",SMTP_FROM:"noreply@example.test",SMTP_PORT:"invalid"}).available,false);
    assert.equal(createEmailDelivery({SMTP_HOST:"smtp.example.test",SMTP_USER:"u",SMTP_PASS:"p",SMTP_FROM:"noreply@example.test",SMTP_PORT:"465"}).available,true);
  } finally {await f.close();}
});

test("falha de entrega invalida o link sem devolver ou registrar código, credenciais ou existência da conta",async()=>{
  let deliveredToken="";
  const f=await setup({available:true,send:async(message)=>{deliveredToken=tokenInMail(message);throw Error("SMTP_SECRET_MUST_NOT_LEAK");}});
  const original=console.error, logs:string[]=[];
  console.error=(...args:unknown[])=>{logs.push(args.join(" "));};
  try {
    await f.register("alice@example.com");
    const response=await request(f.http).post("/auth/forgot-password").send({email:"alice@example.com"}).expect(202);
    assert.equal("token" in response.body,false);
    // Wait for the asynchronous adapter failure handler; no real external messages are sent.
    for(let i=0;i<20&&!logs.length;i++) await new Promise(resolve=>setTimeout(resolve,5));
    assert.ok(logs.length);
    assert.ok(logs.every(log=>!log.includes(deliveredToken)&&!log.includes("SMTP_SECRET_MUST_NOT_LEAK")&&!log.includes("alice@example.com")));
    await request(f.http).post("/auth/reset-password").send({token:deliveredToken,password:"nova-senha-123"}).expect(400);
    const rows=await f.db.query("SELECT used_at FROM security_tokens");
    assert.ok(rows.rows.every(row=>row.used_at!==null));
  } finally {console.error=original;await f.close();}
});
