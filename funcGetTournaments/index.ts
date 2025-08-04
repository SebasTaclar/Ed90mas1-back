import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentService } from '../src/shared/serviceProvider';

const funcGetTournaments = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  log.logInfo('Getting all tournaments - Public endpoint');

  const tournamentService = getTournamentService(log);
  const tournaments = await tournamentService.getAllTournaments();

  return ApiResponseBuilder.success(tournaments, 'Tournaments retrieved successfully');
};

export default withApiHandler(funcGetTournaments);
