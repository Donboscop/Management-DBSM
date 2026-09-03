import { PrismaClient } from '@prisma/client';
import { generateOtp, hashOtp, verifyOtpHash } from './utils/crypto';
import { generateToken, verifyToken } from './utils/jwt';
import { balanceByLanguage } from './utils/languageBalancing';

const prisma = new PrismaClient();

async function runTests() {
  console.log('\n🧪 ========================================================');
  console.log('🧪 RUNNING AUTOMATED SECURITY & AUTHENTICATION TESTS');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Crypto OTP generation & hashing
  const otp1 = generateOtp();
  assert(/^\d{6}$/.test(otp1), 'Generated OTP is exactly 6 digits');
  const hash1 = hashOtp(otp1, 'test@example.com');
  assert(verifyOtpHash(otp1, 'test@example.com', hash1), 'OTP hash verifies correctly');
  assert(!verifyOtpHash('000000', 'test@example.com', hash1), 'Incorrect OTP is rejected');

  // Test 2: JWT generation & verification
  const token = generateToken({
    userId: 'user-123',
    email: 'student@test.com',
    role: 'STUDENT',
    studentCustomId: 'STU-0001',
  });
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.role === 'STUDENT', 'JWT token signs and decodes role');
  assert(verifyToken('invalid.token.here') === null, 'Malformed JWT is rejected');

  // Test 3: Language balancing algorithm
  const mockStudents = [
    { id: '1', name: 'A', gender: 'Male', language: 'Tamil' },
    { id: '2', name: 'B', gender: 'Male', language: 'Tamil' },
    { id: '3', name: 'C', gender: 'Male', language: 'Tamil' },
    { id: '4', name: 'D', gender: 'Male', language: 'Kannada' },
    { id: '5', name: 'E', gender: 'Male', language: 'Telugu' },
  ];
  const mockRooms = [
    { id: 'room-1', name: 'Room 1', capacity: 3, genderRule: 'Male' },
    { id: 'room-2', name: 'Room 2', capacity: 3, genderRule: 'Male' },
  ];
  const balanced = balanceByLanguage(mockStudents, mockRooms);
  const r1Students = balanced.get('room-1') || [];
  const r2Students = balanced.get('room-2') || [];
  assert(r1Students.length > 0 && r2Students.length > 0, 'Dormitory allocates across rooms');
  assert(
    r1Students.length + r2Students.length === mockStudents.length,
    'All eligible students allocated without drops'
  );

  // Test 4: Database query for unauthorized admin rejection
  const unauthorizedAdmin = await prisma.user.findFirst({
    where: { email: 'hacker@random.com', role: 'ADMIN', isActive: true },
  });
  assert(unauthorizedAdmin === null, 'Unauthorized admin email is absent from DB');

  // Test 5: Database query for unregistered student rejection
  const unregisteredStudent = await prisma.student.findFirst({
    where: { email: 'unknown_student@random.com', isActive: true },
  });
  assert(unregisteredStudent === null, 'Unregistered student email is absent from DB');

  // Test 6: Authorized student exists
  const registeredStudent = await prisma.student.findFirst({
    where: { email: 'donbosco@gmail.com', isActive: true },
  });
  assert(registeredStudent !== null && registeredStudent.studentId === 'STU-0001', 'Authorized student is registered in DB');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
