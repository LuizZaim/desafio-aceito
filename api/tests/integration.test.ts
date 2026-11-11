import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";
test("API: cadastro, login, isolamento, match, persistência e exceções", async () => {
  const pg = new PGlite();
  await pg.exec(readFileSync("migrations/001_initial.sql", "utf8"));
  const db = {
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
    await request(http)
      .post("/state")
      .set(auth)
      .send({ version: 0, action: { type: "interest", id: "vila" } })
      .expect(200);
    const saved = await request(http).get("/state").set(auth).expect(200);
    assert.ok(saved.body.state.matches.includes("vila"));
    assert.equal(saved.body.version, 1);
    await request(http)
      .post("/state")
      .set(auth)
      .send({ version: 0, action: { type: "read" } })
      .expect(409);
    await request(http)
      .post("/state")
      .set(auth)
      .send({
        version: 1,
        action: { type: "send", id: "leste", text: "sem match" },
      })
      .expect(400);
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
    assert.ok(!other.body.state.matches.includes("vila"));
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
