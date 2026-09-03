import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { balanceByLanguage } from '../utils/languageBalancing';

const prisma = new PrismaClient();
const router = Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Helper for title capitalization
function normalizeLanguageName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Not Specified';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/dashboard', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.student.count();
    const maleStudents = await prisma.student.count({ where: { gender: 'Male' } });
    const femaleStudents = await prisma.student.count({ where: { gender: 'Female' } });
    const dayScholars = await prisma.student.count({ where: { dayScholar: true } });
    const hostellers = totalStudents - dayScholars;

    const languages = await prisma.language.findMany({
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    const activeRooms = await prisma.dormitoryRoom.count({ where: { isActive: true } });
    const activeTables = await prisma.refectoryTable.count({ where: { isActive: true } });
    const activeResponsibilities = await prisma.specialResponsibility.count({ where: { active: true } });
    const noticesCount = await prisma.notice.count({ where: { published: true } });
    const pendingLeavesCount = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });

    const recentLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const representedLanguages = languages.filter((l) => l._count.students > 0);
    const languagesRepresented = representedLanguages.length;

    const hostellerPct = totalStudents > 0 ? Number(((hostellers / totalStudents) * 100).toFixed(1)) : 0;
    const dayScholarPct = totalStudents > 0 ? Number(((dayScholars / totalStudents) * 100).toFixed(1)) : 0;
    const malePct = totalStudents > 0 ? Number(((maleStudents / totalStudents) * 100).toFixed(1)) : 0;
    const femalePct = totalStudents > 0 ? Number(((femaleStudents / totalStudents) * 100).toFixed(1)) : 0;

    // Recent Schedules from activity logs
    const recentScheduleLogs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: [
            'GENERATE_DORMITORY',
            'GENERATE_REFECTORY',
            'GENERATE_DUTIES',
            'GENERATE_ALL_SCHEDULES',
            'DORMITORY_MANUAL_OVERRIDE',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Format schedule items
    const recentSchedules = recentScheduleLogs.map((log) => {
      let title = 'Rotational Schedule';
      let period = 'Current Term 2026';
      if (log.action.includes('DORMITORY')) {
        title = 'Dormitory Allocation';
        period = 'Residential Halls (Term 1)';
      } else if (log.action.includes('REFECTORY')) {
        title = 'Refectory Seating';
        period = 'Dining Tables (Balanced)';
      } else if (log.action.includes('DUTIES')) {
        title = 'Daily Rotational Duties';
        period = 'Daily Schedule';
      } else if (log.action.includes('ALL')) {
        title = 'All Institutional Schedules';
        period = 'Full System Matrix';
      }
      return {
        id: log.id,
        title,
        period,
        status: 'Generated',
        details: log.details,
        createdAt: log.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        hostellers,
        hostellerPct,
        dayScholars,
        dayScholarPct,
        maleStudents,
        malePct,
        femaleStudents,
        femalePct,
        languagesRepresented,
        totalLanguagesPool: languages.length,
        activeRooms,
        activeTables,
        activeResponsibilities,
        noticesCount,
        pendingLeavesCount,
      },
      languages: languages
        .map((l) => ({
          id: l.id,
          name: l.name,
          count: l._count.students,
          percentage: totalStudents > 0 ? Number(((l._count.students / totalStudents) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.count - a.count),
      recentSchedules,
      recentLogs,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Generate All Schedules in One Click
router.post('/schedules/generate-all', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const term = req.body.term || 'Term 1 - 2026';
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // 1. Generate Dormitory
    const hostellers = await prisma.student.findMany({
      where: { dayScholar: false, isActive: true },
      include: { language: true },
    });
    const rooms = await prisma.dormitoryRoom.findMany({ where: { isActive: true } });

    await prisma.dormitoryAllocation.deleteMany({
      where: { term, isManualOverride: false },
    });

    const maleAlloc = balanceByLanguage(
      hostellers.filter((s) => s.gender === 'Male').map((s) => ({ ...s, language: s.language?.name })),
      rooms.filter((r) => r.gender === 'Male').map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }))
    );
    const femaleAlloc = balanceByLanguage(
      hostellers.filter((s) => s.gender === 'Female').map((s) => ({ ...s, language: s.language?.name })),
      rooms.filter((r) => r.gender === 'Female').map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }))
    );

    const dormEntries: any[] = [];
    maleAlloc.forEach((stus, roomId) => {
      stus.forEach((s) => dormEntries.push({ roomId, studentId: s.id, term, isManualOverride: false }));
    });
    femaleAlloc.forEach((stus, roomId) => {
      stus.forEach((s) => dormEntries.push({ roomId, studentId: s.id, term, isManualOverride: false }));
    });
    for (const item of dormEntries) {
      await prisma.dormitoryAllocation.upsert({
        where: { roomId_studentId_term: { roomId: item.roomId, studentId: item.studentId, term: item.term } },
        update: {},
        create: item,
      });
    }

    // 2. Generate Refectory
    const allStudents = await prisma.student.findMany({
      where: { isActive: true },
      include: { language: true },
    });
    const tables = await prisma.refectoryTable.findMany({ where: { isActive: true } });

    await prisma.refectoryAllocation.deleteMany({
      where: { term, isManualOverride: false },
    });

    const refectoryAllocMap = balanceByLanguage(
      allStudents.map((s) => ({ ...s, language: s.language?.name })),
      tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, genderRule: t.genderRule }))
    );

    const refectoryEntries: any[] = [];
    refectoryAllocMap.forEach((stus, tableId) => {
      stus.forEach((s, idx) => {
        refectoryEntries.push({ tableId, seatNumber: idx + 1, studentId: s.id, term, isManualOverride: false });
      });
    });
    for (const a of refectoryEntries) {
      await prisma.refectoryAllocation.upsert({
        where: { tableId_seatNumber_term: { tableId: a.tableId, seatNumber: a.seatNumber, term: a.term } },
        update: { studentId: a.studentId, isManualOverride: false },
        create: a,
      });
    }

    // 3. Generate Daily Duties (FIFO/Rotation with Same-day Conflict Prevention)
    await prisma.dutyAssignment.deleteMany({ where: { date, isManualOverride: false } });

    const availablePool = [...allStudents].sort(() => Math.random() - 0.5);
    const assignedIdsToday = new Set<string>();
    const newAssignments: any[] = [];

    // Morning Jobs
    const morningJobs = [
      'Main Hall & Corridor Sweeping',
      'Garden & Courtyard Maintenance',
      'Portico & Entrance Cleaning',
      'Classroom Dusting & Board Prep',
      'Drinking Water Station Prep',
    ];
    for (const job of morningJobs) {
      const candidate = availablePool.find((s) => !assignedIdsToday.has(s.id));
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({ dutyType: 'MORNING_JOB', title: job, date, studentId: candidate.id, isManualOverride: false });
      }
    }

    // House Cleaning
    const cleaningZones = [
      { title: 'Male Restroom Sanitation', gender: 'Male' },
      { title: 'Female Restroom Sanitation', gender: 'Female' },
      { title: 'Common Dining Corridor', gender: 'ANY' },
    ];
    for (const zone of cleaningZones) {
      const candidate = availablePool.find((s) => {
        if (assignedIdsToday.has(s.id)) return false;
        if (zone.gender !== 'ANY' && s.gender !== zone.gender) return false;
        return true;
      });
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({ dutyType: 'HOUSE_CLEANING', title: zone.title, date, studentId: candidate.id, isManualOverride: false });
      }
    }

    // Special Responsibilities
    const specialTasks = await prisma.specialResponsibility.findMany({ where: { active: true } });
    for (const task of specialTasks) {
      for (let i = 0; i < task.requiredCount; i++) {
        const candidate = availablePool.find((s) => {
          if (assignedIdsToday.has(s.id)) return false;
          if (task.genderRule !== 'ANY' && s.gender !== task.genderRule) return false;
          return true;
        });
        if (candidate) {
          assignedIdsToday.add(candidate.id);
          newAssignments.push({ dutyType: 'SPECIAL_DUTY', title: task.title, date, studentId: candidate.id, isManualOverride: false });
        }
      }
    }

    // Mass Readings
    const readingRoles = ['First Reading', 'Second Reading', 'Prayer of the Faithful'];
    for (const role of readingRoles) {
      const candidate = availablePool.find((s) => {
        if (assignedIdsToday.has(s.id)) return false;
        if (s.religion !== 'Christian' || s.dayScholar) return false;
        return true;
      });
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({ dutyType: 'MASS_READING', title: role, date, studentId: candidate.id, isManualOverride: false });
      }
    }

    // Assembly
    const assemblyRoles = ['MC / Anchor', 'Opening Prayer', 'Hymn Lead', 'Thought for the Day'];
    for (const role of assemblyRoles) {
      const candidate = availablePool.find((s) => !assignedIdsToday.has(s.id));
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({ dutyType: 'ASSEMBLY', title: role, date, studentId: candidate.id, isManualOverride: false });
      }
    }

    for (const a of newAssignments) {
      await prisma.dutyAssignment.create({ data: a });
    }

    await prisma.activityLog.create({
      data: {
        action: 'GENERATE_ALL_SCHEDULES',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Generated all schedules: ${dormEntries.length} room allocations, ${refectoryEntries.length} table seats, ${newAssignments.length} duties (${date})`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Generated all schedules: ${dormEntries.length} dorm beds, ${refectoryEntries.length} dining seats, ${newAssignments.length} daily duties.`,
      summary: {
        dormitoryCount: dormEntries.length,
        refectoryCount: refectoryEntries.length,
        dutiesCount: newAssignments.length,
      },
    });
  } catch (error) {
    console.error('Generate all error:', error);
    res.status(500).json({ error: 'Failed to generate all schedules' });
  }
});

