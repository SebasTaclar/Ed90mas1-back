import { PrismaClient } from '@prisma/client';
import { Logger } from '../../shared/Logger';
import { IPlayerDataSource } from '../../domain/interfaces/IPlayerDataSource';
import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  PlayerWithTeam,
} from '../../domain/entities/Player';
import { ValidationError, NotFoundError, ConflictError } from '../../shared/exceptions';

export class PlayerPrismaAdapter implements IPlayerDataSource {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  async create(playerData: CreatePlayerRequest): Promise<Player> {
    try {
      this.logger.logInfo('Creating new player', {
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        teamId: playerData.teamId,
      });

      const player = await this.prisma.player.create({
        data: {
          firstName: playerData.firstName,
          lastName: playerData.lastName,
          email: playerData.email,
          phone: playerData.phone,
          dateOfBirth: playerData.dateOfBirth,
          position: playerData.position,
          jerseyNumber: playerData.jerseyNumber,
          teamId: playerData.teamId,
          profilePhotoPath: playerData.profilePhotoPath,
        },
      });

      this.logger.logInfo('Player created successfully', { id: player.id });
      return player;
    } catch (error: any) {
      this.logger.logError('Error creating player', error);

      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new ConflictError('A player with this email already exists');
        }
        if (error.meta?.target?.includes('unique_jersey_per_team')) {
          throw new ConflictError('A player with this jersey number already exists in this team');
        }
      }
      if (error.code === 'P2003') {
        throw new ValidationError('Invalid team ID provided');
      }
      throw new ValidationError('Failed to create player');
    }
  }

  async findById(id: number): Promise<PlayerWithTeam | null> {
    try {
      this.logger.logInfo('Finding player by ID', { id });

      const player = await this.prisma.player.findUnique({
        where: { id },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoPath: true,
            },
          },
        },
      });

      return player;
    } catch (error) {
      this.logger.logError('Error finding player by ID', error);
      throw new ValidationError('Failed to find player');
    }
  }

  async findAll(): Promise<PlayerWithTeam[]> {
    try {
      this.logger.logInfo('Finding all players');

      const players = await this.prisma.player.findMany({
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoPath: true,
            },
          },
        },
        orderBy: [{ team: { name: 'asc' } }, { lastName: 'asc' }, { firstName: 'asc' }],
      });

      this.logger.logInfo('Players retrieved successfully', { count: players.length });
      return players;
    } catch (error) {
      this.logger.logError('Error finding all players', error);
      throw new ValidationError('Failed to retrieve players');
    }
  }

  async findByTeam(teamId: number): Promise<PlayerWithTeam[]> {
    try {
      this.logger.logInfo('Finding players by team', { teamId });

      const players = await this.prisma.player.findMany({
        where: { teamId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoPath: true,
            },
          },
        },
        orderBy: [{ jerseyNumber: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
      });

      this.logger.logInfo('Players by team retrieved successfully', {
        teamId,
        count: players.length,
      });
      return players;
    } catch (error) {
      this.logger.logError('Error finding players by team', error);
      throw new ValidationError('Failed to retrieve players by team');
    }
  }

  async update(id: number, playerData: UpdatePlayerRequest): Promise<Player> {
    try {
      this.logger.logInfo('Updating player', { id, data: playerData });

      const player = await this.prisma.player.update({
        where: { id },
        data: playerData,
      });

      this.logger.logInfo('Player updated successfully', { id: player.id });
      return player;
    } catch (error: any) {
      this.logger.logError('Error updating player', error);

      if (error.code === 'P2025') {
        throw new NotFoundError('Player not found');
      }
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new ConflictError('A player with this email already exists');
        }
        if (error.meta?.target?.includes('unique_jersey_per_team')) {
          throw new ConflictError('A player with this jersey number already exists in this team');
        }
      }
      if (error.code === 'P2003') {
        throw new ValidationError('Invalid team ID provided');
      }
      throw new ValidationError('Failed to update player');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      this.logger.logInfo('Deleting player', { id });

      await this.prisma.player.delete({
        where: { id },
      });

      this.logger.logInfo('Player deleted successfully', { id });
    } catch (error: any) {
      this.logger.logError('Error deleting player', error);

      if (error.code === 'P2025') {
        throw new NotFoundError('Player not found');
      }
      throw new ValidationError('Failed to delete player');
    }
  }

  async findByEmail(email: string): Promise<Player | null> {
    try {
      this.logger.logInfo('Finding player by email', { email });

      const player = await this.prisma.player.findUnique({
        where: { email },
      });

      return player;
    } catch (error) {
      this.logger.logError('Error finding player by email', error);
      throw new ValidationError('Failed to find player by email');
    }
  }

  async findByJerseyNumberInTeam(teamId: number, jerseyNumber: number): Promise<Player | null> {
    try {
      this.logger.logInfo('Finding player by jersey number in team', { teamId, jerseyNumber });

      const player = await this.prisma.player.findFirst({
        where: {
          teamId,
          jerseyNumber,
        },
      });

      return player;
    } catch (error) {
      this.logger.logError('Error finding player by jersey number in team', error);
      throw new ValidationError('Failed to find player by jersey number');
    }
  }
}
