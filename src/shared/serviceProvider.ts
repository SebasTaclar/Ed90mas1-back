import { Logger } from './Logger';
import { AuthService } from '../application/services/AuthService';
import { HealthService } from '../application/services/HealthService';
import { CategoryService } from '../application/services/CategoryService';
import { TournamentService } from '../application/services/TournamentService';
import { TournamentConfigurationService } from '../application/services/TournamentConfigurationService';
import { TeamService } from '../application/services/TeamService';
import { PlayerService } from '../application/services/PlayerService';
import { MatchService } from '../application/services/MatchService';
import { MatchEventService } from '../application/services/MatchEventService';
import { MatchStatisticsService } from '../application/services/MatchStatisticsService';
import { BlobStorageService } from './BlobStorageService';
import { UserPrismaAdapter } from '../infrastructure/DbAdapters/UserPrismaAdapter';
import { CategoryPrismaAdapter } from '../infrastructure/DbAdapters/CategoryPrismaAdapter';
import { TournamentPrismaAdapter } from '../infrastructure/DbAdapters/TournamentPrismaAdapter';
import { TournamentConfigurationPrismaAdapter } from '../infrastructure/DbAdapters/TournamentConfigurationPrismaAdapter';
import { TeamPrismaAdapter } from '../infrastructure/DbAdapters/TeamPrismaAdapter';
import { PlayerPrismaAdapter } from '../infrastructure/DbAdapters/PlayerPrismaAdapter';
import { MatchPrismaAdapter } from '../infrastructure/DbAdapters/MatchPrismaAdapter';
import { MatchEventPrismaAdapter } from '../infrastructure/DbAdapters/MatchEventPrismaAdapter';
import { MatchStatisticsPrismaAdapter } from '../infrastructure/DbAdapters/MatchStatisticsPrismaAdapter';
import { IUserDataSource } from '../domain/interfaces/IUserDataSource';
import { ICategoryDataSource } from '../domain/interfaces/ICategoryDataSource';
import { ITournamentDataSource } from '../domain/interfaces/ITournamentDataSource';
import { ITournamentConfigurationDataSource } from '../domain/interfaces/ITournamentConfigurationDataSource';
import { ITeamDataSource } from '../domain/interfaces/ITeamDataSource';
import { IPlayerDataSource } from '../domain/interfaces/IPlayerDataSource';
import { IMatchDataSource } from '../domain/interfaces/IMatchDataSource';
import { IMatchEventDataSource } from '../domain/interfaces/IMatchEventDataSource';
import { IMatchStatisticsDataSource } from '../domain/interfaces/IMatchStatisticsDataSource';
import { getPrismaClient } from '../config/PrismaClient';

/**
 * Service Provider para inyección de dependencias
 * Centraliza la creación de servicios y manejo de dependencias
 */
export class ServiceProvider {
  private static prismaClient = getPrismaClient();

  /**
   * Crea una instancia de UserDataSource (actualmente PrismaAdapter)
   */
  static getUserDataSource(): IUserDataSource {
    return new UserPrismaAdapter();
  }

