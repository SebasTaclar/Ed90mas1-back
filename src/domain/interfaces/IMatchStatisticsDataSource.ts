import {
  MatchStatistics,
  CreateMatchStatisticsRequest,
  UpdateMatchStatisticsRequest,
  MatchStatisticsWithRelations,
  TournamentStatistics,
  PlayerTournamentStats,
  TeamTournamentStats,
} from '../entities/MatchStatistics';

export interface IMatchStatisticsDataSource {
  // CRUD básico de estadísticas
  create(request: CreateMatchStatisticsRequest): Promise<MatchStatistics>;
  findById(id: number): Promise<MatchStatisticsWithRelations | null>;
  findByMatch(matchId: number): Promise<MatchStatisticsWithRelations[]>;
  findByPlayer(playerId: number, tournamentId?: number): Promise<MatchStatisticsWithRelations[]>;
  findByTeam(teamId: number, tournamentId?: number): Promise<MatchStatisticsWithRelations[]>;
  update(id: number, request: UpdateMatchStatisticsRequest): Promise<MatchStatistics | null>;
  delete(id: number): Promise<boolean>;
  upsert(
    matchId: number,
    playerId: number,
    request: UpdateMatchStatisticsRequest
  ): Promise<MatchStatistics>;

  // Operaciones específicas
  deleteByMatch(matchId: number): Promise<boolean>;
  initializeMatchStatistics(matchId: number, playerIds: number[]): Promise<MatchStatistics[]>;

  // Estadísticas agregadas
  getTournamentStatistics(tournamentId: number): Promise<TournamentStatistics>;
  getPlayerTournamentStats(tournamentId: number, limit?: number): Promise<PlayerTournamentStats[]>;
  getTeamTournamentStats(tournamentId: number): Promise<TeamTournamentStats[]>;
  getTopScorers(tournamentId: number, limit?: number): Promise<PlayerTournamentStats[]>;
  getTopAssists(tournamentId: number, limit?: number): Promise<PlayerTournamentStats[]>;
}
