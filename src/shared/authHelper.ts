import { verifyToken } from './jwtHelper';

export function validateAuthToken(authHeader: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token format');
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    throw new Error('Unauthorized: Empty token');
  }

  // Verificar que el token sea válido (esto lanzará una excepción si no lo es)
  verifyToken(token);

  return token;
}
