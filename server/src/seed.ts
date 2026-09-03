import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Checking / Seeding database...');

  // 1. Seed Languages
  const languagesList = ['Tamil', 'Kannada', 'Telugu', 'Malayalam', 'Hindi', 'Bengali', 'English', 'Not Specified'];
  const languageMap: Record<string, string> = {};
  for (const name of languagesList) {
    const lang = await prisma.language.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    languageMap[name] = lang.id;
  }

  // 2. Seed Authorized Admin User
  await prisma.user.upsert({
    where: { email: 'admin@donbosco.edu' },
    update: { isActive: true },
    create: {
      email: 'admin@donbosco.edu',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'director@donbosco.edu' },
    update: { isActive: true },
    create: {
      email: 'director@donbosco.edu',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  // 3. Seed Students
  const initialStudents = [
    {
      studentId: 'STU-0001',
      name: 'Don Bosco',
      email: 'donbosco@gmail.com',
      gender: 'Male',
      religion: 'Christian',
      dayScholar: false,
      batch: 'Batch 2026',
      languageId: languageMap['Tamil'],
    },
    {
      studentId: 'STU-0002',
      name: 'Maria Dominic',
      email: 'maria@gmail.com',
      gender: 'Female',
      religion: 'Christian',
      dayScholar: false,
      batch: 'Batch 2026',
      languageId: languageMap['Kannada'],
    },
    {
      studentId: 'STU-0003',
      name: 'Arun Kumar',
      email: 'arun@gmail.com',
      gender: 'Male',
      religion: 'Hindu',
      dayScholar: false,
      batch: 'Batch 2026',
      languageId: languageMap['Tamil'],
    },
    {
      studentId: 'STU-0004',
      name: 'Priya Sharma',
      email: 'priya@gmail.com',
      gender: 'Female',
      religion: 'Hindu',
      dayScholar: false,
      batch: 'Batch 2026',
      languageId: languageMap['Hindi'],
    },
    {
      studentId: 'STU-0005',
      name: 'Joseph Raj',
      email: 'joseph@gmail.com',
      gender: 'Male',
      religion: 'Christian',
      dayScholar: true,
      batch: 'Batch 2026',
      languageId: languageMap['Malayalam'],
    },
    {
      studentId: 'STU-0006',
      name: 'Sneha Reddy',
      email: 'sneha@gmail.com',
      gender: 'Female',
      religion: 'Hindu',
      dayScholar: false,
      batch: 'Batch 2026',
      languageId: languageMap['Telugu'],
    },
  ];

  for (const s of initialStudents) {
    const student = await prisma.student.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        gender: s.gender,
        religion: s.religion,
        dayScholar: s.dayScholar,
        languageId: s.languageId,
      },
      create: s,
    });

    // Ensure corresponding Student User account is authorized
    await prisma.user.upsert({
      where: { email: s.email },
      update: { studentId: student.id, isActive: true },
      create: {
        email: s.email,
        role: 'STUDENT',
        isActive: true,
        emailVerified: true,
        studentId: student.id,
      },
    });
  }

  // 4. Seed Dormitory Rooms
  const rooms = [
    { name: 'St. Dominic Savio Hall', gender: 'Male', capacity: 6 },
    { name: 'Don Bosco Hall', gender: 'Male', capacity: 6 },
    { name: 'Mother Mazzarello Hall', gender: 'Female', capacity: 6 },
    { name: 'St. Mary Hall', gender: 'Female', capacity: 6 },
  ];
  for (const r of rooms) {
    await prisma.dormitoryRoom.upsert({
      where: { name: r.name },
      update: { capacity: r.capacity, gender: r.gender },
      create: r,
    });
  }

  // 5. Seed Refectory Tables
  const tables = [
    { name: 'Table 01 - Harmony', capacity: 8, genderRule: 'ANY' },
    { name: 'Table 02 - Solidarity', capacity: 8, genderRule: 'ANY' },
    { name: 'Table 03 - Excellence', capacity: 8, genderRule: 'ANY' },
    { name: 'Table 04 - Integrity', capacity: 8, genderRule: 'ANY' },
  ];
  for (const t of tables) {
    await prisma.refectoryTable.upsert({
      where: { name: t.name },
      update: { capacity: t.capacity },
      create: t,
    });
  }

  // 6. Seed Special Responsibilities
  const responsibilities = [
    { title: 'Bell Ringers', requiredCount: 2, genderRule: 'ANY' },
    { title: 'Sacristans', requiredCount: 2, genderRule: 'ANY' },
    { title: 'Lights & Doors Management', requiredCount: 2, genderRule: 'ANY' },
    { title: 'Water System Monitoring', requiredCount: 2, genderRule: 'ANY' },
    { title: 'Terrace & Gate Locking', requiredCount: 1, genderRule: 'ANY' },
  ];
  for (const resp of responsibilities) {
    await prisma.specialResponsibility.upsert({
      where: { title: resp.title },
      update: { requiredCount: resp.requiredCount },
      create: resp,
    });
  }

  // 7. Seed Notices
  const countNotices = await prisma.notice.count();
  if (countNotices === 0) {
    await prisma.notice.createMany({
      data: [
        {
          title: 'Welcome to Term 1 Academic Year 2026',
          content: 'The new schedules for Dormitory, Refectory, and Daily Ministries have been published. Please review your personalized assignments.',
          priority: 'HIGH',
          targetAudience: 'ALL',
        },
        {
          title: 'Sunday Liturgy & Assembly Preparation',
          content: 'Assigned readers and hymn leads are requested to report 20 minutes before chapel service for rehearsal.',
          priority: 'NORMAL',
          targetAudience: 'STUDENT',
        },
      ],
    });
  }

  console.log('✅ Database seeded successfully.');
}

if (process.argv.includes('--run')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
