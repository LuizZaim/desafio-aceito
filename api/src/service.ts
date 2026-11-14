import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  randomUUID,
  randomBytes,
  createHash,
} from "node:crypto";
import { Network } from "./network";
import { Arbitration } from "./arbitration";
import { AccountSecurity } from "./account-security";
import { createEmailDelivery, type EmailDelivery } from "./mail";
import { hashPassword, verifyPassword } from "./passwords";
import type { Database } from "./db";
const digest = (x: string) => createHash("sha256").update(x).digest("hex");
export class Service {
  private readonly security: AccountSecurity;
  constructor(private db: Database, mail: EmailDelivery = createEmailDelivery()) { this.security = new AccountSecurity(db,mail); }
  capabilities() { return this.security.capabilities(); }
  forgot(body: any) { return this.security.forgot(body); }
  reset(body: any) { return this.security.reset(body); }
  account(user: string) { return this.security.account(user); }
  changePassword(user: string, body: any) { return this.security.changePassword(user,body); }
  changeEmail(user: string, body: any) { return this.security.changeEmail(user,body); }
  confirmEmail(body: any) { return this.security.confirmEmail(body); }
  createRecoveryCodes(user: string, body: any) { return this.security.createRecoveryCodes(user,body); }
  recoverCode(body: any) { return this.security.recoverCode(body); }
  async register(body: any) {
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new BadRequestException("Solicitação inválida.");
    const email = String(body.email || "")
        .trim()
        .toLowerCase(),
      name = String(body.name || "").trim(),
      password = String(body.password || "");
    if (
      !/^\S+@\S+\.\S+$/.test(email) ||
      email.length > 254 ||
      name.length < 3 ||
      name.length > 100 ||
      password.length < 8 ||
      password.length > 128
    )
      throw new BadRequestException(
        "Informe nome, e-mail válido e senha de 8 a 128 caracteres.",
      );
    const hash = await hashPassword(password);
    let row;
    try {
      row = await this.db.query(
        "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,email",
        [randomUUID(), name, email, hash],
      );
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException("Já existe uma conta com este e-mail.");
      throw e;
    }
    return this.session(row.rows[0]);
  }
  async login(body: any) {
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new BadRequestException("Solicitação inválida.");
    const email = String(body.email || "")
        .trim()
        .toLowerCase(),
      password = String(body.password || "");
    if (password.length > 128)
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    const result = await this.db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    const valid = await verifyPassword(password,user?.password_hash);
    if (!user || !valid) throw new UnauthorizedException("E-mail ou senha inválidos.");
    return this.session({ id: user.id, name: user.name, email: user.email });
  }
  private async session(user: any) {
    const token = randomBytes(32).toString("base64url");
    await this.db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
      [
        digest(token),
        user.id,
        new Date(Date.now() + 7 * 86400000).toISOString(),
      ],
    );
    return { token, user };
  }
  async authenticate(token: string) {
    if (!token || token.length > 256)
      throw new UnauthorizedException("Faça login para continuar.");
    const result = await this.db.query(
      "SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at > CURRENT_TIMESTAMP",
      [digest(token)],
    );
    if (!result.rows[0])
      throw new UnauthorizedException("Sua sessão expirou. Entre novamente.");
    return result.rows[0].user_id as string;
  }
  async logout(token: string) {
    await this.db.query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  }
  async getState(user: string) { return new Network(this.db).state(user); }
  async update(user: string, body: any) { return new Network(this.db).update(user, body); }
  async referee(user: string) { return new Arbitration(this.db).snapshot(user); }
  async teams(user: string) { return new Network(this.db).catalog(user); }
  async team(user: string, id: string) { return new Network(this.db).publicProfile(user, id); }
}