// ==========================================
// 2. STUDENT MANAGEMENT
// ==========================================
router.get('/students', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, gender, residency, languageId } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { studentId: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (gender && typeof gender === 'string') {
      where.gender = gender;
    }
    if (residency && typeof residency === 'string') {
      where.dayScholar = residency === 'Day Scholar';
    }
    if (languageId && typeof languageId === 'string') {
      where.languageId = languageId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        language: true,
        user: { select: { id: true, isActive: true, emailVerified: true } },
      },
      orderBy: { studentId: 'asc' },
    });

    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create single student
router.post('/students', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, gender, religion, dayScholar, batch, languageName, customStudentId } = req.body;

    if (!name || !email || !gender) {
      res.status(400).json({ error: 'Name, email, and gender are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.student.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: 'A student with this email address already exists' });
      return;
    }

    // Resolve or create Language dynamically
    let languageId: string | null = null;
    if (languageName) {
      const normalized = normalizeLanguageName(languageName);
      let lang = await prisma.language.findUnique({ where: { name: normalized } });
      if (!lang) {
        lang = await prisma.language.create({ data: { name: normalized } });
      }
      languageId = lang.id;
    }

    // Generate unique student ID if not provided
    let finalStudentId = customStudentId?.trim();
    if (!finalStudentId) {
      const count = await prisma.student.count();
      finalStudentId = `STU-${(count + 1).toString().padStart(4, '0')}`;
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        studentId: finalStudentId,
        name: name.trim(),
        email: cleanEmail,
        gender,
        religion: religion || 'Christian',
        dayScholar: Boolean(dayScholar),
        batch: batch || 'Batch 2026',
        languageId,
        isActive: true,
      },
    });

    // Authorize student account for passwordless email OTP login
    await prisma.user.create({
      data: {
        email: cleanEmail,
        role: 'STUDENT',
        studentId: student.id,
        isActive: true,
        emailVerified: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CREATE_STUDENT',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Created student ${student.name} (${student.studentId}) and authorized passwordless login`,
      },
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/students/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, gender, religion, dayScholar, batch, languageId, isActive } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        name,
        email: email?.trim().toLowerCase(),
        gender,
        religion,
        dayScholar: Boolean(dayScholar),
        batch,
        languageId,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    // Sync corresponding user active state if changed
    if (isActive !== undefined) {
      await prisma.user.updateMany({
        where: { studentId: id },
        data: { isActive: Boolean(isActive) },
      });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student (and clean up associated allocations/duties/users)
router.delete('/students/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // 1. Delete associated user auth accounts
    await prisma.user.deleteMany({ where: { studentId: id } });
    // 2. Delete dormitory allocations
    await prisma.dormitoryAllocation.deleteMany({ where: { studentId: id } });
    // 3. Delete refectory allocations
    await prisma.refectoryAllocation.deleteMany({ where: { studentId: id } });
    // 4. Delete duty assignments
    await prisma.dutyAssignment.deleteMany({ where: { studentId: id } });
    // 5. Delete student record
    await prisma.student.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'DELETE_STUDENT',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Deleted student ${student.name} (${student.studentId}, ${student.email}) and removed associated allocations`,
      },
    });

    res.status(200).json({ success: true, message: `Student ${student.name} deleted successfully.` });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Bulk Import Students from Excel/CSV
router.post('/students/import', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ error: 'No student records provided for import' });
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of students) {
      const email = (item.email || item.Email || '').trim().toLowerCase();
      const name = (item.name || item.Name || '').trim();
      if (!email || !name) {
        skippedCount++;
        continue;
      }

      // Check if already exists
      const existing = await prisma.student.findUnique({ where: { email } });
      if (existing) {
        skippedCount++;
        continue;
      }

      // Language resolution
      const rawLang = item.language || item.Language || item['Mother Tongue'] || 'Not Specified';
      const normalizedLang = normalizeLanguageName(rawLang);
      let lang = await prisma.language.findUnique({ where: { name: normalizedLang } });
      if (!lang) {
        lang = await prisma.language.create({ data: { name: normalizedLang } });
      }

      const gender = (item.gender || item.Gender || 'Male').trim();
      const religion = (item.religion || item.Religion || 'Christian').trim();
      const dayScholarRaw = (item.dayScholar || item.DayScholar || item.residency || item.Residency || '').toString().toLowerCase();
      const isDayScholar = dayScholarRaw.includes('day') || dayScholarRaw === 'yes' || dayScholarRaw === 'true';
      const batch = (item.batch || item.Batch || 'Batch 2026').trim();
      const customId = (item.studentId || item.StudentID || item['Student ID'] || '').trim();

      const count = await prisma.student.count();
      const studentId = customId || `STU-${(count + 1).toString().padStart(4, '0')}`;

      const createdStudent = await prisma.student.create({
        data: {
          studentId,
          name,
          email,
          gender: gender.toLowerCase().startsWith('f') ? 'Female' : 'Male',
          religion,
          dayScholar: isDayScholar,
          batch,
          languageId: lang.id,
          isActive: true,
        },
      });

      await prisma.user.create({
        data: {
          email,
          role: 'STUDENT',
          studentId: createdStudent.id,
          isActive: true,
        },
      });

      importedCount++;
    }

    await prisma.activityLog.create({
      data: {
        action: 'BULK_IMPORT_STUDENTS',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Imported ${importedCount} students (Skipped ${skippedCount})`,
      },
    });

    res.status(200).json({
      success: true,
      importedCount,
      skippedCount,
      message: `Successfully imported ${importedCount} students`,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to complete student import' });
  }
});

