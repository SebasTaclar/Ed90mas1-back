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

  // Verificar permisos: admin o team owner pueden eliminar jugadores
  if (user.role !== 'admin' && user.role !== 'team') {
    throw new AuthorizationError('Only administrators or team owners can delete players');
  }

  const playerService = getPlayerService(log);

  // Si es rol "team", verificar que es owner del equipo del jugador
  if (user.role === 'team') {
    const player = await playerService.getPlayerById(playerId);

    // Comparar como números para evitar problemas de tipo
    const userId = Number(user.id);
    const teamUserId = Number(player.team.user?.id);

    if (userId !== teamUserId) {
      throw new AuthorizationError('You can only delete players from your own team');
    }
  }
  await playerService.deletePlayer(playerId);

  return ApiResponseBuilder.success(null, 'Player deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeletePlayer);
