import { IPlayerDataSource } from '../../domain/interfaces/IPlayerDataSource';
import { ITeamDataSource } from '../../domain/interfaces/ITeamDataSource';
import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  PlayerWithTeam,
} from '../../domain/entities/Player';
import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError, ConflictError } from '../../shared/exceptions';

export class PlayerService {
  constructor(
    private playerDataSource: IPlayerDataSource,
    private teamDataSource: ITeamDataSource,
    private logger: Logger
  ) {}

  async createPlayer(playerData: CreatePlayerRequest): Promise<Player> {
    this.logger.logInfo('PlayerService: Creating player', {
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      teamId: playerData.teamId,
    });

    // Validate input
    if (!playerData.firstName || playerData.firstName.trim().length === 0) {
      throw new ValidationError('First name is required');
    }

    if (playerData.firstName.trim().length < 2) {
      throw new ValidationError('First name must be at least 2 characters long');
    }

    if (playerData.firstName.trim().length > 50) {
      throw new ValidationError('First name cannot exceed 50 characters');
    }

    if (!playerData.lastName || playerData.lastName.trim().length === 0) {
      throw new ValidationError('Last name is required');
    }

    if (playerData.lastName.trim().length < 2) {
      throw new ValidationError('Last name must be at least 2 characters long');
    }

    if (playerData.lastName.trim().length > 50) {
      throw new ValidationError('Last name cannot exceed 50 characters');
    }

    if (!playerData.email || playerData.email.trim().length === 0) {
      throw new ValidationError('Email is required');
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(playerData.email.trim())) {
      throw new ValidationError('Invalid email format');
    }

    if (!playerData.dateOfBirth) {
      throw new ValidationError('Date of birth is required');
    }

    if (!playerData.teamId || playerData.teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    // Check if team exists
    const team = await this.teamDataSource.findById(playerData.teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Validate jersey number if provided
    if (playerData.jerseyNumber !== undefined) {
      if (playerData.jerseyNumber < 1 || playerData.jerseyNumber > 99) {
        throw new ValidationError('Jersey number must be between 1 and 99');
      }

      // Check if jersey number is already taken in the team
      const existingPlayer = await this.playerDataSource.findByJerseyNumberInTeam(
        playerData.teamId,
        playerData.jerseyNumber
      );
      if (existingPlayer) {
        throw new ConflictError(
          `Jersey number ${playerData.jerseyNumber} is already taken in this team`
        );
      }
    }

    // Check if email is already in use
    const existingPlayerByEmail = await this.playerDataSource.findByEmail(playerData.email.trim());
    if (existingPlayerByEmail) {
      throw new ConflictError('A player with this email already exists');
    }

    // Validate phone if provided
    if (playerData.phone && playerData.phone.trim().length > 0) {
      if (playerData.phone.trim().length < 10 || playerData.phone.trim().length > 15) {
        throw new ValidationError('Phone number must be between 10 and 15 characters');
      }
    }

    // Validate position if provided
    if (playerData.position && playerData.position.trim().length > 50) {
      throw new ValidationError('Position cannot exceed 50 characters');
    }

    const player = await this.playerDataSource.create({
      firstName: playerData.firstName.trim(),
      lastName: playerData.lastName.trim(),
      email: playerData.email.trim().toLowerCase(),
      phone: playerData.phone?.trim() || undefined,
      dateOfBirth: new Date(playerData.dateOfBirth),
      position: playerData.position?.trim() || undefined,
      jerseyNumber: playerData.jerseyNumber,
      teamId: playerData.teamId,
      profilePhotoPath: playerData.profilePhotoPath?.trim() || undefined,
      identificationNumber: playerData.identificationNumber?.trim() || undefined,
      epsProvider: playerData.epsProvider?.trim() || undefined,
    });

    this.logger.logInfo('PlayerService: Player created successfully', { id: player.id });
    return player;
  }

  async getPlayerById(id: number): Promise<PlayerWithTeam> {
    this.logger.logInfo('PlayerService: Getting player by ID', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    const player = await this.playerDataSource.findById(id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    return player;
  }

  async getAllPlayers(): Promise<PlayerWithTeam[]> {
    this.logger.logInfo('PlayerService: Getting all players');

    const players = await this.playerDataSource.findAll();

    this.logger.logInfo('PlayerService: Players retrieved', { count: players.length });
    return players;
  }

  async getPlayersByTeam(teamId: number): Promise<PlayerWithTeam[]> {
    this.logger.logInfo('PlayerService: Getting players by team', { teamId });

    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    // Check if team exists
    const team = await this.teamDataSource.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const players = await this.playerDataSource.findByTeam(teamId);

    this.logger.logInfo('PlayerService: Players by team retrieved', {
      teamId,
      count: players.length,
    });
    return players;
  }

  async updatePlayer(id: number, playerData: UpdatePlayerRequest): Promise<Player> {
    this.logger.logInfo('PlayerService: Updating player', { id, data: playerData });

    if (!id || id <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Check if player exists
    const existingPlayer = await this.playerDataSource.findById(id);
    if (!existingPlayer) {
      throw new NotFoundError('Player not found');
    }

    // Validate name if provided
    if (playerData.firstName !== undefined) {
      if (!playerData.firstName || playerData.firstName.trim().length === 0) {
        throw new ValidationError('First name cannot be empty');
      }

      if (playerData.firstName.trim().length < 2) {
        throw new ValidationError('First name must be at least 2 characters long');
      }

      if (playerData.firstName.trim().length > 50) {
        throw new ValidationError('First name cannot exceed 50 characters');
      }
    }

    if (playerData.lastName !== undefined) {
      if (!playerData.lastName || playerData.lastName.trim().length === 0) {
        throw new ValidationError('Last name cannot be empty');
      }

      if (playerData.lastName.trim().length < 2) {
        throw new ValidationError('Last name must be at least 2 characters long');
      }

      if (playerData.lastName.trim().length > 50) {
        throw new ValidationError('Last name cannot exceed 50 characters');
      }
    }

    // Validate email if provided
    if (playerData.email !== undefined) {
      if (!playerData.email || playerData.email.trim().length === 0) {
        throw new ValidationError('Email cannot be empty');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(playerData.email.trim())) {
        throw new ValidationError('Invalid email format');
      }

      // Check if email is already in use by another player
      const existingPlayerByEmail = await this.playerDataSource.findByEmail(
        playerData.email.trim()
      );
      if (existingPlayerByEmail && existingPlayerByEmail.id !== id) {
        throw new ConflictError('A player with this email already exists');
      }
    }

    // Validate date of birth if provided
    // Validate team if provided
    if (playerData.teamId !== undefined) {
      if (!playerData.teamId || playerData.teamId <= 0) {
        throw new ValidationError('Valid team ID is required');
      }

      const team = await this.teamDataSource.findById(playerData.teamId);
      if (!team) {
        throw new NotFoundError('Team not found');
      }
    }

    // Validate jersey number if provided
    if (playerData.jerseyNumber !== undefined) {
      if (
        playerData.jerseyNumber !== null &&
        (playerData.jerseyNumber < 1 || playerData.jerseyNumber > 99)
      ) {
        throw new ValidationError('Jersey number must be between 1 and 99');
      }

      if (playerData.jerseyNumber !== null) {
        const teamIdToCheck = playerData.teamId || existingPlayer.teamId;
        const existingPlayerWithJersey = await this.playerDataSource.findByJerseyNumberInTeam(
          teamIdToCheck,
          playerData.jerseyNumber
        );
        if (existingPlayerWithJersey && existingPlayerWithJersey.id !== id) {
          throw new ConflictError(
            `Jersey number ${playerData.jerseyNumber} is already taken in this team`
          );
        }
      }
    }

    // Validate phone if provided
    if (
      playerData.phone !== undefined &&
      playerData.phone !== null &&
      playerData.phone.trim().length > 0
    ) {
      if (playerData.phone.trim().length < 10 || playerData.phone.trim().length > 15) {
        throw new ValidationError('Phone number must be between 10 and 15 characters');
      }
    }

    // Validate position if provided
    if (
      playerData.position !== undefined &&
      playerData.position !== null &&
      playerData.position.trim().length > 50
    ) {
      throw new ValidationError('Position cannot exceed 50 characters');
    }

    const updateData: UpdatePlayerRequest = {};

    if (playerData.firstName !== undefined) {
      updateData.firstName = playerData.firstName.trim();
    }
    if (playerData.lastName !== undefined) {
      updateData.lastName = playerData.lastName.trim();
    }
    if (playerData.email !== undefined) {
      updateData.email = playerData.email.trim().toLowerCase();
    }
    if (playerData.phone !== undefined) {
      updateData.phone = playerData.phone?.trim() || null;
    }
    if (playerData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(playerData.dateOfBirth);
    }
    if (playerData.position !== undefined) {
      updateData.position = playerData.position?.trim() || null;
    }
    if (playerData.jerseyNumber !== undefined) {
      updateData.jerseyNumber = playerData.jerseyNumber;
    }
    if (playerData.isActive !== undefined) {
      updateData.isActive = playerData.isActive;
    }
    if (playerData.teamId !== undefined) {
      updateData.teamId = playerData.teamId;
    }
    if (playerData.profilePhotoPath !== undefined) {
      updateData.profilePhotoPath = playerData.profilePhotoPath?.trim() || null;
    }
    if (playerData.identificationNumber !== undefined) {
      updateData.identificationNumber = playerData.identificationNumber?.trim() || null;
    }
    if (playerData.epsProvider !== undefined) {
      updateData.epsProvider = playerData.epsProvider?.trim() || null;
    }

    const player = await this.playerDataSource.update(id, updateData);

    this.logger.logInfo('PlayerService: Player updated successfully', { id });
    return player;
  }

  async deletePlayer(id: number): Promise<void> {
    this.logger.logInfo('PlayerService: Deleting player', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Check if player exists
    const existingPlayer = await this.playerDataSource.findById(id);
    if (!existingPlayer) {
      throw new NotFoundError('Player not found');
    }

    await this.playerDataSource.delete(id);

    this.logger.logInfo('PlayerService: Player deleted successfully', { id });
  }

  async updatePlayerPhoto(id: number, photoPath: string | null): Promise<PlayerWithTeam> {
    this.logger.logInfo('PlayerService: Updating player photo', { id, photoPath });

    if (!id || id <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    // Check if player exists
    const existingPlayer = await this.playerDataSource.findById(id);
    if (!existingPlayer) {
      throw new NotFoundError('Player not found');
    }

    // Update only the photo path
    const player = await this.playerDataSource.update(id, {
      profilePhotoPath: photoPath,
    });

    this.logger.logInfo('PlayerService: Player photo updated successfully', { id, photoPath });

    // Return the updated player with team information
    const updatedPlayer = await this.playerDataSource.findById(id);
    if (!updatedPlayer) {
      throw new NotFoundError('Failed to retrieve updated player');
    }

    return updatedPlayer;
  }
}