// ==========================================
// 3. DYNAMIC LANGUAGE MANAGEMENT
// ==========================================
router.get('/languages', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const languages = await prisma.language.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, languages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

router.post('/languages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Language name is required' });
      return;
    }
    const normalized = normalizeLanguageName(name);
    const existing = await prisma.language.findUnique({ where: { name: normalized } });
    if (existing) {
      res.status(400).json({ error: 'Language already exists' });
      return;
    }

    const language = await prisma.language.create({ data: { name: normalized } });
    res.status(201).json({ success: true, language });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create language' });
  }
});

// Delete Language
router.delete('/languages/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lang = await prisma.language.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!lang) {
      res.status(404).json({ error: 'Language not found' });
      return;
    }

    if (lang._count.students > 0) {
      // Reassign students to 'Not Specified'
      let defaultLang = await prisma.language.findUnique({ where: { name: 'Not Specified' } });
      if (!defaultLang) {
        defaultLang = await prisma.language.create({ data: { name: 'Not Specified' } });
      }
      await prisma.student.updateMany({
        where: { languageId: id },
        data: { languageId: defaultLang.id },
      });
    }

    await prisma.language.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'DELETE_LANGUAGE',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Deleted language ${lang.name} (reassigned ${lang._count.students} students)`,
      },
    });

    res.status(200).json({ success: true, message: `Language ${lang.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

// ==========================================
// 4. DORMITORY (LANGUAGE BALANCED)
// ==========================================
router.get('/dormitory', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await prisma.dormitoryRoom.findMany({
      include: {
        allocations: {
          include: {
            student: {
              include: { language: true },
            },
          },
        },
      },
    });
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dormitory rooms' });
  }
});

