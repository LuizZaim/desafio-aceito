import nodemailer from "nodemailer";
export type SecurityMail = { to: string; subject: string; text: string };
export interface EmailDelivery {
  readonly available: boolean;
  send(message: SecurityMail): Promise<void>;
}
const unavailable = (): EmailDelivery => ({ available: false, send: async () => { throw Error("EMAIL_UNAVAILABLE"); } });
/** Security mail leaves only through an explicitly configured TLS/HTTPS provider. */
export function createEmailDelivery(env: NodeJS.ProcessEnv = process.env, http: typeof fetch = fetch): EmailDelivery {
  const provider = env.MAIL_PROVIDER?.trim() || "smtp";
  if (provider === "brevo") {
    const key = env.BREVO_API_KEY?.trim(), from = env.MAIL_FROM?.trim();
    if (!key || /[\r\n]/.test(key) || !from || !/^\S+@\S+\.\S+$/.test(from) || /[\r\n]/.test(from)) return unavailable();
    return {
      available: true,
      send: async (message) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await http("https://api.brevo.com/v3/smtp/email", {
            method: "POST", redirect: "error", signal: controller.signal,
            headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify({ sender: { email: from, name: "Desafio Aceito" }, to: [{ email: message.to }], subject: message.subject, textContent: message.text }),
          });
          if (response.status !== 201) throw Error("EMAIL_DELIVERY_FAILED");
          const result = await response.json();
          if (typeof result?.messageId !== "string" || !result.messageId.trim()) throw Error("EMAIL_DELIVERY_FAILED");
        } catch { throw Error("EMAIL_DELIVERY_FAILED"); }
        finally { clearTimeout(timer); }
      },
    };
  }
  if (provider !== "smtp") return unavailable();
  const host = env.SMTP_HOST?.trim(), user = env.SMTP_USER, pass = env.SMTP_PASS, from = env.SMTP_FROM?.trim();
  const secure = env.SMTP_SECURE !== "false", port = Number(env.SMTP_PORT || (secure ? 465 : 587));
  if (!host || !user || !pass || !from || !/^\S+@\S+\.\S+$/.test(from) || /[\r\n]/.test(from) || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { available: false, send: async () => { throw Error("EMAIL_UNAVAILABLE"); } };
  }
  const transport = nodemailer.createTransport({
    host,port,secure,requireTLS:!secure,
    auth:{user,pass},
    tls:{minVersion:"TLSv1.2",rejectUnauthorized:true},
    connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,
    logger:false,debug:false,
  });
  return {
    available:true,
    send:async (message) => {
      const result = await transport.sendMail({from,...message,disableFileAccess:true,disableUrlAccess:true});
      if (!result.accepted?.length) throw Error("EMAIL_DELIVERY_FAILED");
    },
  };
}
