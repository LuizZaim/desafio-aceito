import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmailDelivery } from "../src/mail";
const env = { MAIL_PROVIDER: "brevo", BREVO_API_KEY: "local-test-key", MAIL_FROM: "sender@example.test" };
const message = { to: "recipient@example.test", subject: "Recovery test", text: "local-test-token" };

test("e-mail HTTPS usa host fixo, não segue redirects e exige confirmação do provedor", async () => {
  const calls: any[] = [];
  const delivery = createEmailDelivery(env, (async (url, options) => {
    calls.push({ url, options }); return new Response('{"messageId":"local-only"}', { status: 201 });
  }) as typeof fetch);
  assert.equal(delivery.available, true); await delivery.send(message);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(calls[0].options.redirect, "error");
  assert.equal(calls[0].options.headers["api-key"], env.BREVO_API_KEY);
  assert.deepEqual(JSON.parse(calls[0].options.body), { sender: { email: env.MAIL_FROM, name: "Desafio Aceito" }, to: [{ email: message.to }], subject: message.subject, textContent: message.text });
});

test("erro/quota/resposta inválida HTTPS não vaza tokens nem repete o envio", async () => {
  for (const [status, body] of [[429, "provider-secret"], [500, "provider-secret"], [302, "redirect"], [201, "{}"], [201, "invalid-json"]] as const) {
    let calls = 0;
    const delivery = createEmailDelivery(env, (async () => { calls++; return new Response(body, { status }); }) as typeof fetch);
    await assert.rejects(delivery.send(message), (failure: Error) => { assert.equal(failure.message, "EMAIL_DELIVERY_FAILED"); return true; });
    assert.equal(calls, 1);
  }
});

test("configuração HTTPS incompleta ou desconhecida fica indisponível, sem fallback SMTP", async () => {
  for (const bad of [{ ...env, BREVO_API_KEY: "" }, { ...env, MAIL_FROM: "sender@example.test\r\nBcc:other@example.test" }, { ...env, MAIL_PROVIDER: "unknown" }]) {
    let calls = 0;
    const delivery = createEmailDelivery(bad, (async () => { calls++; throw Error("unexpected"); }) as typeof fetch);
    assert.equal(delivery.available, false); await assert.rejects(delivery.send(message), /UNAVAILABLE/); assert.equal(calls, 0);
  }
});
