import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentService, getBlobStorageService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError, NotFoundError } from '../src/shared/exceptions';

const funcDeleteTournamentBanner = async (
  _context: Context,
  _req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const tournamentId = parseInt(_req.params?.id);

  log.logInfo(
    `Deleting banner for tournament ID: ${tournamentId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos - solo admins pueden eliminar banners de torneos
  if (user.role !== 'admin') {
    throw new AuthorizationError('Only administrators can delete tournament banners');
  }

  const tournamentService = getTournamentService(log);
  const blobStorageService = getBlobStorageService(log);

  const existingTournament = await tournamentService.getTournamentById(tournamentId);

  // Verificar que el torneo tiene banner
  if (!existingTournament.bannerPath) {
    throw new NotFoundError('Tournament does not have a banner to delete');
  }

  // Eliminar banner del blob storage
  await blobStorageService.deleteTournamentBanner(existingTournament.bannerPath);

  // Actualizar tournament removiendo la URL del banner
  const updatedTournament = await tournamentService.updateTournament(tournamentId, {
    bannerPath: null,
  });

  log.logInfo('Tournament banner deleted successfully', {
    tournamentId,
    deletedBannerUrl: existingTournament.bannerPath,
  });

  return ApiResponseBuilder.success({
    tournament: updatedTournament,
    message: 'Tournament banner deleted successfully',
  });
};

export default withAuthenticatedApiHandler(funcDeleteTournamentBanner);
