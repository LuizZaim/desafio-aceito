import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";
import * as domain from "../src/core/domain.ts";

function adapter(file, dependencies, globals = {}) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (!(name in dependencies)) throw Error(`Unexpected import: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports;
}

for (const platform of ["native SQLite", "web QA"]) {
  test(`${platform}: own team persists separately from demonstration and session`, async () => {
    let open;
    let close = () => {};
    if (platform === "native SQLite") {
      const db = new DatabaseSync(":memory:");
      const sqlite = {
        openDatabaseAsync: async () => ({
          execAsync: async (sql) => db.exec(sql),
          getFirstAsync: async (sql, ...args) => db.prepare(sql).get(...args),
          runAsync: async (sql, ...args) => db.prepare(sql).run(...args),
        }),
      };
      open = () => adapter("../src/storage/database.ts", {
        "expo-sqlite": sqlite, "../core/domain": domain,
      });
      close = () => db.close();
    } else {
      const rows = new Map();
      const localStorage = {
        getItem: (key) => rows.get(key) ?? null,
        setItem: (key, value) => rows.set(key, value),
      };
      open = () => adapter("../src/storage/database.web.ts", {
        "../core/domain": domain,
      }, { localStorage });
    }
    try {
      let storage = open();
      assert.equal(await storage.getLocalSession(), false);
      assert.equal(await storage.hasLocalTeam(), false);
      assert.equal((await storage.loadState("team-local-v1")).teamRegistered, false);
      const created = domain.transition(domain.freshState(), {
        type: "registerTeam", name: "União do Bairro", district: "Tatuapé",
        city: "São Paulo", state: "SP", category: "Masculino", level: "Amador", bio: "",
      }).state;
      await storage.saveState(created, "team-local-v1");
      await storage.setLocalSession(true);
      storage = open(); // Reopen adapter with the persisted underlying storage.
      assert.equal(await storage.getLocalSession(), true);
      assert.equal(await storage.hasLocalTeam(), true);
      assert.equal((await storage.loadState("team-local-v1")).profile.name, "União do Bairro");
      const demo = await storage.loadState();
      assert.equal(demo.profile.name, "FutTech FC");
      demo.profile.name = "Demo alterada";
      await storage.saveState(demo);
      const saved = await storage.loadState("team-local-v1");
      assert.equal(saved.profile.name, "União do Bairro");
      const edited = domain.transition(saved, {
        type: "profile", ...saved.profile, bio: "Jogamos aos domingos.",
      }).state;
      await storage.saveState(edited, "team-local-v1");
      await storage.setLocalSession(false);
      storage = open();
      assert.equal(await storage.getLocalSession(), false);
      assert.equal((await storage.loadState("team-local-v1")).profile.bio, "Jogamos aos domingos.");
      assert.equal((await storage.loadState()).profile.name, "Demo alterada");

      // Classroom mode uses the owner's fresh profile with explicitly fictional opponents.
      let own = await storage.loadState("team-local-v1");
      assert.deepEqual(Array.from(own.matches), []);
      assert.deepEqual(Array.from(own.games), []);
      own = domain.transition(own, { type: "interest", id: "vila" }).state;
      assert.deepEqual(own.matches, ["vila"]);
      own = domain.transition(own, { type: "send", id: "vila", text: "Vamos testar um amistoso?" }).state;
      own = domain.transition(own, {
        type: "schedule", id: "vila", date: domain.dateAfter(5), time: "14:00",
        field: domain.fields[0], home: own.profile.name,
      }).state;
      const game = own.games[0].id;
      own = domain.transition(own, { type: "pay", id: game }).state;
      assert.equal(own.games[0].payment, "Simulada");
      assert.equal(own.games[0].status, "Confirmada");
      await storage.saveState(own, "team-local-v1");
      await storage.setLocalSession(true);
      storage = open();
      const resumed = await storage.loadState("team-local-v1");
      assert.equal(resumed.profile.name, "União do Bairro");
      assert.equal(resumed.messages.vila[0].text, "Vamos testar um amistoso?");
      assert.equal(resumed.games[0].id, game);
      assert.equal(resumed.games[0].payment, "Simulada");
      const isolatedDemo = await storage.loadState();
      assert.equal(isolatedDemo.profile.name, "Demo alterada");
      assert.ok(!isolatedDemo.games.some((row) => row.id === game));
      assert.ok(!isolatedDemo.matches.includes("vila"));
    } finally {
      close();
    }
  });
}
