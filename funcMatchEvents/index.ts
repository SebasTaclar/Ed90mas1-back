import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getMatchEventService } from '../src/shared/serviceProvider';
import { MatchEventType } from '../src/domain/entities/MatchEvent';

const funcMatchEvents = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const matchEventService = getMatchEventService(log);
  const eventId = req.params?.eventId ? parseInt(req.params.eventId) : undefined;
  const matchId = req.params?.matchId ? parseInt(req.params.matchId) : undefined;

  switch (req.method) {
    case 'POST': {
      // Create new match event
      if (!matchId) {
        return ApiResponseBuilder.error('Match ID is required', 400);
      }

      const request = {
        ...req.body,
        matchId,
      };

      const result = await matchEventService.addEvent(request);
      return ApiResponseBuilder.success(result, 'Match event created successfully');
    }

    case 'GET': {
      if (eventId) {
        // Get specific event
        const event = await matchEventService.getEventById(eventId);
        if (!event) {
          return ApiResponseBuilder.error('Event not found', 404);
        }
        return ApiResponseBuilder.success(event, 'Event retrieved successfully');
      } else {
        // Get all events for match with filters
        if (req.query.eventType) {
          const eventType = req.query.eventType as string;
          const events = await matchEventService.getEventsByType(
            eventType as MatchEventType,
            matchId
          );
          return ApiResponseBuilder.success(events, 'Events by type retrieved successfully');
        } else if (req.query.playerId) {
          const playerId = parseInt(req.query.playerId as string);
          const events = await matchEventService.getEventsByPlayer(playerId, matchId);
          return ApiResponseBuilder.success(events, 'Player events retrieved successfully');
        } else if (req.query.teamId) {
          const teamId = parseInt(req.query.teamId as string);
          const events = await matchEventService.getEventsByTeam(teamId);
          return ApiResponseBuilder.success(events, 'Team events retrieved successfully');
        } else if (req.query.startMinute && req.query.endMinute) {
          const startMinute = parseInt(req.query.startMinute as string);
          const endMinute = parseInt(req.query.endMinute as string);
          const events = await matchEventService.getEventsInTimeRange(
            matchId,
            startMinute,
            endMinute
          );
          return ApiResponseBuilder.success(events, 'Events in time range retrieved successfully');
        } else if (matchId) {
          const events = await matchEventService.getEventsByMatch(matchId);
          return ApiResponseBuilder.success(events, 'Match events retrieved successfully');
        } else {
          return ApiResponseBuilder.error('Match ID is required or use specific filters', 400);
        }
      }
    }

    case 'PUT': {
      // Update match event
      if (!eventId) {
        return ApiResponseBuilder.error('Event ID is required', 400);
      }

      const result = await matchEventService.updateEvent(eventId, req.body);
      if (!result) {
        return ApiResponseBuilder.error('Event not found', 404);
      }
      return ApiResponseBuilder.success(result, 'Event updated successfully');
    }

    case 'DELETE': {
      // Delete match event
      if (!eventId) {
        return ApiResponseBuilder.error('Event ID is required', 400);
      }

      const success = await matchEventService.removeEvent(eventId);
      if (!success) {
        return ApiResponseBuilder.error('Event not found', 404);
      }
      return ApiResponseBuilder.success(null, 'Event deleted successfully');
    }

    default:
      return ApiResponseBuilder.error('Method not allowed', 405);
  }
};

export default withApiHandler(funcMatchEvents);