// Generate Dormitory Allocations using soft Language Balancing
router.post('/dormitory/generate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const term = req.body.term || 'Term 1 - 2026';

    // 1. Fetch hostellers only (dayScholar === false)
    const students = await prisma.student.findMany({
      where: { dayScholar: false, isActive: true },
      include: { language: true },
    });

    const rooms = await prisma.dormitoryRoom.findMany({
      where: { isActive: true },
    });

    // Clear previous non-manual allocations for this term
    await prisma.dormitoryAllocation.deleteMany({
      where: { term, isManualOverride: false },
    });

    // Separate by gender
    const maleStudents = students.filter((s) => s.gender === 'Male');
    const femaleStudents = students.filter((s) => s.gender === 'Female');
    const maleRooms = rooms.filter((r) => r.gender === 'Male');
    const femaleRooms = rooms.filter((r) => r.gender === 'Female');

    // Run soft language balancing
    const maleAlloc = balanceByLanguage(
      maleStudents.map((s) => ({ ...s, language: s.language?.name })),
      maleRooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }))
    );

    const femaleAlloc = balanceByLanguage(
      femaleStudents.map((s) => ({ ...s, language: s.language?.name })),
      femaleRooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }))
    );

    // Save allocations to DB
    const entries: any[] = [];
    maleAlloc.forEach((stus, roomId) => {
      stus.forEach((s) => {
        entries.push({ roomId, studentId: s.id, term, isManualOverride: false });
      });
    });
    femaleAlloc.forEach((stus, roomId) => {
      stus.forEach((s) => {
        entries.push({ roomId, studentId: s.id, term, isManualOverride: false });
      });
    });

    for (const item of entries) {
      await prisma.dormitoryAllocation.upsert({
        where: {
          roomId_studentId_term: {
            roomId: item.roomId,
            studentId: item.studentId,
            term: item.term,
          },
        },
        update: {},
        create: item,
      });
    }

    await prisma.activityLog.create({
      data: {
        action: 'GENERATE_DORMITORY',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Generated language-balanced dormitory schedule for ${entries.length} hostellers (${term})`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Allocated ${entries.length} students across dormitory rooms with language balancing.`,
    });
  } catch (error) {
    console.error('Dormitory generate error:', error);
    res.status(500).json({ error: 'Failed to generate dormitory schedule' });
  }
});

