import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';

const funcGetPlayersByTeam = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const teamId = parseInt(req.params?.id);

  log.logInfo(`Getting players for team ID: ${teamId} - Public endpoint`);

  const playerService = getPlayerService(log);
  const players = await playerService.getPlayersByTeam(teamId);

  return ApiResponseBuilder.success(players, 'Players retrieved successfully');
};

export default withApiHandler(funcGetPlayersByTeam);
