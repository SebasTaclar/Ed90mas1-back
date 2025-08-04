import { ITeamDataSource } from '../../domain/interfaces/ITeamDataSource';
import { ITournamentDataSource } from '../../domain/interfaces/ITournamentDataSource';
import { IUserDataSource } from '../../domain/interfaces/IUserDataSource';
import {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamWithRelations,
} from '../../domain/entities/Team';
import { Logger } from '../../shared/Logger';

export class TeamService {
  constructor(
    private teamDataSource: ITeamDataSource,
    private tournamentDataSource: ITournamentDataSource,
    private userDataSource: IUserDataSource,
    private logger: Logger
  ) {}

  async createTeam(teamData: CreateTeamRequest): Promise<TeamWithRelations> {
    this.logger.logInfo('TeamService: Creating team', {
      name: teamData.name,
      userEmail: teamData.userEmail,
    });

    // Validate input
    if (!teamData.name || teamData.name.trim().length === 0) {
      throw new Error('Team name is required');
    }

    if (teamData.name.trim().length < 2) {
      throw new Error('Team name must be at least 2 characters long');
    }

    if (teamData.name.trim().length > 100) {
      throw new Error('Team name cannot exceed 100 characters');
    }

    // Validate logoPath if provided
    if (teamData.logoPath && teamData.logoPath.trim().length === 0) {
      throw new Error('Logo path cannot be empty string');
    }

    // Validate user data
    if (!teamData.userEmail || teamData.userEmail.trim().length === 0) {
      throw new Error('User email is required');
    }

    if (!teamData.userPassword || teamData.userPassword.trim().length === 0) {
      throw new Error('User password is required');
    }

    if (teamData.userPassword.length < 6) {
      throw new Error('User password must be at least 6 characters long');
    }

    if (!teamData.userName || teamData.userName.trim().length === 0) {
      throw new Error('User name is required');
    }

    if (teamData.userName.trim().length < 2) {
      throw new Error('User name must be at least 2 characters long');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teamData.userEmail.trim())) {
      throw new Error('Invalid email format');
    }

    // Validate tournaments if provided
    if (teamData.tournamentIds && teamData.tournamentIds.length > 0) {
      for (const tournamentId of teamData.tournamentIds) {
        const tournament = await this.tournamentDataSource.findById(tournamentId);
        if (!tournament) {
          throw new Error(`Tournament with ID ${tournamentId} does not exist`);
        }

        if (!tournament.isActive) {
          throw new Error(`Tournament "${tournament.name}" is not active`);
        }

        // Check if tournament has space for more teams
        const teamsInTournament = await this.teamDataSource.findByTournament(tournamentId);
        if (teamsInTournament.length >= tournament.maxTeams) {
          throw new Error(`Tournament "${tournament.name}" is full`);
        }
      }
    }

    const team = await this.teamDataSource.create({
      name: teamData.name.trim(),
      logoPath: teamData.logoPath?.trim(),
      userEmail: teamData.userEmail.trim().toLowerCase(),
      userPassword: teamData.userPassword,
      userName: teamData.userName.trim(),
      tournamentIds: teamData.tournamentIds ? [...new Set(teamData.tournamentIds)] : [], // Remove duplicates
    });

