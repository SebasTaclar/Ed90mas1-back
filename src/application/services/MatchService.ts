import { IMatchDataSource } from '../../domain/interfaces/IMatchDataSource';
import { IMatchEventDataSource } from '../../domain/interfaces/IMatchEventDataSource';
import { IMatchStatisticsDataSource } from '../../domain/interfaces/IMatchStatisticsDataSource';
import { ITournamentConfigurationDataSource } from '../../domain/interfaces/ITournamentConfigurationDataSource';
import {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  GenerateFixtureRequest,
  MatchWithRelations,
  MatchStatus,
  AttendingPlayers,
} from '../../domain/entities/Match';
import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError } from '../../shared/exceptions';

export class MatchService {
  constructor(
    private matchDataSource: IMatchDataSource,
    private matchEventDataSource: IMatchEventDataSource,
    private matchStatisticsDataSource: IMatchStatisticsDataSource,
    private tournamentConfigurationDataSource: ITournamentConfigurationDataSource,
    private logger: Logger
  ) {}

  async createMatch(request: CreateMatchRequest): Promise<Match> {
    this.logger.logInfo('MatchService: Creating match', { request });

    // Validaciones básicas
    this.validateCreateMatchRequest(request);

    // Verificar que los equipos sean diferentes
    if (request.homeTeamId === request.awayTeamId) {
      throw new ValidationError('Home team and away team must be different');
    }

    // Obtener siguiente número de partido
    if (!request.matchNumber) {
      request.matchNumber = await this.matchDataSource.getNextMatchNumber(request.tournamentId);
    }

    const match = await this.matchDataSource.create(request);

    this.logger.logInfo('MatchService: Match created successfully', {
      id: match.id,
      tournamentId: match.tournamentId,
    });
    return match;
  }

  async getMatchById(id: number): Promise<MatchWithRelations> {
    this.logger.logInfo('MatchService: Getting match by ID', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const match = await this.matchDataSource.findById(id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    return match;
  }

  async getMatchesByTournament(tournamentId: number): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting matches by tournament', { tournamentId });

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    const matches = await this.matchDataSource.findByTournament(tournamentId);

    this.logger.logInfo('MatchService: Tournament matches retrieved successfully', {
      tournamentId,
      count: matches.length,
    });
    return matches;
  }

  async getMatchesByGroup(groupId: number): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting matches by group', { groupId });

    if (!groupId || groupId <= 0) {
      throw new ValidationError('Valid group ID is required');
    }

    const matches = await this.matchDataSource.findByGroup(groupId);

    this.logger.logInfo('MatchService: Group matches retrieved successfully', {
      groupId,
      count: matches.length,
    });
    return matches;
  }

  async getMatchesByTeam(teamId: number, tournamentId?: number): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting matches by team', { teamId, tournamentId });

    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    const matches = await this.matchDataSource.findByTeam(teamId, tournamentId);

