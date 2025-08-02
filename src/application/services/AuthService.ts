import { generateToken } from '../../shared/jwtHelper';
import { Logger } from '../../shared/Logger';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  name: string;
  membershipPaid: boolean;
}

export class AuthService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    try {
      const { username, password } = loginRequest;

      this.logger.logInfo(`Login attempt for user: ${username}`);

      // Validar que se proporcionen username y password
      if (!username || !password) {
        this.logger.logWarning('Login failed: missing username or password');
        return {
          success: false,
          error: 'Username and password are required',
        };
      }

      // Aquí implementarías tu lógica de autenticación
      // Por ejemplo: consultar base de datos, verificar hash de password, etc.
      const user = await this.validateCredentials(username, password);

      if (!user) {
        this.logger.logWarning(`Login failed for user: ${username}`);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Generar token JWT
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        membershipPaid: user.membershipPaid,
      });

      this.logger.logInfo(`Login successful for user: ${username} with role: ${user.role}`);

      return {
        success: true,
        token,
      };
    } catch (error) {
      this.logger.logError(`Error during login: ${error.message}`);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  private async validateCredentials(username: string, password: string): Promise<UserInfo | null> {
    // TODO: Implementar validación real con base de datos
    // Por ahora, ejemplo hardcodeado para demostración

    // Usuarios de ejemplo
    const users: UserInfo[] = [
      {
        id: '1',
        username: 'admin',
        role: 'administrator',
        name: 'Administrator User',
        membershipPaid: true,
      },
      {
        id: '2',
        username: 'user',
        role: 'user',
        name: 'Regular User',
        membershipPaid: true,
      },
      {
        id: '3',
        username: 'manager',
        role: 'manager',
        name: 'Manager User',
        membershipPaid: false,
      },
    ];

    // Passwords de ejemplo (en producción deberían estar hasheados)
    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'user', password: 'user123' },
      { username: 'manager', password: 'manager123' },
    ];

    // Verificar credenciales
    const credentialMatch = validCredentials.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (!credentialMatch) {
      return null;
    }

    // Buscar información del usuario
    const user = users.find((u) => u.username === username);
    return user || null;
  }
}
