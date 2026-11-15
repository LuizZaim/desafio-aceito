import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createServer, type TLSSocket } from "node:tls";

test("SMTP TLS: transporte real entrega em servidor local confiável e recusa certificado não confiável", async () => {
  const directory = mkdtempSync(join(tmpdir(), "desafio-smtp-"));
  const cert = join(directory, "certificate.pem"), key = join(directory, "private-key.pem");
  const sockets = new Set<TLSSocket>();
  let received = "";
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-keyout", key, "-out", cert, "-subj", "/CN=127.0.0.1",
    "-addext", "subjectAltName=IP:127.0.0.1"], { stdio: "ignore" });
  const server = createServer({ key: readFileSync(key), cert: readFileSync(cert), minVersion: "TLSv1.2" }, (socket) => {
    sockets.add(socket); socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.setEncoding("utf8"); socket.write("220 local.test ESMTP\r\n");
    let buffer = "", data = false;
    socket.on("data", (part: string) => {
      buffer += part;
      while (buffer.includes("\r\n")) {
        const end = buffer.indexOf("\r\n"), line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (data) {
          if (line === ".") { data = false; socket.write("250 Message accepted\r\n"); }
          else received += line + "\r\n";
        } else if (/^EHLO /i.test(line)) socket.write("250-local.test\r\n250-AUTH PLAIN\r\n250 SIZE 65536\r\n");
        else if (/^AUTH PLAIN /i.test(line)) socket.write("235 Authentication successful\r\n");
        else if (/^(MAIL FROM|RCPT TO):/i.test(line)) socket.write("250 OK\r\n");
        else if (line === "DATA") { data = true; socket.write("354 End with dot\r\n"); }
        else if (line === "QUIT") { socket.end("221 Bye\r\n"); }
        else socket.write("250 OK\r\n");
      }
    });
  });
  server.on("tlsClientError", () => {});
  const child = (trusted: boolean, port: number) => new Promise<number | null>((resolve, reject) => {
    const env = { ...process.env, SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), SMTP_SECURE: "true",
      SMTP_USER: "local-test", SMTP_PASS: "local-only-test", SMTP_FROM: "sender@example.test", NODE_TLS_REJECT_UNAUTHORIZED: "1" };
    if (trusted) env.NODE_EXTRA_CA_CERTS = cert; else delete env.NODE_EXTRA_CA_CERTS;
    const program = `import {createEmailDelivery} from './src/mail.ts';
      try { await createEmailDelivery().send({to:'recipient@example.test',subject:'Local transport test',text:'security-link-for-local-test'}); process.exit(${trusted ? 0 : 2}); }
      catch { process.exit(${trusted ? 1 : 0}); }`;
    const processChild = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", program], { env, stdio: "ignore" });
    const timeout = setTimeout(() => { processChild.kill(); reject(Error("SMTP local test timed out")); }, 20000);
    processChild.once("error", (error) => { clearTimeout(timeout); reject(error); });
    processChild.once("exit", (code) => { clearTimeout(timeout); resolve(code); });
  });
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address(); assert.ok(address && typeof address !== "string");
    assert.equal(await child(false, address.port), 0, "untrusted certificate must be rejected");
    assert.equal(received, "", "no message may leave through an untrusted TLS server");
    assert.equal(await child(true, address.port), 0, "trusted TLS transport must complete SMTP delivery");
    assert.match(received, /security-link-for-local-test/);
    assert.match(received, /To: recipient@example.test/);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
});