// Manual Dormitory Override
router.put('/dormitory/override', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, targetRoomId, term = 'Term 1 - 2026' } = req.body;
    if (!studentId || !targetRoomId) {
      res.status(400).json({ error: 'studentId and targetRoomId required' });
      return;
    }

    // Remove existing allocation for this student in this term
    await prisma.dormitoryAllocation.deleteMany({
      where: { studentId, term },
    });

    // Insert new override allocation
    const alloc = await prisma.dormitoryAllocation.create({
      data: {
        roomId: targetRoomId,
        studentId,
        term,
        isManualOverride: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'DORMITORY_MANUAL_OVERRIDE',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Manual override for student ${studentId} into room ${targetRoomId}`,
      },
    });

    res.status(200).json({ success: true, allocation: alloc });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record manual override' });
  }
});

// Create Dormitory Room
router.post('/dormitory/rooms', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, capacity, gender } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    const room = await prisma.dormitoryRoom.create({
      data: {
        name: name.trim(),
        capacity: parseInt(capacity) || 6,
        gender: gender || 'Male',
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CREATE_DORM_ROOM',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Created dormitory room ${room.name} (Capacity: ${room.capacity}, ${room.gender})`,
      },
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dormitory room' });
  }
});

// Update Dormitory Room
router.put('/dormitory/rooms/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, capacity, gender, isActive } = req.body;

    const room = await prisma.dormitoryRoom.update({
      where: { id },
      data: {
        name: name?.trim(),
        capacity: capacity ? parseInt(capacity) : undefined,
        gender,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dormitory room' });
  }
});

// Delete Dormitory Room
router.delete('/dormitory/rooms/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const room = await prisma.dormitoryRoom.findUnique({ where: { id } });
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    await prisma.dormitoryAllocation.deleteMany({ where: { roomId: id } });
    await prisma.dormitoryRoom.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'DELETE_DORM_ROOM',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Deleted dormitory room ${room.name}`,
      },
    });

    res.status(200).json({ success: true, message: `Room ${room.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dormitory room' });
  }
});

