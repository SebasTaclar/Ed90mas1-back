import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcGetTeams = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Getting teams - Requested by: ${user.email} (Role: ${user.role})`);

  const teamService = getTeamService(log);
  const tournamentId = req.query.tournamentId;

  const teams = await teamService.getTeams(tournamentId);

  return ApiResponseBuilder.success(teams, 'Teams retrieved successfully');
};

export default withAuthenticatedApiHandler(funcGetTeams);
