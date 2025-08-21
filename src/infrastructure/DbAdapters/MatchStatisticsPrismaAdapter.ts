import { getPrismaClient } from '../../config/PrismaClient';
import { IMatchStatisticsDataSource } from '../../domain/interfaces/IMatchStatisticsDataSource';
import {
  MatchStatistics,
  CreateMatchStatisticsRequest,
  UpdateMatchStatisticsRequest,
  MatchStatisticsWithRelations,
  TournamentStatistics,
  PlayerTournamentStats,
  TeamTournamentStats,
} from '../../domain/entities/MatchStatistics';
import { Logger } from '../../shared/Logger';

export class MatchStatisticsPrismaAdapter implements IMatchStatisticsDataSource {
  private readonly prisma = getPrismaClient();

  constructor(private logger: Logger) {}

  async create(request: CreateMatchStatisticsRequest): Promise<MatchStatistics> {
    try {
      this.logger.logInfo('Creating match statistics', {
        matchId: request.matchId,
        playerId: request.playerId,
      });

      const stats = await this.prisma.matchStatistics.create({
        data: {
          matchId: request.matchId,
          playerId: request.playerId,
          teamId: request.teamId,
          minutesPlayed: request.minutesPlayed || 0,
          goals: request.goals || 0,
          assists: request.assists || 0,
          yellowCards: request.yellowCards || 0,
          redCards: request.redCards || 0,
          shotsOnTarget: request.shotsOnTarget || 0,
          shotsOffTarget: request.shotsOffTarget || 0,
          foulsCommitted: request.foulsCommitted || 0,
          foulsReceived: request.foulsReceived || 0,
          corners: request.corners || 0,
          offsides: request.offsides || 0,
          saves: request.saves || 0,
        },
      });

      this.logger.logInfo('Match statistics created successfully', { id: stats.id });
      return stats;
    } catch (error) {
      this.logger.logError('Error creating match statistics', error);
      throw new Error('Failed to create match statistics');
    }
  }

