import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';

const funcGetPlayerById = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const playerId = parseInt(req.params?.id);

  log.logInfo(`Getting player by ID: ${playerId} - Public endpoint`);

  const playerService = getPlayerService(log);
  const player = await playerService.getPlayerById(playerId);

  return ApiResponseBuilder.success(player, 'Player retrieved successfully');
};

export default withApiHandler(funcGetPlayerById);
