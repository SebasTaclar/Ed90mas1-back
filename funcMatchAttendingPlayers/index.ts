import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchService } from '../src/shared/serviceProvider';

const funcMatchAttendingPlayers = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const matchService = getMatchService(log);
  const matchId = req.params?.matchId ? parseInt(req.params.matchId) : undefined;

  if (!matchId) {
    return ApiResponseBuilder.error('Match ID is required', 400);
  }

  switch (req.method) {
    case 'GET': {
      // Get attending players for match
      const attendingPlayers = await matchService.getAttendingPlayersByMatch(matchId);
      return ApiResponseBuilder.success(
        attendingPlayers,
        'Attending players retrieved successfully'
      );
    }

    case 'POST': {
      // Set complete attending players object for match
      const { attendingPlayers } = req.body;

      if (!attendingPlayers) {
        return ApiResponseBuilder.error('attendingPlayers is required', 400);
      }

      const result = await matchService.setAttendingPlayers(matchId, attendingPlayers);
      return ApiResponseBuilder.success(result, 'Attending players set successfully');
    }

    case 'PUT': {
      // Add a single player to match
      const { teamId, playerId } = req.body;

      if (!teamId || !playerId) {
        return ApiResponseBuilder.error('teamId and playerId are required', 400);
      }

      const result = await matchService.addPlayerToMatch(matchId, teamId, playerId);
      return ApiResponseBuilder.success(result, 'Player added to match successfully');
    }

    case 'DELETE': {
      // Remove a single player from match
      const { teamId, playerId } = req.body;

      if (!teamId || !playerId) {
        return ApiResponseBuilder.error('teamId and playerId are required', 400);
      }

      const result = await matchService.removePlayerFromMatch(matchId, teamId, playerId);
      return ApiResponseBuilder.success(result, 'Player removed from match successfully');
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withApiHandler(funcMatchAttendingPlayers);
