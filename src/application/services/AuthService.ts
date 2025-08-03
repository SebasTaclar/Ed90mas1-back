import { generateToken } from "../../shared/jwtHelper";
import { Logger } from '../../shared/Logger';
import { ValidationError, AuthenticationError } from '../../shared/exceptions';

export interface LoginRequest {
  username: string;
  password: string;
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

  async login(loginRequest: LoginRequest): Promise<string> {
    const { username, password } = loginRequest;

    this.logger.logInfo(`Login attempt for user: ${username}`);

    if (!username || !password) {
      this.logger.logWarning('Login failed: missing username or password');
      throw new ValidationError('Username and password are required');
    }

    const user = await this.validateCredentials(username, password);

    if (!user) {
      this.logger.logWarning(`Login failed for user: ${username}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      membershipPaid: user.membershipPaid
    });

    this.logger.logInfo(`Login successful for user: ${username} with role: ${user.role}`);

    return token;
  }

  private async validateCredentials(username: string, password: string): Promise<UserInfo | null> {
    const users: UserInfo[] = [
      {
        id: '1',
        username: 'admin',
        role: 'administrator',
        name: 'Administrator User',
        membershipPaid: true
      },
      {
        id: '2',
        username: 'user',
        role: 'user',
        name: 'Regular User',
        membershipPaid: true
      },
      {
        id: '3',
        username: 'manager',
        role: 'manager',
        name: 'Manager User',
        membershipPaid: false
      }
    ];

    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'user', password: 'user123' },
      { username: 'manager', password: 'manager123' }
    ];

    const credentialMatch = validCredentials.find(
      cred => cred.username === username && cred.password === password
    );

    if (!credentialMatch) {
      return null;
    }

    const user = users.find(u => u.username === username);
    return user || null;
  }
}
