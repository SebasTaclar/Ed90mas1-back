import { PrismaClient } from '@prisma/client';
import { ITeamDataSource } from '../../domain/interfaces/ITeamDataSource';
import {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamWithRelations,
} from '../../domain/entities/Team';
import { Logger } from '../../shared/Logger';
import { PasswordUtils } from '../../shared/PasswordUtils';
import { USER_ROLES } from '../../shared/UserRoles';
import { UserPrismaAdapter } from './UserPrismaAdapter';
import { ConflictError, NotFoundError } from '../../shared/exceptions';

export class TeamPrismaAdapter implements ITeamDataSource {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger,
    private userAdapter: UserPrismaAdapter
  ) {}

  async create(teamData: CreateTeamRequest): Promise<TeamWithRelations> {
    try {
      this.logger.logInfo('Creating new team', {
        name: teamData.name,
        userEmail: teamData.userEmail,
      });

      return await this.prisma.$transaction(async (tx) => {
        // 1. Validate and hash the password using centralized utility
        PasswordUtils.validatePassword(teamData.userPassword);
        const hashedPassword = await PasswordUtils.hashPassword(teamData.userPassword);

        // 2. Create the user first with 'team' role
        const user = await this.userAdapter.create({
          id: 0, // Will be auto-generated
          email: teamData.userEmail,
          password: hashedPassword,
          name: teamData.userName,
          role: USER_ROLES.TEAM, // Role for team users
          membershipPaid: false,
        });

        // 3. Create the team
        const team = await tx.team.create({
          data: {
            name: teamData.name,
            logoPath: teamData.logoPath,
            userId: user.id,
          },
        });

        // 3. Associate team with tournaments
        if (teamData.tournamentIds && teamData.tournamentIds.length > 0) {
          await tx.teamTournament.createMany({
            data: teamData.tournamentIds.map((tournamentId) => ({
              teamId: team.id,
              tournamentId,
            })),
          });
        }

        // 4. Return team with relations
        const teamWithRelations = await tx.team.findUnique({
          where: { id: team.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            teamTournaments: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
          },
        });

        // Transform the result to match our interface
        const result: TeamWithRelations = {
          ...teamWithRelations,
          tournaments: teamWithRelations.teamTournaments.map((tt) => tt.tournament),
        };

        this.logger.logInfo('Team created successfully', {
          teamId: team.id,
          userId: user.id,
          tournaments: teamData.tournamentIds?.length || 0,
        });

        return result;
      });
    } catch (error) {
      this.logger.logError('Error creating team', error);
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new ConflictError('User email already exists');
        }
        if (error.meta?.target?.includes('user_id')) {
          throw new ConflictError('User already has a team associated');
        }
      }
      throw new Error('Failed to create team');
    }
  }

  async findById(id: number): Promise<TeamWithRelations | null> {
    try {
      this.logger.logInfo('Finding team by ID', { id });

      const team = await this.prisma.team.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          teamTournaments: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
      });

      if (!team) return null;

      // Transform the result
      const result: TeamWithRelations = {
        ...team,
        tournaments: team.teamTournaments.map((tt) => tt.tournament),
      };

      return result;
    } catch (error) {
      this.logger.logError('Error finding team by ID', error);
      throw new Error('Failed to find team');
    }
  }

  async findByUserId(userId: number): Promise<Team | null> {
    try {
      this.logger.logInfo('Finding team by user ID', { userId });

      const team = await this.prisma.team.findUnique({
        where: { userId }, // Ahora es una relación uno a uno
      });

      return team;
    } catch (error) {
      this.logger.logError('Error finding team by user ID', error);
      throw new Error('Failed to find team by user');
    }
  }
  async findAll(): Promise<TeamWithRelations[]> {
    try {
      this.logger.logInfo('Finding all teams');

      const teams = await this.prisma.team.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          teamTournaments: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the results
      const results: TeamWithRelations[] = teams.map((team) => ({
        ...team,
        tournaments: team.teamTournaments.map((tt) => tt.tournament),
      }));

      this.logger.logInfo('Teams retrieved successfully', { count: teams.length });
      return results;
    } catch (error) {
      this.logger.logError('Error finding all teams', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  async findByTournament(tournamentId: number): Promise<TeamWithRelations[]> {
    try {
      this.logger.logInfo('Finding teams by tournament', { tournamentId });

      const teams = await this.prisma.team.findMany({
        where: {
          teamTournaments: {
            some: {
              tournamentId,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          teamTournaments: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the results
      const results: TeamWithRelations[] = teams.map((team) => ({
        ...team,
        tournaments: team.teamTournaments.map((tt) => tt.tournament),
      }));

      this.logger.logInfo('Teams by tournament retrieved successfully', {
        tournamentId,
        count: teams.length,
      });
      return results;
    } catch (error) {
      this.logger.logError('Error finding teams by tournament', error);
      throw new Error('Failed to retrieve teams by tournament');
    }
  }

  async update(id: number, teamData: UpdateTeamRequest): Promise<Team> {
    try {
      this.logger.logInfo('Updating team', { id, data: teamData });

      return await this.prisma.$transaction(async (tx) => {
        const updateData: any = { ...teamData };
        delete updateData.tournamentIds; // Remove tournamentIds from direct update

        const team = await tx.team.update({
          where: { id },
          data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.logoPath !== undefined && { logoPath: updateData.logoPath }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          },
        }); // If tournamentIds are provided, update the relationships
        if (teamData.tournamentIds) {
          await tx.teamTournament.deleteMany({
            where: { teamId: id },
          });

          if (teamData.tournamentIds.length > 0) {
            await tx.teamTournament.createMany({
              data: teamData.tournamentIds.map((tournamentId) => ({
                teamId: id,
                tournamentId,
              })),
            });
          }
        }

        this.logger.logInfo('Team updated successfully', { id: team.id });
        return team;
      });
    } catch (error) {
      this.logger.logError('Error updating team', error);
      if (error.code === 'P2025') {
        throw new NotFoundError('Team not found');
      }
      throw new Error('Failed to update team');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      this.logger.logInfo('Deleting team', { id });

      await this.prisma.$transaction(async (tx) => {
        // Delete team tournament relationships
        await tx.teamTournament.deleteMany({
          where: { teamId: id },
        });

        // Get team to find associated user
        const team = await tx.team.findUnique({
          where: { id },
        });

        if (!team) {
          throw new NotFoundError('Team not found');
        }

        // Delete team
        await tx.team.delete({
          where: { id },
        });

        // Optionally delete the associated user (you might want to keep users)
        // await tx.user.delete({
        //   where: { id: team.userId },
        // });
      });

      this.logger.logInfo('Team deleted successfully', { id });
    } catch (error) {
      this.logger.logError('Error deleting team', error);
      if (error.code === 'P2025') {
        throw new NotFoundError('Team not found');
      }
      throw new Error('Failed to delete team');
    }
  }

  async addToTournaments(teamId: number, tournamentIds: number[]): Promise<void> {
    try {
      this.logger.logInfo('Adding team to tournaments', { teamId, tournamentIds });

      await this.prisma.teamTournament.createMany({
        data: tournamentIds.map((tournamentId) => ({
          teamId,
          tournamentId,
        })),
        skipDuplicates: true,
      });

      this.logger.logInfo('Team added to tournaments successfully', { teamId });
    } catch (error) {
      this.logger.logError('Error adding team to tournaments', error);
      throw new Error('Failed to add team to tournaments');
    }
  }

  async removeFromTournaments(teamId: number, tournamentIds: number[]): Promise<void> {
    try {
      this.logger.logInfo('Removing team from tournaments', { teamId, tournamentIds });

      await this.prisma.teamTournament.deleteMany({
        where: {
          teamId,
          tournamentId: {
            in: tournamentIds,
          },
        },
      });

      this.logger.logInfo('Team removed from tournaments successfully', { teamId });
    } catch (error) {
      this.logger.logError('Error removing team from tournaments', error);
      throw new Error('Failed to remove team from tournaments');
    }
  }
}