    this.logger.logInfo('TeamService: Team created successfully', {
      teamId: team.id,
      userId: team.user.id,
      tournaments: team.tournaments.length,
    });
    return team;
  }

  async getTeamById(id: number): Promise<TeamWithRelations> {
    this.logger.logInfo('TeamService: Getting team by ID', { id });

    if (!id || id <= 0) {
      throw new Error('Valid team ID is required');
    }

    const team = await this.teamDataSource.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }

    return team;
  }

  async getAllTeams(): Promise<TeamWithRelations[]> {
    this.logger.logInfo('TeamService: Getting all teams');

    const teams = await this.teamDataSource.findAll();

    this.logger.logInfo('TeamService: Teams retrieved', { count: teams.length });
    return teams;
  }

  async getTeams(tournamentId?: string): Promise<TeamWithRelations[]> {
    this.logger.logInfo('TeamService: Getting teams with filters', { tournamentId });

    if (tournamentId) {
      // Validate tournament ID format
      const tournamentIdNum = parseInt(tournamentId);
      if (isNaN(tournamentIdNum)) {
        throw new Error('Invalid tournament ID format');
      }

      if (tournamentIdNum <= 0) {
        throw new Error('Tournament ID must be a positive number');
      }

      // Use existing method for tournament-specific teams
      return await this.getTeamsByTournament(tournamentIdNum);
    } else {
      // Use existing method for all teams
      return await this.getAllTeams();
    }
  }

  async getTeamByUserId(userId: number): Promise<Team | null> {
    this.logger.logInfo('TeamService: Getting team by user ID', { userId });

    if (!userId || userId <= 0) {
      throw new Error('Valid user ID is required');
    }

    const team = await this.teamDataSource.findByUserId(userId);

    this.logger.logInfo('TeamService: Team by user retrieved', { userId, found: !!team });
    return team;
  }
  async getTeamsByTournament(tournamentId: number): Promise<TeamWithRelations[]> {
    this.logger.logInfo('TeamService: Getting teams by tournament', { tournamentId });

    if (!tournamentId || tournamentId <= 0) {
      throw new Error('Valid tournament ID is required');
    }

    // Validate that tournament exists
    const tournament = await this.tournamentDataSource.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const teams = await this.teamDataSource.findByTournament(tournamentId);

    this.logger.logInfo('TeamService: Teams by tournament retrieved', {
      tournamentId,
      count: teams.length,
    });
    return teams;
  }

  async updateTeam(
    id: number,
    teamData: UpdateTeamRequest,
    authenticatedUser?: { id: string; role: string; email: string }
  ): Promise<Team> {
    this.logger.logInfo('TeamService: Updating team', {
      id,
      data: teamData,
      requestedBy: authenticatedUser?.email,
    });

    if (!id || id <= 0) {
      throw new Error('Valid team ID is required');
    }

    // Check if team exists
    const existingTeam = await this.teamDataSource.findById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }

    // Authorization check: only admins or the team owner can update
    if (authenticatedUser) {
      if (
        authenticatedUser.role !== 'admin' &&
        authenticatedUser.id !== existingTeam.user.id.toString()
      ) {
        throw new Error('Forbidden: You can only update your own team');
      }
    }

    // Validate name if provided
    if (teamData.name !== undefined) {
      if (!teamData.name || teamData.name.trim().length === 0) {
        throw new Error('Team name cannot be empty');
      }

      if (teamData.name.trim().length < 2) {
        throw new Error('Team name must be at least 2 characters long');
      }

      if (teamData.name.trim().length > 100) {
        throw new Error('Team name cannot exceed 100 characters');
      }
    }

    // Validate logoPath if provided
    if (teamData.logoPath !== undefined) {
      // Allow empty string to clear the logo, but validate non-empty strings
      if (typeof teamData.logoPath === 'string' && teamData.logoPath.trim().length > 0) {
        // Optional: Add validation for valid file path format if needed
      }
    }

    // Validate tournaments if provided
    if (teamData.tournamentIds) {
      for (const tournamentId of teamData.tournamentIds) {
        const tournament = await this.tournamentDataSource.findById(tournamentId);
        if (!tournament) {
          throw new Error(`Tournament with ID ${tournamentId} does not exist`);
        }

        if (!tournament.isActive) {
          throw new Error(`Tournament "${tournament.name}" is not active`);
        }

        // Check if tournament has space for more teams (excluding current team)
        const teamsInTournament = await this.teamDataSource.findByTournament(tournamentId);
        const currentTeamInTournament = teamsInTournament.some((team) => team.id === id);
        const effectiveTeamCount = currentTeamInTournament
          ? teamsInTournament.length
          : teamsInTournament.length + 1;

        if (effectiveTeamCount > tournament.maxTeams) {
          throw new Error(`Tournament "${tournament.name}" is full`);
        }
      }
    }

    const updateData: UpdateTeamRequest = {};

    if (teamData.name !== undefined) {
      updateData.name = teamData.name.trim();
    }
    if (teamData.logoPath !== undefined) {
      updateData.logoPath = teamData.logoPath?.trim() || null;
    }
    if (teamData.isActive !== undefined) {
      updateData.isActive = teamData.isActive;
    }
    if (teamData.tournamentIds !== undefined) {
      updateData.tournamentIds = [...new Set(teamData.tournamentIds)]; // Remove duplicates
    }

    const team = await this.teamDataSource.update(id, updateData);

    this.logger.logInfo('TeamService: Team updated successfully', { id });
    return team;
  }

  async deleteTeam(id: number): Promise<void> {
    this.logger.logInfo('TeamService: Deleting team', { id });

    if (!id || id <= 0) {
      throw new Error('Valid team ID is required');
    }

    // Check if team exists
    const existingTeam = await this.teamDataSource.findById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }

    // Get the user ID before deleting the team
    const userId = existingTeam.user.id;

    this.logger.logInfo('TeamService: Deleting team and associated user', {
      teamId: id,
      userId: userId,
      userEmail: existingTeam.user.email,
    });

    // Delete the team first (this will also delete related records due to foreign key constraints)
    await this.teamDataSource.delete(id);

    // Delete the associated user
    await this.userDataSource.delete(userId.toString());

    this.logger.logInfo('TeamService: Team and user deleted successfully', {
      teamId: id,
      userId: userId,
    });
  }

  async addTeamToTournaments(teamId: number, tournamentIds: number[]): Promise<void> {
    this.logger.logInfo('TeamService: Adding team to tournaments', { teamId, tournamentIds });

    if (!teamId || teamId <= 0) {
      throw new Error('Valid team ID is required');
    }

    if (!tournamentIds || tournamentIds.length === 0) {
      throw new Error('At least one tournament ID is required');
    }

    // Check if team exists
    const team = await this.teamDataSource.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Validate tournaments
    for (const tournamentId of tournamentIds) {
      const tournament = await this.tournamentDataSource.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} does not exist`);
      }

      if (!tournament.isActive) {
        throw new Error(`Tournament "${tournament.name}" is not active`);
      }

      // Check if tournament has space for more teams
      const teamsInTournament = await this.teamDataSource.findByTournament(tournamentId);
      const teamAlreadyInTournament = teamsInTournament.some((t) => t.id === teamId);

      if (!teamAlreadyInTournament && teamsInTournament.length >= tournament.maxTeams) {
        throw new Error(`Tournament "${tournament.name}" is full`);
      }
    }

    await this.teamDataSource.addToTournaments(teamId, [...new Set(tournamentIds)]);

    this.logger.logInfo('TeamService: Team added to tournaments successfully', { teamId });
  }

  async removeTeamFromTournaments(teamId: number, tournamentIds: number[]): Promise<void> {
    this.logger.logInfo('TeamService: Removing team from tournaments', { teamId, tournamentIds });

    if (!teamId || teamId <= 0) {
      throw new Error('Valid team ID is required');
    }

    if (!tournamentIds || tournamentIds.length === 0) {
      throw new Error('At least one tournament ID is required');
    }

    // Check if team exists
    const team = await this.teamDataSource.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    await this.teamDataSource.removeFromTournaments(teamId, [...new Set(tournamentIds)]);

    this.logger.logInfo('TeamService: Team removed from tournaments successfully', { teamId });
  }
}
