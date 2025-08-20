import { PrismaClient } from '@prisma/client';
import { IMatchDataSource } from '../../domain/interfaces/IMatchDataSource';
import {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  GenerateFixtureRequest,
  PreDefinedFixture,
  MatchWithRelations,
  MatchStatus,
  AttendingPlayers,
} from '../../domain/entities/Match';
import { MatchEventType } from '../../domain/entities/MatchEvent';
import { Logger } from '../../shared/Logger';
import { NotFoundError, ValidationError } from '../../shared/exceptions';

export class MatchPrismaAdapter implements IMatchDataSource {
  private logger: Logger;

  constructor(
    private prisma: PrismaClient,
    logger?: Logger
  ) {
    this.logger = logger || new Logger(console as any);
  }

  // Helper functions to convert Prisma types to domain types
  private convertMatchToDomain(match: any): Match {
    return {
      ...match,
      status: match.status as MatchStatus,
      attendingPlayers: match.attendingPlayers ? match.attendingPlayers : undefined,
    };
  }

  private convertMatchWithRelationsToDomain(match: any): MatchWithRelations {
    return {
      ...match,
      status: match.status as MatchStatus,
      attendingPlayers: match.attendingPlayers ? match.attendingPlayers : undefined,
      matchEvents:
        match.matchEvents?.map((event: any) => ({
          ...event,
          eventType: event.eventType as MatchEventType,
        })) || [],
    };
  }

  async create(data: CreateMatchRequest): Promise<Match> {
    try {
      this.logger.logInfo('Creating match', { data });

      // Convertir fechas string a Date objects (manteniendo hora local)
      const createData: any = { ...data };

      if (createData.matchDate && typeof createData.matchDate === 'string') {
        createData.matchDate = new Date(createData.matchDate);
      }

      const match = await this.prisma.match.create({
        data: createData,
      });

      this.logger.logInfo('Match created successfully', { id: match.id });
      return this.convertMatchToDomain(match);
    } catch (error) {
      this.logger.logError('Error creating match', error);
      throw new Error('Failed to create match');
    }
  }

