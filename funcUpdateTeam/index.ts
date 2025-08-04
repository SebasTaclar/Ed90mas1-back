import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcUpdateTeam = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const teamId = parseInt(req.params?.id);

  log.logInfo(`Updating team ID: ${teamId} - Requested by: ${user.email} (Role: ${user.role})`);

  const teamService = getTeamService(log);
  const updatedTeam = await teamService.updateTeam(teamId, req.body, user);

  return ApiResponseBuilder.success(updatedTeam, 'Team updated successfully');
};

export default withAuthenticatedApiHandler(funcUpdateTeam);
