import { Logger } from './Logger';
import { AuthService } from '../application/services/AuthService';
import { HealthService } from '../application/services/HealthService';

/**
 * Service Provider para inyección de dependencias
 * Centraliza la creación de servicios y manejo de dependencias
 */
export class ServiceProvider {
  /**
   * Crea una instancia de AuthService con sus dependencias inyectadas
   */
  static getAuthService(logger: Logger): AuthService {
    return new AuthService(logger);
  }

  /**
   * Crea una instancia de HealthService con sus dependencias inyectadas
   */
  static getHealthService(logger: Logger): HealthService {
    return new HealthService(logger);
  }

  // Aquí puedes agregar otros servicios en el futuro
  // static getUserService(logger: Logger): UserService {
  //   return new UserService(logger);
  // }
}

// Export directo de las funciones más usadas para mayor conveniencia
export const getAuthService = ServiceProvider.getAuthService;
export const getHealthService = ServiceProvider.getHealthService;
