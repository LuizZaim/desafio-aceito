import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { brazilianStates } from "../../src/core/domain";
import type { Database } from "./db";

/** Professional capabilities belong to the authenticated account, never to a client role flag. */
export class Arbitration {
  constructor(private readonly db: Database) {}
  private project(row: any) {
    return { id: row.id, name: row.name, city: row.city, state: row.state, kind: row.kind, bio: row.bio, available: row.available };
  }
  async snapshot(user: string) {
    const profile = (await this.db.query("SELECT * FROM referees WHERE user_id=$1", [user])).rows[0];
    const professionals = await this.db.query("SELECT * FROM referees ORDER BY name,id LIMIT 200");
    let invites: any[] = [];
    if (profile) invites = (await this.db.query(`SELECT x.id,x.game_id,x.role,x.status,g.status AS game_status,
      a.name AS team_a_name,b.name AS team_b_name,f.name AS field,
      to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD') AS date,
      to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI') AS time
      FROM game_referees x JOIN games g ON g.id=x.game_id JOIN teams a ON a.id=g.team_a_id
      JOIN teams b ON b.id=g.team_b_id JOIN fields f ON f.id=g.field_id
      WHERE x.referee_id=$1 ORDER BY g.starts_at DESC,x.created_at DESC LIMIT 200`, [profile.id])).rows.map((row) => ({
        id: row.id, gameId: row.game_id, role: row.role, status: row.status, gameStatus: row.game_status,
        teamAName: row.team_a_name, teamBName: row.team_b_name, date: row.date, time: row.time, field: row.field,
        canRespond: row.status === "Pendente" && row.game_status === "Confirmada",
      }));
    return { profile: profile ? this.project(profile) : null, professionals: professionals.rows.map((row) => this.project(row)), invites };
  }
  async action(user: string, own: any, action: any): Promise<string> {
    if (["registerReferee","refereeProfile"].includes(action.type)) {
      const valid = (value: unknown, min: number, max: number) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
      if (!valid(action.name,3,100) || !valid(action.city,2,80) || !brazilianStates.includes(action.state) || !["arbitro","bandeirinha"].includes(action.kind) || typeof action.available !== "boolean" || (action.bio !== undefined && !valid(action.bio,0,500))) throw new BadRequestException("Informe nome, cidade, UF, função, disponibilidade e descrição válida de até 500 caracteres.");
      const profile = (await this.db.query("SELECT * FROM referees WHERE user_id=$1 FOR UPDATE", [user])).rows[0];
      if (action.type === "registerReferee" && profile) throw new ConflictException("Você já possui cadastro profissional. Edite seu perfil.");
      if (action.type === "refereeProfile" && !profile) throw new NotFoundException("Cadastre seu perfil profissional primeiro.");
      if (profile) {
        if (profile.kind !== action.kind) {
          const active = await this.db.query("SELECT 1 FROM game_referees x JOIN games g ON g.id=x.game_id WHERE x.referee_id=$1 AND x.status IN ('Pendente','Aceito') AND g.status='Confirmada' LIMIT 1", [profile.id]);
          if (active.rows.length) throw new ConflictException("Responda aos convites e conclua as partidas antes de alterar sua função profissional.");
        }
        await this.db.query("UPDATE referees SET name=$1,city=$2,state=$3,kind=$4,bio=$5,available=$6,updated_at=CURRENT_TIMESTAMP WHERE user_id=$7", [action.name.trim(),action.city.trim(),action.state,action.kind,(action.bio||"").trim(),action.available,user]);
      } else await this.db.query("INSERT INTO referees(id,user_id,name,city,state,kind,bio,available) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [randomUUID(),user,action.name.trim(),action.city.trim(),action.state,action.kind,(action.bio||"").trim(),action.available]);
      return profile ? "Perfil profissional atualizado." : "Perfil profissional cadastrado. Os convites serão vinculados somente à sua conta.";
    }
    if (action.type === "refereeAvailable") {
      if (typeof action.value !== "boolean") throw new BadRequestException("Disponibilidade inválida.");
      const result = await this.db.query("UPDATE referees SET available=$1,updated_at=CURRENT_TIMESTAMP WHERE user_id=$2 RETURNING id", [action.value,user]);
      if (!result.rows.length) throw new NotFoundException("Cadastre seu perfil profissional primeiro.");
      return action.value ? "Disponível para receber convites de arbitragem." : "Indisponível para novos aceites. Atuações já aceitas permanecem no histórico.";
    }
    if (action.type === "inviteReferee") {
      if (!own || !own.active) throw new ForbiddenException("Somente o organizador de uma equipe da partida pode convidar um profissional.");
      if (!["arbitro","bandeirinha1","bandeirinha2"].includes(action.role) || typeof action.refereeId !== "string") throw new BadRequestException("Selecione o profissional e sua função na partida.");
      const professional = (await this.db.query("SELECT * FROM referees WHERE id=$1 FOR UPDATE", [action.refereeId])).rows[0];
      if (!professional) throw new NotFoundException("Profissional não encontrado.");
      const game = (await this.db.query("SELECT * FROM games WHERE id=$1 FOR UPDATE", [typeof action.id === "string" ? action.id : ""])).rows[0];
      if (!game) throw new NotFoundException("Partida não encontrada.");
      if (![game.team_a_id,game.team_b_id].includes(own.id)) throw new ForbiddenException("Você não participa desta partida.");
      if (game.status !== "Confirmada" || new Date(game.starts_at).getTime() <= Date.now()) throw new ConflictException("Convide profissionais somente para partidas confirmadas e futuras.");
      const affiliation = await this.db.query("SELECT 1 FROM teams WHERE organizer_id=$1 AND id IN ($2,$3)", [professional.user_id,game.team_a_id,game.team_b_id]);
      if (affiliation.rows.length) throw new ForbiddenException("O profissional não pode atuar em uma partida da própria equipe.");
      if (!professional.available) throw new ConflictException("Este profissional está indisponível.");
      if ((action.role === "arbitro" ? "arbitro" : "bandeirinha") !== professional.kind) throw new BadRequestException("A função do convite precisa corresponder ao cadastro profissional.");
      const active = await this.db.query("SELECT 1 FROM game_referees WHERE game_id=$1 AND (role=$2 OR referee_id=$3) AND status IN ('Pendente','Aceito')", [game.id,action.role,professional.id]);
      if (active.rows.length) throw new ConflictException("Esta função ou este profissional já possui convite ativo na partida.");
      await this.db.query("INSERT INTO game_referees(id,game_id,referee_id,invited_by_team_id,role) VALUES($1,$2,$3,$4,$5)", [randomUUID(),game.id,professional.id,own.id,action.role]);
      return "Convite enviado à conta do profissional. Somente ele pode aceitar ou recusar.";
    }
    if (action.type === "respondReferee") {
      if (typeof action.accept !== "boolean") throw new BadRequestException("Resposta inválida.");
      const profile = (await this.db.query("SELECT * FROM referees WHERE user_id=$1 FOR UPDATE", [user])).rows[0];
      if (!profile) throw new ForbiddenException("Cadastre seu perfil profissional antes de responder a um convite.");
      const invite = (await this.db.query("SELECT * FROM game_referees WHERE id=$1", [typeof action.id === "string" ? action.id : ""])).rows[0];
      if (!invite) throw new NotFoundException("Convite não encontrado.");
      if (invite.referee_id !== profile.id) throw new ForbiddenException("Este convite pertence a outro profissional.");
      const game = (await this.db.query("SELECT * FROM games WHERE id=$1 FOR UPDATE", [invite.game_id])).rows[0];
      if (invite.status !== "Pendente" || game.status !== "Confirmada") throw new ConflictException("Este convite não está disponível para resposta.");
      if (action.accept) {
        if (!profile.available) throw new ConflictException("Ative sua disponibilidade antes de aceitar o convite.");
        if (new Date(game.starts_at).getTime() <= Date.now()) throw new ConflictException("O horário desta partida já passou.");
        const conflict = await this.db.query(`SELECT 1 FROM game_referees x JOIN games g ON g.id=x.game_id
          WHERE x.referee_id=$1 AND x.status='Aceito' AND g.status='Confirmada' AND g.id<>$2
          AND g.starts_at > $3::timestamptz - INTERVAL '2 hours' AND g.starts_at < $3::timestamptz + INTERVAL '2 hours' LIMIT 1`, [profile.id,game.id,new Date(game.starts_at).toISOString()]);
        if (conflict.rows.length) throw new ConflictException("Há conflito com outra atuação aceita no intervalo de 2 horas.");
      }
      await this.db.query("UPDATE game_referees SET status=$1,responded_at=CURRENT_TIMESTAMP WHERE id=$2", [action.accept?"Aceito":"Recusado",invite.id]);
      return action.accept ? "Atuação aceita. As duas equipes já podem consultar sua confirmação." : "Convite recusado. As equipes podem convidar outro profissional.";
    }
    throw new BadRequestException("Operação de arbitragem inválida.");
  }
}