  async findById(id: number): Promise<MatchWithRelations | null> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, groupName: true },
        },
        homeTeam: {
          select: { id: true, name: true, logoPath: true },
        },
        awayTeam: {
          select: { id: true, name: true, logoPath: true },
        },
      },
    });

    if (!match) return null;

    return this.convertMatchWithRelationsToDomain(match);
  }

  async findAll(): Promise<MatchWithRelations[]> {
    try {
      this.logger.logInfo('Finding all matches');

      const matches = await this.prisma.match.findMany({
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      this.logger.logInfo('All matches retrieved successfully', { count: matches.length });
      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding all matches', error);
      throw new Error('Failed to retrieve matches');
    }
  }

  async findByTournament(tournamentId: number): Promise<MatchWithRelations[]> {
    try {
      this.logger.logInfo('Finding matches by tournament', { tournamentId });

      const matches = await this.prisma.match.findMany({
        where: { tournamentId },
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      this.logger.logInfo('Tournament matches retrieved successfully', {
        tournamentId,
        count: matches.length,
      });
      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding matches by tournament', error);
      throw new Error('Failed to retrieve tournament matches');
    }
  }

  async update(id: number, request: UpdateMatchRequest): Promise<Match | null> {
    try {
      this.logger.logInfo('Updating match', { id, request });

      // Convertir fechas string a Date objects (manteniendo hora local)
      const updateData: any = { ...request };

      if (updateData.matchDate && typeof updateData.matchDate === 'string') {
        updateData.matchDate = new Date(updateData.matchDate);
      }

      if (updateData.startTime && typeof updateData.startTime === 'string') {
        updateData.startTime = new Date(updateData.startTime);
      }

      if (updateData.endTime && typeof updateData.endTime === 'string') {
        updateData.endTime = new Date(updateData.endTime);
      }

      const match = await this.prisma.match.update({
        where: { id },
        data: updateData,
      });

      this.logger.logInfo('Match updated successfully', { id });
      return this.convertMatchToDomain(match);
    } catch (error: any) {
      this.logger.logError('Error updating match', error);
      if (error.code === 'P2025') {
        throw new NotFoundError(`Match with id ${id} not found`);
      }
      throw new Error('Failed to update match');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting match', { id });

      await this.prisma.match.delete({
        where: { id },
      });

      this.logger.logInfo('Match deleted successfully', { id });
      return true;
    } catch (error: any) {
      this.logger.logError('Error deleting match', error);
      if (error.code === 'P2025') {
        throw new NotFoundError(`Match with id ${id} not found`);
      }
      throw new Error('Failed to delete match');
    }
  }

  async generateFixture(request: GenerateFixtureRequest): Promise<Match[]> {
    try {
      this.logger.logInfo('Generating fixture for tournament', {
        tournamentId: request.tournamentId,
        fixtureType: request.fixtureType,
        hasPreDefinedFixtures: !!request.fixtures,
        fixtureCount: request.fixtures?.length || 0,
      });

      return await this.prisma.$transaction(async (tx) => {
        // Si hay fixtures predefinidas, usarlas
        if (request.fixtures && request.fixtures.length > 0) {
          return await this.createPreDefinedFixtures(tx, request);
        }

        // Lógica existente para generación automática
        // Get teams in tournament
        const teamTournaments = await tx.teamTournament.findMany({
          where: { tournamentId: request.tournamentId },
          include: { team: true },
        });

        if (teamTournaments.length < 2) {
          throw new ValidationError('Tournament must have at least 2 teams to generate fixture');
        }

        const teams = teamTournaments.map((tt) => tt.team);
        const matches: Match[] = [];

        // Get the current highest match number for this tournament
        const lastMatch = await tx.match.findFirst({
          where: { tournamentId: request.tournamentId },
          orderBy: { matchNumber: 'desc' },
        });

        let currentMatchNumber = (lastMatch?.matchNumber || 0) + 1;

        // Generate round-robin fixture
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const homeTeam = teams[i];
            const awayTeam = teams[j];

            const match = await tx.match.create({
              data: {
                tournamentId: request.tournamentId,
                groupId: request.groupId,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                matchDate: new Date(),
                location: request.location || 'TBD',
                round: request.round || 'Fase de grupos',
                status: MatchStatus.SCHEDULED,
                matchNumber: currentMatchNumber++, // Increment after each use
              },
            });

            matches.push(this.convertMatchToDomain(match));
          }
        }

        return matches;
      });
    } catch (error) {
      this.logger.logError('Error generating fixture', error);
      throw new Error('Failed to generate fixture');
    }
  }

  async deleteByTournament(tournamentId: number): Promise<boolean> {
    try {
      this.logger.logInfo('Deleting all matches by tournament', { tournamentId });

      const result = await this.prisma.match.deleteMany({
        where: { tournamentId },
      });

      this.logger.logInfo('Tournament matches deleted successfully', {
        tournamentId,
        deletedCount: result.count,
      });
      return true;
    } catch (error) {
      this.logger.logError('Error deleting tournament matches', error);
      throw new Error('Failed to delete tournament matches');
    }
  }

  async getNextMatchNumber(tournamentId: number): Promise<number> {
    try {
      const lastMatch = await this.prisma.match.findFirst({
        where: { tournamentId },
        orderBy: { matchNumber: 'desc' },
      });

      return (lastMatch?.matchNumber || 0) + 1;
    } catch (error) {
      this.logger.logError('Error getting next match number', error);
      return 1;
    }
  }

  async findByStatus(status: string, tournamentId?: number): Promise<MatchWithRelations[]> {
    try {
      const whereClause: any = { status };

      if (tournamentId) {
        whereClause.tournamentId = tournamentId;
      }

      const matches = await this.prisma.match.findMany({
        where: whereClause,
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding matches by status', error);
      throw new Error('Failed to retrieve matches by status');
    }
  }

  async findByGroup(groupId: number): Promise<MatchWithRelations[]> {
    try {
      this.logger.logInfo('Finding matches by group', { groupId });

      const matches = await this.prisma.match.findMany({
        where: { groupId },
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding matches by group', error);
      throw new Error('Failed to retrieve group matches');
    }
  }

  async findByTeam(teamId: number, tournamentId?: number): Promise<MatchWithRelations[]> {
    try {
      this.logger.logInfo('Finding matches by team', { teamId, tournamentId });

      const whereClause: any = {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      };

      if (tournamentId) {
        whereClause.tournamentId = tournamentId;
      }

      const matches = await this.prisma.match.findMany({
        where: whereClause,
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding matches by team', error);
      throw new Error('Failed to retrieve team matches');
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tournamentId?: number
  ): Promise<MatchWithRelations[]> {
    try {
      const whereClause: any = {
        matchDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (tournamentId) {
        whereClause.tournamentId = tournamentId;
      }

      const matches = await this.prisma.match.findMany({
        where: whereClause,
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
      });

      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding matches by date range', error);
      throw new Error('Failed to retrieve matches by date range');
    }
  }

  async findUpcomingMatches(teamId?: number, limit = 10): Promise<MatchWithRelations[]> {
    try {
      const now = new Date();
      const whereClause: any = {
        matchDate: { gte: now },
      };

      if (teamId) {
        whereClause.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
      }

      const matches = await this.prisma.match.findMany({
        where: whereClause,
        include: {
          tournament: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, groupName: true },
          },
          homeTeam: {
            select: { id: true, name: true, logoPath: true },
          },
          awayTeam: {
            select: { id: true, name: true, logoPath: true },
          },
        },
        orderBy: { matchDate: 'asc' },
        take: limit,
      });

      return matches.map((m) => this.convertMatchWithRelationsToDomain(m));
    } catch (error) {
      this.logger.logError('Error finding upcoming matches', error);
      throw new Error('Failed to retrieve upcoming matches');
    }
  }

  private async createPreDefinedFixtures(
    tx: any,
    request: GenerateFixtureRequest
  ): Promise<Match[]> {
    const matches: Match[] = [];

    // Get the current highest match number for this tournament
    const lastMatch = await tx.match.findFirst({
      where: { tournamentId: request.tournamentId },
      orderBy: { matchNumber: 'desc' },
    });

    let currentMatchNumber = (lastMatch?.matchNumber || 0) + 1;

    for (const fixture of request.fixtures!) {
      // Combinar fecha y hora (manteniendo hora local)
      const dateTimeString = `${fixture.date}T${fixture.time}`;
      const matchDateTime = new Date(dateTimeString);

      this.logger.logInfo('Creating predefined fixture', {
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        location: fixture.location,
        matchDateTime,
        groupId: fixture.groupId,
      });

      const match = await tx.match.create({
        data: {
          tournamentId: request.tournamentId,
          groupId: fixture.groupId ? parseInt(fixture.groupId) : undefined,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          matchDate: matchDateTime,
          location: fixture.location, // Usar la ubicación específica de cada fixture
          round: request.round || 'Fase de grupos',
          status: fixture.status || MatchStatus.SCHEDULED,
          matchNumber: currentMatchNumber++,
        },
      });

      matches.push(this.convertMatchToDomain(match));
    }

    this.logger.logInfo('Predefined fixtures created successfully', {
      tournamentId: request.tournamentId,
      count: matches.length,
    });

    return matches;
  }

  private async validateTeamsInTournament(
    tournamentId: number,
    homeTeamId: number,
    awayTeamId: number
  ): Promise<void> {
    const homeTeamInTournament = await this.prisma.teamTournament.findUnique({
      where: {
        teamId_tournamentId: {
          teamId: homeTeamId,
          tournamentId,
        },
      },
    });

    const awayTeamInTournament = await this.prisma.teamTournament.findUnique({
      where: {
        teamId_tournamentId: {
          teamId: awayTeamId,
          tournamentId,
        },
      },
    });

    if (!homeTeamInTournament) {
      throw new ValidationError(
        `Home team ${homeTeamId} is not part of tournament ${tournamentId}`
      );
    }
    if (!awayTeamInTournament) {
      throw new ValidationError(
        `Away team ${awayTeamId} is not part of tournament ${tournamentId}`
      );
    }
    if (homeTeamId === awayTeamId) {
      throw new ValidationError('Home team and away team cannot be the same');
    }
  }
}
