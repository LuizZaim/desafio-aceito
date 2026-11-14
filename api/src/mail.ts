import nodemailer from "nodemailer";
export type SecurityMail = { to: string; subject: string; text: string };
export interface EmailDelivery {
  readonly available: boolean;
  send(message: SecurityMail): Promise<void>;
}
/** No console/file mail transport: recovery secrets leave the server only through configured TLS SMTP. */
export function createEmailDelivery(env: NodeJS.ProcessEnv = process.env): EmailDelivery {
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
