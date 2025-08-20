import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchService } from '../src/shared/serviceProvider';

const funcMatchFixtures = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const matchService = getMatchService(log);
  const tournamentId = req.params?.tournamentId ? parseInt(req.params.tournamentId) : undefined;

  if (!tournamentId) {
    return ApiResponseBuilder.error('Tournament ID is required', 400);
  }

  switch (req.method) {
    case 'POST': {
      // Generate fixtures for tournament
      const request = {
        ...req.body,
        tournamentId,
      };

      log.logInfo('Generate fixtures request received', { request });

      const fixtures = await matchService.generateFixture(request);
      return ApiResponseBuilder.success(
        fixtures,
        `Generated ${fixtures.length} matches for tournament`
      );
    }

    case 'DELETE': {
      // Delete all matches for tournament
      // For now, we'll use a direct call to the data source
      // TODO: Add deleteMatchesByTournament method to MatchService
      return ApiResponseBuilder.error('Delete tournament matches not yet implemented', 501);
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withApiHandler(funcMatchFixtures);
