import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import request from "supertest";
import { createApp } from "../src/app";

async function setup() {
  const pg = new PGlite();
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(`migrations/${file}`, "utf8"));
  const db = {
    query: async (sql: string, args?: any[]) => { const r = await pg.query(sql, args); return { rows: r.rows as any[], rowCount: r.affectedRows }; },
    transaction: async (run: any) => pg.transaction(async (tx) => run({ query: async (sql: string, args?: any[]) => { const r = await tx.query(sql, args); return { rows: r.rows, rowCount: r.affectedRows }; } })),
  };
  const app = await createApp(db);
  return { app, http: app.getHttpServer(), close: async () => { await app.close(); await pg.close(); } };
}

test("login com credenciais erradas é limitado a 30 tentativas e devolve 429", async () => {
  const { http, close } = await setup();
  try {
    for (let i = 0; i < 30; i++)
      await request(http).post("/auth/login").send({ email: "x@example.com", password: "errada-123" }).expect(401);
    await request(http).post("/auth/login").send({ email: "x@example.com", password: "errada-123" }).expect(429);
    await request(http).get("/health").expect(200);
  } finally { await close(); }
});

test("rotas protegidas sem token ou com token inválido dão 401; corpo grande é recusado", async () => {
  const { http, close } = await setup();
  try {
    for (const path of ["/state", "/referee", "/teams", "/teams/x", "/account"])
      await request(http).get(path).expect(401);
    await request(http).get("/state").set("Authorization", "Bearer invalido").expect(401);
    await request(http).get("/state").set("Authorization", "Basic abc").expect(401);
    await request(http).post("/auth/logout").expect(401);
    await request(http).post("/auth/register").send({ name: "x".repeat(20000), email: "a@example.com", password: "senha-de-teste-123" }).expect(413);
    await request(http).post("/auth/login").send([]).expect(400);
  } finally { await close(); }
});
