import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcCreateTournament = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Creating tournament - Requested by: ${user.email} (Role: ${user.role})`);

  // Opcional: Verificar permisos basados en el rol del usuario autenticado
  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can create tournaments', 403);
  }

  const tournamentService = getTournamentService(log);
  const tournament = await tournamentService.createTournament(req.body);
  return ApiResponseBuilder.success(tournament, 'Tournament created successfully');
};

export default withAuthenticatedApiHandler(funcCreateTournament);
