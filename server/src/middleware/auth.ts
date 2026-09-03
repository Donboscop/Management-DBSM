import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/jwt';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  studentData?: {
    id: string;
    studentId: string;
    name: string;
    email: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  // Ensure user is still active in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { student: true },
  });

  if (!user || !user.isActive) {
    res.status(403).json({ error: 'Account has been deactivated or does not exist' });
    return;
  }

  req.user = payload;
  if (user.student) {
    req.studentData = {
      id: user.student.id,
      studentId: user.student.studentId,
      name: user.student.name,
      email: user.student.email,
    };
  }

  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Administrative authorization required' });
    return;
  }
  next();
}

export function requireStudent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Student authorization required' });
    return;
  }
  next();
}