// ==========================================
// 5. REFECTORY (LANGUAGE BALANCED)
// ==========================================
router.get('/refectory', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tables = await prisma.refectoryTable.findMany({
      include: {
        allocations: {
          include: {
            student: {
              include: { language: true },
            },
          },
          orderBy: { seatNumber: 'asc' },
        },
      },
    });
    res.status(200).json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch refectory tables' });
  }
});

router.post('/refectory/generate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const term = req.body.term || 'Term 1 - 2026';
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: { language: true },
    });
    const tables = await prisma.refectoryTable.findMany({ where: { isActive: true } });

    await prisma.refectoryAllocation.deleteMany({
      where: { term, isManualOverride: false },
    });

    const allocMap = balanceByLanguage(
      students.map((s) => ({ ...s, language: s.language?.name })),
      tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, genderRule: t.genderRule }))
    );

    const allocations: any[] = [];
    allocMap.forEach((stus, tableId) => {
      stus.forEach((s, idx) => {
        allocations.push({
          tableId,
          seatNumber: idx + 1,
          studentId: s.id,
          term,
          isManualOverride: false,
        });
      });
    });

    for (const a of allocations) {
      await prisma.refectoryAllocation.upsert({
        where: {
          tableId_seatNumber_term: {
            tableId: a.tableId,
            seatNumber: a.seatNumber,
            term: a.term,
          },
        },
        update: { studentId: a.studentId, isManualOverride: false },
        create: a,
      });
    }

    res.status(200).json({
      success: true,
      message: `Allocated ${allocations.length} students to refectory tables with language diversity.`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate refectory schedule' });
  }
});

// Create Refectory Table
router.post('/refectory/tables', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, capacity, genderRule } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Table name is required' });
      return;
    }

    const table = await prisma.refectoryTable.create({
      data: {
        name: name.trim(),
        capacity: parseInt(capacity) || 8,
        genderRule: genderRule || 'ANY',
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CREATE_REFECTORY_TABLE',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Created dining table ${table.name} (Capacity: ${table.capacity}, Gender Rule: ${table.genderRule})`,
      },
    });

    res.status(201).json({ success: true, table });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create refectory table' });
  }
});

// Update Refectory Table
router.put('/refectory/tables/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, capacity, genderRule, isActive } = req.body;

    const table = await prisma.refectoryTable.update({
      where: { id },
      data: {
        name: name?.trim(),
        capacity: capacity ? parseInt(capacity) : undefined,
        genderRule,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.status(200).json({ success: true, table });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update refectory table' });
  }
});

// Delete Refectory Table
router.delete('/refectory/tables/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const table = await prisma.refectoryTable.findUnique({ where: { id } });
    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    await prisma.refectoryAllocation.deleteMany({ where: { tableId: id } });
    await prisma.refectoryTable.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'DELETE_REFECTORY_TABLE',
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Deleted dining table ${table.name}`,
      },
    });

    res.status(200).json({ success: true, message: `Table ${table.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete refectory table' });
  }
});

