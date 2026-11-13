import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { freshState, transition, type State } from "../../src/core/domain";
import type { Database } from "./db";

/** Shared entities are authoritative. Client workspaces never grant ownership or matches. */
export class Network {
  constructor(private readonly db: Database) {}
  private async own(user: string) {
    return (await this.db.query("SELECT * FROM teams WHERE organizer_id=$1", [user])).rows[0];
  }
  private publicTeam(row: any, reciprocal = false) {
    return {
      id: row.id, name: row.name,
      short: row.name.split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase(),
      color: "#28745d", district: row.district, city: row.city, state: row.state,
      distance: null, level: row.level, category: row.category,
      rating: 0, games: 0, bio: row.bio, reciprocal, active: row.active,
    };
  }
  async catalog(user: string) {
    const own = await this.own(user);
    const result = await this.db.query(
      `SELECT t.*, EXISTS(SELECT 1 FROM team_interests i WHERE i.from_team_id=t.id AND i.to_team_id=$1) AS reciprocal
       FROM teams t WHERE t.id<>$1 AND (
         (t.active=TRUE AND (
           t.id IN (SELECT id FROM teams WHERE active=TRUE AND id<>$1 ORDER BY name,id LIMIT 200)
           OR EXISTS(SELECT 1 FROM team_matches m WHERE m.active=TRUE AND ((m.team_a_id=$1 AND m.team_b_id=t.id) OR (m.team_b_id=$1 AND m.team_a_id=t.id)))
         ))
         OR EXISTS(SELECT 1 FROM games g WHERE (g.team_a_id=$1 AND g.team_b_id=t.id) OR (g.team_b_id=$1 AND g.team_a_id=t.id))
       ) ORDER BY t.name,t.id`,
      [own?.id || ""],
    );
    return { teams: result.rows.map((t) => this.publicTeam(t, t.reciprocal)), currentTeamId: own?.id || null };
  }
  async publicProfile(user: string, id: string) {
    const own = await this.own(user);
    const row = (await this.db.query(`SELECT t.* FROM teams t WHERE t.id=$1 AND (t.active=TRUE
      OR EXISTS(SELECT 1 FROM games g WHERE (g.team_a_id=$2 AND g.team_b_id=t.id) OR (g.team_b_id=$2 AND g.team_a_id=t.id)))`, [id, own?.id || ""])).rows[0];
    if (!row) throw new NotFoundException("Equipe não encontrada.");
    return this.publicTeam(row);
  }
  async state(user: string) {
    await this.db.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING", [user, JSON.stringify(freshState())]);
    const record = (await this.db.query("SELECT data,version FROM workspaces WHERE user_id=$1", [user])).rows[0];
    const own = await this.own(user), baseline = freshState();
    const state: State = { ...baseline, settings: { ...baseline.settings, ...record.data.settings }, skipped: Array.isArray(record.data.skipped) ? record.data.skipped : [] };
    if (!own) {
      const draft = record.data.teamDraft || record.data.profile;
      if (draft && typeof draft === "object") {
        for (const key of ["name","district","city","state","category","level","bio"] as const)
          if (typeof draft[key] === "string") state.profile[key] = draft[key];
      }
    }
    if (own) {
      state.teamRegistered = true;
      state.deleted = !own.active;
      state.profile = { name: own.name, district: own.district, city: own.city, state: own.state, category: own.category, level: own.level, bio: own.bio, role: "organizador", available: true };
      const [interests, matches, messages, notifications, reports, games] = await Promise.all([
        this.db.query("SELECT to_team_id FROM team_interests WHERE from_team_id=$1", [own.id]),
        this.db.query("SELECT id,team_a_id,team_b_id FROM team_matches WHERE active=TRUE AND (team_a_id=$1 OR team_b_id=$1) ORDER BY created_at,id", [own.id]),
        this.db.query(`SELECT m.*, CASE WHEN x.team_a_id=$1 THEN x.team_b_id ELSE x.team_a_id END AS other_team FROM messages m JOIN team_matches x ON x.id=m.match_id WHERE x.active=TRUE AND (x.team_a_id=$1 OR x.team_b_id=$1) ORDER BY m.created_at DESC,m.id DESC LIMIT 500`, [own.id]),
        this.db.query("SELECT id,text,read FROM notifications WHERE team_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100", [own.id]),
        this.db.query("SELECT reported_team_id,reason FROM team_reports WHERE reporter_team_id=$1 ORDER BY created_at", [own.id]),
        this.db.query(`SELECT g.*,f.name AS field_name,h.name AS home_name,
          to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD') AS game_date,
          to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI') AS game_time
          FROM games g JOIN fields f ON f.id=g.field_id JOIN teams h ON h.id=g.home_team_id
          WHERE g.team_a_id=$1 OR g.team_b_id=$1 ORDER BY g.starts_at DESC,g.id`, [own.id]),
      ]);
      state.interests = interests.rows.map((r) => r.to_team_id);
      state.matches = matches.rows.map((r) => r.team_a_id === own.id ? r.team_b_id : r.team_a_id);
      for (const id of state.matches) state.messages[id] = [];
      for (const row of messages.rows.reverse()) (state.messages[row.other_team] ??= []).push({ text: row.text, own: row.sender_team_id === own.id, at: new Date(row.created_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) });
      state.games = games.rows.map((g) => ({
        id: g.id, team: g.team_a_id === own.id ? g.team_b_id : g.team_a_id,
        date: g.game_date, time: g.game_time, field: g.field_name, home: g.home_name,
        status: g.status, payment: g.status === "Cancelada" ? "Não cobrada" : "Pendente",
        referee: "Pendente", proposerId: g.proposer_team_id,
        canRespond: g.status === "Aguardando adversário" && g.proposer_team_id !== own.id,
        canWeatherAgree: g.status === "Clima: aguardando acordo" && g.weather_requested_by !== own.id,
        ...(g.reason ? { reason: g.reason } : {}),
      }));
      state.notifications = notifications.rows;
      state.reports = reports.rows.map((r) => ({ team: r.reported_team_id, reason: r.reason }));
    }
    return { state, version: record.version as number, ...await this.catalog(user) };
  }
  async update(user: string, body: any): Promise<any> {
    if (!body || !Number.isInteger(body.version) || body.version < 0 || !body.action || typeof body.action !== "object" || Array.isArray(body.action)) throw new BadRequestException("Solicitação inválida.");
    if (!this.db.transaction) throw new Error("Banco sem suporte a transações.");
    return this.db.transaction(async (tx) => new Network(tx).write(user, body));
  }
  private async write(user: string, body: any) {
    const action = body.action, own = await this.own(user);
    // Lock both game participants before the game and workspace, in a fixed order.
    // Notification FK checks must not acquire the opponent's team lock out of order.
    if (own) {
      let ids = [own.id, typeof action.id === "string" ? action.id : ""];
      if (["acceptProposal","rejectProposal","cancel","weatherAgree"].includes(action.type)) {
        const game = (await this.db.query("SELECT team_a_id,team_b_id FROM games WHERE id=$1", [ids[1]])).rows[0];
        if (game && [game.team_a_id,game.team_b_id].includes(own.id)) ids = [game.team_a_id,game.team_b_id];
      }
      await this.db.query("SELECT id FROM teams WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE", [ids]);
    }
    await this.db.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING", [user, JSON.stringify(freshState())]);
    const record = (await this.db.query("SELECT version FROM workspaces WHERE user_id=$1 FOR UPDATE", [user])).rows[0];
    if (record.version !== body.version) throw new ConflictException("Os dados foram atualizados em outra sessão. Atualize e tente novamente.");
    const previous = await this.state(user), state = previous.state;
    if (state.deleted && action.type !== "restore") throw new ForbiddenException("Sua equipe está desativada. Restaure-a nas configurações.");
    let message = "Alterações salvas.";
    if (["registerTeam", "profile"].includes(action.type)) {
      let result;
      try { result = transition(state, action); } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : "Dados da equipe inválidos."); }
      const p = result.state.profile;
      if (action.type === "registerTeam") await this.db.query("INSERT INTO teams(id,organizer_id,name,district,city,state,category,level,bio) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [randomUUID(), user, p.name, p.district, p.city, p.state, p.category, p.level, p.bio]);
      else await this.db.query("UPDATE teams SET name=$1,district=$2,city=$3,state=$4,category=$5,level=$6,bio=$7,updated_at=CURRENT_TIMESTAMP WHERE organizer_id=$8", [p.name, p.district, p.city, p.state, p.category, p.level, p.bio, user]);
      message = result.message;
    } else if (["interest", "send", "unmatch", "skip", "report"].includes(action.type)) {
      if (!own || !own.active) throw new ForbiddenException("Cadastre sua equipe antes de buscar adversários.");
      const id = typeof action.id === "string" ? action.id : "";
      if (id === own.id) throw new BadRequestException("Selecione outra equipe.");
      const other = (await this.db.query("SELECT id,name FROM teams WHERE id=$1 AND active=TRUE", [id])).rows[0];
      if (!other) throw new NotFoundException("Equipe não encontrada.");
      const [a, b] = [own.id, id].sort();
      const match = (await this.db.query("SELECT id FROM team_matches WHERE team_a_id=$1 AND team_b_id=$2 AND active=TRUE", [a, b])).rows[0];
      if (action.type === "interest") {
        await this.db.query("INSERT INTO team_interests(from_team_id,to_team_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [own.id, id]);
        const reciprocal = (await this.db.query("SELECT 1 FROM team_interests WHERE from_team_id=$1 AND to_team_id=$2", [id, own.id])).rows.length > 0;
        if (reciprocal) {
          const created = await this.db.query("INSERT INTO team_matches(id,team_a_id,team_b_id) VALUES($1,$2,$3) ON CONFLICT(team_a_id,team_b_id) DO UPDATE SET active=TRUE,created_at=CURRENT_TIMESTAMP WHERE team_matches.active=FALSE RETURNING id", [randomUUID(), a, b]);
          if (created.rows.length) { await this.notify(own.id, `É match! Você e ${other.name} demonstraram interesse.`); await this.notify(id, `É match! Você e ${own.name} demonstraram interesse.`); }
          message = "É match! A conversa entre as duas equipes está liberada.";
        } else message = "Interesse enviado. A conversa será liberada quando a outra equipe também demonstrar interesse.";
      } else if (action.type === "send") {
        if (!match) throw new ForbiddenException("O chat exige interesse mútuo entre as equipes.");
        if (typeof action.text !== "string" || !action.text.trim() || action.text.trim().length > 1000) throw new BadRequestException("Digite uma mensagem de até 1000 caracteres.");
        await this.db.query("INSERT INTO messages(id,match_id,sender_team_id,text) VALUES($1,$2,$3,$4)", [randomUUID(), match.id, own.id, action.text.trim()]);
        await this.notify(id, `Nova mensagem de ${own.name}.`);
        message = "Mensagem enviada.";
      } else if (action.type === "unmatch") {
        if (!match) throw new NotFoundException("Match não encontrado.");
        const active = await this.db.query("SELECT 1 FROM games WHERE match_id=$1 AND status<>'Cancelada' LIMIT 1", [match.id]);
        if (active.rows.length) throw new ConflictException("Cancele a partida ativa antes de encerrar o match.");
        await this.db.query("UPDATE team_matches SET active=FALSE WHERE id=$1", [match.id]);
        await this.db.query("DELETE FROM team_interests WHERE (from_team_id=$1 AND to_team_id=$2) OR (from_team_id=$2 AND to_team_id=$1)", [own.id, id]);
        message = "Match encerrado para as duas equipes.";
      } else if (action.type === "skip") { state.skipped = [...new Set([...state.skipped, id])]; message = "Equipe pulada."; }
      else {
        if (typeof action.reason !== "string" || action.reason.trim().length < 10 || action.reason.trim().length > 500) throw new BadRequestException("Descreva a denúncia com 10 a 500 caracteres.");
        await this.db.query("INSERT INTO team_reports(id,reporter_team_id,reported_team_id,reason) VALUES($1,$2,$3,$4)", [randomUUID(), own.id, id, action.reason.trim()]);
        message = "Denúncia registrada no servidor. O atendimento por uma equipe de moderação ainda não está disponível.";
      }
    } else if (["schedule", "acceptProposal", "rejectProposal", "cancel", "weatherAgree"].includes(action.type)) {
      if (!own || !own.active) throw new ForbiddenException("Cadastre sua equipe antes de agendar.");
      message = await this.gameAction(own, action);
    } else if (action.type === "read") { if (own) await this.db.query("UPDATE notifications SET read=TRUE WHERE team_id=$1", [own.id]); }
    else if (action.type === "settings") {
      if (![action.push, action.email, action.dark].every((v) => typeof v === "boolean")) throw new BadRequestException("Preferências inválidas.");
      state.settings = { push: action.push, email: action.email, dark: action.dark };
    } else if (action.type === "resetDiscovery") state.skipped = [];
    else if (["delete", "restore"].includes(action.type)) {
      if (!own) throw new BadRequestException("Cadastre sua equipe primeiro.");
      await this.db.query("UPDATE teams SET active=$1,updated_at=CURRENT_TIMESTAMP WHERE organizer_id=$2", [action.type === "restore", user]);
      if (action.type === "delete") {
        const active = await this.db.query("SELECT 1 FROM games WHERE (team_a_id=$1 OR team_b_id=$1) AND status<>'Cancelada' LIMIT 1", [own.id]);
        if (active.rows.length) throw new ConflictException("Cancele as partidas ativas antes de desativar a equipe.");
        await this.db.query("UPDATE team_matches SET active=FALSE WHERE team_a_id=$1 OR team_b_id=$1", [own.id]);
        await this.db.query("DELETE FROM team_interests WHERE from_team_id=$1 OR to_team_id=$1", [own.id]);
      }
      message = action.type === "restore" ? "Equipe restaurada." : "Equipe desativada e retirada da descoberta. O histórico foi preservado.";
    } else if (["role", "available"].includes(action.type)) throw new ForbiddenException("O cadastro e a habilitação de profissionais de arbitragem ainda não estão disponíveis no modo conectado.");
    else if (["pay", "result", "review", "referee"].includes(action.type)) throw new ConflictException("Pagamento, resultado, avaliação e arbitragem ainda não estão disponíveis no modo conectado. A confirmação exige a integração real da caução; nenhum pagamento foi cobrado.");
    else throw new BadRequestException("Operação desconhecida.");
    // Retain preferences only. Never trust client-supplied ownership, matches or conversations.
    await this.db.query("UPDATE workspaces SET data=$1,version=version+1 WHERE user_id=$2", [JSON.stringify({ settings: state.settings, skipped: state.skipped, ...(!own ? { teamDraft: state.profile } : {}) }), user]);
    return { ...await this.state(user), message };
  }
  private async gameAction(own: any, action: any): Promise<string> {
    if (action.type === "schedule") {
      const id = typeof action.id === "string" ? action.id : "";
      if (id === own.id) throw new BadRequestException("Selecione outra equipe.");
      const other = (await this.db.query("SELECT * FROM teams WHERE id=$1 AND active=TRUE", [id])).rows[0];
      if (!other) throw new NotFoundException("Equipe não encontrada.");
      const [a,b] = [own.id,other.id].sort();
      const match = (await this.db.query("SELECT id FROM team_matches WHERE team_a_id=$1 AND team_b_id=$2 AND active=TRUE", [a,b])).rows[0];
      if (!match) throw new ForbiddenException("Agende somente com equipes com match.");
      if (typeof action.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(action.date) || typeof action.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(action.time)) throw new BadRequestException("Data ou horário inválido.");
      const start = new Date(`${action.date}T${action.time}:00-03:00`);
      if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now() || new Date(`${action.date}T12:00:00Z`).toISOString().slice(0,10) !== action.date) throw new BadRequestException("Escolha uma data e um horário futuros válidos.");
      const name = typeof action.field === "string" ? action.field.trim().replace(/\s+/g," ") : "";
      if (name.length < 3 || name.length > 100) throw new BadRequestException("Informe o local com 3 a 100 caracteres.");
      let home: string;
      if (action.home === own.id || action.home === own.name) home = own.id;
      else if (action.home === other.id || action.home === other.name) home = other.id;
      else throw new BadRequestException("Selecione o mando de campo.");
      const field = (await this.db.query("INSERT INTO fields(id,name,normalized_key) VALUES($1,$2,$3) ON CONFLICT(normalized_key) DO UPDATE SET normalized_key=EXCLUDED.normalized_key RETURNING id", [randomUUID(),name,name.toLocaleLowerCase("pt-BR")])).rows[0];
      // The field row serializes proposals sharing a place, even with disjoint teams.
      await this.db.query("SELECT id FROM fields WHERE id=$1 FOR UPDATE",[field.id]);
      const conflict = await this.db.query(`SELECT 1 FROM games WHERE status<>'Cancelada'
        AND starts_at > $1::timestamptz - INTERVAL '2 hours' AND starts_at < $1::timestamptz + INTERVAL '2 hours'
        AND (team_a_id IN ($2,$3) OR team_b_id IN ($2,$3) OR field_id=$4) LIMIT 1`,[start.toISOString(),own.id,other.id,field.id]);
      if (conflict.rows.length) throw new ConflictException("Há conflito de horário entre as equipes ou o local (intervalo de 2 horas).");
      await this.db.query("INSERT INTO games(id,match_id,team_a_id,team_b_id,proposer_team_id,home_team_id,field_id,starts_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),match.id,a,b,own.id,home,field.id,start.toISOString()]);
      await this.notify(other.id,`Nova proposta de amistoso de ${own.name}. Aceite ou recuse na agenda.`);
      return "Proposta enviada. A outra equipe precisa aceitar antes da etapa de caução. O local informado ainda não possui reserva externa.";
    }
    const id = typeof action.id === "string" ? action.id : "";
    const game = (await this.db.query("SELECT * FROM games WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if (!game) throw new NotFoundException("Partida não encontrada.");
    if (![game.team_a_id,game.team_b_id].includes(own.id)) throw new ForbiddenException("Você não participa desta partida.");
    const other = game.team_a_id === own.id ? game.team_b_id : game.team_a_id;
    let status: string, message: string, reason: string | null = game.reason, weatherBy: string | null = game.weather_requested_by;
    if (["acceptProposal","rejectProposal"].includes(action.type)) {
      if (game.status !== "Aguardando adversário") throw new ConflictException("Esta proposta não está aguardando resposta.");
      if (game.proposer_team_id === own.id) throw new ForbiddenException("Somente a equipe adversária pode responder à proposta.");
      if (action.type === "acceptProposal" && new Date(game.starts_at).getTime() <= Date.now()) throw new ConflictException("A data da proposta já passou. Recuse e envie uma nova proposta.");
      status = action.type === "acceptProposal" ? "Aguardando caução" : "Cancelada";
      message = action.type === "acceptProposal" ? "Proposta aceita pelas duas equipes. Aguarda a integração da caução para confirmação; nenhum valor foi cobrado." : "Proposta recusada. Nenhum valor foi cobrado.";
      if (action.type === "rejectProposal") reason = "Proposta recusada pela equipe adversária.";
    } else if (action.type === "cancel") {
      if (game.status === "Cancelada") throw new ConflictException("Esta partida já foi cancelada.");
      if (typeof action.reason !== "string" || !action.reason.trim() || action.reason.trim().length > 250) throw new BadRequestException("Informe o motivo com até 250 caracteres.");
      reason = action.reason.trim();
      if (action.weather === true) {
        if (game.status !== "Aguardando caução") throw new ConflictException("A exceção climática exige proposta aceita pelas duas equipes.");
        status = "Clima: aguardando acordo"; weatherBy = own.id;
        message = "Solicitação climática enviada. A outra equipe precisa concordar com o cancelamento.";
      } else { status = "Cancelada"; message = "Partida cancelada. Nenhuma caução foi cobrada nesta versão."; }
    } else {
      if (game.status !== "Clima: aguardando acordo") throw new ConflictException("Não há acordo climático pendente.");
      if (game.weather_requested_by === own.id) throw new ForbiddenException("Somente a outra equipe pode concordar com o cancelamento climático.");
      status = "Cancelada"; message = "As duas equipes concordaram. Partida cancelada por condição climática, sem cobrança.";
    }
    await this.db.query("UPDATE games SET status=$1,reason=$2,weather_requested_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4",[status,reason,weatherBy,id]);
    await this.notify(other,`${own.name}: ${message}`);
    return message;
  }
  private async notify(team: string, text: string) {
    const preference = (await this.db.query("SELECT w.data FROM workspaces w JOIN teams t ON t.organizer_id=w.user_id WHERE t.id=$1", [team])).rows[0];
    if (preference?.data?.settings?.push === false) return;
    await this.db.query("INSERT INTO notifications(id,team_id,text) VALUES($1,$2,$3)", [randomUUID(), team, text]);
  }
}
