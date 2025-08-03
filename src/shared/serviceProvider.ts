import { Logger } from './Logger';
import { AuthService } from '../application/services/AuthService';
import { HealthService } from '../application/services/HealthService';
import { UserPrismaAdapter } from '../infrastructure/DbAdapters/UserPrismaAdapter';
import { IUserDataSource } from '../domain/interfaces/IUserDataSource';

/**
 * Service Provider para inyección de dependencias
 * Centraliza la creación de servicios y manejo de dependencias
 */
export class ServiceProvider {
  /**
   * Crea una instancia de UserDataSource (actualmente PrismaAdapter)
   */
  static getUserDataSource(): IUserDataSource {
    return new UserPrismaAdapter();
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

  // Aquí puedes agregar otros servicios en el futuro
  // static getUserService(logger: Logger): UserService {
  //   const userDataSource = this.getUserDataSource();
  //   return new UserService(logger, userDataSource);
  // }
}

// Export directo de las funciones más usadas para mayor conveniencia
export const getAuthService = (logger: Logger): AuthService => {
  return ServiceProvider.getAuthService(logger);
};

export const getHealthService = (logger: Logger): HealthService => {
  return ServiceProvider.getHealthService(logger);
};

export const getUserDataSource = (): IUserDataSource => {
  return ServiceProvider.getUserDataSource();
};
