import { BadRequestException, ConflictException, HttpException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import type { Database } from "./db";
import type { GoogleIdentityProvider, VerifiedGoogleIdentity } from "./google-identity";
import { hashPassword, verifyPassword } from "./passwords";
const INVALID="Não foi possível validar o acesso com Google. Tente novamente.";
export class GoogleAccount {
  constructor(private readonly db:Database,private readonly provider:GoogleIdentityProvider) {}
  async authenticate(body:any):Promise<{id:string;name:string;email:string}> {
    if (!this.provider.available) throw new ServiceUnavailableException("O acesso com Google ainda não foi configurado para este aplicativo.");
    if (!body || typeof body!=="object" || Array.isArray(body) || typeof body.idToken!=="string" || body.idToken.length<20 || body.idToken.length>12000)
      throw new BadRequestException("Solicitação de acesso com Google inválida.");
    let identity:VerifiedGoogleIdentity;
    try { identity=await this.provider.verify(body.idToken); }
    catch { throw new UnauthorizedException(INVALID); }
    if (!this.db.transaction) throw Error("Banco sem suporte a transações.");
    try {
      return await this.db.transaction(async(tx)=>{
        // Serializes first-time links without locking unrelated users. Order is shared across all requests.
        const keys=["google-email:"+identity.email,"google-sub:"+identity.issuer+":"+identity.sub].sort();
        for(const value of keys) {
          const key=createHash("sha256").update(value).digest();
          await tx.query("SELECT pg_advisory_xact_lock($1,$2)",[key.readInt32BE(0),key.readInt32BE(4)]);
        }
        const linked=(await tx.query(`SELECT u.id,u.name,u.email FROM google_identities g JOIN users u ON u.id=g.user_id
          WHERE g.issuer=$1 AND g.sub=$2 FOR UPDATE OF u,g`,[identity.issuer,identity.sub])).rows[0];
        if(linked) return linked;
        if(body.password===undefined) throw new HttpException("Para concluir o acesso, informe sua senha do aplicativo. Se esta for sua primeira conta, escolha uma senha de 8 a 128 caracteres.",428);
        if(typeof body.password!=="string"||body.password.length<8||body.password.length>128) throw new BadRequestException("Informe uma senha do aplicativo de 8 a 128 caracteres.");
        let user=(await tx.query("SELECT id,name,email,password_hash FROM users WHERE email=$1 FOR UPDATE",[identity.email])).rows[0];
        if(user) {
          if(!await verifyPassword(body.password,user.password_hash)) throw new UnauthorizedException("Não foi possível concluir o vínculo. Confira a senha do aplicativo.");
          if((await tx.query("SELECT id FROM google_identities WHERE user_id=$1",[user.id])).rows.length) throw new ConflictException("Esta conta já possui outro vínculo com Google.");
        } else {
          const passwordHash=await hashPassword(body.password);
          user=(await tx.query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,email",[randomUUID(),identity.name,identity.email,passwordHash])).rows[0];
        }
        await tx.query("INSERT INTO google_identities(id,issuer,sub,user_id) VALUES($1,$2,$3,$4)",[randomUUID(),identity.issuer,identity.sub,user.id]);
        return {id:user.id,name:user.name,email:user.email};
      });
    } catch(error:any) {
      if(error.code==="23505") throw new ConflictException("Os dados de acesso foram atualizados. Tente novamente para concluir o vínculo.");
      throw error;
    }
  }
}
