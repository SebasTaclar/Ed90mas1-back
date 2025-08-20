export interface Match {
  id: number;
  tournamentId: number;
  groupId?: number;
  homeTeamId: number;
  awayTeamId: number;
  matchDate: Date;
  location?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  round?: string;
  matchNumber: number;
  startTime?: Date;
  endTime?: Date;
  attendingPlayers?: AttendingPlayers;
  createdAt: Date;
  updatedAt: Date;
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

// Estructura para los jugadores que se presentaron al partido
export interface AttendingPlayers {
  [teamId: string]: number[]; // teamId como string y array de playerIds como numbers
}

export interface CreateMatchRequest {
  tournamentId: number;
  groupId?: number;
  homeTeamId: number;
  awayTeamId: number;
  matchDate: Date;
  location?: string;
  round?: string;
  matchNumber: number;
  attendingPlayers?: AttendingPlayers;
}

export interface UpdateMatchRequest {
  matchDate?: Date;
  location?: string;
  status?: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  startTime?: Date;
  endTime?: Date;
  attendingPlayers?: AttendingPlayers;
}

export interface GenerateFixtureRequest {
  tournamentId: number;
  groupId?: number;
  startDate: Date;
  location?: string;
  round?: string;
  matchIntervalDays?: number; // Días entre partidos
  matchesPerDay?: number; // Partidos por día
  includePlayoffs?: boolean; // Si incluir fase eliminatoria
  fixtureType?: string; // Tipo de fixture
  fixtures?: PreDefinedFixture[]; // Fixtures predefinidas
}

export interface PreDefinedFixture {
  homeTeamId: number;
  awayTeamId: number;
  date: string;
  time: string;
  location: string;
  groupId?: string;
  status?: MatchStatus;
}

export interface MatchWithRelations extends Match {
  tournament?: {
    id: number;
    name: string;
  };
  group?: {
    id: number;
    groupName: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logoPath?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logoPath?: string;
  };
  matchEvents?: any[];
  matchStatistics?: any[];
}
