import { BadRequestException, ConflictException, HttpException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { Database } from "./db";
import type { EmailDelivery } from "./mail";
import { hashPassword, verifyPassword } from "./passwords";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const RECOVERY_CODE = /^[A-Za-z0-9_-]{22}$/;
const REQUEST_MESSAGE = "Se houver uma conta com este e-mail, você receberá as instruções de recuperação.";
const INVALID_TOKEN = "O link é inválido, expirou ou já foi utilizado. Solicite um novo link.";
export class AccountSecurity {
  constructor(private readonly db: Database, private readonly mail: EmailDelivery) {}
  capabilities() { return {passwordRecovery:this.mail.available,emailChange:this.mail.available,passwordChange:true,recoveryCodes:true}; }
  private object(body: any) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestException("Solicitação inválida.");
  }
  private email(value: unknown) {
    if (typeof value !== "string") throw new BadRequestException("Informe um e-mail válido.");
    const email = value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length>254) throw new BadRequestException("Informe um e-mail válido.");
    return email;
  }
  private password(value: unknown) {
    if (typeof value !== "string" || value.length<8 || value.length>128) throw new BadRequestException("A nova senha precisa ter de 8 a 128 caracteres.");
    return value;
  }
  private currentPassword(value: unknown) {
    if (typeof value !== "string" || !value || value.length>128) throw new BadRequestException("Informe sua senha atual.");
    return value;
  }
  private transaction<T>(run: (tx: Database) => Promise<T>): Promise<T> {
    if (!this.db.transaction) throw Error("Banco sem suporte a transações.");
    return this.db.transaction(run);
  }
  private async limit(key: string, max: number) {
    const result = await this.db.query(`INSERT INTO security_rate_limits(key_hash,attempts) VALUES($1,1)
      ON CONFLICT(key_hash) DO UPDATE SET
        attempts=CASE WHEN security_rate_limits.window_started < CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1 ELSE security_rate_limits.attempts+1 END,
        window_started=CASE WHEN security_rate_limits.window_started < CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN CURRENT_TIMESTAMP ELSE security_rate_limits.window_started END
      RETURNING attempts`,[digest(key)]);
    if (result.rows[0].attempts>max) throw new HttpException("Muitas tentativas. Aguarde antes de tentar novamente.",429);
  }
  private link(purpose: string, token: string) {
    const raw = purpose === "reset_password" ? process.env.PASSWORD_RESET_URL || "desafioaceito://recuperar" : process.env.EMAIL_CONFIRMATION_URL || "desafioaceito://confirmar-email";
    let url: URL;
    try { url = new URL(raw); } catch { throw new ServiceUnavailableException("O endereço de recuperação não está configurado corretamente."); }
    if (!["https:","desafioaceito:"].includes(url.protocol)) throw new ServiceUnavailableException("O endereço de recuperação não está configurado corretamente.");
    url.searchParams.set("token",token);
    return url.toString();
  }
  private async issue(tx: Database, user: string, purpose: string, emailTarget?: string) {
    const token = randomBytes(32).toString("base64url");
    await tx.query("UPDATE security_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=$1 AND purpose=$2 AND used_at IS NULL",[user,purpose]);
    await tx.query("INSERT INTO security_tokens(token_hash,user_id,purpose,email_target,expires_at) VALUES($1,$2,$3,$4,CURRENT_TIMESTAMP+INTERVAL '20 minutes')",[digest(token),user,purpose,emailTarget||null]);
    return token;
  }
  private deliver(to: string, purpose: string, token: string) {
    const link = this.link(purpose,token);
    const subject = purpose === "reset_password" ? "Recuperar acesso — Desafio Aceito" : "Confirmar novo e-mail — Desafio Aceito";
    const text = `${purpose === "reset_password" ? "Para escolher uma nova senha" : "Para confirmar a alteração do e-mail da sua conta"}, abra este link em até 20 minutos:\n\n${link}\n\nSe o aplicativo não abrir, copie somente o código após token= e cole na tela correspondente. Se você não solicitou esta alteração, ignore esta mensagem. O link só pode ser utilizado uma vez.`;
    // Delivery runs after issuance; the public response has the same shape and does not wait on a recipient's SMTP timing.
    void this.mail.send({to,subject,text}).catch(async () => {
      try { await this.db.query("UPDATE security_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=$1 AND used_at IS NULL",[digest(token)]); } catch {}
      console.error("Falha na entrega de e-mail de segurança; nenhum detalhe de conta ou código foi registrado.");
    });
  }
  async forgot(body: any) {
    this.object(body);
    const email = this.email(body.email);
    if (!this.mail.available) throw new ServiceUnavailableException("O serviço de e-mail não está configurado. A recuperação por e-mail está indisponível.");
    await this.limit("reset-request:"+email,5);
    // Validate configured destination even for an unknown account.
    this.link("reset_password","configuration-check");
    const issued = await this.transaction(async (tx) => {
      const row = (await tx.query("SELECT id FROM users WHERE email=$1 FOR UPDATE",[email])).rows[0];
      return row ? await this.issue(tx,row.id,"reset_password") : null;
    });
    if (issued) this.deliver(email,"reset_password",issued);
    return {message:REQUEST_MESSAGE};
  }
  private async revoke(tx: Database, user: string) {
    await tx.query("DELETE FROM sessions WHERE user_id=$1",[user]);
    await tx.query("UPDATE security_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=$1 AND used_at IS NULL",[user]);
  }
  async reset(body: any) {
    this.object(body);
    const password = this.password(body.password);
    if (typeof body.token !== "string" || !TOKEN.test(body.token)) throw new BadRequestException(INVALID_TOKEN);
    await this.limit("reset-token:"+digest(body.token),10);
    const hash = await hashPassword(password);
    await this.transaction(async (tx) => {
      const hint = (await tx.query("SELECT user_id FROM security_tokens WHERE token_hash=$1 AND purpose='reset_password'",[digest(body.token)])).rows[0];
      if (!hint) throw new BadRequestException(INVALID_TOKEN);
      await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE",[hint.user_id]);
      const row = (await tx.query("SELECT user_id FROM security_tokens WHERE token_hash=$1 AND purpose='reset_password' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP FOR UPDATE",[digest(body.token)])).rows[0];
      if (!row) throw new BadRequestException(INVALID_TOKEN);
      await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2",[hash,row.user_id]);
      await this.revoke(tx,row.user_id);
    });
    return {message:"Senha alterada. Entre novamente com a nova senha."};
  }
  async account(user: string) {
    const row = (await this.db.query("SELECT id,name,email FROM users WHERE id=$1",[user])).rows[0];
    if (!row) throw new UnauthorizedException("Entre novamente.");
    return {user:row};
  }
  async changePassword(user: string, body: any) {
    this.object(body);
    const current = this.currentPassword(body.currentPassword), next = this.password(body.newPassword);
    await this.limit("change-password:"+user,10);
    const hash = await hashPassword(next);
    await this.transaction(async (tx) => {
      const row = (await tx.query("SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",[user])).rows[0];
      if (!row || !await verifyPassword(current,row.password_hash)) throw new UnauthorizedException("Senha atual inválida.");
      await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2",[hash,user]);
      await this.revoke(tx,user);
    });
    return {message:"Senha alterada. Todas as sessões foram encerradas. Entre novamente."};
  }
  async changeEmail(user: string, body: any) {
    this.object(body);
    const current = this.currentPassword(body.currentPassword), email = this.email(body.newEmail);
    if (!this.mail.available) throw new ServiceUnavailableException("O serviço de e-mail não está configurado. A alteração de e-mail está indisponível.");
    await this.limit("change-email:"+user,5);
    this.link("confirm_email","configuration-check");
    const issued = await this.transaction(async (tx) => {
      const row = (await tx.query("SELECT password_hash,email FROM users WHERE id=$1 FOR UPDATE",[user])).rows[0];
      if (!row || !await verifyPassword(current,row.password_hash)) throw new UnauthorizedException("Senha atual inválida.");
      if (row.email === email) throw new BadRequestException("Informe um endereço diferente do atual.");
      if ((await tx.query("SELECT id FROM users WHERE email=$1",[email])).rows.length) throw new ConflictException("Não foi possível usar este endereço de e-mail.");
      return this.issue(tx,user,"confirm_email",email);
    });
    this.deliver(email,"confirm_email",issued);
    return {message:"Solicitação registrada. Confirme o novo endereço pelo link recebido no e-mail. A conta continua usando o endereço atual até a confirmação."};
  }
  async confirmEmail(body: any) {
    this.object(body);
    if (typeof body.token !== "string" || !TOKEN.test(body.token)) throw new BadRequestException(INVALID_TOKEN);
    await this.limit("confirm-email-token:"+digest(body.token),10);
    try {
      await this.transaction(async (tx) => {
        const hint = (await tx.query("SELECT user_id FROM security_tokens WHERE token_hash=$1 AND purpose='confirm_email'",[digest(body.token)])).rows[0];
        if (!hint) throw new BadRequestException(INVALID_TOKEN);
        await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE",[hint.user_id]);
        const row = (await tx.query("SELECT user_id,email_target FROM security_tokens WHERE token_hash=$1 AND purpose='confirm_email' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP FOR UPDATE",[digest(body.token)])).rows[0];
        if (!row) throw new BadRequestException(INVALID_TOKEN);
        await tx.query("UPDATE users SET email=$1 WHERE id=$2",[row.email_target,row.user_id]);
        await this.revoke(tx,row.user_id);
      });
    } catch (error: any) {
      if (error.code === "23505") throw new ConflictException("Não foi possível usar este endereço de e-mail. Solicite uma nova alteração.");
      throw error;
    }
    return {message:"Novo e-mail confirmado. Entre novamente com o novo endereço."};
  }
  async createRecoveryCodes(user: string, body: any) {
    this.object(body);
    const current = this.currentPassword(body.currentPassword);
    await this.limit("create-recovery-codes:"+user,5);
    const codes = Array.from({length:6},()=>randomBytes(16).toString("base64url"));
    await this.transaction(async (tx) => {
      const row = (await tx.query("SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",[user])).rows[0];
      if (!row || !await verifyPassword(current,row.password_hash)) throw new UnauthorizedException("Senha atual inválida.");
      await tx.query("DELETE FROM account_recovery_codes WHERE user_id=$1",[user]);
      for (const code of codes) await tx.query("INSERT INTO account_recovery_codes(code_hash,user_id) VALUES($1,$2)",[digest(code),user]);
    });
    return {codes,message:"Guarde estes códigos em um local seguro. Eles aparecem somente agora. Cada código funciona uma vez; gerar novos invalida os anteriores."};
  }
  async recoverCode(body: any) {
    this.object(body);
    const email = this.email(body.email), password = this.password(body.password);
    if (typeof body.code !== "string" || !RECOVERY_CODE.test(body.code)) throw new BadRequestException("Código de recuperação inválido ou já utilizado.");
    await this.limit("recovery-code:"+email,10);
    const hash = await hashPassword(password);
    await this.transaction(async (tx) => {
      const user = (await tx.query("SELECT id FROM users WHERE email=$1 FOR UPDATE",[email])).rows[0];
      if (!user) throw new BadRequestException("Código de recuperação inválido ou já utilizado.");
      const code = (await tx.query("SELECT code_hash FROM account_recovery_codes WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL FOR UPDATE",[user.id,digest(body.code)])).rows[0];
      if (!code) throw new BadRequestException("Código de recuperação inválido ou já utilizado.");
      await tx.query("UPDATE account_recovery_codes SET used_at=CURRENT_TIMESTAMP WHERE code_hash=$1",[code.code_hash]);
      await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2",[hash,user.id]);
      await this.revoke(tx,user.id);
    });
    return {message:"Senha recuperada com seu código de uso único. Entre novamente com a nova senha."};
  }
}
