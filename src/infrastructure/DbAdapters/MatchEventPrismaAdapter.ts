import { getPrismaClient } from '../../config/PrismaClient';
import { IMatchEventDataSource } from '../../domain/interfaces/IMatchEventDataSource';
import {
  MatchEvent,
  CreateMatchEventRequest,
  UpdateMatchEventRequest,
  MatchEventWithRelations,
  MatchEventType,
} from '../../domain/entities/MatchEvent';
import { Logger } from '../../shared/Logger';

export class MatchEventPrismaAdapter implements IMatchEventDataSource {
  private readonly prisma = getPrismaClient();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger(console as any);
  }

  // Helper function to convert Prisma types to domain types
  private convertEventToDomain(event: any): MatchEvent {
    return {
      ...event,
      eventType: event.eventType as MatchEventType,
    };
  }

  private convertEventWithRelationsToDomain(event: any): MatchEventWithRelations {
    return {
      ...event,
      eventType: event.eventType as MatchEventType,
    };
  }

  async create(request: CreateMatchEventRequest): Promise<MatchEvent> {
    try {
      this.logger.logInfo('Creating match event', {
        matchId: request.matchId,
        eventType: request.eventType,
        minute: request.minute,
      });

      const event = await this.prisma.matchEvent.create({
        data: {
          matchId: request.matchId,
          eventType: request.eventType,
          minute: request.minute,
          extraTime: request.extraTime,
          description: request.description,
          teamId: request.teamId,
          playerId: request.playerId,
          assistPlayerId: request.assistPlayerId,
        },
      });

      this.logger.logInfo('Match event created successfully', {
        eventId: event.id,
        matchId: request.matchId,
      });
      return this.convertEventToDomain(event);
    } catch (error) {
      this.logger.logError('Error creating match event', error);
      throw new Error('Failed to create match event');
    }
  }

  async findById(id: number): Promise<MatchEventWithRelations | null> {
    try {
      const event = await this.prisma.matchEvent.findUnique({
        where: { id },
        include: {
          match: {
            select: {
              id: true,
              homeTeamId: true,
              awayTeamId: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
      });

      if (!event) return null;

      return this.convertEventWithRelationsToDomain(event);
    } catch (error) {
      this.logger.logError('Error finding match event by id', error);
      throw new Error('Failed to retrieve match event');
    }
  }

  async findByMatch(matchId: number): Promise<MatchEventWithRelations[]> {
    try {
      this.logger.logInfo('Finding events by match', { matchId });

      const events = await this.prisma.matchEvent.findMany({
        where: { matchId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ minute: 'asc' }, { extraTime: 'asc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding match events', error);
      throw new Error('Failed to retrieve match events');
    }
  }

  async findByPlayer(playerId: number, tournamentId?: number): Promise<MatchEventWithRelations[]> {
    try {
      this.logger.logInfo('Finding events by player', { playerId, tournamentId });

      const whereConditions: any = { playerId };
      if (tournamentId) {
        whereConditions.match = {
          tournamentId,
        };
      }

      const events = await this.prisma.matchEvent.findMany({
        where: whereConditions,
        include: {
          match: {
            select: {
              id: true,
              homeTeamId: true,
              awayTeamId: true,
              matchDate: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding events by player', error);
      throw new Error('Failed to retrieve player events');
    }
  }

  async findByTeam(teamId: number, tournamentId?: number): Promise<MatchEventWithRelations[]> {
    try {
      this.logger.logInfo('Finding events by team', { teamId, tournamentId });

      const whereConditions: any = { teamId };
      if (tournamentId) {
        whereConditions.match = {
          tournamentId,
        };
      }

      const events = await this.prisma.matchEvent.findMany({
        where: whereConditions,
        include: {
          match: {
            select: {
              id: true,
              homeTeamId: true,
              awayTeamId: true,
              matchDate: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding events by team', error);
      throw new Error('Failed to retrieve team events');
    }
  }

  async update(id: number, request: UpdateMatchEventRequest): Promise<MatchEvent | null> {
    try {
      this.logger.logInfo('Updating match event', { id, request });

      const event = await this.prisma.matchEvent.update({
        where: { id },
        data: request,
      });

      this.logger.logInfo('Match event updated successfully', { id });
      return this.convertEventToDomain(event);
    } catch (error: any) {
      this.logger.logError('Error updating match event', error);
      if (error.code === 'P2025') {
        return null;
      }
      throw new Error('Failed to update match event');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting match event', { id });

      await this.prisma.matchEvent.delete({
        where: { id },
      });

      this.logger.logInfo('Match event deleted successfully', { id });
      return true;
    } catch (error: any) {
      this.logger.logError('Error deleting match event', error);
      if (error.code === 'P2025') {
        return false;
      }
      throw new Error('Failed to delete match event');
    }
  }

  async findByEventType(
    eventType: string,
    matchId?: number,
    tournamentId?: number
  ): Promise<MatchEventWithRelations[]> {
    try {
      this.logger.logInfo('Finding events by type', { eventType, matchId, tournamentId });

      const whereConditions: any = { eventType };

      if (matchId) {
        whereConditions.matchId = matchId;
      } else if (tournamentId) {
        whereConditions.match = {
          tournamentId,
        };
      }

      const events = await this.prisma.matchEvent.findMany({
        where: whereConditions,
        include: {
          match: {
            select: {
              id: true,
              homeTeamId: true,
              awayTeamId: true,
              matchDate: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding events by type', error);
      throw new Error('Failed to retrieve events by type');
    }
  }

  async deleteByMatch(matchId: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting all events for match', { matchId });

      const result = await this.prisma.matchEvent.deleteMany({
        where: { matchId },
      });

      this.logger.logInfo('Match events deleted successfully', {
        matchId,
        deletedCount: result.count,
      });
      return true;
    } catch (error) {
      this.logger.logError('Error deleting match events', error);
      throw new Error('Failed to delete match events');
    }
  }

  async getEventsInTimeRange(
    matchId: number,
    startMinute: number,
    endMinute: number
  ): Promise<MatchEventWithRelations[]> {
    try {
      this.logger.logInfo('Finding events in time range', { matchId, startMinute, endMinute });

      const events = await this.prisma.matchEvent.findMany({
        where: {
          matchId,
          minute: {
            gte: startMinute,
            lte: endMinute,
          },
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ minute: 'asc' }, { extraTime: 'asc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding events in time range', error);
      throw new Error('Failed to retrieve events in time range');
    }
  }

  async getGoalsByMatch(matchId: number): Promise<MatchEventWithRelations[]> {
    try {
      const events = await this.prisma.matchEvent.findMany({
        where: {
          matchId,
          eventType: MatchEventType.GOAL,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
          assistPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [{ minute: 'asc' }, { extraTime: 'asc' }],
      });

      return events.map((e) => this.convertEventWithRelationsToDomain(e));
    } catch (error) {
      this.logger.logError('Error finding goals by match', error);
      throw new Error('Failed to retrieve goals');
    }
  }
}
