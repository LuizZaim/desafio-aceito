import type { State, Team } from "./domain";
import type { ArbitrationState } from "./arbitration";
import type { AcademicState } from "./academic";

export type WorkspaceSnapshot = {
  state: State;
  version: number;
  teams: Team[];
  currentTeamId: string | null;
  arbitration: ArbitrationState;
  academic: AcademicState;
};
type Request = (path: string, method?: string, body?: unknown) => Promise<any>;

/** Serializes refreshes and writes so a slow poll cannot overwrite a sent message. */
export class WorkspaceSession {
  private generation = 0;
  private version = 0;
  private reading: Promise<WorkspaceSnapshot | null> | null = null;
  private writing: Promise<WorkspaceSnapshot | null> | null = null;
  private request: Request;
  private commit: (snapshot: WorkspaceSnapshot) => void;

  constructor(request: Request, commit: (snapshot: WorkspaceSnapshot) => void) {
    this.request = request;
    this.commit = commit;
  }

  reset() {
    this.generation++;
    this.version = 0;
    this.reading = null;
    this.writing = null;
  }

  private accept(data: WorkspaceSnapshot, generation: number) {
    if (generation !== this.generation) return null;
    if (
      !data?.state ||
      !Number.isInteger(data.version) ||
      data.version < 0 ||
      !Array.isArray(data.state.matches) ||
      !Array.isArray(data.state.games)
    )
      throw Error("Os dados recebidos estão incompletos. Tente atualizar novamente.");
    const snapshot: WorkspaceSnapshot = {
      ...data,
      // Old services must never accidentally show demonstration opponents online.
      teams: Array.isArray(data.teams) ? data.teams : [],
      currentTeamId: typeof data.currentTeamId === "string" ? data.currentTeamId : null,
      arbitration: {
        profile: data.arbitration?.profile && typeof data.arbitration.profile.id === "string"
          ? data.arbitration.profile : null,
        professionals: Array.isArray(data.arbitration?.professionals) ? data.arbitration.professionals : [],
        invites: Array.isArray(data.arbitration?.invites) ? data.arbitration.invites : [],
      },
      academic: {
        cards: Array.isArray(data.academic?.cards) ? data.academic.cards : [],
        subscription: data.academic?.subscription && ["gratuito", "academico"].includes(data.academic.subscription.plan) && Number.isInteger(data.academic.subscription.priorityCredits)
          ? data.academic.subscription : { plan: "gratuito", priorityCredits: 0 },
        players: Array.isArray(data.academic?.players) ? data.academic.players : [],
        preferredField: typeof data.academic?.preferredField === "string" ? data.academic.preferredField : "",
        achievements: Array.isArray(data.academic?.achievements) ? data.academic.achievements : [],
        refereeMerits: Array.isArray(data.academic?.refereeMerits) ? data.academic.refereeMerits : [],
        planCreditGranted: data.academic?.planCreditGranted === true,
      },
    };
    this.version = data.version;
    this.commit(snapshot);
    return snapshot;
  }

  refresh(): Promise<WorkspaceSnapshot | null> {
    if (this.writing) return this.writing;
    if (this.reading) return this.reading;
    const generation = this.generation;
    const operation = this.request("/state")
      .then((data) => this.accept(data, generation))
      .finally(() => {
        if (this.reading === operation) this.reading = null;
      });
    this.reading = operation;
    return operation;
  }

  update(action: unknown): Promise<WorkspaceSnapshot | null> {
    if (this.writing) return Promise.reject(Error("Aguarde a operação anterior terminar."));
    const generation = this.generation;
    const read = this.reading;
    const operation = (async () => {
      if (read) await read;
      if (generation !== this.generation) return null;
      const data = await this.request("/state", "POST", { action, version: this.version });
      return this.accept(data, generation);
    })().finally(() => {
      if (this.writing === operation) this.writing = null;
    });
    this.writing = operation;
    return operation;
  }
}
