import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService, getBlobStorageService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcDeleteTeamLogo = async (
  _context: Context,
  _req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const teamId = parseInt(_req.params?.id);

  log.logInfo(
    `Deleting logo for team ID: ${teamId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  const teamService = getTeamService(log);
  const blobStorageService = getBlobStorageService(log);

  const existingTeam = await teamService.getTeamById(teamId);

  // Verificar permisos
  if (user.role !== 'admin' && user.id !== existingTeam.user.id.toString()) {
    return ApiResponseBuilder.error('Forbidden: You can only delete logos for your own team', 403);
  }

  // Verificar que el equipo tiene logo
  if (!existingTeam.logoPath) {
    return ApiResponseBuilder.error('Team has no logo to delete', 400);
  }

  // Eliminar logo del blob storage
  await blobStorageService.deleteTeamLogo(existingTeam.logoPath);

  // Actualizar equipo removiendo logoPath
  await teamService.updateTeam(teamId, { logoPath: null }, user);

  return ApiResponseBuilder.success(null, 'Team logo deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeleteTeamLogo);
