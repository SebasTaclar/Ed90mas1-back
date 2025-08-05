import { Logger } from './Logger';
import { AuthService } from '../application/services/AuthService';
import { HealthService } from '../application/services/HealthService';
import { CategoryService } from '../application/services/CategoryService';
import { TournamentService } from '../application/services/TournamentService';
import { TeamService } from '../application/services/TeamService';
import { BlobStorageService } from './BlobStorageService';
import { UserPrismaAdapter } from '../infrastructure/DbAdapters/UserPrismaAdapter';
import { CategoryPrismaAdapter } from '../infrastructure/DbAdapters/CategoryPrismaAdapter';
import { TournamentPrismaAdapter } from '../infrastructure/DbAdapters/TournamentPrismaAdapter';
import { TeamPrismaAdapter } from '../infrastructure/DbAdapters/TeamPrismaAdapter';
import { IUserDataSource } from '../domain/interfaces/IUserDataSource';
import { ICategoryDataSource } from '../domain/interfaces/ICategoryDataSource';
import { ITournamentDataSource } from '../domain/interfaces/ITournamentDataSource';
import { ITeamDataSource } from '../domain/interfaces/ITeamDataSource';
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
   * Crea una instancia de TeamDataSource
   */
  static getTeamDataSource(logger: Logger): ITeamDataSource {
    const userAdapter = new UserPrismaAdapter();
    return new TeamPrismaAdapter(this.prismaClient, logger, userAdapter);
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
    return new TournamentService(tournamentDataSource, categoryDataSource, teamDataSource, logger);
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

export const getTeamService = (logger: Logger): TeamService => {
  return ServiceProvider.getTeamService(logger);
};

export const getUserDataSource = (): IUserDataSource => {
  return ServiceProvider.getUserDataSource();
};

export const getBlobStorageService = (logger: Logger): BlobStorageService => {
  return ServiceProvider.getBlobStorageService(logger);
};
