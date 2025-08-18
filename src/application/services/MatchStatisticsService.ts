import { IMatchStatisticsDataSource } from '../../domain/interfaces/IMatchStatisticsDataSource';
import { IMatchDataSource } from '../../domain/interfaces/IMatchDataSource';
import {
  MatchStatistics,
  CreateMatchStatisticsRequest,
  UpdateMatchStatisticsRequest,
  MatchStatisticsWithRelations,
  TournamentStatistics,
  PlayerTournamentStats,
  TeamTournamentStats,
} from '../../domain/entities/MatchStatistics';
import { MatchStatus } from '../../domain/entities/Match';
import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError } from '../../shared/exceptions';

export class MatchStatisticsService {
  constructor(
    private matchStatisticsDataSource: IMatchStatisticsDataSource,
    private matchDataSource: IMatchDataSource,
    private logger: Logger
  ) {}

  async createStatistics(request: CreateMatchStatisticsRequest): Promise<MatchStatistics> {
    this.logger.logInfo('MatchStatisticsService: Creating statistics', { request });

    // Validaciones básicas
    this.validateCreateStatisticsRequest(request);

    // Verificar que el partido existe
    await this.validateMatchExists(request.matchId);

    const stats = await this.matchStatisticsDataSource.create(request);

    this.logger.logInfo('MatchStatisticsService: Statistics created successfully', {
      id: stats.id,
      matchId: stats.matchId,
      playerId: stats.playerId,
    });
    return stats;
  }

  async getStatisticsById(id: number): Promise<MatchStatisticsWithRelations> {
    this.logger.logInfo('MatchStatisticsService: Getting statistics by ID', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid statistics ID is required');
    }

    const stats = await this.matchStatisticsDataSource.findById(id);
    if (!stats) {
      throw new NotFoundError('Statistics not found');
    }

    return stats;
  }

