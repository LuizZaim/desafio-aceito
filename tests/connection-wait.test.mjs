import test from "node:test";
import assert from "node:assert/strict";
import { createConnectionWait } from "../src/core/connection-wait.ts";
import { createApiClient } from "../src/core/api-client.ts";

test("aviso de conexão permanece até terminar a última requisição lenta", () => {
  const tracker = createConnectionWait(); const states = [];
  const unsubscribe = tracker.subscribe(() => states.push(tracker.snapshot()));
  const first = tracker.begin(), second = tracker.begin();
  first(); first(); assert.equal(tracker.snapshot(), true);
  second(); assert.equal(tracker.snapshot(), false); unsubscribe();
  assert.deepEqual(states, [true, true, true, false]);
});

test("requisição lenta termina o aviso e envia a mutação uma única vez", async () => {
  let finish, notify, calls = 0, ended = 0;
  const started = new Promise((resolve) => { notify = resolve; });
  const request = createApiClient({ baseURL: "https://api.example", getToken: async () => null, slowAfterMs: 1,
    onSlowRequest: () => { notify(); return () => { ended++; }; },
    fetch: async () => { calls++; return new Promise((resolve) => { finish = resolve; }); },
  });
  const result = request("/state", "POST", { action: "send" });
  await started; assert.equal(calls, 1); assert.equal(ended, 0);
  finish(new Response('{"saved":true}')); assert.deepEqual(await result, { saved: true }); assert.equal(ended, 1);
});

test("timeout após mutação avisa para conferir o resultado e não faz retry", async () => {
  let calls = 0;
  const request = createApiClient({ baseURL: "https://api.example", getToken: async () => null, timeoutMs: 5,
    fetch: async (_url, options) => { calls++; return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Error("timeout")))); },
  });
  await assert.rejects(request("/state", "POST", {}), /pode ter sido concluída/); assert.equal(calls, 1);
});
