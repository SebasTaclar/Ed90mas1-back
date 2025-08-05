import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError } from '../src/shared/exceptions';

const funcCreatePlayer = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Creating player - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos: solo admin o owner del equipo pueden crear jugadores
  if (user.role !== 'admin') {
    // Si no es admin, verificar si es el owner del equipo
    if (!req.body.teamId) {
      throw new AuthorizationError('Team ID is required');
    }

    // Aquí necesitaríamos verificar si el usuario es owner del equipo
    // Por ahora, solo permitimos a admins crear jugadores
    throw new AuthorizationError('Only administrators can create players');
  }

  const playerService = getPlayerService(log);
  const player = await playerService.createPlayer(req.body);

  return ApiResponseBuilder.success(player, 'Player created successfully');
};

export default withAuthenticatedApiHandler(funcCreatePlayer);
