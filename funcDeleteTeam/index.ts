import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcDeleteTeam = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const teamId = parseInt(req.params?.id);

  log.logInfo(`Deleting team ID: ${teamId} - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos basados en el rol del usuario autenticado
  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can delete teams', 403);
  }

  if (!teamId || isNaN(teamId)) {
    return ApiResponseBuilder.error('Invalid team ID', 400);
  }

  const teamService = getTeamService(log);
  await teamService.deleteTeam(teamId);

  return ApiResponseBuilder.success(null, 'Team deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeleteTeam);
