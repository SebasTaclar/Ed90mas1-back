import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';

const funcGetPlayers = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  log.logInfo('Getting all players - Public endpoint');

  const playerService = getPlayerService(log);
  const players = await playerService.getAllPlayers();

  return ApiResponseBuilder.success(players, 'Players retrieved successfully');
};

export default withApiHandler(funcGetPlayers);