  async findById(id: number): Promise<MatchStatisticsWithRelations | null> {
    try {
      this.logger.logInfo('Finding match statistics by ID', { id });

      const stats = await this.prisma.matchStatistics.findUnique({
        where: { id },
        include: {
          match: {
            select: { id: true, matchDate: true },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
              position: true,
            },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      });

      return stats;
    } catch (error) {
      this.logger.logError('Error finding match statistics by ID', error);
      throw new Error('Failed to find match statistics');
    }
  }

  async findByMatch(matchId: number): Promise<MatchStatisticsWithRelations[]> {
    try {
      this.logger.logInfo('Finding statistics by match', { matchId });

      const stats = await this.prisma.matchStatistics.findMany({
        where: { matchId },
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
              position: true,
            },
          },
          team: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ player: { jerseyNumber: 'asc' } }],
      });

      this.logger.logInfo('Match statistics retrieved successfully', {
        matchId,
        count: stats.length,
      });
      return stats;
    } catch (error) {
      this.logger.logError('Error finding statistics by match', error);
      throw new Error('Failed to retrieve match statistics');
    }
  }

  async findByPlayer(
    playerId: number,
    tournamentId?: number
  ): Promise<MatchStatisticsWithRelations[]> {
    try {
      this.logger.logInfo('Finding statistics by player', { playerId, tournamentId });

      const whereClause: any = { playerId };

      if (tournamentId) {
        whereClause.match = {
          tournamentId: tournamentId,
        };
      }

      const stats = await this.prisma.matchStatistics.findMany({
        where: whereClause,
        include: {
          match: {
            select: { id: true, matchDate: true },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
              position: true,
            },
          },
          team: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ match: { matchDate: 'desc' } }],
      });

      this.logger.logInfo('Player statistics retrieved successfully', {
        playerId,
        tournamentId,
        count: stats.length,
      });
      return stats;
    } catch (error) {
      this.logger.logError('Error finding statistics by player', error);
      throw new Error('Failed to retrieve player statistics');
    }
  }

  async findByTeam(teamId: number, tournamentId?: number): Promise<MatchStatisticsWithRelations[]> {
    try {
      this.logger.logInfo('Finding statistics by team', { teamId, tournamentId });

      const whereClause: any = { teamId };

      if (tournamentId) {
        whereClause.match = {
          tournamentId: tournamentId,
        };
      }

      const stats = await this.prisma.matchStatistics.findMany({
        where: whereClause,
        include: {
          match: {
            select: { id: true, matchDate: true },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
              position: true,
            },
          },
          team: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ match: { matchDate: 'desc' } }],
      });

      this.logger.logInfo('Team statistics retrieved successfully', {
        teamId,
        tournamentId,
        count: stats.length,
      });
      return stats;
    } catch (error) {
      this.logger.logError('Error finding statistics by team', error);
      throw new Error('Failed to retrieve team statistics');
    }
  }

  async update(id: number, request: UpdateMatchStatisticsRequest): Promise<MatchStatistics | null> {
    try {
      this.logger.logInfo('Updating match statistics', { id, request });

      const stats = await this.prisma.matchStatistics.update({
        where: { id },
        data: {
          ...request,
        },
      });

      this.logger.logInfo('Match statistics updated successfully', { id });
      return stats;
    } catch (error) {
      this.logger.logError('Error updating match statistics', error);
      if (error.code === 'P2025') {
        return null;
      }
      throw new Error('Failed to update match statistics');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting match statistics', { id });

      await this.prisma.matchStatistics.delete({
        where: { id },
      });

      this.logger.logInfo('Match statistics deleted successfully', { id });
      return true;
    } catch (error) {
      this.logger.logError('Error deleting match statistics', error);
      if (error.code === 'P2025') {
        return false;
      }
      throw new Error('Failed to delete match statistics');
    }
  }

  async upsert(
    matchId: number,
    playerId: number,
    request: UpdateMatchStatisticsRequest
  ): Promise<MatchStatistics> {
    try {
      this.logger.logInfo('Upserting match statistics', { matchId, playerId });

      // Obtener el teamId del jugador
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
        select: { teamId: true },
      });

      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }

      const stats = await this.prisma.matchStatistics.upsert({
        where: {
          matchId_playerId: {
            matchId,
            playerId,
          },
        },
        update: request,
        create: {
          matchId,
          playerId,
          teamId: player.teamId,
          minutesPlayed: request.minutesPlayed || 0,
          goals: request.goals || 0,
          assists: request.assists || 0,
          yellowCards: request.yellowCards || 0,
          redCards: request.redCards || 0,
          shotsOnTarget: request.shotsOnTarget || 0,
          shotsOffTarget: request.shotsOffTarget || 0,
          foulsCommitted: request.foulsCommitted || 0,
          foulsReceived: request.foulsReceived || 0,
          corners: request.corners || 0,
          offsides: request.offsides || 0,
          saves: request.saves || 0,
        },
      });

      this.logger.logInfo('Match statistics upserted successfully', { id: stats.id });
      return stats;
    } catch (error) {
      this.logger.logError('Error upserting match statistics', error);
      throw new Error('Failed to upsert match statistics');
    }
  }

  async deleteByMatch(matchId: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting all statistics by match', { matchId });

      const result = await this.prisma.matchStatistics.deleteMany({
        where: { matchId },
      });

      this.logger.logInfo('Match statistics deleted successfully', {
        matchId,
        deletedCount: result.count,
      });
      return true;
    } catch (error) {
      this.logger.logError('Error deleting statistics by match', error);
      throw new Error('Failed to delete match statistics');
    }
  }

  async initializeMatchStatistics(
    matchId: number,
    playerIds: number[]
  ): Promise<MatchStatistics[]> {
    try {
      this.logger.logInfo('Initializing match statistics', {
        matchId,
        playerCount: playerIds.length,
      });

      // Process players SEQUENTIALLY to avoid multiple DB connections
      const results: MatchStatistics[] = [];
      for (const playerId of playerIds) {
        const player = await this.prisma.player.findUnique({
          where: { id: playerId },
          select: { teamId: true },
        });

        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }

        const result = await this.prisma.matchStatistics.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId,
            },
          },
          update: {}, // No actualizar si ya existe
          create: {
            matchId,
            playerId,
            teamId: player.teamId,
            minutesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            shotsOnTarget: 0,
            shotsOffTarget: 0,
            foulsCommitted: 0,
            foulsReceived: 0,
            corners: 0,
            offsides: 0,
            saves: 0,
          },
        });

        results.push(result);
      }

      this.logger.logInfo('Match statistics initialized successfully', { matchId });
      return results;
    } catch (error) {
      this.logger.logError('Error initializing match statistics', error);
      throw new Error('Failed to initialize match statistics');
    }
  }

  async getTournamentStatistics(tournamentId: number): Promise<TournamentStatistics> {
    try {
      this.logger.logInfo('Getting tournament statistics', { tournamentId });

      // Obtener estadísticas agregadas del torneo
      const stats = await this.prisma.matchStatistics.aggregate({
        where: {
          match: {
            tournamentId: tournamentId,
            status: 'finished',
          },
        },
        _sum: {
          goals: true,
          assists: true,
          yellowCards: true,
          redCards: true,
        },
        _count: {
          id: true,
        },
      });

      const matchCount = await this.prisma.match.count({
        where: {
          tournamentId: tournamentId,
          status: 'finished',
        },
      });

      const topScorers = await this.getTopScorers(tournamentId, 10);
      const topAssists = await this.getTopAssists(tournamentId, 10);
      const teamStats = await this.getTeamTournamentStats(tournamentId);

      const result: TournamentStatistics = {
        tournamentId,
        totalMatches: matchCount,
        totalGoals: stats._sum.goals || 0,
        totalCards: (stats._sum.yellowCards || 0) + (stats._sum.redCards || 0),
        topScorers,
        topAssists,
        teamStats,
      };

      this.logger.logInfo('Tournament statistics retrieved successfully', { tournamentId });
      return result;
    } catch (error) {
      this.logger.logError('Error getting tournament statistics', error);
      throw new Error('Failed to retrieve tournament statistics');
    }
  }

  async getPlayerTournamentStats(
    tournamentId: number,
    limit = 50
  ): Promise<PlayerTournamentStats[]> {
    try {
      // Query SQL para obtener estadísticas de jugadores usando match_events
      const stats = await this.prisma.$queryRaw<PlayerTournamentStats[]>`
        WITH player_events AS (
          SELECT 
            p.id as player_id,
            p.first_name,
            p.last_name,
            t.name as team_name,
            me.match_id,
            me.event_type
          FROM players p
          JOIN teams t ON p.team_id = t.id
          LEFT JOIN match_events me ON p.id = me.player_id
          LEFT JOIN matches m ON me.match_id = m.id
          WHERE m.tournament_id = ${tournamentId} 
            AND m.status != 'scheduled'
        ),
        player_stats AS (
          SELECT 
            player_id,
            first_name,
            last_name,
            team_name,
            COUNT(DISTINCT match_id) as matches_played,
            COUNT(CASE WHEN event_type = 'goal' THEN 1 END) as goals,
            COUNT(CASE WHEN event_type = 'assist' THEN 1 END) as assists,
            COUNT(CASE WHEN event_type = 'yellow_card' THEN 1 END) as yellow_cards,
            COUNT(CASE WHEN event_type = 'red_card' THEN 1 END) as red_cards
          FROM player_events
          WHERE player_id IS NOT NULL
          GROUP BY player_id, first_name, last_name, team_name
        )
        SELECT 
          player_id as "playerId",
          first_name as "firstName",
          last_name as "lastName",
          team_name as "teamName",
          goals::int as goals,
          assists::int as assists,
          yellow_cards::int as "yellowCards",
          red_cards::int as "redCards",
          matches_played::int as "matchesPlayed",
          0::int as "totalMinutes"
        FROM player_stats
        WHERE matches_played > 0
        ORDER BY goals DESC, assists DESC
        LIMIT ${limit}
      `;

      return stats;
    } catch (error) {
      this.logger.logError('Error getting player tournament stats', error);
      throw new Error('Failed to retrieve player tournament statistics');
    }
  }

  async getTeamTournamentStats(tournamentId: number): Promise<TeamTournamentStats[]> {
    try {
      // Query SQL para obtener estadísticas de equipos usando match_events
      const stats = await this.prisma.$queryRaw<TeamTournamentStats[]>`
        WITH team_goals AS (
          -- Obtener goles de cada equipo por partido (excluyendo partidos scheduled)
          SELECT 
            m.id as match_id,
            m.home_team_id,
            m.away_team_id,
            COALESCE(home_goals.goals, 0) as home_goals,
            COALESCE(away_goals.goals, 0) as away_goals
          FROM matches m
          LEFT JOIN (
            SELECT 
              me.match_id,
              COUNT(*) as goals
            FROM match_events me
            JOIN players p ON me.player_id = p.id
            JOIN matches m2 ON me.match_id = m2.id
            WHERE me.event_type = 'goal' 
              AND p.team_id = m2.home_team_id
              AND m2.status NOT IN ('scheduled', 'not_started')
            GROUP BY me.match_id
          ) home_goals ON m.id = home_goals.match_id
          LEFT JOIN (
            SELECT 
              me.match_id,
              COUNT(*) as goals
            FROM match_events me
            JOIN players p ON me.player_id = p.id
            JOIN matches m2 ON me.match_id = m2.id
            WHERE me.event_type = 'goal' 
              AND p.team_id = m2.away_team_id
              AND m2.status != 'scheduled'
            GROUP BY me.match_id
          ) away_goals ON m.id = away_goals.match_id
          WHERE m.tournament_id = ${tournamentId}
            AND m.status != 'scheduled'
        ),
        team_match_results AS (
          SELECT 
            t.id as team_id,
            t.name as team_name,
            tg.match_id,
            CASE 
              WHEN t.id = tg.home_team_id THEN 'home'
              ELSE 'away'
            END as team_position,
            CASE 
              WHEN t.id = tg.home_team_id THEN tg.home_goals
              ELSE tg.away_goals
            END as goals_for,
            CASE 
              WHEN t.id = tg.home_team_id THEN tg.away_goals
              ELSE tg.home_goals
            END as goals_against
          FROM teams t
          JOIN team_goals tg ON (t.id = tg.home_team_id OR t.id = tg.away_team_id)
        )
        SELECT 
          team_id as "teamId",
          team_name as "teamName",
          COUNT(*)::int as "matchesPlayed",
          SUM(CASE 
            WHEN goals_for > goals_against THEN 1 
            ELSE 0 
          END)::int as wins,
          SUM(CASE 
            WHEN goals_for = goals_against THEN 1 
            ELSE 0 
          END)::int as draws,
          SUM(CASE 
            WHEN goals_for < goals_against THEN 1 
            ELSE 0 
          END)::int as losses,
          COALESCE(SUM(goals_for), 0)::int as "goalsFor",
          COALESCE(SUM(goals_against), 0)::int as "goalsAgainst",
          (COALESCE(SUM(goals_for), 0) - COALESCE(SUM(goals_against), 0))::int as "goalDifference",
          (SUM(CASE 
            WHEN goals_for > goals_against THEN 3 
            WHEN goals_for = goals_against THEN 1 
            ELSE 0 
          END))::int as points
        FROM team_match_results
        GROUP BY team_id, team_name
        ORDER BY points DESC, "goalDifference" DESC, "goalsFor" DESC
      `;

      return stats;
    } catch (error) {
      this.logger.logError('Error getting team tournament stats', error);
      throw new Error('Failed to retrieve team tournament statistics');
    }
  }

  async getTopScorers(tournamentId: number, limit = 10): Promise<PlayerTournamentStats[]> {
    try {
      const stats = await this.prisma.$queryRaw<PlayerTournamentStats[]>`
        WITH player_goals AS (
          SELECT 
            p.id as player_id,
            p.first_name,
            p.last_name,
            t.name as team_name,
            me.match_id,
            me.event_type
          FROM players p
          JOIN teams t ON p.team_id = t.id
          LEFT JOIN match_events me ON p.id = me.player_id
          LEFT JOIN matches m ON me.match_id = m.id
          WHERE m.tournament_id = ${tournamentId} 
            AND m.status != 'scheduled'
            AND me.event_type IN ('goal', 'assist', 'yellow_card', 'red_card')
        ),
        player_stats AS (
          SELECT 
            player_id,
            first_name,
            last_name,
            team_name,
            COUNT(DISTINCT match_id) as matches_played,
            COUNT(CASE WHEN event_type = 'goal' THEN 1 END) as goals,
            COUNT(CASE WHEN event_type = 'assist' THEN 1 END) as assists,
            COUNT(CASE WHEN event_type = 'yellow_card' THEN 1 END) as yellow_cards,
            COUNT(CASE WHEN event_type = 'red_card' THEN 1 END) as red_cards
          FROM player_goals
          WHERE player_id IS NOT NULL
          GROUP BY player_id, first_name, last_name, team_name
        )
        SELECT 
          player_id as "playerId",
          first_name as "firstName",
          last_name as "lastName",
          team_name as "teamName",
          goals::int as goals,
          assists::int as assists,
          yellow_cards::int as "yellowCards",
          red_cards::int as "redCards",
          matches_played::int as "matchesPlayed",
          0::int as "totalMinutes"
        FROM player_stats
        WHERE goals > 0
        ORDER BY goals DESC, assists DESC
        LIMIT ${limit}
      `;

      return stats;
    } catch (error) {
      this.logger.logError('Error getting top scorers', error);
      throw new Error('Failed to retrieve top scorers');
    }
  }

  async getTopAssists(tournamentId: number, limit = 10): Promise<PlayerTournamentStats[]> {
    try {
      const stats = await this.prisma.$queryRaw<PlayerTournamentStats[]>`
        WITH player_assists AS (
          SELECT 
            p.id as player_id,
            p.first_name,
            p.last_name,
            t.name as team_name,
            me.match_id,
            me.event_type
          FROM players p
          JOIN teams t ON p.team_id = t.id
          LEFT JOIN match_events me ON p.id = me.player_id
          LEFT JOIN matches m ON me.match_id = m.id
          WHERE m.tournament_id = ${tournamentId} 
            AND m.status != 'scheduled'
            AND me.event_type IN ('goal', 'assist', 'yellow_card', 'red_card')
        ),
        player_stats AS (
          SELECT 
            player_id,
            first_name,
            last_name,
            team_name,
            COUNT(DISTINCT match_id) as matches_played,
            COUNT(CASE WHEN event_type = 'goal' THEN 1 END) as goals,
            COUNT(CASE WHEN event_type = 'assist' THEN 1 END) as assists,
            COUNT(CASE WHEN event_type = 'yellow_card' THEN 1 END) as yellow_cards,
            COUNT(CASE WHEN event_type = 'red_card' THEN 1 END) as red_cards
          FROM player_assists
          WHERE player_id IS NOT NULL
          GROUP BY player_id, first_name, last_name, team_name
        )
        SELECT 
          player_id as "playerId",
          first_name as "firstName",
          last_name as "lastName",
          team_name as "teamName",
          goals::int as goals,
          assists::int as assists,
          yellow_cards::int as "yellowCards",
          red_cards::int as "redCards",
          matches_played::int as "matchesPlayed",
          0::int as "totalMinutes"
        FROM player_stats
        WHERE assists > 0
        ORDER BY assists DESC, goals DESC
        LIMIT ${limit}
      `;

      return stats;
    } catch (error) {
      this.logger.logError('Error getting top assists', error);
      throw new Error('Failed to retrieve top assists');
    }
  }
}
