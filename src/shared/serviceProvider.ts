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
 * Implementa patrón singleton para evitar múltiples instancias
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

  // Cache de servicios singleton
  private static authService: AuthService | null = null;
  private static healthService: HealthService | null = null;
  private static categoryService: CategoryService | null = null;
  private static tournamentService: TournamentService | null = null;
  private static tournamentConfigurationService: TournamentConfigurationService | null = null;
  private static teamService: TeamService | null = null;
  private static playerService: PlayerService | null = null;
  private static matchService: MatchService | null = null;
  private static matchEventService: MatchEventService | null = null;
  private static matchStatisticsService: MatchStatisticsService | null = null;

  // Usar función para obtener la instancia global cada vez
  private static getPrismaClient() {
    return getPrismaClient();
  }

  /**
   * Obtiene la instancia singleton de UserDataSource
   */
  static getUserDataSource(): UserPrismaAdapter {
    if (!this.userDataSource) {
      console.log('🔄 Creating new UserPrismaAdapter singleton');
      this.userDataSource = new UserPrismaAdapter(this.getPrismaClient());
    }
    return this.userDataSource;
  }

  /**
   * Obtiene la instancia singleton de CategoryDataSource
   */
  static getCategoryDataSource(logger: Logger): ICategoryDataSource {
    if (!this.categoryDataSource) {
      console.log('🔄 Creating new CategoryPrismaAdapter singleton');
      this.categoryDataSource = new CategoryPrismaAdapter(this.getPrismaClient(), logger);
    }
    return this.categoryDataSource;
  }

  /**
   * Obtiene la instancia singleton de TournamentDataSource
   */
  static getTournamentDataSource(logger: Logger): ITournamentDataSource {
    if (!this.tournamentDataSource) {
      console.log('🔄 Creating new TournamentPrismaAdapter singleton');
      this.tournamentDataSource = new TournamentPrismaAdapter(this.getPrismaClient(), logger);
    }
    return this.tournamentDataSource;
  }

  /**
   * Obtiene la instancia singleton de TournamentConfigurationDataSource
   */
  static getTournamentConfigurationDataSource(): ITournamentConfigurationDataSource {
    if (!this.tournamentConfigurationDataSource) {
      console.log('🔄 Creating new TournamentConfigurationPrismaAdapter singleton');
      this.tournamentConfigurationDataSource = new TournamentConfigurationPrismaAdapter(
        this.getPrismaClient()
      );
    }
    return this.tournamentConfigurationDataSource;
  }

  /**
   * Obtiene la instancia singleton de TeamDataSource
   */
  static getTeamDataSource(logger: Logger): ITeamDataSource {
    if (!this.teamDataSource) {
      console.log('🔄 Creating new TeamPrismaAdapter singleton');
      const userAdapter = this.getUserDataSource(); // Ya devuelve UserPrismaAdapter
      this.teamDataSource = new TeamPrismaAdapter(this.getPrismaClient(), logger, userAdapter);
    }
    return this.teamDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchDataSource
   */
  static getMatchDataSource(logger: Logger): IMatchDataSource {
    if (!this.matchDataSource) {
      console.log('🔄 Creating new MatchPrismaAdapter singleton');
      this.matchDataSource = new MatchPrismaAdapter(this.getPrismaClient(), logger);
    }
    return this.matchDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchEventDataSource
   */
  static getMatchEventDataSource(logger: Logger): IMatchEventDataSource {
    if (!this.matchEventDataSource) {
      console.log('🔄 Creating new MatchEventPrismaAdapter singleton');
      this.matchEventDataSource = new MatchEventPrismaAdapter(this.getPrismaClient(), logger);
    }
    return this.matchEventDataSource;
  }

  /**
   * Obtiene la instancia singleton de MatchStatisticsDataSource
   */
  static getMatchStatisticsDataSource(logger: Logger): IMatchStatisticsDataSource {
    if (!this.matchStatisticsDataSource) {
      console.log('🔄 Creating new MatchStatisticsPrismaAdapter singleton');
      this.matchStatisticsDataSource = new MatchStatisticsPrismaAdapter(
        this.getPrismaClient(),
        logger
      );
    }
    return this.matchStatisticsDataSource;
  }

  /**
   * Obtiene la instancia singleton de PlayerDataSource
   */
  static getPlayerDataSource(logger: Logger): IPlayerDataSource {
    if (!this.playerDataSource) {
      console.log('🔄 Creating new PlayerPrismaAdapter singleton');
      this.playerDataSource = new PlayerPrismaAdapter(this.getPrismaClient(), logger);
    }
    return this.playerDataSource;
  }

  /**
   * Obtiene la instancia singleton de AuthService
   */
  static getAuthService(logger: Logger): AuthService {
    if (!this.authService) {
      console.log('🔄 Creating new AuthService singleton');
      const userDataSource = this.getUserDataSource();
      this.authService = new AuthService(logger, userDataSource);
    }
    return this.authService;
  }

  /**
   * Obtiene la instancia singleton de HealthService
   */
  static getHealthService(logger: Logger): HealthService {
    if (!this.healthService) {
      console.log('🔄 Creating new HealthService singleton');
      this.healthService = new HealthService(logger);
    }
    return this.healthService;
  }

  /**
   * Obtiene la instancia singleton de CategoryService
   */
  static getCategoryService(logger: Logger): CategoryService {
    if (!this.categoryService) {
      console.log('🔄 Creating new CategoryService singleton');
      const categoryDataSource = this.getCategoryDataSource(logger);
      const tournamentDataSource = this.getTournamentDataSource(logger);
      this.categoryService = new CategoryService(categoryDataSource, tournamentDataSource, logger);
    }
    return this.categoryService;
  }

  /**
   * Obtiene la instancia singleton de TournamentService
   */
  static getTournamentService(logger: Logger): TournamentService {
    if (!this.tournamentService) {
      console.log('🔄 Creating new TournamentService singleton');
      const tournamentDataSource = this.getTournamentDataSource(logger);
      const categoryDataSource = this.getCategoryDataSource(logger);
      const teamDataSource = this.getTeamDataSource(logger);
      const tournamentConfigurationService = this.getTournamentConfigurationService(logger);
      this.tournamentService = new TournamentService(
        tournamentDataSource,
        categoryDataSource,
        teamDataSource,
        tournamentConfigurationService,
        logger
      );
    }
    return this.tournamentService;
  }

  /**
   * Obtiene la instancia singleton de TournamentConfigurationService
   */
  static getTournamentConfigurationService(logger: Logger): TournamentConfigurationService {
    if (!this.tournamentConfigurationService) {
      console.log('🔄 Creating new TournamentConfigurationService singleton');
      const tournamentConfigDataSource = this.getTournamentConfigurationDataSource();
      this.tournamentConfigurationService = new TournamentConfigurationService(
        logger,
        tournamentConfigDataSource
      );
    }
    return this.tournamentConfigurationService;
  }

  /**
   * Obtiene la instancia singleton de TeamService
   */
  static getTeamService(logger: Logger): TeamService {
    if (!this.teamService) {
      console.log('🔄 Creating new TeamService singleton');
      const teamDataSource = this.getTeamDataSource(logger);
      const tournamentDataSource = this.getTournamentDataSource(logger);
      const userDataSource = this.getUserDataSource();
      this.teamService = new TeamService(
        teamDataSource,
        tournamentDataSource,
        userDataSource,
        logger
      );
    }
    return this.teamService;
  }

  /**
   * Obtiene la instancia singleton de PlayerService
   */
  static getPlayerService(logger: Logger): PlayerService {
    if (!this.playerService) {
      console.log('🔄 Creating new PlayerService singleton');
      const playerDataSource = this.getPlayerDataSource(logger);
      const teamDataSource = this.getTeamDataSource(logger);
      this.playerService = new PlayerService(playerDataSource, teamDataSource, logger);
    }
    return this.playerService;
  }

  /**
   * Obtiene la instancia singleton de MatchService
   */
  static getMatchService(logger: Logger): MatchService {
    if (!this.matchService) {
      console.log('🔄 Creating new MatchService singleton');
      const matchDataSource = this.getMatchDataSource(logger);
      const matchEventDataSource = this.getMatchEventDataSource(logger);
      const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
      const tournamentConfigDataSource = this.getTournamentConfigurationDataSource();
      this.matchService = new MatchService(
        matchDataSource,
        matchEventDataSource,
        matchStatisticsDataSource,
        tournamentConfigDataSource,
        logger
      );
    }
    return this.matchService;
  }

  /**
   * Obtiene la instancia singleton de MatchEventService
   */
  static getMatchEventService(logger: Logger): MatchEventService {
    if (!this.matchEventService) {
      console.log('🔄 Creating new MatchEventService singleton');
      const matchEventDataSource = this.getMatchEventDataSource(logger);
      const matchDataSource = this.getMatchDataSource(logger);
      const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
      this.matchEventService = new MatchEventService(
        matchEventDataSource,
        matchDataSource,
        matchStatisticsDataSource,
        logger
      );
    }
    return this.matchEventService;
  }

  /**
   * Obtiene la instancia singleton de MatchStatisticsService
   */
  static getMatchStatisticsService(logger: Logger): MatchStatisticsService {
    if (!this.matchStatisticsService) {
      console.log('🔄 Creating new MatchStatisticsService singleton');
      const matchStatisticsDataSource = this.getMatchStatisticsDataSource(logger);
      const matchDataSource = this.getMatchDataSource(logger);
      this.matchStatisticsService = new MatchStatisticsService(
        matchStatisticsDataSource,
        matchDataSource,
        logger
      );
    }
    return this.matchStatisticsService;
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

export const getUserDataSource = (): UserPrismaAdapter => {
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
