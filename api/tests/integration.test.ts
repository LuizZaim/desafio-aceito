import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";
test("API: cadastro, login, isolamento, match, persistência e exceções", async () => {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    transaction: async (run: any) => pg.transaction(async (tx) => run({query: async (sql: string, args?: any[]) => { const r = await tx.query(sql,args); return {rows:r.rows,rowCount:r.affectedRows}; }})),
    query: async (sql: string, args?: any[]) => {
      const result = await pg.query(sql, args);
      return { rows: result.rows as any[], rowCount: result.affectedRows };
    },
  };
  const app = await createApp(db);
  const http = app.getHttpServer();
  try {
    await request(http).get("/health").expect(200);
    await request(http).post("/auth/login").set("Content-Type","application/json").send("{").expect(400);
    await request(http).get("/state").expect(401);
    await request(http)
      .post("/auth/register")
      .send({ name: "A", email: "inválido", password: "1" })
      .expect(400);
    const user = await request(http)
      .post("/auth/register")
      .send({
        name: "Luiz Zaim",
        email: "luiz@example.com",
        password: "senha-de-teste-123",
      })
      .expect(201);
    const token = user.body.token;
    assert.ok(token);
    await request(http)
      .post("/auth/register")
      .send({
        name: "Luiz Zaim",
        email: "luiz@example.com",
        password: "senha-de-teste-123",
      })
      .expect(409);
    await request(http)
      .post("/auth/login")
      .send({ email: "' OR 1=1 --", password: "errada" })
      .expect(401);
    const login = await request(http)
      .post("/auth/login")
      .send({ email: "luiz@example.com", password: "senha-de-teste-123" })
      .expect(200);
    assert.ok(login.body.token);
    const auth = { Authorization: `Bearer ${token}` };
    const initial = await request(http).get("/state").set(auth).expect(200);
    assert.equal(initial.body.version, 0);
    assert.equal(initial.body.state.teamRegistered, false);
    assert.equal(initial.body.state.profile.name, "");
    assert.deepEqual(initial.body.state.games, []);
    assert.deepEqual(initial.body.state.matches, []);
    await request(http).post("/state").set(auth)
      .send({ version: 0, action: { type: "interest", id: "vila" } }).expect(403);
    const team = {
      type: "registerTeam", name: "Tatuapé FC", district: "Tatuapé",
      city: "São Paulo", state: "SP", category: "Masculino", level: "Amador",
      bio: "Futebol aos domingos",
    };
    await request(http).post("/state").set(auth)
      .send({ version: 0, action: { ...team, state: "XX" } }).expect(400);
    await request(http).post("/state").set(auth)
      .send({ version: 0, action: team }).expect(200);
    const registered = await request(http).get("/state").set(auth).expect(200);
    assert.equal(registered.body.state.teamRegistered, true);
    assert.equal(registered.body.state.profile.name, "Tatuapé FC");
    assert.equal(registered.body.state.profile.city, "São Paulo");
    assert.deepEqual(registered.body.state.games, []);
    await request(http).post("/state").set(auth)
      .send({ version: 1, action: team }).expect(400);
    const reloggedState = await request(http).get("/state")
      .set("Authorization", `Bearer ${login.body.token}`).expect(200);
    assert.deepEqual(reloggedState.body.state, registered.body.state);

    await request(http).post("/state").set(auth)
      .send({version:1,action:{type:"interest",id:"vila"}}).expect(404);
    const saved = await request(http).get("/state").set(auth).expect(200);
    assert.deepEqual(saved.body.state.matches, []);
    assert.equal(saved.body.version, 1);
    await request(http).post("/state").set(auth)
      .send({version:0,action:{type:"read"}}).expect(409);
    const another = await request(http)
      .post("/auth/register")
      .send({
        name: "Outra Pessoa",
        email: "outra@example.com",
        password: "outra-senha-123",
      })
      .expect(201);
    const other = await request(http)
      .get("/state")
      .set("Authorization", `Bearer ${another.body.token}`)
      .expect(200);
    assert.deepEqual(other.body.state.matches, []);
    assert.deepEqual(other.body.state.games, []);
    assert.equal(other.body.state.profile.name, "");
    assert.equal(other.body.state.teamRegistered, false);
    await request(http).post("/state").set(auth)
      .send({ version: 1, action: { ...team, type: "profile", name: "Tatuapé Unido" } })
      .expect(200);
    const edited = await request(http).get("/state").set(auth).expect(200);
    assert.equal(edited.body.state.profile.name, "Tatuapé Unido");
    const hashes = await pg.query<any>("SELECT password_hash FROM users");
    assert.ok(
      hashes.rows.every((r) => !r.password_hash.includes("senha-de-teste")),
    );
    await request(http).post("/auth/logout").set(auth).expect(204);
    await request(http).get("/state").set(auth).expect(401);
    await assert.rejects(() =>
      pg.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2)", [
        "missing",
        "{}",
      ]),
    );
  } finally {
    await app.close();
    await pg.close();
  }
});
