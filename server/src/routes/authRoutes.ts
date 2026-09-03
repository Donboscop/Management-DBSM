import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/crypto';
import { generateToken } from '../utils/jwt';
import { sendOtpEmail } from '../services/emailService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// POST /api/auth/request-otp
router.post('/request-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, role: rawRole } = req.body;

    if (!rawEmail || typeof rawEmail !== 'string') {
      res.status(400).json({ error: 'Valid email address is required' });
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    const role = (rawRole || '').toUpperCase();

    if (role !== 'ADMIN' && role !== 'STUDENT') {
      res.status(400).json({ error: 'Invalid portal role specified' });
      return;
    }

    // Role-based verification checks
    if (role === 'ADMIN') {
      const adminUser = await prisma.user.findFirst({
        where: { email, role: 'ADMIN', isActive: true },
      });

      if (!adminUser) {
        res.status(403).json({
          error: 'Unauthorized administrator email. Please verify with system owner.',
        });
        return;
      }
    } else if (role === 'STUDENT') {
      // Must be pre-registered by Admin
      const student = await prisma.student.findFirst({
        where: { email, isActive: true },
      });

      if (!student) {
        res.status(403).json({
          error: 'Email not registered. Please contact the administrator.',
        });
        return;
      }

      // Ensure user entry exists
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await prisma.user.create({
          data: {
            email,
            role: 'STUDENT',
            studentId: student.id,
            isActive: true,
          },
        });
      }
    }

    // Check resend cooldown
    const existingOtp = await prisma.otpVerification.findFirst({
      where: { email, role },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const timeSinceCreation = Date.now() - new Date(existingOtp.createdAt).getTime();
      if (timeSinceCreation < OTP_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - timeSinceCreation) / 1000);
        res.status(429).json({
          error: `Please wait ${remainingSeconds} seconds before requesting a new code`,
          cooldownRemaining: remainingSeconds,
        });
        return;
      }
    }

    // Clear old unverified OTPs
    await prisma.otpVerification.deleteMany({
      where: { email, role },
    });

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp, email);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.otpVerification.create({
      data: {
        email,
        role,
        otpHash,
        expiresAt,
      },
    });

    // Send via email service (Never returned to client in response)
    await sendOtpEmail({
      email,
      otp,
      role: role as 'ADMIN' | 'STUDENT',
    });

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}`,
      cooldownSeconds: 60,
      expiresAt: expiresAt.toISOString(),
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to process verification code request' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, otp: rawOtp, role: rawRole } = req.body;

    if (!rawEmail || !rawOtp) {
      res.status(400).json({ error: 'Email and 6-digit verification code are required' });
      return;
    }

    const email = rawEmail.trim().toLowerCase();
    const otp = rawOtp.trim();
    const role = (rawRole || '').toUpperCase();

    const record = await prisma.otpVerification.findFirst({
      where: { email, role },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      res.status(400).json({ error: 'No active verification code found. Please request one.' });
      return;
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      await prisma.otpVerification.delete({ where: { id: record.id } });
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }

    // Check max attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.otpVerification.delete({ where: { id: record.id } });
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }

    // Verify OTP
    const isValid = verifyOtpHash(otp, email, record.otpHash);
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
      return;
    }

    // OTP is valid -> delete challenge
    await prisma.otpVerification.delete({ where: { id: record.id } });

    // Mark email as verified and fetch complete user record
    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true },
    });

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'Account is inactive or disabled' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Create session token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STUDENT',
      studentId: user.studentId || undefined,
      studentCustomId: user.student?.studentId || undefined,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_LOGIN',
        actorEmail: user.email,
        actorRole: user.role,
        details: `Successful OTP authentication for portal ${role}`,
      },
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.student?.name || (user.role === 'ADMIN' ? 'Administrator' : 'User'),
        studentId: user.student?.id,
        studentCustomId: user.student?.studentId,
        gender: user.student?.gender,
        batch: user.student?.batch,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify authentication code' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        student: {
          include: { language: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      student: user.student,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user context' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;
