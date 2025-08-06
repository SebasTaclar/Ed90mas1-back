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

  // Verificar permisos: admin o team owner pueden actualizar jugadores
  if (user.role !== 'admin' && user.role !== 'team') {
    throw new AuthorizationError('Only administrators or team owners can update players');
  }

  const playerService = getPlayerService(log);

  // Si es rol "team", verificar que es owner del equipo del jugador
  if (user.role === 'team') {
    const existingPlayer = await playerService.getPlayerById(playerId);

    // Comparar como números para evitar problemas de tipo
    const userId = Number(user.id);
    const teamUserId = Number(existingPlayer.team.user?.id);

    if (userId !== teamUserId) {
      throw new AuthorizationError('You can only update players from your own team');
    }

    // Si está cambiando el equipo del jugador, verificar que el nuevo equipo también le pertenece
    if (req.body.teamId && req.body.teamId !== existingPlayer.teamId) {
      const { getTeamService } = await import('../src/shared/serviceProvider');
      const teamService = getTeamService(log);
      const newTeam = await teamService.getTeamById(req.body.teamId);

      // Comparar como números para evitar problemas de tipo
      const userId = Number(user.id);
      const newTeamUserId = Number(newTeam.user.id);

      if (userId !== newTeamUserId) {
        throw new AuthorizationError('You can only move players to your own teams');
      }
    }
  }

  const player = await playerService.updatePlayer(playerId, req.body);

  return ApiResponseBuilder.success(player, 'Player updated successfully');
};

export default withAuthenticatedApiHandler(funcUpdatePlayer);