    this.logger.logInfo('MatchService: Team matches retrieved successfully', {
      teamId,
      tournamentId,
      count: matches.length,
    });
    return matches;
  }

  async updateMatch(id: number, request: UpdateMatchRequest): Promise<Match> {
    this.logger.logInfo('MatchService: Updating match', { id, request });

    if (!id || id <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    // Verificar que el partido existe
    const existingMatch = await this.matchDataSource.findById(id);
    if (!existingMatch) {
      throw new NotFoundError('Match not found');
    }

    // Validar cambios de estado
    if (request.status) {
      this.validateStatusTransition(existingMatch.status, request.status);
    }

    const updatedMatch = await this.matchDataSource.update(id, request);
    if (!updatedMatch) {
      throw new NotFoundError('Match not found');
    }

    this.logger.logInfo('MatchService: Match updated successfully', { id });
    return updatedMatch;
  }

  async updateMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<Match> {
    this.logger.logInfo('MatchService: Updating match result', { matchId, homeScore, awayScore });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (homeScore < 0 || awayScore < 0) {
      throw new ValidationError('Scores must be non-negative');
    }

    // Verificar que el partido existe y está en estado correcto
    const existingMatch = await this.matchDataSource.findById(matchId);
    if (!existingMatch) {
      throw new NotFoundError('Match not found');
    }

    if (
      existingMatch.status !== MatchStatus.IN_PROGRESS &&
      existingMatch.status !== MatchStatus.FINISHED
    ) {
      throw new ValidationError('Match must be in progress or finished to update result');
    }

    const updatedMatch = await this.matchDataSource.update(matchId, {
      homeScore,
      awayScore,
      status: MatchStatus.FINISHED,
      endTime: new Date(),
    });

    if (!updatedMatch) {
      throw new NotFoundError('Failed to update match result');
    }

    this.logger.logInfo('MatchService: Match result updated successfully', { matchId });
    return updatedMatch;
  }

  async startMatch(matchId: number): Promise<Match> {
    this.logger.logInfo('MatchService: Starting match', { matchId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const existingMatch = await this.matchDataSource.findById(matchId);
    if (!existingMatch) {
      throw new NotFoundError('Match not found');
    }

    if (existingMatch.status !== MatchStatus.SCHEDULED) {
      throw new ValidationError('Only scheduled matches can be started');
    }

    const updatedMatch = await this.matchDataSource.update(matchId, {
      status: MatchStatus.IN_PROGRESS,
      startTime: new Date(),
    });

    if (!updatedMatch) {
      throw new NotFoundError('Failed to start match');
    }

    this.logger.logInfo('MatchService: Match started successfully', { matchId });
    return updatedMatch;
  }

  async finishMatch(matchId: number): Promise<Match> {
    this.logger.logInfo('MatchService: Finishing match', { matchId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const existingMatch = await this.matchDataSource.findById(matchId);
    if (!existingMatch) {
      throw new NotFoundError('Match not found');
    }

    if (existingMatch.status !== MatchStatus.IN_PROGRESS) {
      throw new ValidationError('Only matches in progress can be finished');
    }

    const updatedMatch = await this.matchDataSource.update(matchId, {
      status: MatchStatus.FINISHED,
      endTime: new Date(),
    });

    if (!updatedMatch) {
      throw new NotFoundError('Failed to finish match');
    }

    this.logger.logInfo('MatchService: Match finished successfully', { matchId });
    return updatedMatch;
  }

  async generateFixture(request: GenerateFixtureRequest): Promise<Match[]> {
    this.logger.logInfo('MatchService: Generating fixture', { request });

    // Validaciones
    if (!request.tournamentId || request.tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    if (!request.startDate) {
      throw new ValidationError('Start date is required');
    }

    if (request.startDate < new Date()) {
      throw new ValidationError('Start date cannot be in the past');
    }

    // Verificar que el torneo tenga configuración
    const config = await this.tournamentConfigurationDataSource.getConfigurationByTournamentId(
      request.tournamentId
    );

    if (!config) {
      throw new ValidationError('Tournament configuration not found');
    }

    if (!config.isConfigured) {
      throw new ValidationError('Tournament must be configured before generating fixture');
    }

    // Generar fixture
    const matches = await this.matchDataSource.generateFixture(request);

    this.logger.logInfo('MatchService: Fixture generated successfully', {
      tournamentId: request.tournamentId,
      matchCount: matches.length,
    });
    return matches;
  }

  async deleteMatch(id: number): Promise<boolean> {
    this.logger.logInfo('MatchService: Deleting match', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    // Verificar que el partido existe
    const existingMatch = await this.matchDataSource.findById(id);
    if (!existingMatch) {
      throw new NotFoundError('Match not found');
    }

    // No permitir eliminar partidos que ya iniciaron
    if (
      existingMatch.status === MatchStatus.IN_PROGRESS ||
      existingMatch.status === MatchStatus.FINISHED
    ) {
      throw new ValidationError('Cannot delete matches that have started or finished');
    }

    // Eliminar eventos y estadísticas relacionadas
    await this.matchEventDataSource.deleteByMatch(id);
    await this.matchStatisticsDataSource.deleteByMatch(id);

    // Eliminar el partido
    const deleted = await this.matchDataSource.delete(id);

    this.logger.logInfo('MatchService: Match deleted successfully', { id });
    return deleted;
  }

  async getUpcomingMatches(teamId?: number, limit = 10): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting upcoming matches', { teamId, limit });

    const matches = await this.matchDataSource.findUpcomingMatches(teamId, limit);

    this.logger.logInfo('MatchService: Upcoming matches retrieved successfully', {
      teamId,
      count: matches.length,
    });
    return matches;
  }

  async getMatchesByStatus(
    status: MatchStatus,
    tournamentId?: number
  ): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting matches by status', { status, tournamentId });

    const matches = await this.matchDataSource.findByStatus(status, tournamentId);

    this.logger.logInfo('MatchService: Matches by status retrieved successfully', {
      status,
      tournamentId,
      count: matches.length,
    });
    return matches;
  }

  async getMatchesByDateRange(
    startDate: Date,
    endDate: Date,
    tournamentId?: number
  ): Promise<MatchWithRelations[]> {
    this.logger.logInfo('MatchService: Getting matches by date range', {
      startDate,
      endDate,
      tournamentId,
    });

    if (startDate >= endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const matches = await this.matchDataSource.findByDateRange(startDate, endDate, tournamentId);

    this.logger.logInfo('MatchService: Matches by date range retrieved successfully', {
      startDate,
      endDate,
      tournamentId,
      count: matches.length,
    });
    return matches;
  }

  private validateCreateMatchRequest(request: CreateMatchRequest): void {
    if (!request.tournamentId || request.tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    if (!request.homeTeamId || request.homeTeamId <= 0) {
      throw new ValidationError('Valid home team ID is required');
    }

    if (!request.awayTeamId || request.awayTeamId <= 0) {
      throw new ValidationError('Valid away team ID is required');
    }

    if (!request.matchDate) {
      throw new ValidationError('Match date is required');
    }

    if (request.matchDate < new Date()) {
      throw new ValidationError('Match date cannot be in the past');
    }
  }

  private validateStatusTransition(currentStatus: string, newStatus: MatchStatus): void {
    const validTransitions: { [key: string]: MatchStatus[] } = {
      [MatchStatus.SCHEDULED]: [MatchStatus.IN_PROGRESS, MatchStatus.CANCELLED],
      [MatchStatus.IN_PROGRESS]: [MatchStatus.FINISHED, MatchStatus.CANCELLED],
      [MatchStatus.FINISHED]: [], // No se puede cambiar desde finalizado
      [MatchStatus.CANCELLED]: [], // No se puede cambiar desde cancelado
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  // Métodos para manejar jugadores asistentes
  async setAttendingPlayers(matchId: number, attendingPlayers: AttendingPlayers): Promise<Match> {
    this.logger.logInfo('MatchService: Setting attending players', { matchId, attendingPlayers });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    // Validar que attendingPlayers tenga la estructura correcta
    this.validateAttendingPlayers(attendingPlayers);

    const match = await this.matchDataSource.update(matchId, { attendingPlayers });
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    this.logger.logInfo('MatchService: Attending players set successfully', { matchId });
    return match;
  }

  async addPlayerToMatch(matchId: number, teamId: number, playerId: number): Promise<Match> {
    this.logger.logInfo('MatchService: Adding player to match', { matchId, teamId, playerId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }
    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }
    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Obtener el partido actual
    const currentMatch = await this.matchDataSource.findById(matchId);
    if (!currentMatch) {
      throw new NotFoundError('Match not found');
    }

    // Verificar que el equipo esté en el partido
    if (teamId !== currentMatch.homeTeamId && teamId !== currentMatch.awayTeamId) {
      throw new ValidationError('Team is not part of this match');
    }

    // Obtener jugadores asistentes actuales
    const attendingPlayers = currentMatch.attendingPlayers || {};
    const teamIdStr = teamId.toString();

    if (!attendingPlayers[teamIdStr]) {
      attendingPlayers[teamIdStr] = [];
    }

    // Agregar jugador si no existe
    if (!attendingPlayers[teamIdStr].includes(playerId)) {
      attendingPlayers[teamIdStr].push(playerId);
    }

    const match = await this.matchDataSource.update(matchId, { attendingPlayers });
    if (!match) {
      throw new NotFoundError('Failed to update match');
    }

    this.logger.logInfo('MatchService: Player added to match successfully', {
      matchId,
      teamId,
      playerId,
    });
    return match;
  }

  async removePlayerFromMatch(matchId: number, teamId: number, playerId: number): Promise<Match> {
    this.logger.logInfo('MatchService: Removing player from match', { matchId, teamId, playerId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }
    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }
    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Obtener el partido actual
    const currentMatch = await this.matchDataSource.findById(matchId);
    if (!currentMatch) {
      throw new NotFoundError('Match not found');
    }

    // Obtener jugadores asistentes actuales
    const attendingPlayers = currentMatch.attendingPlayers || {};
    const teamIdStr = teamId.toString();

    if (attendingPlayers[teamIdStr]) {
      attendingPlayers[teamIdStr] = attendingPlayers[teamIdStr].filter((id) => id !== playerId);

      // Si no quedan jugadores, remover el equipo del objeto
      if (attendingPlayers[teamIdStr].length === 0) {
        delete attendingPlayers[teamIdStr];
      }
    }

    const match = await this.matchDataSource.update(matchId, { attendingPlayers });
    if (!match) {
      throw new NotFoundError('Failed to update match');
    }

    this.logger.logInfo('MatchService: Player removed from match successfully', {
      matchId,
      teamId,
      playerId,
    });
    return match;
  }

  async getAttendingPlayersByMatch(matchId: number): Promise<AttendingPlayers | null> {
    this.logger.logInfo('MatchService: Getting attending players by match', { matchId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const match = await this.matchDataSource.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    this.logger.logInfo('MatchService: Attending players retrieved successfully', {
      matchId,
      hasAttendingPlayers: !!match.attendingPlayers,
    });
    return match.attendingPlayers || null;
  }

  private validateAttendingPlayers(attendingPlayers: AttendingPlayers): void {
    if (!attendingPlayers || typeof attendingPlayers !== 'object') {
      throw new ValidationError('Attending players must be an object');
    }

    for (const [teamId, playerIds] of Object.entries(attendingPlayers)) {
      // Validar que teamId sea un número válido
      const teamIdNum = parseInt(teamId);
      if (isNaN(teamIdNum) || teamIdNum <= 0) {
        throw new ValidationError(`Invalid team ID: ${teamId}`);
      }

      // Validar que playerIds sea un array
      if (!Array.isArray(playerIds)) {
        throw new ValidationError(`Player IDs for team ${teamId} must be an array`);
      }

      // Validar que todos los playerIds sean números válidos
      for (const playerId of playerIds) {
        if (typeof playerId !== 'number' || playerId <= 0) {
          throw new ValidationError(`Invalid player ID: ${playerId} for team ${teamId}`);
        }
      }

      // Validar que no haya playerIds duplicados
      const uniquePlayerIds = [...new Set(playerIds)];
      if (uniquePlayerIds.length !== playerIds.length) {
        throw new ValidationError(`Duplicate player IDs found for team ${teamId}`);
      }
    }
  }
}
