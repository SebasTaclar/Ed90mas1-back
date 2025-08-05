import { ITournamentDataSource } from '../../domain/interfaces/ITournamentDataSource';
import { ICategoryDataSource } from '../../domain/interfaces/ICategoryDataSource';
import { ITeamDataSource } from '../../domain/interfaces/ITeamDataSource';
import {
  Tournament,
  CreateTournamentRequest,
  UpdateTournamentRequest,
} from '../../domain/entities/Tournament';
import { Logger } from '../../shared/Logger';

export class TournamentService {
  constructor(
    private tournamentDataSource: ITournamentDataSource,
    private categoryDataSource: ICategoryDataSource,
    private teamDataSource: ITeamDataSource,
    private logger: Logger
  ) {}

  async createTournament(tournamentData: CreateTournamentRequest): Promise<Tournament> {
    this.logger.logInfo('TournamentService: Creating tournament', { name: tournamentData.name });

    // Validate input
    if (!tournamentData.name || tournamentData.name.trim().length === 0) {
      throw new Error('Tournament name is required');
    }

    if (tournamentData.name.trim().length < 3) {
      throw new Error('Tournament name must be at least 3 characters long');
    }

    if (tournamentData.name.trim().length > 200) {
      throw new Error('Tournament name cannot exceed 200 characters');
    }

    if (!tournamentData.startDate || !tournamentData.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (new Date(tournamentData.startDate) >= new Date(tournamentData.endDate)) {
      throw new Error('End date must be after start date');
    }

    if (new Date(tournamentData.startDate) < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    if (!tournamentData.maxTeams || tournamentData.maxTeams <= 0) {
      throw new Error('Maximum teams must be a positive number');
    }

    if (tournamentData.maxTeams > 1000) {
      throw new Error('Maximum teams cannot exceed 1000');
    }

    if (!tournamentData.categoryIds || tournamentData.categoryIds.length === 0) {
      throw new Error('At least one category must be selected');
    }

    // Validate that all categories exist
    for (const categoryId of tournamentData.categoryIds) {
      const category = await this.categoryDataSource.findById(categoryId);
      if (!category) {
        throw new Error(`Category with ID ${categoryId} does not exist`);
      }
    }

    const tournament = await this.tournamentDataSource.create({
      name: tournamentData.name.trim(),
      description: tournamentData.description?.trim(),
      startDate: new Date(tournamentData.startDate),
      endDate: new Date(tournamentData.endDate),
      maxTeams: tournamentData.maxTeams,
      categoryIds: [...new Set(tournamentData.categoryIds)], // Remove duplicates
    });

    this.logger.logInfo('TournamentService: Tournament created successfully', {
      id: tournament.id,
    });
    return tournament;
  }

  async getTournamentById(id: number): Promise<Tournament> {
    this.logger.logInfo('TournamentService: Getting tournament by ID', { id });

    if (!id || id <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    const tournament = await this.tournamentDataSource.findById(id);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    this.logger.logInfo('TournamentService: Getting all tournaments');

    const tournaments = await this.tournamentDataSource.findAll();

    this.logger.logInfo('TournamentService: Tournaments retrieved', { count: tournaments.length });
    return tournaments;
  }

  async getTournamentsByCategory(categoryId: number): Promise<Tournament[]> {
    this.logger.logInfo('TournamentService: Getting tournaments by category', { categoryId });

    if (!categoryId || categoryId <= 0) {
      throw new Error('Valid category ID is required');
    }

    // Validate that category exists
    const category = await this.categoryDataSource.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const tournaments = await this.tournamentDataSource.findByCategory(categoryId);

    this.logger.logInfo('TournamentService: Tournaments by category retrieved', {
      categoryId,
      count: tournaments.length,
    });
    return tournaments;
  }

  async updateTournament(id: number, tournamentData: UpdateTournamentRequest): Promise<Tournament> {
    this.logger.logInfo('TournamentService: Updating tournament', { id, data: tournamentData });

    if (!id || id <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    // Check if tournament exists
    const existingTournament = await this.tournamentDataSource.findById(id);
    if (!existingTournament) {
      throw new Error('Tournament not found');
    }

    // Validate name if provided
    if (tournamentData.name !== undefined) {
      if (!tournamentData.name || tournamentData.name.trim().length === 0) {
        throw new Error('Tournament name cannot be empty');
      }

      if (tournamentData.name.trim().length < 3) {
        throw new Error('Tournament name must be at least 3 characters long');
      }

      if (tournamentData.name.trim().length > 200) {
        throw new Error('Tournament name cannot exceed 200 characters');
      }
    }

    // Validate dates if provided
    if (tournamentData.startDate && tournamentData.endDate) {
      if (new Date(tournamentData.startDate) >= new Date(tournamentData.endDate)) {
        throw new Error('End date must be after start date');
      }
    } else if (tournamentData.startDate) {
      if (new Date(tournamentData.startDate) >= new Date(existingTournament.endDate)) {
        throw new Error('Start date must be before existing end date');
      }
    } else if (tournamentData.endDate) {
      if (new Date(existingTournament.startDate) >= new Date(tournamentData.endDate)) {
        throw new Error('End date must be after existing start date');
      }
    }

    // Validate maxTeams if provided
    if (tournamentData.maxTeams !== undefined) {
      if (tournamentData.maxTeams <= 0) {
        throw new Error('Maximum teams must be a positive number');
      }

      if (tournamentData.maxTeams > 1000) {
        throw new Error('Maximum teams cannot exceed 1000');
      }
    }

    // Validate categories if provided
    if (tournamentData.categoryIds) {
      if (tournamentData.categoryIds.length === 0) {
        throw new Error('At least one category must be selected');
      }

      for (const categoryId of tournamentData.categoryIds) {
        const category = await this.categoryDataSource.findById(categoryId);
        if (!category) {
          throw new Error(`Category with ID ${categoryId} does not exist`);
        }
      }
    }

    const updateData: UpdateTournamentRequest = {};

    if (tournamentData.name !== undefined) {
      updateData.name = tournamentData.name.trim();
    }
    if (tournamentData.description !== undefined) {
      updateData.description = tournamentData.description?.trim();
    }
    if (tournamentData.startDate !== undefined) {
      updateData.startDate = new Date(tournamentData.startDate);
    }
    if (tournamentData.endDate !== undefined) {
      updateData.endDate = new Date(tournamentData.endDate);
    }
    if (tournamentData.maxTeams !== undefined) {
      updateData.maxTeams = tournamentData.maxTeams;
    }
    if (tournamentData.isActive !== undefined) {
      updateData.isActive = tournamentData.isActive;
    }
    if (tournamentData.bannerPath !== undefined) {
      updateData.bannerPath = tournamentData.bannerPath;
    }
    if (tournamentData.categoryIds !== undefined) {
      updateData.categoryIds = [...new Set(tournamentData.categoryIds)]; // Remove duplicates
    }

    const tournament = await this.tournamentDataSource.update(id, updateData);

    this.logger.logInfo('TournamentService: Tournament updated successfully', { id });
    return tournament;
  }

  async deleteTournament(id: number): Promise<void> {
    this.logger.logInfo('TournamentService: Deleting tournament', { id });

    if (!id || id <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    // Check if tournament exists
    const existingTournament = await this.tournamentDataSource.findById(id);
    if (!existingTournament) {
      throw new Error('Tournament not found');
    }

    // Check if tournament has teams associated
    const associatedTeams = await this.teamDataSource.findByTournament(id);
    if (associatedTeams.length > 0) {
      throw new Error(
        `Cannot delete tournament "${existingTournament.name}" because it has ${associatedTeams.length} team(s) associated. Please remove all teams from the tournament first.`
      );
    }

    await this.tournamentDataSource.delete(id);

    this.logger.logInfo('TournamentService: Tournament deleted successfully', { id });
  }

  async addCategoriesToTournament(tournamentId: number, categoryIds: number[]): Promise<void> {
    this.logger.logInfo('TournamentService: Adding categories to tournament', {
      tournamentId,
      categoryIds,
    });

    if (!tournamentId || tournamentId <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('At least one category ID is required');
    }

    // Check if tournament exists
    const tournament = await this.tournamentDataSource.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Validate that all categories exist
    for (const categoryId of categoryIds) {
      const category = await this.categoryDataSource.findById(categoryId);
      if (!category) {
        throw new Error(`Category with ID ${categoryId} does not exist`);
      }
    }

    await this.tournamentDataSource.addCategories(tournamentId, [...new Set(categoryIds)]);

    this.logger.logInfo('TournamentService: Categories added to tournament successfully', {
      tournamentId,
    });
  }

  async removeCategoriesFromTournament(tournamentId: number, categoryIds: number[]): Promise<void> {
    this.logger.logInfo('TournamentService: Removing categories from tournament', {
      tournamentId,
      categoryIds,
    });

    if (!tournamentId || tournamentId <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('At least one category ID is required');
    }

    // Check if tournament exists
    const tournament = await this.tournamentDataSource.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    await this.tournamentDataSource.removeCategories(tournamentId, [...new Set(categoryIds)]);

    this.logger.logInfo('TournamentService: Categories removed from tournament successfully', {
      tournamentId,
    });
  }
}
