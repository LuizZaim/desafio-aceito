import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { generateKeyPairSync, sign } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import request from "supertest";
import { createApp } from "../src/app";
import { createGoogleIdentityProvider, type GoogleIdentityProvider, type VerifiedGoogleIdentity } from "../src/google-identity";
const CLIENT_ID="1234567890-trustedweb.apps.googleusercontent.com";
const TOKEN="header.signed-google-test-payload.signature";
async function setup(googleIdentity?:GoogleIdentityProvider) {
  const pg=new PGlite();
  for(const file of readdirSync("migrations").filter(f=>f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`,"utf8"));
  const db={
    query:async(sql:string,args?:any[])=>{const r=await pg.query(sql,args);return {rows:r.rows as any[],rowCount:r.affectedRows};},
    transaction:async(run:any)=>pg.transaction(async(tx)=>run({query:async(sql:string,args?:any[])=>{const r=await tx.query(sql,args);return {rows:r.rows,rowCount:r.affectedRows};}})),
  };
  const app=await createApp(db,{googleIdentity:googleIdentity||createGoogleIdentityProvider({}),emailDelivery:{available:false,send:async()=>{throw Error("disabled");}}});
  const http=app.getHttpServer();
  return {pg,db,app,http,close:async()=>{await app.close();await pg.close();}};
}

test("Google oficial: usa audiência fixa e rejeita assinatura, emissor, expiração e e-mail não verificado",async()=>{
  const good={iss:"https://accounts.google.com",aud:CLIENT_ID,sub:"google-sub-001",email:"google@example.com",email_verified:true,name:"Nome do Google",iat:Math.floor(Date.now()/1000)-30,exp:Math.floor(Date.now()/1000)+3600};
  let seen:any;
  const create=(claims:any)=>createGoogleIdentityProvider({GOOGLE_WEB_CLIENT_ID:CLIENT_ID},{verifyIdToken:async(options)=>{seen=options;return {getPayload:()=>claims};}});
  const identity=await create(good).verify(TOKEN);
  assert.deepEqual(seen,{idToken:TOKEN,audience:CLIENT_ID});
  assert.equal(identity.sub,"google-sub-001");
  assert.equal(identity.issuer,"https://accounts.google.com");
  assert.equal((await create({...good,iss:"accounts.google.com"}).verify(TOKEN)).issuer,"https://accounts.google.com");
  for(const change of [
    {aud:"attacker.apps.googleusercontent.com"}, {exp:Math.floor(Date.now()/1000)-1},
    {iss:"https://attacker.invalid"},{email_verified:false},{sub:""},{email:"invalid"},
  ]) await assert.rejects(()=>create({...good,...change}).verify(TOKEN));
  const failed=createGoogleIdentityProvider({GOOGLE_WEB_CLIENT_ID:CLIENT_ID},{verifyIdToken:async()=>{throw Error("invalid signature: PRIVATE_PROVIDER_DETAILS");}});
  const f=await setup(failed);
  try {
    const response=await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-valida-123"}).expect(401);
    assert.ok(!JSON.stringify(response.body).includes("PRIVATE_PROVIDER_DETAILS"));
    assert.ok(!JSON.stringify(response.body).includes(TOKEN));
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM users")).rows[0].n,0);
  } finally {await f.close();}
});

test("Google sem configuração permanece indisponível e não revela client ID ou cria contas",async()=>{
  const f=await setup();
  try {
    const caps=await request(f.http).get("/auth/capabilities").expect(200);
    assert.equal(caps.body.google,false);
    assert.equal("googleWebClientId" in caps.body,false);
    await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-valida-123"}).expect(503);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM users")).rows[0].n,0);
    assert.equal(createGoogleIdentityProvider({GOOGLE_WEB_CLIENT_ID:"https://attacker.invalid"}).available,false);
  } finally {await f.close();}
});

test("Google novo usuário escolhe senha real; identidade sub mantém a conta mesmo após alteração de e-mail",async()=>{
  let identity:VerifiedGoogleIdentity={issuer:"https://accounts.google.com",sub:"new-google-sub",email:"new-google@example.com",name:"Nome Verificado Google"};
  const f=await setup({available:true,clientId:CLIENT_ID,verify:async()=>identity});
  try {
    const caps=await request(f.http).get("/auth/capabilities").expect(200);
    assert.equal(caps.body.google,true);
    assert.equal(caps.body.googleWebClientId,CLIENT_ID);
    await request(f.http).post("/auth/google").send({idToken:TOKEN}).expect(428);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM users")).rows[0].n,0);
    await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"curta"}).expect(400);
    const created=await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-escolhida-123",email:"attacker@example.com",name:"Nome Injetado",sub:"attacker-sub"}).expect(200);
    assert.equal(created.body.user.email,"new-google@example.com");
    assert.equal(created.body.user.name,"Nome Verificado Google");
    assert.ok(created.body.token);
    await request(f.http).get("/state").set("Authorization",`Bearer ${created.body.token}`).expect(200);
    const passwordLogin=await request(f.http).post("/auth/login").send({email:"new-google@example.com",password:"senha-escolhida-123"}).expect(200);
    assert.equal(passwordLogin.body.user.id,created.body.user.id);
    const code=await request(f.http).post("/account/recovery-codes").set("Authorization",`Bearer ${created.body.token}`).send({currentPassword:"senha-escolhida-123"}).expect(200);
    assert.equal(code.body.codes.length,6,"Google signup keeps account password/recovery management usable");
    await f.db.query("UPDATE users SET email='changed-in-app@example.com' WHERE id=$1",[created.body.user.id]);
    identity={...identity,email:"changed-at-google@example.com",name:"Changed Google Name"};
    const again=await request(f.http).post("/auth/google").send({idToken:TOKEN}).expect(200);
    assert.equal(again.body.user.id,created.body.user.id);
    assert.equal(again.body.user.email,"changed-in-app@example.com");
    assert.equal(again.body.user.name,"Nome Verificado Google");
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM users")).rows[0].n,1);
    const links=(await f.db.query("SELECT issuer,sub,user_id FROM google_identities")).rows;
    assert.deepEqual(links,[{issuer:"https://accounts.google.com",sub:"new-google-sub",user_id:created.body.user.id}]);
  } finally {await f.close();}
});

test("Google não vincula por e-mail automaticamente: exige senha atual e mantém vínculo único por conta",async()=>{
  let identity:VerifiedGoogleIdentity={issuer:"https://accounts.google.com",sub:"existing-google-sub",email:"existing@example.com",name:"Google Name"};
  const f=await setup({available:true,clientId:CLIENT_ID,verify:async()=>identity});
  try {
    const original=await request(f.http).post("/auth/register").send({name:"Nome da Conta Original",email:"existing@example.com",password:"senha-original-123"}).expect(201);
    await request(f.http).post("/auth/google").send({idToken:TOKEN}).expect(428);
    await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-errada-123"}).expect(401);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM google_identities")).rows[0].n,0);
    const linked=await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-original-123"}).expect(200);
    assert.equal(linked.body.user.id,original.body.user.id);
    assert.equal(linked.body.user.name,"Nome da Conta Original");
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM users")).rows[0].n,1);
    await request(f.http).post("/auth/google").send({idToken:TOKEN}).expect(200);
    identity={...identity,sub:"second-google-sub"};
    await request(f.http).post("/auth/google").send({idToken:TOKEN,password:"senha-original-123"}).expect(409);
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM google_identities")).rows[0].n,1);
    await assert.rejects(()=>f.db.query("INSERT INTO google_identities(id,issuer,sub,user_id) VALUES('duplicate','https://accounts.google.com','different-sub',$1)",[original.body.user.id]),/unique constraint/i);
    await request(f.http).post("/auth/login").send({email:"existing@example.com",password:"senha-original-123"}).expect(200);
  } finally {await f.close();}
});


test("Google RS256 real: biblioteca oficial valida assinatura e rejeita token adulterado sem acessar a rede",async()=>{
  const {privateKey,publicKey}=generateKeyPairSync("rsa",{modulusLength:2048});
  const kid="classroom-signature-fixture";
  const client=new OAuth2Client(CLIENT_ID);
  type CertResponse=Awaited<ReturnType<OAuth2Client["getFederatedSignonCertsAsync"]>>;
  let certificateRequests=0;
  // Only the public certificate fetch is replaced. Real verifyIdToken and the
  // official RSA verifier run unchanged; no HTTP or external credential is used.
  client.getFederatedSignonCertsAsync=async():Promise<CertResponse>=>{
    certificateRequests++;
    return {certs:{[kid]:publicKey.export({format:"pem",type:"spki"}).toString()},format:"PEM" as CertResponse["format"]};
  };
  const provider=createGoogleIdentityProvider({GOOGLE_WEB_CLIENT_ID:CLIENT_ID},client);
  const now=Math.floor(Date.now()/1000);
  const claims={iss:"https://accounts.google.com",aud:CLIENT_ID,sub:"real-rsa-fixture-sub",email:"rsa-fixture@example.test",email_verified:true,name:"Pessoa da Fixture",iat:now-60,exp:now+3600};
  const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
  const signed=(payload:typeof claims)=>{
    const data=encode({alg:"RS256",typ:"JWT",kid})+"."+encode(payload);
    return data+"."+sign("RSA-SHA256",Buffer.from(data),privateKey).toString("base64url");
  };
  const valid=signed(claims);
  assert.deepEqual(await provider.verify(valid),{issuer:"https://accounts.google.com",sub:claims.sub,email:claims.email,name:claims.name});
  const [header,,signature]=valid.split(".");
  const tampered=header+"."+encode({...claims,email:"attacker@example.test"})+"."+signature;
  await assert.rejects(()=>provider.verify(tampered),/Invalid token signature/);
  const damagedSignature=Buffer.from(signature,"base64url");
  damagedSignature[0]^=1;
  await assert.rejects(()=>provider.verify(header+"."+encode(claims)+"."+damagedSignature.toString("base64url")),/Invalid token signature/);
  await assert.rejects(()=>provider.verify(signed({...claims,aud:"wrong-audience.apps.googleusercontent.com"})),/Wrong recipient/);
  await assert.rejects(()=>provider.verify(signed({...claims,iss:"https://attacker.invalid"})),/Invalid issuer/);
  await assert.rejects(()=>provider.verify(signed({...claims,iat:now-3600,exp:now-600})),/Token used too late/);
  await assert.rejects(()=>provider.verify(signed({...claims,email_verified:false})),/INVALID_GOOGLE_IDENTITY/);
  assert.equal(certificateRequests,7,"all cases use real OAuth2Client verification with local fixture certificates");
});
