export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  studentId?: string;
  studentCustomId?: string;
  gender?: string;
  batch?: string;
}

export interface Language {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  _count?: { students: number };
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female';
  religion: string;
  dayScholar: boolean;
  batch: string;
  languageId?: string;
  language?: Language;
  isActive: boolean;
  user?: { id: string; isActive: boolean; emailVerified: boolean };
}

export interface DormitoryRoom {
  id: string;
  name: string;
  gender: string;
  capacity: number;
  isActive: boolean;
  allocations?: {
    id: string;
    studentId: string;
    student: {
      id: string;
      studentId: string;
      name: string;
      gender: string;
      language?: { name: string };
    };
    isManualOverride: boolean;
  }[];
}

export interface RefectoryTable {
  id: string;
  name: string;
  capacity: number;
  genderRule: string;
  isActive: boolean;
  allocations?: {
    id: string;
    seatNumber: number;
    studentId: string;
    student: {
      id: string;
      studentId: string;
      name: string;
      gender: string;
      language?: { name: string };
    };
    isManualOverride: boolean;
  }[];
}

export interface DutyAssignment {
  id: string;
  dutyType: 'MORNING_JOB' | 'HOUSE_CLEANING' | 'SPECIAL_RESPONSIBILITY' | 'MASS_READING' | 'ASSEMBLY';
  title: string;
  date: string;
  studentId: string;
  student?: {
    id: string;
    studentId: string;
    name: string;
    gender: string;
    religion: string;
  };
  notes?: string;
  isManualOverride: boolean;
}

export interface SpecialResponsibility {
  id: string;
  title: string;
  requiredCount: number;
  genderRule: string;
  active: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  priority: string;
  published: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  hostellers: number;
  dayScholars: number;
  languageCount: number;
  activeRooms: number;
  activeTables: number;
  activeResponsibilities: number;
  noticesCount: number;
}
