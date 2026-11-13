import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { freshState } from "../../src/core/domain";

test("migração preserva equipe válida sem importar matches fictícios e é reaplicável", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(readFileSync("migrations/001_initial.sql", "utf8"));
    for (const id of ["valid", "incomplete"]) {
      await pg.query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",
        [id, "Organizador " + id, id + "@example.test", "hash-apenas-fixture-sql"]);
      const state = freshState();
      state.teamRegistered = true;
      state.profile = { ...state.profile, name: "União do Bairro", district: "Tatuapé", city: "São Paulo", state: "SP", category: "Masculino", level: "Amador" };
      if (id === "incomplete") { delete state.profile.city; delete state.profile.state; }
      state.matches = ["mooca"];
      state.messages = { mooca: [{ own: true, text: "Conversa fictícia", at: "10:00" }] };
      await pg.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2)", [id, JSON.stringify(state)]);
    }
    const migration = readFileSync("migrations/002_shared_teams.sql", "utf8");
    await pg.exec(migration);
    await pg.exec(migration);
    const teams = await pg.query<any>("SELECT organizer_id,name,city,state FROM teams");
    assert.deepEqual(teams.rows, [{ organizer_id: "valid", name: "União do Bairro", city: "São Paulo", state: "SP" }]);
    for (const table of ["team_matches", "team_interests", "messages"]) {
      const result = await pg.query<any>(`SELECT count(*)::int AS total FROM ${table}`);
      assert.equal(result.rows[0].total, 0);
    }
    const preserved = await pg.query<any>("SELECT data FROM workspaces WHERE user_id=$1", ["incomplete"]);
    assert.equal(preserved.rows[0].data.profile.name, "União do Bairro");
    await assert.rejects(() => pg.query(
      "INSERT INTO team_interests(from_team_id,to_team_id) VALUES($1,$2)", ["team-valid", "missing-team"]),
      /foreign key/i);
    await assert.rejects(() => pg.query(
      "INSERT INTO team_interests(from_team_id,to_team_id) VALUES($1,$1)", ["team-valid"]),
      /check constraint/i);
    await assert.rejects(() => pg.query("UPDATE teams SET state='XX' WHERE organizer_id=$1", ["valid"]), /check constraint/i);
  } finally {
    await pg.close();
  }
});
