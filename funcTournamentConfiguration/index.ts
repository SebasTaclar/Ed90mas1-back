import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler, withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentConfigurationService } from '../src/shared/serviceProvider';

const funcTournamentConfiguration = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const tournamentConfigurationService = getTournamentConfigurationService(log);
  const tournamentId = req.params?.tournamentId ? parseInt(req.params.tournamentId) : undefined;

  switch (req.method) {
    case 'POST': {
      // Configure tournament (create configuration, groups, and assignments)
      if (!tournamentId) {
        return ApiResponseBuilder.error('Tournament ID is required', 400);
      }
      const request = { ...req.body, tournamentId };
      const result = await tournamentConfigurationService.configureTournament(request);
      return ApiResponseBuilder.success(result, 'Tournament configured successfully');
    }

    case 'GET': {
      // Get tournament configuration
      if (!tournamentId) {
        return ApiResponseBuilder.error('Tournament ID is required', 400);
      }
      const configuration =
        await tournamentConfigurationService.getTournamentConfiguration(tournamentId);
      return ApiResponseBuilder.success(
        configuration,
        'Tournament configuration retrieved successfully'
      );
    }

    case 'PUT': {
      // Update tournament configuration
      if (!tournamentId) {
        return ApiResponseBuilder.error('Tournament ID is required', 400);
      }

      // If teamAssignments are provided, use configureTournament (full reconfiguration)
      if (req.body.teamAssignments && Array.isArray(req.body.teamAssignments)) {
        const request = { ...req.body, tournamentId };
        const result = await tournamentConfigurationService.configureTournament(request);
        return ApiResponseBuilder.success(result, 'Tournament configuration updated successfully');
      } else {
        // Otherwise, just update basic configuration
        const currentConfig =
          await tournamentConfigurationService.getTournamentConfiguration(tournamentId);
        if (!currentConfig.configuration) {
          return ApiResponseBuilder.error('Tournament configuration not found', 404);
        }
        const updatedConfig = await tournamentConfigurationService.updateTournamentConfiguration(
          currentConfig.configuration.id,
          req.body
        );
        return ApiResponseBuilder.success(
          updatedConfig,
          'Tournament configuration updated successfully'
        );
      }
    }

    case 'DELETE': {
      // Delete tournament configuration
      if (!tournamentId) {
        return ApiResponseBuilder.error('Tournament ID is required', 400);
      }

      const deleted =
        await tournamentConfigurationService.deleteTournamentConfiguration(tournamentId);

      if (deleted) {
        return ApiResponseBuilder.success(
          { deleted: true },
          'Tournament configuration deleted successfully'
        );
      } else {
        return ApiResponseBuilder.error('Failed to delete tournament configuration', 500);
      }
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withAuthenticatedApiHandler(funcTournamentConfiguration);
