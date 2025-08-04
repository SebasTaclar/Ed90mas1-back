import '../config/config';
import { sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

// Validar que JWT_SECRET esté configurado
if (!SECRET_KEY) {
  throw new Error('JWT_SECRET environment variable is not configured');
}

export function generateToken(user: {
  id: number;
  role: string;
  name: string;
  email: string;
  membershipPaid: boolean;
}): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membershipPaid: user.membershipPaid,
  };

  const token = sign(payload, SECRET_KEY, { expiresIn: '1h' });
  return token;
}

export function verifyToken(token: string): {
  id: string;
  email: string;
  name: string;
  role: string;
  membershipPaid: boolean;
} {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    if (!SECRET_KEY) {
      throw new Error('JWT secret is not configured');
    }

    const decoded = verify(token, SECRET_KEY) as {
      id: string;
      email: string;
      name: string;
      role: string;
      membershipPaid: boolean;
    };

    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      // Log más específico del error
      console.error('JWT verification failed:', error.message);

      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token format');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      }
    }

    throw new Error('unauthorized');
  }
}
