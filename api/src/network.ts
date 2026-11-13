import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { freshState, transition, type State } from "../../src/core/domain";
import type { Database } from "./db";
import { Arbitration } from "./arbitration";

const REFEREE_ACTIONS = ["registerReferee","refereeProfile","refereeAvailable","inviteReferee","respondReferee"];

const TEAM_STATS = `
  COALESCE((SELECT AVG((r.skill+r.fair+r.punctuality+r.organization)/4.0) FROM game_reviews r WHERE r.target_team_id=t.id),0) AS rating_average,
  (SELECT COUNT(*)::int FROM game_reviews r WHERE r.target_team_id=t.id) AS review_count,
  (SELECT COUNT(*)::int FROM games g WHERE g.status='Concluída' AND (g.team_a_id=t.id OR g.team_b_id=t.id)) AS completed_games`;

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
      rating: Number(row.rating_average) || 0, games: Number(row.completed_games) || 0, reviewCount: Number(row.review_count) || 0, bio: row.bio, reciprocal, active: row.active,
    };
  }
  async catalog(user: string) {
    const own = await this.own(user);
    const result = await this.db.query(
      `SELECT t.*, ${TEAM_STATS}, EXISTS(SELECT 1 FROM team_interests i WHERE i.from_team_id=t.id AND i.to_team_id=$1) AS reciprocal
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
    const row = (await this.db.query(`SELECT t.*, ${TEAM_STATS} FROM teams t WHERE t.id=$1 AND (t.active=TRUE
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
        this.db.query(`SELECT g.*,f.name AS field_name,f.address AS field_address,f.latitude,f.longitude,h.name AS home_name,
          d.paid AS deposit_paid,d.reversed AS deposit_reversed,d.amount_cents,d.penalty_cents,
          r.skill AS own_skill,r.fair AS own_fair,r.punctuality AS own_punctuality,r.organization AS own_organization,
          COALESCE((SELECT json_agg(json_build_object('id',x.id,'refereeId',p.id,'name',p.name,'role',x.role,'status',x.status) ORDER BY x.created_at,x.id)
            FROM game_referees x JOIN referees p ON p.id=x.referee_id WHERE x.game_id=g.id),'[]'::json) AS referee_assignments,
          to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD') AS game_date,
          to_char(g.starts_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI') AS game_time
          FROM games g JOIN fields f ON f.id=g.field_id JOIN teams h ON h.id=g.home_team_id
          LEFT JOIN simulated_deposits d ON d.game_id=g.id
          LEFT JOIN game_reviews r ON r.game_id=g.id AND r.reviewer_team_id=$1
          WHERE g.team_a_id=$1 OR g.team_b_id=$1 ORDER BY g.starts_at DESC,g.id`, [own.id]),
      ]);
      state.interests = interests.rows.map((r) => r.to_team_id);
      state.matches = matches.rows.map((r) => r.team_a_id === own.id ? r.team_b_id : r.team_a_id);
      for (const id of state.matches) state.messages[id] = [];
      for (const row of messages.rows.reverse()) (state.messages[row.other_team] ??= []).push({ text: row.text, own: row.sender_team_id === own.id, at: new Date(row.created_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) });
      state.games = games.rows.map((g) => ({
        id: g.id, team: g.team_a_id === own.id ? g.team_b_id : g.team_a_id,
        date: g.game_date, time: g.game_time, field: g.field_name, home: g.home_name,
        ...(g.field_address !== null ? { fieldAddress: g.field_address } : {}),
        ...(g.latitude !== null && g.longitude !== null ? { latitude: g.latitude, longitude: g.longitude } : {}),
        status: g.status, payment: g.deposit_reversed ? "Estorno simulado" : g.deposit_paid ? "Simulada" : g.status === "Cancelada" ? "Não cobrada" : "Pendente",
        fee: (g.penalty_cents || 0) / 100,
        ...(g.amount_cents ? { depositAmount: g.amount_cents / 100 } : {}),
        ...(g.score_a !== null && g.score_b !== null ? { score: own.id === g.team_a_id ? `${g.score_a} × ${g.score_b}` : `${g.score_b} × ${g.score_a}` } : {}),
        ...(g.own_skill !== null ? { review: { skill: g.own_skill, fair: g.own_fair, punctuality: g.own_punctuality, organization: g.own_organization } } : {}),
        referee: g.referee_assignments.find((x: any) => x.role === "arbitro" && x.status === "Aceito")?.name || "Pendente",
        refereeAssignments: g.referee_assignments,
        proposerId: g.proposer_team_id,
        canRespond: g.status === "Aguardando adversário" && g.proposer_team_id !== own.id,
        canWeatherAgree: g.status === "Clima: aguardando acordo" && g.weather_requested_by !== own.id,
        ...(g.reason ? { reason: g.reason } : {}),
      }));
      state.notifications = notifications.rows;
      state.reports = reports.rows.map((r) => ({ team: r.reported_team_id, reason: r.reason }));
    }
    return { state, version: record.version as number, ...await this.catalog(user), arbitration: await new Arbitration(this.db).snapshot(user) };
  }
  async update(user: string, body: any): Promise<any> {
    if (!body || !Number.isInteger(body.version) || body.version < 0 || !body.action || typeof body.action !== "object" || Array.isArray(body.action)) throw new BadRequestException("Solicitação inválida.");
    if (!this.db.transaction) throw new Error("Banco sem suporte a transações.");
    return this.db.transaction(async (tx) => new Network(tx).write(user, body));
  }
  private async write(user: string, body: any) {
    const action = body.action, own = await this.own(user);
    // Locks always precede workspace/profile/game mutations. A professional may have no team.
    // Include both game participants, plus any team owned by the professional, in sorted order.
    let ids: string[] = own ? [own.id] : [];
    if (["acceptProposal","rejectProposal","cancel","weatherAgree","pay","result","review","inviteReferee"].includes(action.type)) {
      const game = (await this.db.query("SELECT team_a_id,team_b_id FROM games WHERE id=$1", [typeof action.id === "string" ? action.id : ""])).rows[0];
      if (game && own && [game.team_a_id,game.team_b_id].includes(own.id)) ids.push(game.team_a_id,game.team_b_id);
    } else if (action.type === "respondReferee") {
      const game = (await this.db.query(`SELECT g.team_a_id,g.team_b_id FROM games g JOIN game_referees x ON x.game_id=g.id
        JOIN referees p ON p.id=x.referee_id WHERE x.id=$1 AND p.user_id=$2`, [typeof action.id === "string" ? action.id : "",user])).rows[0];
      if (game) ids.push(game.team_a_id,game.team_b_id);
    } else if (own && typeof action.id === "string") ids.push(action.id);
    if (ids.length) await this.db.query("SELECT id FROM teams WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE", [[...new Set(ids)]]);
    await this.db.query("INSERT INTO workspaces(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING", [user, JSON.stringify(freshState())]);
    const record = (await this.db.query("SELECT version FROM workspaces WHERE user_id=$1 FOR UPDATE", [user])).rows[0];
    if (record.version !== body.version) throw new ConflictException("Os dados foram atualizados em outra sessão. Atualize e tente novamente.");
    const previous = await this.state(user), state = previous.state;
    if (state.deleted && action.type !== "restore" && !REFEREE_ACTIONS.includes(action.type)) throw new ForbiddenException("Sua equipe está desativada. Restaure-a nas configurações.");
    let message = "Alterações salvas.";
    if (REFEREE_ACTIONS.includes(action.type)) {
      message = await new Arbitration(this.db).action(user,own,action);
      if (["inviteReferee","respondReferee"].includes(action.type)) {
        const game = action.type === "inviteReferee"
          ? (await this.db.query("SELECT team_a_id,team_b_id FROM games WHERE id=$1", [action.id])).rows[0]
          : (await this.db.query("SELECT g.team_a_id,g.team_b_id FROM games g JOIN game_referees x ON x.game_id=g.id WHERE x.id=$1", [action.id])).rows[0];
        if (game) for (const team of [game.team_a_id,game.team_b_id]) await this.notify(team,message);
      }
    } else if (["registerTeam", "profile"].includes(action.type)) {
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
        const active = await this.db.query("SELECT 1 FROM games WHERE match_id=$1 AND status NOT IN ('Cancelada','Concluída') LIMIT 1", [match.id]);
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
    } else if (["schedule", "acceptProposal", "rejectProposal", "cancel", "weatherAgree", "pay", "result", "review"].includes(action.type)) {
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
        const active = await this.db.query("SELECT 1 FROM games WHERE (team_a_id=$1 OR team_b_id=$1) AND status NOT IN ('Cancelada','Concluída') LIMIT 1", [own.id]);
        if (active.rows.length) throw new ConflictException("Cancele as partidas ativas antes de desativar a equipe.");
        await this.db.query("UPDATE team_matches SET active=FALSE WHERE team_a_id=$1 OR team_b_id=$1", [own.id]);
        await this.db.query("DELETE FROM team_interests WHERE from_team_id=$1 OR to_team_id=$1", [own.id]);
      }
      message = action.type === "restore" ? "Equipe restaurada." : "Equipe desativada e retirada da descoberta. O histórico foi preservado.";
    } else if (["role", "available"].includes(action.type)) throw new ForbiddenException("Cadastre ou edite seu perfil profissional na área de arbitragem. O papel de organizador não pode ser alterado por este comando.");
    else if (action.type === "referee") throw new ConflictException("Abra seu convite na área de arbitragem para aceitar ou recusar com o perfil profissional vinculado à sua conta.");
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
      const hasLatitude = action.latitude !== undefined, hasLongitude = action.longitude !== undefined;
      if (hasLatitude !== hasLongitude || (hasLatitude && (
        typeof action.latitude !== "number" || typeof action.longitude !== "number" ||
        !Number.isFinite(action.latitude) || !Number.isFinite(action.longitude) ||
        action.latitude < -90 || action.latitude > 90 || action.longitude < -180 || action.longitude > 180
      ))) throw new BadRequestException("Informe latitude e longitude juntas, numéricas e dentro dos limites geográficos válidos.");
      const address = action.fieldAddress === undefined ? null : typeof action.fieldAddress === "string" ? action.fieldAddress.trim().replace(/\s+/g," ") : "";
      if (address !== null && (address.length < 2 || address.length > 250)) throw new BadRequestException("Informe o endereço do local com 2 a 250 caracteres.");
      let home: string;
      if (action.home === own.id || action.home === own.name) home = own.id;
      else if (action.home === other.id || action.home === other.name) home = other.id;
      else throw new BadRequestException("Selecione o mando de campo.");
      const field = (await this.db.query("INSERT INTO fields(id,name,normalized_key) VALUES($1,$2,$3) ON CONFLICT(normalized_key) DO UPDATE SET normalized_key=EXCLUDED.normalized_key RETURNING id", [randomUUID(),name,name.toLocaleLowerCase("pt-BR")])).rows[0];
      // The field row serializes proposals sharing a place, even with disjoint teams.
      const existingField = (await this.db.query("SELECT id,address,latitude,longitude FROM fields WHERE id=$1 FOR UPDATE",[field.id])).rows[0];
      if (address !== null && existingField.address !== null && address.toLocaleLowerCase("pt-BR") !== existingField.address.toLocaleLowerCase("pt-BR")) throw new ConflictException("Já existe outro endereço cadastrado para este nome de local. Informe o nome e o endereço que identificam o campo correto.");
      if (hasLatitude && existingField.latitude !== null && (Math.abs(existingField.latitude-action.latitude)>0.000001 || Math.abs(existingField.longitude-action.longitude)>0.000001)) throw new ConflictException("Este local já possui coordenadas diferentes. Verifique a identificação do campo.");
      if (address !== null || hasLatitude) await this.db.query("UPDATE fields SET address=COALESCE(address,$1),latitude=COALESCE(latitude,$2),longitude=COALESCE(longitude,$3) WHERE id=$4", [address,hasLatitude?action.latitude:null,hasLongitude?action.longitude:null,field.id]);
      const conflict = await this.db.query(`SELECT 1 FROM games WHERE status<>'Cancelada'
        AND starts_at > $1::timestamptz - INTERVAL '2 hours' AND starts_at < $1::timestamptz + INTERVAL '2 hours'
        AND (team_a_id IN ($2,$3) OR team_b_id IN ($2,$3) OR field_id=$4) LIMIT 1`,[start.toISOString(),own.id,other.id,field.id]);
      if (conflict.rows.length) throw new ConflictException("Há conflito de horário entre as equipes ou o local (intervalo de 2 horas).");
      await this.db.query("INSERT INTO games(id,match_id,team_a_id,team_b_id,proposer_team_id,home_team_id,field_id,starts_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),match.id,a,b,own.id,home,field.id,start.toISOString()]);
      await this.notify(other.id,`Nova proposta de amistoso de ${own.name}. Aceite ou recuse na agenda.`);
      return "Proposta enviada. A outra equipe precisa aceitar antes da caução simulada. O local informado é demonstrativo e não possui reserva externa.";
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
      message = action.type === "acceptProposal" ? "Proposta aceita pelas duas equipes. Simule a caução de R$ 50 para confirmar; nenhum valor real será cobrado." : "Proposta recusada. Nenhum valor foi cobrado.";
      if (action.type === "rejectProposal") reason = "Proposta recusada pela equipe adversária.";
    } else if (action.type === "pay") {
      if (game.status !== "Aguardando caução") throw new ConflictException("A caução simulada exige proposta aceita pelas duas equipes e só pode ser registrada uma vez.");
      if (new Date(game.starts_at).getTime() <= Date.now()) throw new ConflictException("A data da proposta já passou. Cancele e envie uma nova proposta.");
      await this.db.query("INSERT INTO simulated_deposits(game_id,payer_team_id) VALUES($1,$2)",[id,own.id]);
      status = "Confirmada";
      message = "Caução de R$ 50 simulada. Partida confirmada na demonstração. Nenhum valor real foi cobrado.";
    } else if (action.type === "result") {
      if (game.status !== "Confirmada") throw new ConflictException("A partida precisa estar confirmada para registrar resultado.");
      if (new Date(game.starts_at).getTime() > Date.now()) throw new ConflictException("O resultado só pode ser registrado depois do horário de início do jogo.");
      const goal = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v>=0 && v<=99) || (typeof v === "string" && /^\d{1,2}$/.test(v));
      if (!goal(action.a) || !goal(action.b)) throw new BadRequestException("Informe gols inteiros de 0 a 99 para as duas equipes.");
      const scoreA = own.id === game.team_a_id ? Number(action.a) : Number(action.b);
      const scoreB = own.id === game.team_b_id ? Number(action.a) : Number(action.b);
      await this.db.query("UPDATE games SET score_a=$1,score_b=$2,completed_by=$3 WHERE id=$4",[scoreA,scoreB,own.id,id]);
      status = "Concluída";
      message = "Resultado demonstrativo registrado. As duas equipes podem avaliar o adversário uma vez.";
    } else if (action.type === "review") {
      if (game.status !== "Concluída") throw new ConflictException("Avalie somente partidas concluídas.");
      if (![action.skill,action.fair,action.punctuality,action.organization].every((v) => typeof v === "number" && Number.isInteger(v) && v>=1 && v<=5)) throw new BadRequestException("Informe notas inteiras de 1 a 5 para nível técnico, fair play, pontualidade e organização.");
      const exists = await this.db.query("SELECT 1 FROM game_reviews WHERE game_id=$1 AND reviewer_team_id=$2",[id,own.id]);
      if (exists.rows.length) throw new ConflictException("Você já avaliou esta partida.");
      await this.db.query("INSERT INTO game_reviews(game_id,reviewer_team_id,target_team_id,skill,fair,punctuality,organization) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,own.id,other,action.skill,action.fair,action.punctuality,action.organization]);
      status = game.status;
      message = "Avaliação registrada. O ranking compartilhado foi atualizado com as quatro dimensões.";
    } else if (action.type === "cancel") {
      if (["Cancelada","Concluída"].includes(game.status)) throw new ConflictException("Esta partida já foi cancelada ou concluída.");
      if (typeof action.reason !== "string" || !action.reason.trim() || action.reason.trim().length > 250) throw new BadRequestException("Informe o motivo com até 250 caracteres.");
      reason = action.reason.trim();
      if (action.weather === true) {
        if (!["Aguardando caução","Confirmada"].includes(game.status)) throw new ConflictException("A exceção climática exige proposta aceita pelas duas equipes.");
        status = "Clima: aguardando acordo"; weatherBy = own.id;
        message = "Solicitação climática enviada. A outra equipe precisa concordar com o cancelamento.";
      } else {
        status = "Cancelada";
        const deposit = (await this.db.query("SELECT paid FROM simulated_deposits WHERE game_id=$1",[id])).rows[0];
        const day = (value: Date) => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(value);
        const fee = deposit?.paid ? (day(new Date(game.starts_at)) === day(new Date()) ? 30 : 10) : 0;
        if (deposit?.paid) await this.db.query("UPDATE simulated_deposits SET reversed=TRUE,penalty_cents=$1,reversed_at=CURRENT_TIMESTAMP WHERE game_id=$2",[fee*100,id]);
        message = `Partida cancelada. Penalidade demonstrativa de R$ ${fee}; caução e estorno são simulados. Nenhum valor real foi movimentado.`;
      }
    } else {
      if (game.status !== "Clima: aguardando acordo") throw new ConflictException("Não há acordo climático pendente.");
      if (game.weather_requested_by === own.id) throw new ForbiddenException("Somente a outra equipe pode concordar com o cancelamento climático.");
      status = "Cancelada";
      await this.db.query("UPDATE simulated_deposits SET reversed=TRUE,penalty_cents=0,reversed_at=CURRENT_TIMESTAMP WHERE game_id=$1",[id]);
      message = "As duas equipes concordaram. Cancelamento climático sem penalidade; estorno de caução simulado, sem movimentação de valores reais.";
    }
    await this.db.query("UPDATE games SET status=$1,reason=$2,weather_requested_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4",[status,reason,weatherBy,id]);
    if (status === "Cancelada") await this.db.query("UPDATE game_referees SET status='Cancelado',responded_at=CURRENT_TIMESTAMP WHERE game_id=$1 AND status IN ('Pendente','Aceito')", [id]);
    await this.notify(other,`${own.name}: ${message}`);
    return message;
  }
  private async notify(team: string, text: string) {
    const preference = (await this.db.query("SELECT w.data FROM workspaces w JOIN teams t ON t.organizer_id=w.user_id WHERE t.id=$1", [team])).rows[0];
    if (preference?.data?.settings?.push === false) return;
    await this.db.query("INSERT INTO notifications(id,team_id,text) VALUES($1,$2,$3)", [randomUUID(), team, text]);
  }
}
