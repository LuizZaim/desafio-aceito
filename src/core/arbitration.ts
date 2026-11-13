/** Connected professional profiles are separate from the account's team role. */
export type RefereeKind = "arbitro" | "bandeirinha";
export type RefereeRole = "arbitro" | "bandeirinha1" | "bandeirinha2";
export type RefereeInviteStatus = "Pendente" | "Aceito" | "Recusado" | "Cancelado";

export type RefereeProfile = {
  id: string;
  name: string;
  city: string;
  state: string;
  kind: RefereeKind;
  bio: string;
  available: boolean;
};

export type RefereeInvite = {
  id: string;
  gameId: string;
  role: RefereeRole;
  status: RefereeInviteStatus;
  gameStatus: string;
  teamAName: string;
  teamBName: string;
  date: string;
  time: string;
  field: string;
  canRespond: boolean;
};

export type ArbitrationState = {
  profile: RefereeProfile | null;
  professionals: RefereeProfile[];
  invites: RefereeInvite[];
};
