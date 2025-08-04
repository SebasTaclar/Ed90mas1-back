import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService } from '../src/shared/serviceProvider';

const funcCreateTeam = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  log.logInfo('Creating team - Public endpoint');

  // Este endpoint es público porque incluye la creación del usuario
  // El frontend debe proporcionar todos los datos necesarios
  const teamService = getTeamService(log);
  const team = await teamService.createTeam(req.body);

  return ApiResponseBuilder.success(
    {
      team: {
        id: team.id,
        name: team.name,
        isActive: team.isActive,
        createdAt: team.createdAt,
        user: {
          id: team.user.id,
          email: team.user.email,
          name: team.user.name,
        },
        tournaments: team.tournaments,
      },
    },
    'Team and user created successfully'
  );
};

export default withApiHandler(funcCreateTeam);
