import '../config/config';
import { sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

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
    return verify(token, SECRET_KEY) as {
      id: string;
      email: string;
      name: string;
      role: string;
      membershipPaid: boolean;
    };
  } catch {
    throw new Error('unauthorized');
  }
}
