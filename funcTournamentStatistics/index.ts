import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchStatisticsService } from '../src/shared/serviceProvider';

const funcTournamentStatistics = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const matchStatisticsService = getMatchStatisticsService(log);
  const tournamentId = req.params?.tournamentId ? parseInt(req.params.tournamentId) : undefined;
  const type = req.params?.type as string;

  if (!tournamentId) {
    return ApiResponseBuilder.error('Tournament ID is required', 400);
  }

  switch (type) {
    case 'teams': {
      // Get team statistics for tournament
      const statistics = await matchStatisticsService.getTeamTournamentStats(tournamentId);
      return ApiResponseBuilder.success(
        statistics,
        'Tournament team statistics retrieved successfully'
      );
    }

    case 'players': {
      // Get player statistics for tournament
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      const statistics = await matchStatisticsService.getPlayerTournamentStats(
        tournamentId,
        teamId
      );
      return ApiResponseBuilder.success(
        statistics,
        'Tournament player statistics retrieved successfully'
      );
    }

    case 'top-scorers': {
      // Get top scorers in tournament
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topScorers = await matchStatisticsService.getTopScorers(tournamentId, limit);
      return ApiResponseBuilder.success(topScorers, 'Top scorers retrieved successfully');
    }

    case 'top-assists': {
      // Get top assists in tournament
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topAssists = await matchStatisticsService.getTopAssists(tournamentId, limit);
      return ApiResponseBuilder.success(topAssists, 'Top assists retrieved successfully');
    }

    default: {
      // Get overall tournament statistics
      const statistics = await matchStatisticsService.getTournamentStatistics(tournamentId);
      return ApiResponseBuilder.success(statistics, 'Tournament statistics retrieved successfully');
    }
  }
};

export default withApiHandler(funcTournamentStatistics);
