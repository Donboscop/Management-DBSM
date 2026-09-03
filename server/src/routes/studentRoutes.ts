import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Protect all routes with student authentication
router.use(authenticateToken);
router.use(requireStudent);

// Helper to get authenticated student's DB record
async function getStudentOrThrow(req: AuthenticatedRequest, res: Response) {
  if (!req.studentData?.id) {
    res.status(403).json({ error: 'No associated student record found for this account' });
    return null;
  }
  return req.studentData.id;
}

// GET /api/student/me - Returns personal profile & overview
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        language: true,
        dormitoryAllocations: {
          include: { room: true },
        },
        refectoryAllocations: {
          include: { table: true },
        },
        dutyAssignments: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Student me error:', error);
    res.status(500).json({ error: 'Failed to load student profile' });
  }
});

// GET /api/student/dormitory - Own room allocation only
router.get('/dormitory', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const allocation = await prisma.dormitoryAllocation.findFirst({
      where: { studentId },
      include: {
        room: {
          include: {
            allocations: {
              include: {
                student: {
                  select: { id: true, studentId: true, name: true, gender: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      allocation: allocation || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dormitory allocation' });
  }
});

// GET /api/student/refectory - Own table & seat allocation only
router.get('/refectory', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const allocation = await prisma.refectoryAllocation.findFirst({
      where: { studentId },
      include: {
        table: {
          include: {
            allocations: {
              include: {
                student: {
                  select: { id: true, studentId: true, name: true, gender: true },
                },
              },
              orderBy: { seatNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      allocation: allocation || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load refectory allocation' });
  }
});

// GET /api/student/duties - Own duty assignments only
router.get('/duties', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const assignments = await prisma.dutyAssignment.findMany({
      where: { studentId },
      orderBy: { date: 'asc' },
    });

    // Group personal duties by module
    const grouped = {
      morningJob: assignments.filter((a) => a.dutyType === 'MORNING_JOB'),
      houseCleaning: assignments.filter((a) => a.dutyType === 'HOUSE_CLEANING'),
      specialResponsibility: assignments.filter((a) => a.dutyType === 'SPECIAL_RESPONSIBILITY'),
      massReading: assignments.filter((a) => a.dutyType === 'MASS_READING'),
      assembly: assignments.filter((a) => a.dutyType === 'ASSEMBLY'),
    };

    res.status(200).json({
      success: true,
      assignments,
      grouped,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load duties' });
  }
});

// GET /api/student/leaves - Student's own leave requests
router.get('/leaves', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error('Student get leaves error:', error);
    res.status(500).json({ error: 'Failed to load leave applications' });
  }
});

// POST /api/student/leaves - Submit a new leave application
router.post('/leaves', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentOrThrow(req, res);
    if (!studentId) return;

    const { subject, startDate, endDate, reason } = req.body;

    if (!subject || !startDate || !endDate || !reason) {
      res.status(400).json({ error: 'Subject, start date, end date, and reason are required' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid start or end date format' });
      return;
    }

    if (end < start) {
      res.status(400).json({ error: 'End date cannot be earlier than start date' });
      return;
    }

    // Calculate total inclusive calendar days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId,
        subject: subject.trim(),
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
        status: 'PENDING',
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'SUBMIT_LEAVE_REQUEST',
        actorEmail: req.user?.email || 'student',
        actorRole: 'STUDENT',
        details: `Submitted leave request for ${totalDays} day(s) (${startDate} to ${endDate}) - ${subject}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for review',
      leave,
    });
  } catch (error) {
    console.error('Submit leave error:', error);
    res.status(500).json({ error: 'Failed to submit leave application' });
  }
});

export default router;
