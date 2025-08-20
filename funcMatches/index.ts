import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchService } from '../src/shared/serviceProvider';
import { MatchStatus } from '../src/domain/entities/Match';

const funcMatches = async (_context: Context, req: HttpRequest, log: Logger): Promise<unknown> => {
  const matchService = getMatchService(log);
  const matchId = req.params?.matchId ? parseInt(req.params.matchId) : undefined;

  switch (req.method) {
    case 'POST': {
      // Create new match
      const result = await matchService.createMatch(req.body);
      return ApiResponseBuilder.success(result, 'Match created successfully');
    }

    case 'GET': {
      if (matchId) {
        // Get specific match
        const match = await matchService.getMatchById(matchId);
        if (!match) {
          return ApiResponseBuilder.error('Match not found', 404);
        }
        return ApiResponseBuilder.success(match, 'Match retrieved successfully');
      } else {
        // Get matches with filters
        if (req.query.tournamentId) {
          const tournamentId = parseInt(req.query.tournamentId as string);
          const matches = await matchService.getMatchesByTournament(tournamentId);
          return ApiResponseBuilder.success(matches, 'Tournament matches retrieved successfully');
        } else if (req.query.teamId) {
          const teamId = parseInt(req.query.teamId as string);
          const tournamentId = req.query.tournamentId
            ? parseInt(req.query.tournamentId as string)
            : undefined;
          const matches = await matchService.getMatchesByTeam(teamId, tournamentId);
          return ApiResponseBuilder.success(matches, 'Team matches retrieved successfully');
        } else if (req.query.status) {
          const status = req.query.status as string;
          const tournamentId = req.query.tournamentId
            ? parseInt(req.query.tournamentId as string)
            : undefined;
          const matches = await matchService.getMatchesByStatus(
            status as MatchStatus,
            tournamentId
          );
          return ApiResponseBuilder.success(matches, 'Matches by status retrieved successfully');
        } else if (req.query.upcoming === 'true') {
          const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
          const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
          const matches = await matchService.getUpcomingMatches(teamId, limit);
          return ApiResponseBuilder.success(matches, 'Upcoming matches retrieved successfully');
        } else {
          return ApiResponseBuilder.error(
            'Please provide filters: tournamentId, teamId, status, or upcoming=true',
            400
          );
        }
      }
    }

    case 'PUT': {
      // Update match
      if (!matchId) {
        return ApiResponseBuilder.error('Match ID is required', 400);
      }

      const result = await matchService.updateMatch(matchId, req.body);
      if (!result) {
        return ApiResponseBuilder.error('Match not found', 404);
      }
      return ApiResponseBuilder.success(result, 'Match updated successfully');
    }

    case 'DELETE': {
      // Delete match
      if (!matchId) {
        return ApiResponseBuilder.error('Match ID is required', 400);
      }

      const success = await matchService.deleteMatch(matchId);
      if (!success) {
        return ApiResponseBuilder.error('Match not found', 404);
      }
      return ApiResponseBuilder.success(null, 'Match deleted successfully');
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withApiHandler(funcMatches);
