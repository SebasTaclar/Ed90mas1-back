import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcUpdateTournament = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const tournamentId = parseInt(req.params?.id);

  log.logInfo(
    `Updating tournament ID: ${tournamentId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos basados en el rol del usuario autenticado
  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can update tournaments', 403);
  }

  if (!tournamentId || isNaN(tournamentId)) {
    return ApiResponseBuilder.error('Invalid tournament ID', 400);
  }

  const tournamentService = getTournamentService(log);
  const tournament = await tournamentService.updateTournament(tournamentId, req.body);

  return ApiResponseBuilder.success(tournament, 'Tournament updated successfully');
};

export default withAuthenticatedApiHandler(funcUpdateTournament);
