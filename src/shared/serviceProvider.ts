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

/**
 * Service Provider para inyección de dependencias
 * Centraliza la creación de servicios y manejo de dependencias
 * Implementa patrón singleton para adapters de datos (para compartir conexión DB)
 * Los servicios se crean como nuevas instancias en cada invocación
 */
export class ServiceProvider {
  // Cache de instancias singleton para adapters
  private static userDataSource: UserPrismaAdapter | null = null;
  private static categoryDataSource: ICategoryDataSource | null = null;
  private static tournamentDataSource: ITournamentDataSource | null = null;
  private static tournamentConfigurationDataSource: ITournamentConfigurationDataSource | null =
    null;
  private static teamDataSource: ITeamDataSource | null = null;
  private static playerDataSource: IPlayerDataSource | null = null;
  private static matchDataSource: IMatchDataSource | null = null;
  private static matchEventDataSource: IMatchEventDataSource | null = null;
  private static matchStatisticsDataSource: IMatchStatisticsDataSource | null = null;

  /**
   * Obtiene la instancia singleton de UserDataSource
   */
  static getUserDataSource(logger: Logger): UserPrismaAdapter {
    if (!this.userDataSource) {
      console.log('🔄 Creating new UserPrismaAdapter singleton');
      this.userDataSource = new UserPrismaAdapter(logger);
    }
    return this.userDataSource;
  }

  /**
   * Obtiene la instancia singleton de CategoryDataSource
   */
  static getCategoryDataSource(logger: Logger): ICategoryDataSource {
    if (!this.categoryDataSource) {
      console.log('🔄 Creating new CategoryPrismaAdapter singleton');
      this.categoryDataSource = new CategoryPrismaAdapter(logger);
    }
    return this.categoryDataSource;
  }

  /**
   * Obtiene la instancia singleton de TournamentDataSource
   */
  static getTournamentDataSource(logger: Logger): ITournamentDataSource {
    if (!this.tournamentDataSource) {
      console.log('🔄 Creating new TournamentPrismaAdapter singleton');
      this.tournamentDataSource = new TournamentPrismaAdapter(logger);
    }
    return this.tournamentDataSource;
  }

  /**
   * Obtiene la instancia singleton de TournamentConfigurationDataSource
   */
  static getTournamentConfigurationDataSource(): ITournamentConfigurationDataSource {
    if (!this.tournamentConfigurationDataSource) {
      console.log('🔄 Creating new TournamentConfigurationPrismaAdapter singleton');
      this.tournamentConfigurationDataSource = new TournamentConfigurationPrismaAdapter();
    }
    return this.tournamentConfigurationDataSource;
  }

  /**
   * Obtiene la instancia singleton de TeamDataSource
   */
  static getTeamDataSource(logger: Logger): ITeamDataSource {
    if (!this.teamDataSource) {
      console.log('🔄 Creating new TeamPrismaAdapter singleton');
      const userAdapter = this.getUserDataSource(logger); // Ya devuelve UserPrismaAdapter
      this.teamDataSource = new TeamPrismaAdapter(logger, userAdapter);
    }
    return this.teamDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchDataSource
   */
  static getMatchDataSource(logger: Logger): IMatchDataSource {
    if (!this.matchDataSource) {
      console.log('🔄 Creating new MatchPrismaAdapter singleton');
      this.matchDataSource = new MatchPrismaAdapter(logger);
    }
    return this.matchDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchEventDataSource
   */
  static getMatchEventDataSource(logger: Logger): IMatchEventDataSource {
    if (!this.matchEventDataSource) {
      console.log('🔄 Creating new MatchEventPrismaAdapter singleton');
      this.matchEventDataSource = new MatchEventPrismaAdapter(logger);
    }
    return this.matchEventDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchStatisticsDataSource
   */
  static getMatchStatisticsDataSource(logger: Logger): IMatchStatisticsDataSource {
    if (!this.matchStatisticsDataSource) {
      console.log('🔄 Creating new MatchStatisticsPrismaAdapter singleton');
      this.matchStatisticsDataSource = new MatchStatisticsPrismaAdapter(logger);
    }
    return this.matchStatisticsDataSource;
  }

  /**
   * Obtiene la instancia singleton de PlayerDataSource
   */
  static getPlayerDataSource(logger: Logger): IPlayerDataSource {
    if (!this.playerDataSource) {
      console.log('🔄 Creating new PlayerPrismaAdapter singleton');
      this.playerDataSource = new PlayerPrismaAdapter(logger);
    }
    return this.playerDataSource;
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
    const tournamentConfigDataSource = this.getTournamentConfigurationDataSource();
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
