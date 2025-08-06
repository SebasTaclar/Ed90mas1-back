import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService, getTeamService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError } from '../src/shared/exceptions';

const funcCreatePlayer = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Creating player - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos: admin o team owner pueden crear jugadores
  if (user.role !== 'admin' && user.role !== 'team') {
    throw new AuthorizationError('Only administrators or team owners can create players');
  }

  if (!req.body.teamId) {
    throw new AuthorizationError('Team ID is required');
  }

  if (user.role === 'team') {
    const teamService = getTeamService(log);
    const team = await teamService.getTeamById(req.body.teamId);
    const userId = Number(user.id);
    const teamUserId = Number(team.user.id);

    if (userId !== teamUserId) {
      throw new AuthorizationError('You can only add players to your own team');
    }
  }

  const playerService = getPlayerService(log);
  const player = await playerService.createPlayer(req.body);

  return ApiResponseBuilder.success(player, 'Player created successfully');
};

export default withAuthenticatedApiHandler(funcCreatePlayer);
