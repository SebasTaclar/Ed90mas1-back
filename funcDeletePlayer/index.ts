import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError } from '../src/shared/exceptions';

const funcDeletePlayer = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const playerId = parseInt(req.params?.id);

  log.logInfo(`Deleting player ID: ${playerId} - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos: solo admin puede eliminar jugadores
  if (user.role !== 'admin') {
    throw new AuthorizationError('Only administrators can delete players');
  }

  const playerService = getPlayerService(log);
  await playerService.deletePlayer(playerId);

  return ApiResponseBuilder.success(null, 'Player deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeletePlayer);
