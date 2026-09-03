import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dbsm-cinematic-jwt-secret-key-production-grade-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  studentId?: string; // Foreign key to Student model
  studentCustomId?: string; // e.g. "STU-0001"
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
