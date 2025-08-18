export interface MatchStatistics {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  foulsCommitted: number;
  foulsReceived: number;
  corners: number;
  offsides: number;
  saves: number; // Para porteros
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMatchStatisticsRequest {
  matchId: number;
  playerId: number;
  teamId: number;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  foulsCommitted?: number;
  foulsReceived?: number;
  corners?: number;
  offsides?: number;
  saves?: number;
}

export interface UpdateMatchStatisticsRequest {
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  foulsCommitted?: number;
  foulsReceived?: number;
  corners?: number;
  offsides?: number;
  saves?: number;
}

export interface MatchStatisticsWithRelations extends MatchStatistics {
  match?: {
    id: number;
    matchDate: Date;
  };
  player: {
    id: number;
    firstName: string;
    lastName: string;
    jerseyNumber?: number;
    position?: string;
  };
  team: {
    id: number;
    name: string;
  };
}

export interface TournamentStatistics {
  tournamentId: number;
  totalMatches: number;
  totalGoals: number;
  totalCards: number;
  topScorers: PlayerTournamentStats[];
  topAssists: PlayerTournamentStats[];
  teamStats: TeamTournamentStats[];
}

export interface PlayerTournamentStats {
  playerId: number;
  firstName: string;
  lastName: string;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  totalMinutes: number;
}

export interface TeamTournamentStats {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
