import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { academicInput, academicAchievements, ACADEMIC_ACTIONS, type AcademicState } from "../../src/core/academic";
import type { Database } from "./db";

export const EXTRAS_ACTIONS = ACADEMIC_ACTIONS.filter((type) => type !== "priorityInterest");

/** Persisted classroom extras; deliberately stores no real payment credentials. */
export class AcademicExtras {
  constructor(private readonly db: Database) {}
  private async wallet(user: string) {
    await this.db.query("INSERT INTO academic_wallets(user_id) VALUES($1) ON CONFLICT DO NOTHING", [user]);
    return (await this.db.query("SELECT * FROM academic_wallets WHERE user_id=$1", [user])).rows[0];
  }
  async snapshot(user: string): Promise<AcademicState> {
    const wallet = await this.wallet(user);
    const own = (await this.db.query("SELECT id FROM teams WHERE organizer_id=$1", [user])).rows[0];
    const [cards, players, field, counts, merits] = await Promise.all([
      this.db.query("SELECT id,label,last4 FROM demo_cards WHERE user_id=$1 ORDER BY created_at,id LIMIT 5", [user]),
      this.db.query("SELECT id,name,number,position FROM team_players WHERE team_id=$1 ORDER BY number NULLS LAST,name,id LIMIT 40", [own?.id || ""]),
      this.db.query("SELECT preferred_field FROM team_academic_settings WHERE team_id=$1", [own?.id || ""]),
      this.db.query(`SELECT
        (SELECT COUNT(*)::int FROM team_matches WHERE team_a_id=$1 OR team_b_id=$1) AS matches,
        (SELECT COUNT(*)::int FROM games WHERE status='Concluída' AND (team_a_id=$1 OR team_b_id=$1)) AS games,
        (SELECT COUNT(*)::int FROM game_reviews WHERE reviewer_team_id=$1 OR target_team_id=$1) AS reviews`, [own?.id || ""]),
      this.db.query("SELECT COUNT(*)::int AS total FROM game_referees x JOIN referees r ON r.id=x.referee_id WHERE r.user_id=$1 AND x.status='Aceito'", [user]),
    ]);
    return {
      cards: cards.rows, subscription: { plan: wallet.plan, priorityCredits: wallet.priority_credits },
      players: players.rows, preferredField: field.rows[0]?.preferred_field || "",
      achievements: academicAchievements(counts.rows[0]),
      refereeMerits: Number(merits.rows[0]?.total) > 0
        ? [{ id: "first-acceptance", title: "Primeira atuação aceita", description: "Um convite vinculado à sua conta foi aceito no aplicativo." }] : [],
      planCreditGranted: wallet.plan_credit_granted,
    };
  }
  async action(user: string, own: any, action: any): Promise<string> {
    try { academicInput(action); } catch (error) { throw new BadRequestException(error instanceof Error ? error.message : "Dados inválidos."); }
    if (["savePlayer", "removePlayer", "teamField"].includes(action.type) && (!own || !own.active))
      throw new ForbiddenException("Cadastre uma equipe ativa antes de editar o elenco ou o campo preferido.");
    if (action.type === "addDemoCard") {
      const count = (await this.db.query("SELECT COUNT(*)::int AS total FROM demo_cards WHERE user_id=$1", [user])).rows[0].total;
      if (count >= 5) throw new ConflictException("A demonstração permite até cinco identificadores de cartão.");
      await this.db.query("INSERT INTO demo_cards(id,user_id,label,last4) VALUES($1,$2,$3,$4)", [randomUUID(),user,action.label.trim(),action.last4]);
      return "Identificador fictício salvo. Nenhum dado financeiro ou cobrança foi criado.";
    }
    if (action.type === "removeDemoCard") {
      const removed = await this.db.query("DELETE FROM demo_cards WHERE id=$1 AND user_id=$2 RETURNING id", [action.id,user]);
      if (!removed.rows.length) throw new NotFoundException("Identificador de cartão não encontrado na sua conta.");
      return "Identificador fictício removido.";
    }
    if (["selectAcademicPlan", "addPriorityCredit"].includes(action.type)) {
      const wallet = await this.wallet(user);
      if (action.type === "selectAcademicPlan") {
        const grant = action.plan === "academico" && !wallet.plan_credit_granted;
        if (grant && wallet.priority_credits >= 10) throw new ConflictException("Use um crédito de demonstração antes de ativar o benefício acadêmico.");
        await this.db.query("UPDATE academic_wallets SET plan=$1,priority_credits=priority_credits+$2,plan_credit_granted=plan_credit_granted OR $3 WHERE user_id=$4", [action.plan,grant?1:0,grant,user]);
        return action.plan === "academico" ? "Plano acadêmico de demonstração ativado. O benefício inicial de um crédito é concedido apenas uma vez. Nenhum valor foi cobrado." : "Modo gratuito selecionado. Nenhuma assinatura ou cobrança real existe.";
      }
      if (wallet.priority_credits >= 10) throw new ConflictException("Use os créditos de demonstração antes de adicionar mais (máximo de dez).");
      await this.db.query("UPDATE academic_wallets SET priority_credits=priority_credits+1 WHERE user_id=$1", [user]);
      return "Um crédito de prioridade de demonstração foi adicionado gratuitamente, sem cobrança.";
    }
    if (action.type === "savePlayer") {
      const id = typeof action.id === "string" ? action.id : undefined;
      if (id) {
        const previous = await this.db.query("SELECT id FROM team_players WHERE id=$1 AND team_id=$2", [id,own.id]);
        if (!previous.rows.length) throw new NotFoundException("Jogador não encontrado na sua equipe.");
      } else {
        const count = (await this.db.query("SELECT COUNT(*)::int AS total FROM team_players WHERE team_id=$1", [own.id])).rows[0].total;
        if (count >= 40) throw new ConflictException("O elenco permite até quarenta jogadores.");
      }
      try {
        if (id) await this.db.query("UPDATE team_players SET name=$1,number=$2,position=$3 WHERE id=$4 AND team_id=$5", [action.name.trim(),action.number,action.position.trim(),id,own.id]);
        else await this.db.query("INSERT INTO team_players(id,team_id,name,number,position) VALUES($1,$2,$3,$4,$5)", [randomUUID(),own.id,action.name.trim(),action.number,action.position.trim()]);
      } catch (error: any) { if (error.code === "23505") throw new ConflictException("Este número já está em uso no seu elenco."); throw error; }
      return "Jogador salvo no elenco público da sua equipe.";
    }
    if (action.type === "removePlayer") {
      const removed = await this.db.query("DELETE FROM team_players WHERE id=$1 AND team_id=$2 RETURNING id", [action.id,own.id]);
      if (!removed.rows.length) throw new NotFoundException("Jogador não encontrado na sua equipe.");
      return "Jogador removido do elenco.";
    }
    if (action.type === "teamField") {
      await this.db.query("INSERT INTO team_academic_settings(team_id,preferred_field) VALUES($1,$2) ON CONFLICT(team_id) DO UPDATE SET preferred_field=EXCLUDED.preferred_field", [own.id,action.field.trim()]);
      return "Campo preferido salvo. Isso não representa uma reserva do estabelecimento.";
    }
    throw new BadRequestException("Operação acadêmica desconhecida.");
  }
  /** Called inside Network's transaction before the ordinary authenticated interest action. */
  async consumePriority(user: string, own: any, targetId: string): Promise<void> {
    if (!own || !own.active) throw new ForbiddenException("Cadastre uma equipe ativa antes de enviar interesse prioritário.");
    if (targetId === own.id) throw new BadRequestException("Selecione outra equipe.");
    const other = await this.db.query("SELECT id FROM teams WHERE id=$1 AND active=TRUE", [targetId]);
    if (!other.rows.length) throw new NotFoundException("Equipe não encontrada.");
    const previous = await this.db.query(`SELECT 1 FROM priority_interests p JOIN team_interests i
      ON i.from_team_id=p.from_team_id AND i.to_team_id=p.to_team_id WHERE p.from_team_id=$1 AND p.to_team_id=$2`, [own.id,targetId]);
    if (previous.rows.length) throw new ConflictException("Este interesse já possui prioridade. Nenhum crédito foi consumido novamente.");
    await this.wallet(user);
    const wallet = await this.db.query("UPDATE academic_wallets SET priority_credits=priority_credits-1 WHERE user_id=$1 AND priority_credits>0 RETURNING user_id", [user]);
    if (!wallet.rows.length) throw new ConflictException("Adicione um crédito de demonstração antes de enviar interesse prioritário.");
    await this.db.query("INSERT INTO priority_interests(from_team_id,to_team_id) VALUES($1,$2) ON CONFLICT(from_team_id,to_team_id) DO UPDATE SET created_at=CURRENT_TIMESTAMP", [own.id,targetId]);
  }
  /** Public roster/field only; payment identifiers remain private to the authenticated account. */
  async publicTeams<T extends {id:string}>(teams: T[], viewerTeamId: string | null): Promise<(T & {players:any[];preferredField:string;priority:boolean})[]> {
    if (!teams.length) return [];
    const ids = teams.map((team) => team.id);
    const [players, fields, priority] = await Promise.all([
      this.db.query("SELECT id,team_id,name,number,position FROM team_players WHERE team_id=ANY($1::text[]) ORDER BY number NULLS LAST,name,id", [ids]),
      this.db.query("SELECT team_id,preferred_field FROM team_academic_settings WHERE team_id=ANY($1::text[])", [ids]),
      this.db.query(`SELECT p.from_team_id FROM priority_interests p JOIN team_interests i
        ON i.from_team_id=p.from_team_id AND i.to_team_id=p.to_team_id
        WHERE p.from_team_id=ANY($1::text[]) AND p.to_team_id=$2`, [ids,viewerTeamId || ""]),
    ]);
    return teams.map((team) => ({
      ...team,
      players: players.rows.filter((row) => row.team_id===team.id).slice(0,40).map(({team_id,...row}) => row),
      preferredField: fields.rows.find((row) => row.team_id===team.id)?.preferred_field || "",
      priority: priority.rows.some((row) => row.from_team_id===team.id),
    })).sort((a,b) => Number(b.priority)-Number(a.priority));
  }
}
