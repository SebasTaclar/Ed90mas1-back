import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError } from '../src/shared/exceptions';

const funcUpdatePlayer = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const playerId = parseInt(req.params?.id);

  log.logInfo(`Updating player ID: ${playerId} - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos: solo admin puede actualizar jugadores
  if (user.role !== 'admin') {
    throw new AuthorizationError('Only administrators can update players');
  }

  const playerService = getPlayerService(log);
  const player = await playerService.updatePlayer(playerId, req.body);

  return ApiResponseBuilder.success(player, 'Player updated successfully');
};

export default withAuthenticatedApiHandler(funcUpdatePlayer);
