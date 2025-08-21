import { getPrismaClient } from '../../config/PrismaClient';
import { ITournamentConfigurationDataSource } from '../../domain/interfaces/ITournamentConfigurationDataSource';
import {
  TournamentConfiguration,
  CreateTournamentConfigurationRequest,
  UpdateTournamentConfigurationRequest,
} from '../../domain/entities/TournamentConfiguration';
import {
  TournamentGroup,
  CreateTournamentGroupRequest,
} from '../../domain/entities/TournamentGroup';
import {
  TeamGroupAssignment,
  CreateTeamGroupAssignmentRequest,
  ConfigureTournamentRequest,
} from '../../domain/entities/TeamGroupAssignment';
import { Prisma } from '@prisma/client';

export class TournamentConfigurationPrismaAdapter implements ITournamentConfigurationDataSource {
  private readonly prisma = getPrismaClient();

  constructor() {}

  // Tournament Configuration Methods
  async getConfigurationByTournamentId(
    tournamentId: number
  ): Promise<TournamentConfiguration | null> {
    const config = await this.prisma.tournamentConfiguration.findUnique({
      where: { tournamentId },
    });
    return config as TournamentConfiguration | null;
  }

  async createConfiguration(
    request: CreateTournamentConfigurationRequest
  ): Promise<TournamentConfiguration> {
    const config = await this.prisma.tournamentConfiguration.create({
      data: {
        tournamentId: request.tournamentId,
        numberOfGroups: request.numberOfGroups,
        teamsPerGroup: request.teamsPerGroup,
      },
    });
    return config as TournamentConfiguration;
  }

  async updateConfiguration(
    id: number,
    request: UpdateTournamentConfigurationRequest
  ): Promise<TournamentConfiguration | null> {
    try {
      const config = await this.prisma.tournamentConfiguration.update({
        where: { id },
        data: {
          ...(request.numberOfGroups && { numberOfGroups: request.numberOfGroups }),
          ...(request.teamsPerGroup && { teamsPerGroup: request.teamsPerGroup }),
          ...(request.isConfigured !== undefined && { isConfigured: request.isConfigured }),
        },
      });
      return config as TournamentConfiguration;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async deleteConfigurationByTournamentId(tournamentId: number): Promise<boolean> {
    try {
      const result = await this.prisma.tournamentConfiguration.deleteMany({
        where: { tournamentId },
      });
      return result.count > 0;
    } catch (error) {
      return false;
    }
  }

  // Tournament Groups Methods
  async getGroupsByTournamentId(tournamentId: number): Promise<TournamentGroup[]> {
    const groups = await this.prisma.tournamentGroup.findMany({
      where: { tournamentId },
      orderBy: { groupOrder: 'asc' },
    });
    return groups as TournamentGroup[];
  }

  async createGroup(request: CreateTournamentGroupRequest): Promise<TournamentGroup> {
    const group = await this.prisma.tournamentGroup.create({
      data: {
        tournamentId: request.tournamentId,
        groupName: request.groupName,
        groupOrder: request.groupOrder,
      },
    });
    return group as TournamentGroup;
  }

  async deleteGroupsByTournamentId(tournamentId: number): Promise<boolean> {
    try {
      await this.prisma.tournamentGroup.deleteMany({
        where: { tournamentId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Team Group Assignments Methods
  async getAssignmentsByTournamentId(tournamentId: number): Promise<TeamGroupAssignment[]> {
    const assignments = await this.prisma.teamGroupAssignment.findMany({
      where: { tournamentId },
    });
    return assignments as TeamGroupAssignment[];
  }

  async createAssignment(request: CreateTeamGroupAssignmentRequest): Promise<TeamGroupAssignment> {
    const assignment = await this.prisma.teamGroupAssignment.create({
      data: {
        tournamentId: request.tournamentId,
        teamId: request.teamId,
        groupId: request.groupId,
      },
    });
    return assignment as TeamGroupAssignment;
  }

  async deleteAssignmentsByTournamentId(tournamentId: number): Promise<boolean> {
    try {
      await this.prisma.teamGroupAssignment.deleteMany({
        where: { tournamentId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Full Tournament Configuration
  async configureTournament(request: ConfigureTournamentRequest): Promise<{
    configuration: TournamentConfiguration;
    groups: TournamentGroup[];
    assignments: TeamGroupAssignment[];
  }> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Delete existing configuration if exists
      await tx.teamGroupAssignment.deleteMany({
        where: { tournamentId: request.tournamentId },
      });
      await tx.tournamentGroup.deleteMany({
        where: { tournamentId: request.tournamentId },
      });
      await tx.tournamentConfiguration.deleteMany({
        where: { tournamentId: request.tournamentId },
      });

      // 2. Create new configuration
      const configuration = await tx.tournamentConfiguration.create({
        data: {
          tournamentId: request.tournamentId,
          numberOfGroups: request.numberOfGroups,
          teamsPerGroup: request.teamsPerGroup,
          isConfigured: true,
        },
      });

      // 3. Create groups
      const groups: TournamentGroup[] = [];
      for (let i = 0; i < request.numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        const group = await tx.tournamentGroup.create({
          data: {
            tournamentId: request.tournamentId,
            groupName,
            groupOrder: i + 1,
          },
        });
        groups.push(group as TournamentGroup);
      }

      // 4. Create team assignments if provided
      const assignments: TeamGroupAssignment[] = [];
      if (request.teamAssignments) {
        for (const teamAssignment of request.teamAssignments) {
          const group = groups.find((g) => g.groupName === teamAssignment.groupName);
          if (group) {
            const assignment = await tx.teamGroupAssignment.create({
              data: {
                tournamentId: request.tournamentId,
                teamId: teamAssignment.teamId,
                groupId: group.id,
              },
            });
            assignments.push(assignment as TeamGroupAssignment);
          }
        }
      }

      return {
        configuration: configuration as TournamentConfiguration,
        groups,
        assignments,
      };
    });
  }
}
