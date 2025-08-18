import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchStatisticsService } from '../src/shared/serviceProvider';

const funcMatchStatistics = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const matchStatisticsService = getMatchStatisticsService(log);
  const matchId = req.params?.matchId ? parseInt(req.params.matchId) : undefined;
  const statisticsId = req.params?.statisticsId ? parseInt(req.params.statisticsId) : undefined;

  switch (req.method) {
    case 'POST':
      if (!statisticsId) {
        // Crear estadísticas de partidos
        const createRequest = JSON.parse(req.body || '{}');
        const statistics = await matchStatisticsService.createStatistics(createRequest);
        return ApiResponseBuilder.success(statistics, 'Statistics created successfully');
      } else {
        // Inicializar estadísticas de un partido (requiere playerIds)
        const { matchId: bodyMatchId, playerIds } = JSON.parse(req.body || '{}');
        if (!bodyMatchId || !playerIds || !Array.isArray(playerIds)) {
          return ApiResponseBuilder.error(
            'matchId and playerIds array are required for initialization',
            400
          );
        }
        const result = await matchStatisticsService.initializeMatchStatistics(
          bodyMatchId,
          playerIds
        );
        return ApiResponseBuilder.success(result, 'Match statistics initialized successfully');
      }

    case 'GET': {
      if (statisticsId) {
        // Get specific statistics record
        const statistics = await matchStatisticsService.getStatisticsById(statisticsId);
        if (!statistics) {
          return ApiResponseBuilder.error('Statistics not found', 404);
        }
        return ApiResponseBuilder.success(statistics, 'Statistics retrieved successfully');
      } else if (matchId) {
        // Get all statistics for match
        const statistics = await matchStatisticsService.getStatisticsByMatch(matchId);
        return ApiResponseBuilder.success(statistics, 'Match statistics retrieved successfully');
      } else {
        // Get statistics with filters
        const { playerId, teamId, tournamentId } = req.query || {};

        if (playerId) {
          const stats = await matchStatisticsService.getStatisticsByPlayer(
            parseInt(playerId as string),
            tournamentId ? parseInt(tournamentId as string) : undefined
          );
          return ApiResponseBuilder.success(stats, 'Player statistics retrieved successfully');
        } else if (teamId) {
          const stats = await matchStatisticsService.getStatisticsByTeam(
            parseInt(teamId as string),
            tournamentId ? parseInt(tournamentId as string) : undefined
          );
          return ApiResponseBuilder.success(stats, 'Team statistics retrieved successfully');
        } else {
          return ApiResponseBuilder.error(
            'Se requiere al menos un filtro: matchId, playerId o teamId',
            400
          );
        }
      }
    }

    case 'PUT': {
      if (!statisticsId) {
        return ApiResponseBuilder.error('Statistics ID is required for updates', 400);
      }

      const updateData = JSON.parse(req.body || '{}');
      const updatedStatistics = await matchStatisticsService.updateStatistics(
        statisticsId,
        updateData
      );
      return ApiResponseBuilder.success(updatedStatistics, 'Statistics updated successfully');
    }

    case 'DELETE': {
      if (!statisticsId) {
        return ApiResponseBuilder.error('Statistics ID is required for deletion', 400);
      }

      const deleted = await matchStatisticsService.deleteStatistics(statisticsId);
      if (deleted) {
        return ApiResponseBuilder.success(null, 'Statistics deleted successfully');
      } else {
        return ApiResponseBuilder.error('Statistics not found', 404);
      }
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withApiHandler(funcMatchStatistics);