  /**
   * Crea una instancia de CategoryDataSource
   */
  static getCategoryDataSource(logger: Logger): ICategoryDataSource {
    return new CategoryPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de TournamentDataSource
   */
  static getTournamentDataSource(logger: Logger): ITournamentDataSource {
    return new TournamentPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de TournamentConfigurationDataSource
   */
  static getTournamentConfigurationDataSource(): ITournamentConfigurationDataSource {
    return new TournamentConfigurationPrismaAdapter();
  }

  /**
   * Crea una instancia de TeamDataSource
   */
  static getTeamDataSource(logger: Logger): ITeamDataSource {
    const userAdapter = new UserPrismaAdapter();
    return new TeamPrismaAdapter(this.prismaClient, logger, userAdapter);
  }

  /**
   * Crea una instancia de MatchDataSource
   */
  static getMatchDataSource(logger: Logger): IMatchDataSource {
    return new MatchPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de MatchEventDataSource
   */
  static getMatchEventDataSource(logger: Logger): IMatchEventDataSource {
    return new MatchEventPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de MatchStatisticsDataSource
   */
  static getMatchStatisticsDataSource(logger: Logger): IMatchStatisticsDataSource {
    return new MatchStatisticsPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de PlayerDataSource
   */
  static getPlayerDataSource(logger: Logger): IPlayerDataSource {
    return new PlayerPrismaAdapter(this.prismaClient, logger);
  }

  /**
   * Crea una instancia de AuthService con sus dependencias inyectadas
   */
  static getAuthService(logger: Logger): AuthService {
    const userDataSource = this.getUserDataSource();
    return new AuthService(logger, userDataSource);
  }

  /**
   * Crea una instancia de HealthService con sus dependencias inyectadas
   */
  static getHealthService(logger: Logger): HealthService {
    return new HealthService(logger);
  }

  /**
   * Crea una instancia de CategoryService con sus dependencias inyectadas
   */
  static getCategoryService(logger: Logger): CategoryService {
    const categoryDataSource = this.getCategoryDataSource(logger);
    const tournamentDataSource = this.getTournamentDataSource(logger);
    return new CategoryService(categoryDataSource, tournamentDataSource, logger);
  }

  /**
   * Crea una instancia de TournamentService con sus dependencias inyectadas
   */
  static getTournamentService(logger: Logger): TournamentService {
    const tournamentDataSource = this.getTournamentDataSource(logger);
    const categoryDataSource = this.getCategoryDataSource(logger);
    const teamDataSource = this.getTeamDataSource(logger);
    const tournamentConfigurationService = this.getTournamentConfigurationService(logger);
    return new TournamentService(
      tournamentDataSource,
      categoryDataSource,
      teamDataSource,
      tournamentConfigurationService,
      logger
    );
  }

  /**
   * Crea una instancia de TournamentConfigurationService con sus dependencias inyectadas
   */
  static getTournamentConfigurationService(logger: Logger): TournamentConfigurationService {
    const tournamentConfigDataSource = this.getTournamentConfigurationDataSource();
    return new TournamentConfigurationService(logger, tournamentConfigDataSource);
  }

  /**
   * Crea una instancia de TeamService con sus dependencias inyectadas
   */
  static getTeamService(logger: Logger): TeamService {
    const teamDataSource = this.getTeamDataSource(logger);
    const tournamentDataSource = this.getTournamentDataSource(logger);
    const userDataSource = this.getUserDataSource();
    return new TeamService(teamDataSource, tournamentDataSource, userDataSource, logger);
  }

  /**
   * Crea una instancia de PlayerService con sus dependencias inyectadas
   */
  static getPlayerService(logger: Logger): PlayerService {
    const playerDataSource = this.getPlayerDataSource(logger);
    const teamDataSource = this.getTeamDataSource(logger);
    return new PlayerService(playerDataSource, teamDataSource, logger);
  }

  /**
   * Crea una instancia de MatchService con sus dependencias inyectadas
   */
  static getMatchService(logger: Logger): MatchService {
    const matchDataSource = this.getMatchDataSource(logger);
    const matchEventDataSource = this.getMatchEventDataSource(logger);
    const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
    const tournamentConfigDataSource = this.getTournamentConfigurationDataSource();
    return new MatchService(
      matchDataSource,
      matchEventDataSource,
      matchStatisticsDataSource,
      tournamentConfigDataSource,
      logger
    );
  }

  /**
   * Crea una instancia de MatchEventService con sus dependencias inyectadas
   */
  static getMatchEventService(logger: Logger): MatchEventService {
    const matchEventDataSource = this.getMatchEventDataSource(logger);
    const matchDataSource = this.getMatchDataSource(logger);
    const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
    return new MatchEventService(
      matchEventDataSource,
      matchDataSource,
      matchStatisticsDataSource,
      logger
    );
  }

  /**
   * Crea una instancia de MatchStatisticsService con sus dependencias inyectadas
   */
  static getMatchStatisticsService(logger: Logger): MatchStatisticsService {
    const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
    const matchDataSource = this.getMatchDataSource(logger);
    return new MatchStatisticsService(matchStatisticsDataSource, matchDataSource, logger);
  }

  /**
   * Crea una instancia de BlobStorageService
   */
  static getBlobStorageService(logger: Logger): BlobStorageService {
    return new BlobStorageService(logger);
  }
}

// Export directo de las funciones más usadas para mayor conveniencia
export const getAuthService = (logger: Logger): AuthService => {
  return ServiceProvider.getAuthService(logger);
};

export const getHealthService = (logger: Logger): HealthService => {
  return ServiceProvider.getHealthService(logger);
};

export const getCategoryService = (logger: Logger): CategoryService => {
  return ServiceProvider.getCategoryService(logger);
};

export const getTournamentService = (logger: Logger): TournamentService => {
  return ServiceProvider.getTournamentService(logger);
};

export const getTournamentConfigurationService = (
  logger: Logger
): TournamentConfigurationService => {
  return ServiceProvider.getTournamentConfigurationService(logger);
};

export const getTeamService = (logger: Logger): TeamService => {
  return ServiceProvider.getTeamService(logger);
};

export const getPlayerService = (logger: Logger): PlayerService => {
  return ServiceProvider.getPlayerService(logger);
};

export const getUserDataSource = (): IUserDataSource => {
  return ServiceProvider.getUserDataSource();
};

export const getMatchService = (logger: Logger): MatchService => {
  return ServiceProvider.getMatchService(logger);
};

export const getMatchEventService = (logger: Logger): MatchEventService => {
  return ServiceProvider.getMatchEventService(logger);
};

export const getMatchStatisticsService = (logger: Logger): MatchStatisticsService => {
  return ServiceProvider.getMatchStatisticsService(logger);
};

export const getBlobStorageService = (logger: Logger): BlobStorageService => {
  return ServiceProvider.getBlobStorageService(logger);
};