  async getStatisticsByMatch(matchId: number): Promise<MatchStatisticsWithRelations[]> {
    this.logger.logInfo('MatchStatisticsService: Getting statistics by match', { matchId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const stats = await this.matchStatisticsDataSource.findByMatch(matchId);

    this.logger.logInfo('MatchStatisticsService: Match statistics retrieved successfully', {
      matchId,
      count: stats.length,
    });
    return stats;
  }

  async getStatisticsByPlayer(
    playerId: number,
    tournamentId?: number
  ): Promise<MatchStatisticsWithRelations[]> {
    this.logger.logInfo('MatchStatisticsService: Getting statistics by player', {
      playerId,
      tournamentId,
    });

    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    const stats = await this.matchStatisticsDataSource.findByPlayer(playerId, tournamentId);

    this.logger.logInfo('MatchStatisticsService: Player statistics retrieved successfully', {
      playerId,
      tournamentId,
      count: stats.length,
    });
    return stats;
  }

  async getStatisticsByTeam(
    teamId: number,
    tournamentId?: number
  ): Promise<MatchStatisticsWithRelations[]> {
    this.logger.logInfo('MatchStatisticsService: Getting statistics by team', {
      teamId,
      tournamentId,
    });

    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    const stats = await this.matchStatisticsDataSource.findByTeam(teamId, tournamentId);

    this.logger.logInfo('MatchStatisticsService: Team statistics retrieved successfully', {
      teamId,
      tournamentId,
      count: stats.length,
    });
    return stats;
  }

  async updateStatistics(
    id: number,
    request: UpdateMatchStatisticsRequest
  ): Promise<MatchStatistics> {
    this.logger.logInfo('MatchStatisticsService: Updating statistics', { id, request });

    if (!id || id <= 0) {
      throw new ValidationError('Valid statistics ID is required');
    }

    // Validar datos de entrada
    this.validateUpdateStatisticsRequest(request);

    // Verificar que las estadísticas existan
    const existingStats = await this.matchStatisticsDataSource.findById(id);
    if (!existingStats) {
      throw new NotFoundError('Statistics not found');
    }

    // Verificar que el partido aún permite modificaciones
    const match = await this.matchDataSource.findById(existingStats.matchId);
    if (!match) {
      throw new NotFoundError('Associated match not found');
    }

    if (match.status === MatchStatus.FINISHED) {
      this.logger.logWarning('Updating statistics of finished match', {
        matchId: match.id,
        statisticsId: id,
      });
    }

    const updatedStats = await this.matchStatisticsDataSource.update(id, request);
    if (!updatedStats) {
      throw new NotFoundError('Failed to update statistics');
    }

    this.logger.logInfo('MatchStatisticsService: Statistics updated successfully', { id });
    return updatedStats;
  }

  async updatePlayerStatistics(
    matchId: number,
    playerId: number,
    request: UpdateMatchStatisticsRequest
  ): Promise<MatchStatistics> {
    this.logger.logInfo('MatchStatisticsService: Updating player statistics', {
      matchId,
      playerId,
      request,
    });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Validar datos de entrada
    this.validateUpdateStatisticsRequest(request);

    // Verificar que el partido existe
    await this.validateMatchExists(matchId);

    const stats = await this.matchStatisticsDataSource.upsert(matchId, playerId, request);

    this.logger.logInfo('MatchStatisticsService: Player statistics updated successfully', {
      matchId,
      playerId,
    });
    return stats;
  }

  async initializeMatchStatistics(
    matchId: number,
    playerIds: number[]
  ): Promise<MatchStatistics[]> {
    this.logger.logInfo('MatchStatisticsService: Initializing match statistics', {
      matchId,
      playerCount: playerIds.length,
    });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (!playerIds || playerIds.length === 0) {
      throw new ValidationError('At least one player ID is required');
    }

    // Verificar que el partido existe
    await this.validateMatchExists(matchId);

    const stats = await this.matchStatisticsDataSource.initializeMatchStatistics(
      matchId,
      playerIds
    );

    this.logger.logInfo('MatchStatisticsService: Match statistics initialized successfully', {
      matchId,
      count: stats.length,
    });
    return stats;
  }

  async getTournamentStatistics(tournamentId: number): Promise<TournamentStatistics> {
    this.logger.logInfo('MatchStatisticsService: Getting tournament statistics', { tournamentId });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    const stats = await this.matchStatisticsDataSource.getTournamentStatistics(tournamentId);

    this.logger.logInfo('MatchStatisticsService: Tournament statistics retrieved successfully', {
      tournamentId,
      totalMatches: stats.totalMatches,
      totalGoals: stats.totalGoals,
    });
    return stats;
  }

  async getPlayerTournamentStats(
    tournamentId: number,
    limit = 50
  ): Promise<PlayerTournamentStats[]> {
    this.logger.logInfo('MatchStatisticsService: Getting player tournament statistics', {
      tournamentId,
      limit,
    });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    if (limit <= 0 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    const stats = await this.matchStatisticsDataSource.getPlayerTournamentStats(
      tournamentId,
      limit
    );

    this.logger.logInfo(
      'MatchStatisticsService: Player tournament statistics retrieved successfully',
      {
        tournamentId,
        count: stats.length,
      }
    );
    return stats;
  }

  async getTeamTournamentStats(tournamentId: number): Promise<TeamTournamentStats[]> {
    this.logger.logInfo('MatchStatisticsService: Getting team tournament statistics', {
      tournamentId,
    });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    const stats = await this.matchStatisticsDataSource.getTeamTournamentStats(tournamentId);

    this.logger.logInfo(
      'MatchStatisticsService: Team tournament statistics retrieved successfully',
      {
        tournamentId,
        count: stats.length,
      }
    );
    return stats;
  }

  async getTopScorers(tournamentId: number, limit = 10): Promise<PlayerTournamentStats[]> {
    this.logger.logInfo('MatchStatisticsService: Getting top scorers', { tournamentId, limit });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    if (limit <= 0 || limit > 50) {
      throw new ValidationError('Limit must be between 1 and 50');
    }

    const stats = await this.matchStatisticsDataSource.getTopScorers(tournamentId, limit);

    this.logger.logInfo('MatchStatisticsService: Top scorers retrieved successfully', {
      tournamentId,
      count: stats.length,
    });
    return stats;
  }

  async getTopAssists(tournamentId: number, limit = 10): Promise<PlayerTournamentStats[]> {
    this.logger.logInfo('MatchStatisticsService: Getting top assists', { tournamentId, limit });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    if (limit <= 0 || limit > 50) {
      throw new ValidationError('Limit must be between 1 and 50');
    }

    const stats = await this.matchStatisticsDataSource.getTopAssists(tournamentId, limit);

    this.logger.logInfo('MatchStatisticsService: Top assists retrieved successfully', {
      tournamentId,
      count: stats.length,
    });
    return stats;
  }

  async deleteStatistics(id: number): Promise<boolean> {
    this.logger.logInfo('MatchStatisticsService: Deleting statistics', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid statistics ID is required');
    }

    // Verificar que las estadísticas existan
    const existingStats = await this.matchStatisticsDataSource.findById(id);
    if (!existingStats) {
      throw new NotFoundError('Statistics not found');
    }

    // Verificar que el partido aún permite modificaciones
    const match = await this.matchDataSource.findById(existingStats.matchId);
    if (match && match.status === MatchStatus.FINISHED) {
      throw new ValidationError('Cannot delete statistics from finished matches');
    }

    const deleted = await this.matchStatisticsDataSource.delete(id);

    this.logger.logInfo('MatchStatisticsService: Statistics deleted successfully', { id });
    return deleted;
  }

  async getPlayerSeasonSummary(
    playerId: number,
    tournamentId: number
  ): Promise<{
    totalMatches: number;
    totalMinutes: number;
    averageMinutes: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    shotAccuracy: number;
    goalsPerMatch: number;
    assistsPerMatch: number;
  }> {
    this.logger.logInfo('MatchStatisticsService: Getting player season summary', {
      playerId,
      tournamentId,
    });

    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    const stats = await this.matchStatisticsDataSource.findByPlayer(playerId, tournamentId);

    const summary = {
      totalMatches: stats.length,
      totalMinutes: stats.reduce((sum, stat) => sum + stat.minutesPlayed, 0),
      averageMinutes:
        stats.length > 0
          ? Math.round(stats.reduce((sum, stat) => sum + stat.minutesPlayed, 0) / stats.length)
          : 0,
      goals: stats.reduce((sum, stat) => sum + stat.goals, 0),
      assists: stats.reduce((sum, stat) => sum + stat.assists, 0),
      yellowCards: stats.reduce((sum, stat) => sum + stat.yellowCards, 0),
      redCards: stats.reduce((sum, stat) => sum + stat.redCards, 0),
      shotsOnTarget: stats.reduce((sum, stat) => sum + stat.shotsOnTarget, 0),
      shotsOffTarget: stats.reduce((sum, stat) => sum + stat.shotsOffTarget, 0),
      shotAccuracy: 0,
      goalsPerMatch: 0,
      assistsPerMatch: 0,
    };

    // Calcular métricas derivadas
    const totalShots = summary.shotsOnTarget + summary.shotsOffTarget;
    summary.shotAccuracy =
      totalShots > 0 ? Math.round((summary.shotsOnTarget / totalShots) * 100) : 0;
    summary.goalsPerMatch =
      summary.totalMatches > 0 ? Math.round((summary.goals / summary.totalMatches) * 100) / 100 : 0;
    summary.assistsPerMatch =
      summary.totalMatches > 0
        ? Math.round((summary.assists / summary.totalMatches) * 100) / 100
        : 0;

    this.logger.logInfo('MatchStatisticsService: Player season summary retrieved successfully', {
      playerId,
      tournamentId,
      totalMatches: summary.totalMatches,
      goals: summary.goals,
    });

    return summary;
  }

  private validateCreateStatisticsRequest(request: CreateMatchStatisticsRequest): void {
    if (!request.matchId || request.matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (!request.playerId || request.playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    if (!request.teamId || request.teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    this.validateStatisticsValues(request);
  }

  private validateUpdateStatisticsRequest(request: UpdateMatchStatisticsRequest): void {
    this.validateStatisticsValues(request);
  }

  private validateStatisticsValues(
    request: CreateMatchStatisticsRequest | UpdateMatchStatisticsRequest
  ): void {
    // Validar que todos los valores numéricos sean no negativos
    const numericFields = [
      'minutesPlayed',
      'goals',
      'assists',
      'yellowCards',
      'redCards',
      'shotsOnTarget',
      'shotsOffTarget',
      'foulsCommitted',
      'foulsReceived',
      'corners',
      'offsides',
      'saves',
    ];

    numericFields.forEach((field) => {
      if (request[field] !== undefined && request[field] < 0) {
        throw new ValidationError(`${field} must be non-negative`);
      }
    });

    // Validaciones específicas
    if (request.minutesPlayed !== undefined && request.minutesPlayed > 120) {
      throw new ValidationError('Minutes played cannot exceed 120');
    }

    if (request.yellowCards !== undefined && request.yellowCards > 2) {
      throw new ValidationError('Yellow cards cannot exceed 2 per match');
    }

    if (request.redCards !== undefined && request.redCards > 1) {
      throw new ValidationError('Red cards cannot exceed 1 per match');
    }
  }

  private async validateMatchExists(matchId: number): Promise<void> {
    const match = await this.matchDataSource.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }
  }
}