// ==========================================
// 6. DAILY DUTIES (NO LANGUAGE BALANCING)
// Same-day conflict prevention, FIFO/Fair Rotation
// ==========================================
router.get('/duties', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date, dutyType } = req.query;
    const where: any = {};
    if (date && typeof date === 'string') where.date = date;
    if (dutyType && typeof dutyType === 'string') where.dutyType = dutyType;

    const assignments = await prisma.dutyAssignment.findMany({
      where,
      include: {
        student: { select: { id: true, studentId: true, name: true, gender: true, religion: true } },
      },
      orderBy: [{ date: 'asc' }, { dutyType: 'asc' }],
    });

    res.status(200).json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch duties' });
  }
});

// Generate Daily Schedule with fair rotation & same-day conflict prevention
router.post('/duties/generate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.body;

    const allStudents = await prisma.student.findMany({ where: { isActive: true } });
    if (allStudents.length === 0) {
      res.status(400).json({ error: 'No active students found' });
      return;
    }

    // Shared same-day conflict tracking set
    const assignedIdsToday = new Set<string>();

    // Delete existing non-manual assignments for this date
    await prisma.dutyAssignment.deleteMany({
      where: { date, isManualOverride: false },
    });

    // Shuffle helper (Fisher-Yates)
    function shuffle<T>(array: T[]): T[] {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    const availablePool = shuffle(allStudents);
    const newAssignments: any[] = [];

    // 1. Morning Job Zones (No language balancing)
    const morningZones = ['Garden & Grounds', 'Reception Area', 'Basketball Court', 'Assembly Hall Setup'];
    for (const zone of morningZones) {
      const candidate = availablePool.find((s) => !assignedIdsToday.has(s.id));
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({
          dutyType: 'MORNING_JOB',
          title: zone,
          date,
          studentId: candidate.id,
          isManualOverride: false,
        });
      }
    }

    // 2. House Cleaning (Restrooms: gender strictly enforced; common: any)
    const cleaningZones = [
      { title: 'Male Restroom', gender: 'Male' },
      { title: 'Female Restroom', gender: 'Female' },
      { title: 'Common Dining Corridor', gender: 'ANY' },
    ];
    for (const zone of cleaningZones) {
      const candidate = availablePool.find((s) => {
        if (assignedIdsToday.has(s.id)) return false;
        if (zone.gender !== 'ANY' && s.gender !== zone.gender) return false;
        return true;
      });
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({
          dutyType: 'HOUSE_CLEANING',
          title: zone.title,
          date,
          studentId: candidate.id,
          isManualOverride: false,
        });
      }
    }

    // 3. Special Responsibilities (Admin-configured)
    const specialTasks = await prisma.specialResponsibility.findMany({ where: { active: true } });
    for (const task of specialTasks) {
      for (let i = 0; i < task.requiredCount; i++) {
        const candidate = availablePool.find((s) => {
          if (assignedIdsToday.has(s.id)) return false;
          if (task.genderRule !== 'ANY' && s.gender !== task.genderRule) return false;
          return true;
        });
        if (candidate) {
          assignedIdsToday.add(candidate.id);
          newAssignments.push({
            dutyType: 'SPECIAL_RESPONSIBILITY',
            title: task.title,
            date,
            studentId: candidate.id,
            isManualOverride: false,
          });
        }
      }
    }

    // 4. Mass Reading (Christian Hostellers only)
    const readingRoles = ['First Reading', 'Second Reading', 'Prayer of the Faithful'];
    for (const role of readingRoles) {
      const candidate = availablePool.find((s) => {
        if (assignedIdsToday.has(s.id)) return false;
        if (s.religion !== 'Christian' || s.dayScholar) return false;
        return true;
      });
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({
          dutyType: 'MASS_READING',
          title: role,
          date,
          studentId: candidate.id,
          isManualOverride: false,
        });
      }
    }

    // 5. Assembly Roles
    const assemblyRoles = ['MC / Anchor', 'Opening Prayer', 'Hymn Lead', 'Thought for the Day'];
    for (const role of assemblyRoles) {
      const candidate = availablePool.find((s) => !assignedIdsToday.has(s.id));
      if (candidate) {
        assignedIdsToday.add(candidate.id);
        newAssignments.push({
          dutyType: 'ASSEMBLY',
          title: role,
          date,
          studentId: candidate.id,
          isManualOverride: false,
        });
      }
    }

    // Insert generated assignments into DB
    for (const a of newAssignments) {
      await prisma.dutyAssignment.create({ data: a });
    }

    res.status(200).json({
      success: true,
      count: newAssignments.length,
      message: `Generated ${newAssignments.length} conflict-free duty assignments for ${date}`,
    });
  } catch (error) {
    console.error('Duties generate error:', error);
    res.status(500).json({ error: 'Failed to generate daily duties' });
  }
});

