import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService, getBlobStorageService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError, NotFoundError } from '../src/shared/exceptions';

const funcDeletePlayerPhoto = async (
  _context: Context,
  _req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const playerId = parseInt(_req.params?.id);

  log.logInfo(
    `Deleting photo for player ID: ${playerId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos - solo admins pueden eliminar fotos de jugadores
  if (user.role !== 'admin') {
    throw new AuthorizationError('Only administrators can delete player photos');
  }

  const playerService = getPlayerService(log);
  const blobStorageService = getBlobStorageService(log);

  const existingPlayer = await playerService.getPlayerById(playerId);

  // Verificar que el jugador tiene foto
  if (!existingPlayer.profilePhotoPath) {
    throw new NotFoundError('Player does not have a photo to delete');
  }

  // Eliminar foto del blob storage
  await blobStorageService.deletePlayerPhoto(existingPlayer.profilePhotoPath);

  // Actualizar player removiendo la URL de la foto
  const updatedPlayer = await playerService.updatePlayer(playerId, {
    profilePhotoPath: null,
  });

  log.logInfo('Player photo deleted successfully', {
    playerId,
    deletedPhotoUrl: existingPlayer.profilePhotoPath,
  });

  return ApiResponseBuilder.success({
    player: updatedPlayer,
    message: 'Player photo deleted successfully',
  });
};

export default withAuthenticatedApiHandler(funcDeletePlayerPhoto);
