import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getBlobStorageService, getPlayerService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError, ValidationError } from '../src/shared/exceptions';

const funcDeletePlayerPhoto = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const playerId = parseInt(req.params?.id);

  log.logInfo(
    `Deleting photo for player ID: ${playerId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos: admin o team owner pueden eliminar fotos de jugadores
  if (user.role !== 'admin' && user.role !== 'team') {
    throw new AuthorizationError('Only administrators or team owners can delete player photos');
  }

  const playerService = getPlayerService(log);
  const blobService = getBlobStorageService(log);

  const player = await playerService.getPlayerById(playerId);

  // Si es rol "team", verificar que es owner del equipo del jugador
  if (user.role === 'team') {
    // Comparar como números para evitar problemas de tipo
    const userId = Number(user.id);
    const teamUserId = Number(player.team.user?.id);

    if (userId !== teamUserId) {
      throw new AuthorizationError('You can only delete photos for players from your own team');
    }
  }

  if (!player.profilePhotoPath) {
    throw new ValidationError('Player does not have a photo to delete');
  }

  // Eliminar foto del blob storage
  await blobService.deletePlayerPhoto(player.profilePhotoPath);

  // Actualizar registro en la base de datos
  const updatedPlayer = await playerService.updatePlayerPhoto(playerId, null);

  log.logInfo(`Photo deleted successfully for player ${playerId}`);

  return ApiResponseBuilder.success(updatedPlayer, 'Player photo deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeletePlayerPhoto);