// ==========================================
// 7. SPECIAL RESPONSIBILITIES CONFIGURATION
// ==========================================
router.get('/special-responsibilities', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await prisma.specialResponsibility.findMany({ orderBy: { title: 'asc' } });
    res.status(200).json({ success: true, list });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responsibilities' });
  }
});

router.post('/special-responsibilities', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, requiredCount, genderRule } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const resp = await prisma.specialResponsibility.create({
      data: {
        title: title.trim(),
        requiredCount: parseInt(requiredCount) || 2,
        genderRule: genderRule || 'ANY',
        active: true,
      },
    });
    res.status(201).json({ success: true, responsibility: resp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create responsibility' });
  }
});

router.delete('/special-responsibilities/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.specialResponsibility.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Special responsibility deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete responsibility' });
  }
});

// ==========================================
// 8. NOTICES
// ==========================================
router.get('/notices', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

router.post('/notices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience = 'ALL', priority = 'NORMAL' } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content required' });
      return;
    }
    const notice = await prisma.notice.create({
      data: { title: title.trim(), content: content.trim(), targetAudience, priority, published: true },
    });
    res.status(201).json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

router.delete('/notices/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await prisma.notice.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

// ==========================================
// 9. ACTIVITY LOGS & BACKUP
// ==========================================
router.get('/activity-logs', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

router.get('/backup', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const snapshot = {
      timestamp: new Date().toISOString(),
      languages: await prisma.language.findMany(),
      students: await prisma.student.findMany(),
      users: await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true } }),
      dormitoryRooms: await prisma.dormitoryRoom.findMany(),
      dormitoryAllocations: await prisma.dormitoryAllocation.findMany(),
      refectoryTables: await prisma.refectoryTable.findMany(),
      refectoryAllocations: await prisma.refectoryAllocation.findMany(),
      specialResponsibilities: await prisma.specialResponsibility.findMany(),
      dutyAssignments: await prisma.dutyAssignment.findMany(),
      notices: await prisma.notice.findMany(),
    };
    res.status(200).json({ success: true, backup: snapshot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// ==========================================
// 10. LEAVE MANAGEMENT (REVIEW / APPROVE / REJECT)
// ==========================================
router.get('/leaves', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status.toUpperCase();
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            language: true,
            dormitoryAllocations: { include: { room: true } },
            refectoryAllocations: { include: { table: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const approvedCount = await prisma.leaveRequest.count({ where: { status: 'APPROVED' } });
    const rejectedCount = await prisma.leaveRequest.count({ where: { status: 'REJECTED' } });

    res.status(200).json({
      success: true,
      leaves,
      counts: {
        all: leaves.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error('Admin get leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

router.put('/leaves/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ error: 'Valid status (APPROVED | REJECTED | PENDING) is required' });
      return;
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        adminRemarks: adminRemarks !== undefined ? adminRemarks : existing.adminRemarks,
        reviewedBy: req.user?.email || 'admin',
        reviewedAt: new Date(),
      },
      include: {
        student: {
          include: { language: true },
        },
      },
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        action: `LEAVE_${status}`,
        actorEmail: req.user?.email || 'admin',
        actorRole: 'ADMIN',
        details: `Leave application for ${existing.student.name} (${existing.student.studentId}) was marked as ${status}. Subject: ${existing.subject}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Leave application marked as ${status}`,
      leave: updated,
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

export default router;
