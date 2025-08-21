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
import { ICategoryDataSource } from '../domain/interfaces/ICategoryDataSource';
import { ITournamentDataSource } from '../domain/interfaces/ITournamentDataSource';
import { ITournamentConfigurationDataSource } from '../domain/interfaces/ITournamentConfigurationDataSource';
import { ITeamDataSource } from '../domain/interfaces/ITeamDataSource';
import { IPlayerDataSource } from '../domain/interfaces/IPlayerDataSource';
import { IMatchDataSource } from '../domain/interfaces/IMatchDataSource';
import { IMatchEventDataSource } from '../domain/interfaces/IMatchEventDataSource';
import { IMatchStatisticsDataSource } from '../domain/interfaces/IMatchStatisticsDataSource';

/**
 * Service Provider para inyección de dependencias
 * Centraliza la creación de servicios y manejo de dependencias
 * ELIMINADO: patrón singleton - ahora crea nuevas instancias cada vez
 * Esto permite identificar mejor el problema de múltiples conexiones DB
 */
export class ServiceProvider {
  /**
   * Crea una nueva instancia de UserPrismaAdapter
   */
  static getUserDataSource(logger: Logger): UserPrismaAdapter {
    console.log('🔄 Creating new UserPrismaAdapter instance');
    return new UserPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de CategoryDataSource
   */
  static getCategoryDataSource(logger: Logger): ICategoryDataSource {
    console.log('🔄 Creating new CategoryPrismaAdapter instance');
    return new CategoryPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de TournamentDataSource
   */
  static getTournamentDataSource(logger: Logger): ITournamentDataSource {
    console.log('🔄 Creating new TournamentPrismaAdapter instance');
    return new TournamentPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de TournamentConfigurationDataSource
   */
  static getTournamentConfigurationDataSource(logger: Logger): ITournamentConfigurationDataSource {
    console.log('🔄 Creating new TournamentConfigurationPrismaAdapter instance');
    return new TournamentConfigurationPrismaAdapter();
  }

  /**
   * Crea una nueva instancia de TeamDataSource
   */
  static getTeamDataSource(logger: Logger): ITeamDataSource {
    console.log('🔄 Creating new TeamPrismaAdapter instance');
    const userAdapter = this.getUserDataSource(logger);
    return new TeamPrismaAdapter(logger, userAdapter);
  }

  /**
   * Crea una nueva instancia de MatchDataSource
   */
  static getMatchDataSource(logger: Logger): IMatchDataSource {
    console.log('🔄 Creating new MatchPrismaAdapter instance');
    return new MatchPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de MatchEventDataSource
   */
  static getMatchEventDataSource(logger: Logger): IMatchEventDataSource {
    console.log('🔄 Creating new MatchEventPrismaAdapter instance');
    return new MatchEventPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de MatchStatisticsDataSource
   */
  static getMatchStatisticsDataSource(logger: Logger): IMatchStatisticsDataSource {
    console.log('🔄 Creating new MatchStatisticsPrismaAdapter instance');
    return new MatchStatisticsPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de PlayerDataSource
   */
  static getPlayerDataSource(logger: Logger): IPlayerDataSource {
    console.log('🔄 Creating new PlayerPrismaAdapter instance');
    return new PlayerPrismaAdapter(logger);
  }

  /**
   * Crea una nueva instancia de AuthService
   */
  static getAuthService(logger: Logger): AuthService {
    console.log('🔄 Creating new AuthService instance');
    const userDataSource = this.getUserDataSource(logger);
    return new AuthService(logger, userDataSource);
  }

  /**
   * Crea una nueva instancia de HealthService
   */
  static getHealthService(logger: Logger): HealthService {
    console.log('🔄 Creating new HealthService instance');
    return new HealthService(logger);
  }

  /**
   * Crea una nueva instancia de CategoryService
   */
  static getCategoryService(logger: Logger): CategoryService {
    console.log('🔄 Creating new CategoryService instance');
    const categoryDataSource = this.getCategoryDataSource(logger);
    const tournamentDataSource = this.getTournamentDataSource(logger);
    return new CategoryService(categoryDataSource, tournamentDataSource, logger);
  }

  /**
   * Crea una nueva instancia de TournamentService
   */
  static getTournamentService(logger: Logger): TournamentService {
    console.log('🔄 Creating new TournamentService instance');
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
   * Crea una nueva instancia de TournamentConfigurationService
   */
  static getTournamentConfigurationService(logger: Logger): TournamentConfigurationService {
    console.log('🔄 Creating new TournamentConfigurationService instance');
    const tournamentConfigDataSource = this.getTournamentConfigurationDataSource(logger);
    return new TournamentConfigurationService(logger, tournamentConfigDataSource);
  }

  /**
   * Crea una nueva instancia de TeamService
   */
  static getTeamService(logger: Logger): TeamService {
    console.log('🔄 Creating new TeamService instance');
    const teamDataSource = this.getTeamDataSource(logger);
    const tournamentDataSource = this.getTournamentDataSource(logger);
    const userDataSource = this.getUserDataSource(logger);
    return new TeamService(teamDataSource, tournamentDataSource, userDataSource, logger);
  }

  /**
   * Crea una nueva instancia de PlayerService
   */
  static getPlayerService(logger: Logger): PlayerService {
    console.log('🔄 Creating new PlayerService instance');
    const playerDataSource = this.getPlayerDataSource(logger);
    const teamDataSource = this.getTeamDataSource(logger);
    return new PlayerService(playerDataSource, teamDataSource, logger);
  }

  /**
   * Crea una nueva instancia de MatchService
   */
  static getMatchService(logger: Logger): MatchService {
    console.log('🔄 Creating new MatchService instance');
    const matchDataSource = this.getMatchDataSource(logger);
    const matchEventDataSource = this.getMatchEventDataSource(logger);
    const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
    const tournamentConfigDataSource = this.getTournamentConfigurationDataSource(logger);
    return new MatchService(
      matchDataSource,
      matchEventDataSource,
      matchStatisticsDataSource,
      tournamentConfigDataSource,
      logger
    );
  }

  /**
   * Crea una nueva instancia de MatchEventService
   */
  static getMatchEventService(logger: Logger): MatchEventService {
    console.log('🔄 Creating new MatchEventService instance');
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
   * Crea una nueva instancia de MatchStatisticsService
   */
  static getMatchStatisticsService(logger: Logger): MatchStatisticsService {
    console.log('🔄 Creating new MatchStatisticsService instance');
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

export const getUserDataSource = (logger: Logger): UserPrismaAdapter => {
  return ServiceProvider.getUserDataSource(logger);
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
