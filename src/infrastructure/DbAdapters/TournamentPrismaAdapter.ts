import { PrismaClient } from '@prisma/client';
import { ITournamentDataSource } from '../../domain/interfaces/ITournamentDataSource';
import {
  Tournament,
  CreateTournamentRequest,
  UpdateTournamentRequest,
} from '../../domain/entities/Tournament';
import { Logger } from '../../shared/Logger';

export class TournamentPrismaAdapter implements ITournamentDataSource {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  async create(tournamentData: CreateTournamentRequest): Promise<Tournament> {
    try {
      this.logger.logInfo('Creating new tournament', { name: tournamentData.name });

      const tournament = await this.prisma.tournament.create({
        data: {
          name: tournamentData.name,
          description: tournamentData.description,
          startDate: tournamentData.startDate,
          endDate: tournamentData.endDate,
          maxTeams: tournamentData.maxTeams,
          tournamentCategories: {
            create: tournamentData.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        },
        include: {
          tournamentCategories: {
            include: {
              category: true,
            },
          },
        },
      });

      this.logger.logInfo('Tournament created successfully', {
        id: tournament.id,
        name: tournament.name,
        categories: tournament.tournamentCategories.length,
      });

      return tournament;
    } catch (error) {
      this.logger.logError('Error creating tournament', error);
      throw new Error('Failed to create tournament');
    }
  }

  async findById(id: number): Promise<Tournament | null> {
    try {
      this.logger.logInfo('Finding tournament by ID', { id });

      const tournament = await this.prisma.tournament.findUnique({
        where: { id },
        include: {
          tournamentCategories: {
            include: {
              category: true,
            },
          },
        },
      });

      return tournament;
    } catch (error) {
      this.logger.logError('Error finding tournament by ID', error);
      throw new Error('Failed to find tournament');
    }
  }

  async findAll(): Promise<Tournament[]> {
    try {
      this.logger.logInfo('Finding all tournaments');

      const tournaments = await this.prisma.tournament.findMany({
        include: {
          tournamentCategories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.logInfo('Tournaments retrieved successfully', { count: tournaments.length });
      return tournaments;
    } catch (error) {
      this.logger.logError('Error finding all tournaments', error);
      throw new Error('Failed to retrieve tournaments');
    }
  }

  async findByCategory(categoryId: number): Promise<Tournament[]> {
    try {
      this.logger.logInfo('Finding tournaments by category', { categoryId });

      const tournaments = await this.prisma.tournament.findMany({
        where: {
          tournamentCategories: {
            some: {
              categoryId,
            },
          },
        },
        include: {
          tournamentCategories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.logInfo('Tournaments by category retrieved successfully', {
        categoryId,
        count: tournaments.length,
      });
      return tournaments;
    } catch (error) {
      this.logger.logError('Error finding tournaments by category', error);
      throw new Error('Failed to retrieve tournaments by category');
    }
  }

  async update(id: number, tournamentData: UpdateTournamentRequest): Promise<Tournament> {
    try {
      this.logger.logInfo('Updating tournament', { id, data: tournamentData });

      const updateData: any = { ...tournamentData };
      delete updateData.categoryIds; // Remove categoryIds from direct update

      const tournament = await this.prisma.tournament.update({
        where: { id },
        data: updateData,
        include: {
          tournamentCategories: {
            include: {
              category: true,
            },
          },
        },
      });

      // If categoryIds are provided, update the relationships
      if (tournamentData.categoryIds) {
        await this.prisma.tournamentCategory.deleteMany({
          where: { tournamentId: id },
        });

        await this.prisma.tournamentCategory.createMany({
          data: tournamentData.categoryIds.map((categoryId) => ({
            tournamentId: id,
            categoryId,
          })),
        });
      }

      this.logger.logInfo('Tournament updated successfully', { id: tournament.id });
      return tournament;
    } catch (error) {
      this.logger.logError('Error updating tournament', error);
      if (error.code === 'P2025') {
        throw new Error('Tournament not found');
      }
      throw new Error('Failed to update tournament');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      this.logger.logInfo('Deleting tournament', { id });

      // Delete related records first
      await this.prisma.tournamentCategory.deleteMany({
        where: { tournamentId: id },
      });

      await this.prisma.teamTournament.deleteMany({
        where: { tournamentId: id },
      });

      await this.prisma.tournament.delete({
        where: { id },
      });

      this.logger.logInfo('Tournament deleted successfully', { id });
    } catch (error) {
      this.logger.logError('Error deleting tournament', error);
      if (error.code === 'P2025') {
        throw new Error('Tournament not found');
      }
      throw new Error('Failed to delete tournament');
    }
  }

  async addCategories(tournamentId: number, categoryIds: number[]): Promise<void> {
    try {
      this.logger.logInfo('Adding categories to tournament', { tournamentId, categoryIds });

      await this.prisma.tournamentCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          tournamentId,
          categoryId,
        })),
        skipDuplicates: true,
      });

      this.logger.logInfo('Categories added to tournament successfully', { tournamentId });
    } catch (error) {
      this.logger.logError('Error adding categories to tournament', error);
      throw new Error('Failed to add categories to tournament');
    }
  }

  async removeCategories(tournamentId: number, categoryIds: number[]): Promise<void> {
    try {
      this.logger.logInfo('Removing categories from tournament', { tournamentId, categoryIds });

      await this.prisma.tournamentCategory.deleteMany({
        where: {
          tournamentId,
          categoryId: {
            in: categoryIds,
          },
        },
      });

      this.logger.logInfo('Categories removed from tournament successfully', { tournamentId });
    } catch (error) {
      this.logger.logError('Error removing categories from tournament', error);
      throw new Error('Failed to remove categories from tournament');
    }
  }
}
