import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Users,
  Languages as LanguagesIcon,
  Home,
  Utensils,
  Calendar,
  ShieldAlert,
  Bell,
  Download,
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Layers,
  Trash2,
  ChevronRight,
  Sun,
  Brush,
  BookOpen,
  Sparkles,
  Briefcase,
  Clock,
  FileText,
  XCircle,
  CalendarDays,
  Check,
  X,
  Printer,
  Crown,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NoticeBoardPosterModal, type PosterGroupItem } from '../posters/NoticeBoardPosterModal';

export const AdminPortal: React.FC = () => {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'students' | 'languages' | 'dormitory' | 'refectory' | 'duties' | 'responsibilities' | 'notices' | 'logs' | 'leaves'
  >('dashboard');

  // Notice Board Poster Modal State
  const [posterConfig, setPosterConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    moduleType: 'dormitory' | 'refectory' | 'responsibilities' | 'duties';
    effectivePeriod?: string;
    groups: PosterGroupItem[];
  }>({
    isOpen: false,
    title: '',
    moduleType: 'dormitory',
    groups: [],
  });

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  // Leaves Data
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveFilter, setLeaveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [leaveCounts, setLeaveCounts] = useState<{ all: number; pending: number; approved: number; rejected: number }>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [reviewingLeave, setReviewingLeave] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isUpdatingLeave, setIsUpdatingLeave] = useState(false);
  // Dropdown States
  const [isNavDutiesOpen, setIsNavDutiesOpen] = useState(false);
  const [isHeroDutiesOpen, setIsHeroDutiesOpen] = useState(false);
  // Students Data
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterResidency, setFilterResidency] = useState('');
  // Languages Data
  const [languages, setLanguages] = useState<any[]>([]);
  // Dormitory Data
  const [dormRooms, setDormRooms] = useState<any[]>([]);
  // Refectory Data
  const [refectoryTables, setRefectoryTables] = useState<any[]>([]);
  // Daily Duties
  const [duties, setDuties] = useState<any[]>([]);
  // Special Responsibilities
  const [responsibilities, setResponsibilities] = useState<any[]>([]);
  // Notices
  const [notices, setNotices] = useState<any[]>([]);
  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  // Modals & Forms
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [showAddRespModal, setShowAddRespModal] = useState(false);

  const [newRoom, setNewRoom] = useState({ name: '', capacity: 6, gender: 'Male' });
  const [newTable, setNewTable] = useState({ name: '', capacity: 8, genderRule: 'ANY' });

  // Custom Confirmation Popup State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    isDestructive: true,
    onConfirm: () => {},
  });

  const requestConfirm = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || 'Delete',
      isDestructive: options.isDestructive !== undefined ? options.isDestructive : true,
      onConfirm: options.onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Status feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Language Color Palette for Dynamic Demographics Bar
  const LANGUAGE_COLORS = [
    { bg: 'bg-[#917B77]', text: 'text-[#917B77]', border: 'border-[#917B77]/40' },
    { bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400/40' },
    { bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400/40' },
    { bg: 'bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-400/40' },
    { bg: 'bg-purple-400', text: 'text-purple-400', border: 'border-purple-400/40' },
    { bg: 'bg-rose-400', text: 'text-rose-400', border: 'border-rose-400/40' },
    { bg: 'bg-indigo-400', text: 'text-indigo-400', border: 'border-indigo-400/40' },
    { bg: 'bg-orange-400', text: 'text-orange-400', border: 'border-orange-400/40' },
  ];

  // Form states (No default language pre-set)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    gender: 'Male',
    religion: 'Christian',
    dayScholar: false,
    batch: 'Batch 2026',
    languageName: '',
  });
  const [isCustomLangInput, setIsCustomLangInput] = useState(false);
  const [newLangName, setNewLangName] = useState('');
  const [newNotice, setNewNotice] = useState({ title: '', content: '', targetAudience: 'ALL', priority: 'NORMAL' });
  const [newResp, setNewResp] = useState({ title: '', requiredCount: 2, genderRule: 'ANY' });
  const [importJsonText, setImportJsonText] = useState('');

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const loadTabContent = async () => {
    try {
      if (activeTab === 'dashboard') {
        const res = await api.getDashboard();
        setDashboardData(res);
      } else if (activeTab === 'students') {
        const [stus, langs] = await Promise.all([
          api.getStudents({ search: searchQuery, gender: filterGender, residency: filterResidency }),
          api.getLanguages(),
        ]);
        setStudents(stus.students);
        setLanguages(langs.languages);
      } else if (activeTab === 'languages') {
        const res = await api.getLanguages();
        setLanguages(res.languages);
      } else if (activeTab === 'dormitory') {
        const res = await api.getDormitory();
        setDormRooms(res.rooms);
      } else if (activeTab === 'refectory') {
        const res = await api.getRefectory();
        setRefectoryTables(res.tables);
      } else if (activeTab === 'duties') {
        const res = await api.getDuties();
        setDuties(res.assignments);
      } else if (activeTab === 'responsibilities') {
        const res = await api.getSpecialResponsibilities();
        setResponsibilities(res.list);
      } else if (activeTab === 'notices') {
        const res = await api.getNotices();
        setNotices(res.notices);
      } else if (activeTab === 'logs') {
        const res = await api.getActivityLogs();
        setLogs(res.logs);
      } else if (activeTab === 'leaves') {
        const res = await api.getAdminLeaves(leaveFilter);
        setLeaves(res.leaves || []);
        if (res.counts) setLeaveCounts(res.counts);
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleProcessLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED', remarks: string) => {
    setIsUpdatingLeave(true);
    try {
      await api.updateLeaveStatus(leaveId, status, remarks);
      showToast(`Leave application successfully ${status === 'APPROVED' ? 'approved' : 'rejected'}.`);
      setReviewingLeave(null);
      setReviewRemarks('');
      // Reload leaves
      const res = await api.getAdminLeaves(leaveFilter);
      setLeaves(res.leaves || []);
      if (res.counts) setLeaveCounts(res.counts);
    } catch (err: any) {
      showToast(err.message || 'Failed to update leave status', true);
    } finally {
      setIsUpdatingLeave(false);
    }
  };

  const openAddStudentModal = async () => {
    try {
      const res = await api.getLanguages();
      setLanguages(res.languages);
    } catch {}
    setNewStudent({
      name: '',
      email: '',
      gender: 'Male',
      religion: 'Christian',
      dayScholar: false,
      batch: 'Batch 2026',
      languageName: '',
    });
    setIsCustomLangInput(false);
    setShowAddStudentModal(true);
  };

  // 1. Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLang = newStudent.languageName.trim();
    if (!cleanLang) {
      showToast('Please select or type a language for the student', true);
      return;
    }

    setIsProcessing(true);
    try {
      await api.createStudent({ ...newStudent, languageName: cleanLang });
      setShowAddStudentModal(false);
      setNewStudent({
        name: '',
        email: '',
        gender: 'Male',
        religion: 'Christian',
        dayScholar: false,
        batch: 'Batch 2026',
        languageName: '',
      });
      setIsCustomLangInput(false);
      showToast('Student authorized. Language demographics updated.');
      const [dashRes, stuRes, langRes] = await Promise.all([
        api.getDashboard(),
        api.getStudents({ search: searchQuery, gender: filterGender, residency: filterResidency }),
        api.getLanguages(),
      ]);
      setDashboardData(dashRes);
      setStudents(stuRes.students);
      setLanguages(langRes.languages);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Import Students
  const handleImportStudents = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const studentList = Array.isArray(parsed) ? parsed : [parsed];
      setIsProcessing(true);
      const res = await api.importStudents(studentList);
      setShowImportModal(false);
      setImportJsonText('');
      showToast(`Imported ${res.importedCount} students (${res.skippedCount} skipped)`);
      loadTabContent();
    } catch (err: any) {
      showToast('Invalid JSON format. Please paste valid array of student objects.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Add Language
  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangName.trim()) return;
    setIsProcessing(true);
    try {
      await api.createLanguage(newLangName);
      setNewLangName('');
      setShowAddLanguageModal(false);
      showToast('Language added dynamically.');
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Student (using Custom Popup)
  const handleDeleteStudent = (id: string, name: string) => {
    requestConfirm({
      title: 'Delete Student Record',
      message: `Are you sure you want to delete student "${name}"? This will permanently remove their student profile, authorized email authentication, and all dormitory room, refectory seating, and daily duty allocations.`,
      confirmLabel: 'Delete Student',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        setIsProcessing(true);
        try {
          await api.deleteStudent(id);
          showToast(`Student "${name}" deleted.`);
          loadTabContent();
        } catch (err: any) {
          showToast(err.message, true);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Delete Language (using Custom Popup)
  const handleDeleteLanguage = (id: string, name: string) => {
    requestConfirm({
      title: 'Delete Language',
      message: `Are you sure you want to delete language "${name}" from the repository? Any students currently assigned to this language will be safely reassigned to "Not Specified".`,
      confirmLabel: 'Delete Language',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        setIsProcessing(true);
        try {
          await api.deleteLanguage(id);
          showToast(`Language "${name}" deleted.`);
          loadTabContent();
        } catch (err: any) {
          showToast(err.message, true);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    setIsProcessing(true);
    try {
      await api.createDormRoom(newRoom);
      setNewRoom({ name: '', capacity: 6, gender: 'Male' });
      setShowAddRoomModal(false);
      showToast('Dormitory hall/room added successfully.');
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Room (using Custom Popup)
  const handleDeleteRoom = (id: string, name: string) => {
    requestConfirm({
      title: 'Delete Dormitory Room',
      message: `Are you sure you want to delete room "${name}"? All existing bed allocations for this room will be cleared immediately.`,
      confirmLabel: 'Delete Room',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        setIsProcessing(true);
        try {
          await api.deleteDormRoom(id);
          showToast(`Room "${name}" deleted.`);
          loadTabContent();
        } catch (err: any) {
          showToast(err.message, true);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Create Table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name.trim()) return;
    setIsProcessing(true);
    try {
      await api.createRefectoryTable(newTable);
      setNewTable({ name: '', capacity: 8, genderRule: 'ANY' });
      setShowAddTableModal(false);
      showToast('Dining table added successfully.');
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Table (using Custom Popup)
  const handleDeleteTable = (id: string, name: string) => {
    requestConfirm({
      title: 'Delete Dining Table',
      message: `Are you sure you want to delete dining table "${name}"? All student seating allocations assigned to this table will be cleared.`,
      confirmLabel: 'Delete Table',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        setIsProcessing(true);
        try {
          await api.deleteRefectoryTable(id);
          showToast(`Dining table "${name}" deleted.`);
          loadTabContent();
        } catch (err: any) {
          showToast(err.message, true);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Delete Special Responsibility (using Custom Popup)
  const handleDeleteResp = (id: string, title: string) => {
    requestConfirm({
      title: 'Delete Special Role',
      message: `Are you sure you want to delete institutional responsibility "${title}"? This duty will no longer be assigned during rotational scheduling.`,
      confirmLabel: 'Delete Role',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        setIsProcessing(true);
        try {
          await api.deleteSpecialResponsibility(id);
          showToast(`Responsibility "${title}" deleted.`);
          loadTabContent();
        } catch (err: any) {
          showToast(err.message, true);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // 4. Generate Dormitory Schedule (Soft Language Balanced)
  const handleGenerateDormitory = async () => {
    setIsProcessing(true);
    try {
      const res = await api.generateDormitory();
      showToast(res.message);
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Generate Refectory Schedule (Soft Language Balanced)
  const handleGenerateRefectory = async () => {
    setIsProcessing(true);
    try {
      const res = await api.generateRefectory();
      showToast(res.message);
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Generate Daily Duties (Fair FIFO rotation, NO language balancing)
  const handleGenerateDuties = async () => {
    setIsProcessing(true);
    try {
      const res = await api.generateDuties();
      showToast(res.message);
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Generate All Schedules (One Click Master Generation)
  const handleGenerateAllSchedules = async () => {
    setIsProcessing(true);
    try {
      const res = await api.generateAllSchedules();
      showToast(res.message);
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Add Special Responsibility
  const handleAddResp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResp.title.trim()) return;
    setIsProcessing(true);
    try {
      await api.createSpecialResponsibility(newResp);
      setShowAddRespModal(false);
      setNewResp({ title: '', requiredCount: 2, genderRule: 'ANY' });
      showToast('Special responsibility registered.');
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 9. Add Notice
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    setIsProcessing(true);
    try {
      await api.createNotice(newNotice);
      setShowAddNoticeModal(false);
      setNewNotice({ title: '', content: '', targetAudience: 'ALL', priority: 'NORMAL' });
      showToast('Notice published.');
      loadTabContent();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // 10. Download Backup
  const handleDownloadBackup = async () => {
    try {
      const data = await api.getBackup();
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dbsm-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Full system backup downloaded.');
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // 11. Notice Board Poster Openers
  const openDormitoryPoster = () => {
    const groups: PosterGroupItem[] = dormRooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      gender: room.gender,
      students: (room.allocations || []).map((a: any) => ({
        id: a.student?.id || a.studentId,
        name: a.student?.name || 'Student',
        studentId: a.student?.studentId,
        batch: a.student?.batch,
        language: a.student?.language?.name,
        gender: a.student?.gender,
      })),
    }));

    setPosterConfig({
      isOpen: true,
      title: 'DORMITORY ALLOCATION ROSTER',
      subtitle: 'Language-Balanced Residential Halls Allocation • Official Room Placements',
      moduleType: 'dormitory',
      effectivePeriod: 'Term 1 - 2026 (Valid for Current Session)',
      groups,
    });
  };

  const openRefectoryPoster = () => {
    const groups: PosterGroupItem[] = refectoryTables.map((table) => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      genderRule: table.genderRule,
      students: (table.allocations || []).map((a: any) => ({
        id: a.student?.id || a.studentId,
        name: a.student?.name || 'Student',
        studentId: a.student?.studentId,
        batch: a.student?.batch,
        language: a.student?.language?.name,
      })),
    }));

    setPosterConfig({
      isOpen: true,
      title: 'REFECTORY DINING ALLOCATION ROSTER',
      subtitle: 'Language-Balanced Community Dining Table Assignments',
      moduleType: 'refectory',
      effectivePeriod: 'Term 1 - 2026 (Valid for Current Session)',
      groups,
    });
  };

  const openResponsibilitiesPoster = () => {
    const groups: PosterGroupItem[] = responsibilities.map((r) => {
      const matchedDuties = duties.filter((d) => d.dutyType === 'SPECIAL_RESPONSIBILITY' && d.title === r.title);
      const assignedStudents = matchedDuties.length > 0
        ? matchedDuties.map((d) => ({
            id: d.student?.id || d.studentId,
            name: d.student?.name || 'Student',
            studentId: d.student?.studentId,
            batch: d.student?.batch,
            language: d.student?.language?.name,
          }))
        : students.slice(0, r.requiredCount || 2).map((s) => ({
            id: s.id,
            name: s.name,
            studentId: s.studentId,
            batch: s.batch,
            language: s.language?.name,
          }));

      return {
        id: r.id,
        name: r.title,
        capacity: r.requiredCount || 2,
        genderRule: r.genderRule,
        students: assignedStudents,
      };
    });

    setPosterConfig({
      isOpen: true,
      title: 'SPECIAL RESPONSIBILITIES ROSTER',
      subtitle: 'Fixed Term Institutional Responsibility Assignments',
      moduleType: 'responsibilities',
      effectivePeriod: 'Weekly Rotation (Valid for 7 Days)',
      groups,
    });
  };

  const openDutiesPoster = () => {
    const dutyMap: Record<string, any[]> = {};
    duties.forEach((d) => {
      const typeKey = d.dutyType || 'DAILY_DUTY';
      if (!dutyMap[typeKey]) dutyMap[typeKey] = [];
      dutyMap[typeKey].push(d);
    });

    let groups: PosterGroupItem[] = Object.entries(dutyMap).map(([typeKey, dList]) => ({
      id: typeKey,
      name: typeKey.replace(/_/g, ' '),
      capacity: dList.length,
      students: dList.map((d) => ({
        id: d.student?.id || d.studentId,
        name: `${d.title}: ${d.student?.name || 'Unassigned'}`,
        studentId: d.student?.studentId,
        batch: d.student?.batch,
      })),
    }));

    if (groups.length === 0) {
      groups = [
        {
          id: 'morning_job',
          name: 'MORNING JOBS',
          capacity: 4,
          students: students.slice(0, 4).map((s) => ({ id: s.id, name: s.name, batch: s.batch })),
        },
        {
          id: 'house_cleaning',
          name: 'HOUSE CLEANING',
          capacity: 4,
          students: students.slice(4, 8).map((s) => ({ id: s.id, name: s.name, batch: s.batch })),
        },
      ];
    }

    setPosterConfig({
      isOpen: true,
      title: 'DAILY ROTATIONAL DUTIES ROSTER',
      subtitle: 'Fair Rotational Morning Jobs, Cleaning & Assembly Schedule',
      moduleType: 'duties',
      effectivePeriod: new Date().toISOString().split('T')[0],
      groups,
    });
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative select-none font-body">
      {/* Real Full-Screen Cinematic DBSM Background Image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="/background.jpg"
          alt="DBSM Academy"
          className="w-full h-full object-cover object-[center_35%]"
        />
        {/* Subtle dark gradient/vignette to ensure AAA readability while preserving sunset and building */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/60" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />
      </div>

      {/* Fixed Top Navigation */}
      <nav className="fixed top-0 inset-x-0 z-40 px-6 sm:px-12 py-4 flex items-center justify-between backdrop-blur-md bg-black/25 border-b border-white/10">
        {/* LEFT: Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt="Don Bosco Tech Logo"
            className="w-8 h-8 object-contain rounded-xl bg-white/90 p-0.5 border border-white/20 shadow-md group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-lg sm:text-xl font-medium tracking-tight text-white group-hover:text-amber-200 transition-colors">
              DBSM Academy<sup className="text-xs">®</sup>
            </span>
            <span className="text-amber-300 text-base select-none">✳︎</span>
          </div>
        </div>

        {/* CENTER: Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs tracking-wider uppercase font-medium">
          <button
            onClick={() => setActiveTab('students')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'students' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('dormitory')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'dormitory' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Dormitory
          </button>
          <button
            onClick={() => setActiveTab('refectory')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'refectory' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Refectory
          </button>

          {/* Duties Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNavDutiesOpen(!isNavDutiesOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                ['duties', 'responsibilities'].includes(activeTab) || isNavDutiesOpen
                  ? 'text-white font-semibold bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Duties</span>
              <span className={`text-[9px] transition-transform duration-200 ${isNavDutiesOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isNavDutiesOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-56 py-2.5 rounded-2xl glass-panel shadow-2xl border border-white/20 backdrop-blur-2xl z-50 animate-fadeIn"
                onMouseLeave={() => setIsNavDutiesOpen(false)}
              >
                <div className="px-3.5 py-1 text-[10px] uppercase font-mono tracking-wider text-amber-300/80 border-b border-white/10 mb-1.5">
                  Institutional Duties
                </div>
                <button
                  onClick={() => {
                    setActiveTab('duties');
                    setIsNavDutiesOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/90 hover:text-white hover:bg-white/15 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Morning Job</span>
                  <span className="text-[10px] text-white/40">Daily</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('duties');
                    setIsNavDutiesOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/90 hover:text-white hover:bg-white/15 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>House Cleaning</span>
                  <span className="text-[10px] text-white/40">Rotational</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('responsibilities');
                    setIsNavDutiesOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/90 hover:text-white hover:bg-white/15 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Special Responsibilities</span>
                  <span className="text-[10px] text-amber-300/70">Key Roles</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaves' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>Leaves</span>
            {dashboardData?.stats?.pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono font-bold text-[9px]">
                {dashboardData.stats.pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'notices' ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Posters
          </button>
        </div>

        {/* RIGHT: System Icons & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadBackup}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all border border-white/10 cursor-pointer"
            title="System Cloud Backup"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all border border-white/10 cursor-pointer relative"
            title="Institutional Notices"
          >
            <Bell className="w-4 h-4" />
            {dashboardData?.stats?.noticesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign out
          </Button>
        </div>
      </nav>

      {/* Floating Notifications */}
      {actionSuccess && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 backdrop-blur-xl flex items-center gap-3 animate-fadeIn shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-xs text-red-200 backdrop-blur-xl flex items-center gap-3 animate-fadeIn shadow-2xl">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Administrative Container */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-12 flex flex-col">
        {/* Navigation Breadcrumb Bar when on Sub-tabs */}
        {activeTab !== 'dashboard' && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-3 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-white/30">/</span>
            {[
              { id: 'students', label: 'Students', icon: <Users className="w-3.5 h-3.5 mr-1" /> },
              { id: 'languages', label: 'Languages', icon: <LanguagesIcon className="w-3.5 h-3.5 mr-1" /> },
              { id: 'dormitory', label: 'Dormitory', icon: <Home className="w-3.5 h-3.5 mr-1" /> },
              { id: 'refectory', label: 'Refectory', icon: <Utensils className="w-3.5 h-3.5 mr-1" /> },
              { id: 'duties', label: 'Daily Duties', icon: <Calendar className="w-3.5 h-3.5 mr-1" /> },
              { id: 'responsibilities', label: 'Special Roles', icon: <Layers className="w-3.5 h-3.5 mr-1" /> },
              { id: 'leaves', label: 'Leaves', icon: <FileText className="w-3.5 h-3.5 mr-1" /> },
              { id: 'notices', label: 'Notices & Posters', icon: <Bell className="w-3.5 h-3.5 mr-1" /> },
              { id: 'logs', label: 'Audit Logs', icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. MASTER DASHBOARD VIEW                                 */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8 animate-fadeIn">
            {/* HERO SECTION */}
            <div className="pt-8 pb-4 max-w-4xl">
              <span className="text-xs sm:text-sm tracking-wide text-white/70 font-light block mb-2">
                Welcome to DBSM Academy. Don Bosco Skill Mission Schedule & Student Management
              </span>
              <h1
                className="font-heading font-medium tracking-tight text-white mb-4 leading-none"
                style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}
              >
                DBSM Academy.
              </h1>
              <p className="text-sm sm:text-base text-white/75 font-light leading-relaxed max-w-2xl mb-8">
                Manage students, organize duties, balance accommodation and seating, and prepare professional notice board schedules.
              </p>

              {/* Hero Action Pill Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab('students')}
                  className="px-5 py-2.5 rounded-full bg-[#917B77] hover:bg-[#806b67] text-white text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Students</span>
                </button>

                <button
                  onClick={() => setActiveTab('dormitory')}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Dormitory</span>
                </button>

                <button
                  onClick={() => setActiveTab('refectory')}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Refectory</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaves')}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wider uppercase flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md cursor-pointer relative"
                >
                  <FileText className="w-4 h-4" />
                  <span>Leaves</span>
                  {dashboardData?.stats?.pendingLeavesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono font-bold text-[9px]">
                      {dashboardData.stats.pendingLeavesCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsHeroDutiesOpen(!isHeroDutiesOpen)}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wider uppercase flex items-center gap-1.5 transition-all border border-white/15 backdrop-blur-md cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Duties</span>
                    <span className={`text-[9px] transition-transform duration-200 ${isHeroDutiesOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isHeroDutiesOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-56 py-2.5 rounded-2xl glass-panel shadow-2xl border border-white/20 backdrop-blur-2xl z-50 animate-fadeIn"
                      onMouseLeave={() => setIsHeroDutiesOpen(false)}
                    >
                      <button
                        onClick={() => {
                          setActiveTab('duties');
                          setIsHeroDutiesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Morning Job
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('duties');
                          setIsHeroDutiesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        House Cleaning
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('responsibilities');
                          setIsHeroDutiesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Special Responsibilities
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('notices')}
                  className="px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-neutral-900" />
                  <span>Posters</span>
                </button>
              </div>
            </div>

            {/* DASHBOARD STATISTICS SECTION (6 CARDS - 100% CALCULATED) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* 1. TOTAL STUDENTS */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">TOTAL STUDENTS</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-white mt-2">
                  {dashboardData.stats?.totalStudents || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">100% of academy</span>
              </div>

              {/* 2. HOSTELLERS */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">HOSTELLERS</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-amber-200 mt-2">
                  {dashboardData.stats?.hostellers || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">
                  {dashboardData.stats?.hostellerPct || 0}% of academy
                </span>
              </div>

              {/* 3. DAY SCHOLARS */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">DAY SCHOLARS</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-white mt-2">
                  {dashboardData.stats?.dayScholars || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">
                  {dashboardData.stats?.dayScholarPct || 0}% of academy
                </span>
              </div>

              {/* 4. LANGUAGES */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">LANGUAGES</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-emerald-300 mt-2">
                  {dashboardData.stats?.languagesRepresented || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">Languages represented</span>
              </div>

              {/* 5. MALE */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">MALE</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-white mt-2">
                  {dashboardData.stats?.maleStudents || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">
                  {dashboardData.stats?.malePct || 0}% of academy
                </span>
              </div>

              {/* 6. FEMALE */}
              <div className="p-5 rounded-3xl glass-panel flex flex-col justify-between">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-medium">FEMALE</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium text-white mt-2">
                  {dashboardData.stats?.femaleStudents || 0}
                </span>
                <span className="text-[10px] text-white/40 mt-1">
                  {dashboardData.stats?.femalePct || 0}% of academy
                </span>
              </div>
            </div>

            {/* THREE-COLUMN BOTTOM SECTION: LANGUAGE DIVERSITY, QUICK MODULES, RECENT SCHEDULES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: LANGUAGE DIVERSITY POOL */}
              <div className="p-6 rounded-3xl glass-panel flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-base font-semibold tracking-wider uppercase text-white">
                      LANGUAGE DIVERSITY POOL
                    </h3>
                    <button
                      onClick={() => setActiveTab('languages')}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                  <p className="text-[11px] text-white/45 mb-4">
                    Dynamic student linguistic distribution supporting Dormitory and Refectory balancing.
                  </p>

                  {/* Language List with real progress bars */}
                  <div className="space-y-3">
                    {dashboardData.languages?.filter((l: any) => l.count > 0).slice(0, 7).map((l: any, idx: number) => {
                      const color = LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length];
                      const pct = l.percentage || (dashboardData.stats?.totalStudents ? (l.count / dashboardData.stats.totalStudents) * 100 : 0);
                      return (
                        <div key={l.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-white/90">{l.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-white/60 font-mono text-[11px]">{l.count}</span>
                              <span className="text-white/40 font-mono text-[11px] w-12 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full ${color.bg} transition-all duration-700 rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(!dashboardData.languages || dashboardData.languages.filter((l: any) => l.count > 0).length === 0) && (
                      <div className="py-8 text-center text-xs text-white/40">
                        No student language data available yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
                  <span>{dashboardData.stats?.languagesRepresented || 0} unique languages represented</span>
                  <button
                    onClick={() => setShowAddLanguageModal(true)}
                    className="text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    + Add Language
                  </button>
                </div>
              </div>

              {/* Column 2: QUICK MODULES */}
              <div className="p-6 rounded-3xl glass-panel flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold tracking-wider uppercase text-white">
                      QUICK MODULES
                    </h3>
                    <span className="text-[10px] text-white/40 font-mono">7 Core Modules</span>
                  </div>

                  {/* Grid of Module Cards */}
                  <div className="space-y-2">
                    {[
                      { name: 'Morning Job', icon: <Sun className="w-4 h-4 text-amber-300" />, tab: 'duties' },
                      { name: 'Assembly', icon: <Sparkles className="w-4 h-4 text-cyan-300" />, tab: 'duties' },
                      { name: 'House Cleaning', icon: <Brush className="w-4 h-4 text-emerald-300" />, tab: 'duties' },
                      { name: 'Dormitory Allocation', icon: <Home className="w-4 h-4 text-purple-300" />, tab: 'dormitory' },
                      { name: 'Special Responsibilities', icon: <Briefcase className="w-4 h-4 text-rose-300" />, tab: 'responsibilities' },
                      { name: 'Refectory Seating', icon: <Utensils className="w-4 h-4 text-orange-300" />, tab: 'refectory' },
                      { name: 'Mass Reading', icon: <BookOpen className="w-4 h-4 text-blue-300" />, tab: 'duties' },
                    ].map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setActiveTab(m.tab as any)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 flex items-center justify-between text-xs text-white/90 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1 rounded-lg bg-white/5">{m.icon}</span>
                          <span className="font-medium group-hover:text-white transition-colors">{m.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button: Generate All Schedules */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleGenerateAllSchedules}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-full bg-[#917B77] hover:bg-[#806b67] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Generating Schedules...' : 'Generate All Schedules'}</span>
                  </button>
                </div>
              </div>

              {/* Column 3: RECENT SCHEDULES */}
              <div className="p-6 rounded-3xl glass-panel flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-base font-semibold tracking-wider uppercase text-white">
                      RECENT SCHEDULES
                    </h3>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                  <p className="text-[11px] text-white/45 mb-4">
                    Recently generated rosters and institutional allocations.
                  </p>

                  {/* Schedule Items List */}
                  <div className="space-y-3">
                    {dashboardData.recentSchedules?.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-start justify-between gap-2 text-xs hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-white">{s.title}</h4>
                          <p className="text-[11px] text-white/50 mt-0.5">{s.period}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/40">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(s.createdAt).toLocaleDateString()} • {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#917B77]/25 text-[#d8c3bf] border border-[#917B77]/40 text-[10px] font-medium uppercase tracking-wider">
                          {s.status}
                        </span>
                      </div>
                    ))}
                    {(!dashboardData.recentSchedules || dashboardData.recentSchedules.length === 0) && (
                      <div className="py-12 text-center text-xs text-white/40">
                        No schedules generated yet. Click &ldquo;Generate All Schedules&rdquo; to create your first roster.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
                  <span>Auto-synced with audit logs</span>
                  <button
                    onClick={handleDownloadBackup}
                    className="text-white/60 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Backup Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. STUDENTS VIEW                                         */}
        {/* ======================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search input & Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTabContent()}
                    className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs text-white glass-input outline-none"
                  />
                </div>

                <select
                  value={filterGender}
                  onChange={(e) => {
                    setFilterGender(e.target.value);
                  }}
                  className="px-4 py-2.5 rounded-full text-xs glass-input text-white/80 outline-none"
                >
                  <option value="" className="bg-neutral-900">All Genders</option>
                  <option value="Male" className="bg-neutral-900">Male</option>
                  <option value="Female" className="bg-neutral-900">Female</option>
                </select>

                <select
                  value={filterResidency}
                  onChange={(e) => {
                    setFilterResidency(e.target.value);
                  }}
                  className="px-4 py-2.5 rounded-full text-xs glass-input text-white/80 outline-none"
                >
                  <option value="" className="bg-neutral-900">All Residency</option>
                  <option value="Hosteller" className="bg-neutral-900">Hosteller</option>
                  <option value="Day Scholar" className="bg-neutral-900">Day Scholar</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                >
                  Import Excel / JSON
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openAddStudentModal}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Student
                </Button>
              </div>
            </div>

            {/* Students Table */}
            <div className="p-6 rounded-3xl glass-panel overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Student ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email (OTP Auth)</th>
                    <th className="pb-3">Gender</th>
                    <th className="pb-3">Residency</th>
                    <th className="pb-3">Language</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-2 font-mono text-amber-300 font-medium">{s.studentId}</td>
                      <td className="py-3 font-medium text-white">{s.name}</td>
                      <td className="py-3 text-white/70">{s.email}</td>
                      <td className="py-3 text-white/60">{s.gender}</td>
                      <td className="py-3 text-white/60">{s.dayScholar ? 'Day Scholar' : 'Hosteller'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                          {s.language?.name || 'Not Specified'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                          Authorized
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="py-12 text-center text-white/40">No student records found.</div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. LANGUAGES VIEW                                        */}
        {/* ======================================================== */}
        {activeTab === 'languages' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl text-white">Dynamic Language Repository</h2>
                <p className="text-xs text-white/50">
                  Manage institutional languages used in soft balancing algorithms.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddLanguageModal(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add New Language
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map((l) => (
                <div key={l.id} className="p-5 rounded-3xl glass-panel flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-lg text-white">{l.name}</h4>
                    <span className="text-xs text-white/40">{l._count?.students || 0} Registered Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLanguage(l.id, l.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Language"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. DORMITORY VIEW                                        */}
        {/* ======================================================== */}
        {activeTab === 'dormitory' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-white">Residential Halls (Hostellers)</h2>
                <p className="text-xs text-white/50">
                  Allocations strictly respect gender segregation, room capacity, and soft language diversity.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openDormitoryPoster}
                  icon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
                >
                  Notice Board Poster
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateDormitory}
                  isLoading={isProcessing}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Allocations
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddRoomModal(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Hall / Room
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dormRooms.map((room) => (
                <div key={room.id} className="p-6 rounded-3xl glass-panel">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-heading text-lg text-white">{room.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-mono">
                        {room.gender} • {room.allocations?.length || 0} / {room.capacity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 mt-4">
                    {room.allocations?.map((a: any, aIdx: number) => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                          aIdx === 0
                            ? 'bg-amber-400/10 border-amber-400/30'
                            : aIdx === 1
                            ? 'bg-indigo-500/10 border-indigo-400/30'
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 font-mono text-[10px] w-4">{aIdx + 1}.</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{a.student.name}</span>
                              {aIdx === 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-400 text-black font-bold text-[9px] uppercase">
                                  <Crown className="w-2.5 h-2.5" /> Leader
                                </span>
                              )}
                              {aIdx === 1 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-500 text-white font-bold text-[9px] uppercase">
                                  <Star className="w-2.5 h-2.5" /> Asst. Leader
                                </span>
                              )}
                            </div>
                            <span className="text-white/40 font-mono text-[10px]">
                              {a.student.studentId} • {a.student.batch || 'Batch 2026'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-300 font-medium">
                          {a.student.language?.name || 'Not Specified'}
                        </span>
                      </div>
                    ))}
                    {(!room.allocations || room.allocations.length === 0) && (
                      <div className="py-6 text-center text-xs text-white/40">No students allocated.</div>
                    )}
                  </div>
                </div>
              ))}
              {dormRooms.length === 0 && (
                <div className="col-span-2 py-12 text-center text-white/40 glass-panel rounded-3xl">
                  No dormitory halls configured. Click &ldquo;Add Hall / Room&rdquo; to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. REFECTORY VIEW                                        */}
        {/* ======================================================== */}
        {activeTab === 'refectory' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-white">Refectory Dining Tables</h2>
                <p className="text-xs text-white/50">
                  Allocations with soft language balancing to encourage camaraderie across linguistic backgrounds.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openRefectoryPoster}
                  icon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
                >
                  Notice Board Poster
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateRefectory}
                  isLoading={isProcessing}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Tables
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddTableModal(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Dining Table
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {refectoryTables.map((table) => (
                <div key={table.id} className="p-6 rounded-3xl glass-panel">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-heading text-lg text-white">{table.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-mono">
                        Capacity: {table.capacity} • {table.genderRule || 'ANY'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table.id, table.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                    {table.allocations?.map((a: any, sIdx: number) => {
                      const isLeader = sIdx === 0;
                      const isAsstLeader = sIdx === 1;

                      return (
                        <div
                          key={a.id}
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                            isLeader
                              ? 'bg-amber-400/10 border-amber-400/30'
                              : isAsstLeader
                              ? 'bg-indigo-500/10 border-indigo-400/30'
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] text-white/50 font-mono">Seat #{a.seatNumber}</span>
                            {isLeader && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-400 text-black font-bold text-[9px] uppercase">
                                <Crown className="w-2.5 h-2.5" /> Table Leader
                              </span>
                            )}
                            {isAsstLeader && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-500 text-white font-bold text-[9px] uppercase">
                                <Star className="w-2.5 h-2.5" /> Asst. Leader
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-white truncate">{a.student.name}</span>
                          <span className="text-[10px] text-amber-300 mt-0.5">
                            {a.student.language?.name || 'Not Specified'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {refectoryTables.length === 0 && (
                <div className="col-span-2 py-12 text-center text-white/40 glass-panel rounded-3xl">
                  No dining tables configured. Click &ldquo;Add Dining Table&rdquo; to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. DAILY DUTIES VIEW                                     */}
        {/* ======================================================== */}
        {activeTab === 'duties' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-white">Daily Rotational Duties</h2>
                <p className="text-xs text-white/50">
                  Morning Job, House Cleaning, Liturgy & Assembly (Fair rotation, same-day conflict-free).
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openDutiesPoster}
                  icon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
                >
                  Notice Board Poster
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateDuties}
                  isLoading={isProcessing}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Generate Today's Duties
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Duty Module</th>
                    <th className="pb-3">Task Assignment</th>
                    <th className="pb-3">Assigned Student</th>
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {duties.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-2 font-mono text-amber-300 font-medium">
                        {d.dutyType.replace('_', ' ')}
                      </td>
                      <td className="py-3 font-medium text-white">{d.title}</td>
                      <td className="py-3 text-white/80">{d.student?.name}</td>
                      <td className="py-3 text-white/50 font-mono">{d.student?.studentId}</td>
                      <td className="py-3 text-white/40 font-mono">{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {duties.length === 0 && (
                <div className="py-12 text-center text-white/40">No duties generated for today.</div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. SPECIAL RESPONSIBILITIES VIEW                         */}
        {/* ======================================================== */}
        {activeTab === 'responsibilities' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-white">Configurable Special Responsibilities</h2>
                <p className="text-xs text-white/50">
                  Add or edit institution duties (Bell Ringers, Sacristans, Water System, etc.)
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openResponsibilitiesPoster}
                  icon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
                >
                  Notice Board Poster
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddRespModal(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  New Responsibility
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {responsibilities.map((r) => (
                <div key={r.id} className="p-6 rounded-3xl glass-panel">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-heading text-lg text-white">{r.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleDeleteResp(r.id, r.title)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Responsibility"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span>Required Count:</span>
                    <span className="font-mono text-amber-300 font-bold">{r.requiredCount} students</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                    <span>Gender Rule:</span>
                    <span className="font-mono text-white/80">{r.genderRule}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 8. NOTICES & POSTERS VIEW                                */}
        {/* ======================================================== */}
        {activeTab === 'notices' && (
          <div className="space-y-8 animate-fadeIn">
            {/* OFFICIAL NOTICE BOARD POSTERS GALLERY */}
            <div className="p-8 rounded-3xl glass-panel relative overflow-hidden border border-amber-400/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/30">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300 font-mono font-semibold">
                      Notice Board Publisher & Downloader
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-tight">
                    Official Notice Board Posters
                  </h2>
                  <p className="text-xs text-white/50 max-w-xl mt-1">
                    Generate, edit, swap student placements, and download high-resolution institutional posters for campus notice boards.
                  </p>
                </div>
              </div>

              {/* 4 Poster Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Dormitory Poster */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-amber-400/10 text-amber-300">
                        <Home className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                        {dormRooms.length} Halls
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Dormitory Roster
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Residential halls allocation with Leader & Asst. Leader designations.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openDormitoryPoster}
                    className="w-full mt-4 gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Export Poster</span>
                  </Button>
                </div>

                {/* 2. Refectory Poster */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-indigo-400/10 text-indigo-300">
                        <Utensils className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                        {refectoryTables.length} Tables
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Refectory Roster
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Community dining tables with Table Leader & Asst. Leader designations.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openRefectoryPoster}
                    className="w-full mt-4 gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Export Poster</span>
                  </Button>
                </div>

                {/* 3. Special Responsibilities Poster */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-emerald-400/10 text-emerald-300">
                        <ShieldAlert className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                        {responsibilities.length} Roles
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Responsibilities Roster
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Fixed-term responsibilities (Bell Ringers, Sacristans, Water System, etc.)
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openResponsibilitiesPoster}
                    className="w-full mt-4 gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Export Poster</span>
                  </Button>
                </div>

                {/* 4. Daily Duties Poster */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-purple-400/10 text-purple-300">
                        <Calendar className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/60">
                        Today
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Daily Duties Roster
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Fair rotational Morning Jobs, House Cleaning, and Assembly tasks.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openDutiesPoster}
                    className="w-full mt-4 gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Export Poster</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* CIRCULAR NOTICES SECTION */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl text-white">Campus Circulars & Broadcasts</h2>
                <p className="text-xs text-white/50">Publish announcements and circulars to students or all campus users.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddNoticeModal(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Post New Notice
              </Button>
            </div>

            <div className="space-y-4">
              {notices.map((n) => (
                <div key={n.id} className="p-6 rounded-3xl glass-panel flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading text-lg text-white">{n.title}</h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        {n.priority}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase">Audience: {n.targetAudience}</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed max-w-2xl">{n.content}</p>
                    <span className="text-[10px] text-white/40 block mt-3">
                      Posted: {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await api.deleteNotice(n.id);
                      showToast('Notice deleted.');
                      loadTabContent();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 9. AUDIT LOGS VIEW                                       */}
        {/* ======================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-heading text-2xl text-white">System Security & Activity Audit Trail</h2>
              <p className="text-xs text-white/50">All administrative operations and logins are logged immutably.</p>
            </div>

            <div className="p-6 rounded-3xl glass-panel overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Action</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="py-3 pl-2 font-mono text-amber-300 font-semibold">{log.action}</td>
                      <td className="py-3 text-white">{log.actorEmail}</td>
                      <td className="py-3 text-white/60">{log.actorRole}</td>
                      <td className="py-3 text-white/70">{log.details || '-'}</td>
                      <td className="py-3 text-white/40 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 10. LEAVE MANAGEMENT VIEW                                */}
        {/* ======================================================== */}
        {activeTab === 'leaves' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Filter Bar */}
            <div className="p-8 rounded-3xl glass-panel flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300 font-mono px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-300/30">
                    Institutional Attendance
                  </span>
                  {leaveCounts.pending > 0 && (
                    <span className="text-[10px] uppercase font-bold text-black px-2 py-0.5 rounded-full bg-amber-400 animate-pulse">
                      {leaveCounts.pending} Action Required
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-tight">
                  Student Leave Applications
                </h2>
                <p className="text-xs text-white/50 max-w-xl mt-1">
                  Review student leave requests, authorize date spans, add institutional administrative remarks, or decline applications.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                {[
                  { id: 'ALL', label: 'All', count: leaveCounts.all },
                  { id: 'PENDING', label: 'Pending', count: leaveCounts.pending },
                  { id: 'APPROVED', label: 'Approved', count: leaveCounts.approved },
                  { id: 'REJECTED', label: 'Rejected', count: leaveCounts.rejected },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={async () => {
                      setLeaveFilter(f.id as any);
                      const res = await api.getAdminLeaves(f.id);
                      setLeaves(res.leaves || []);
                      if (res.counts) setLeaveCounts(res.counts);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      leaveFilter === f.id
                        ? 'bg-white text-black font-semibold shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        leaveFilter === f.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Applications List */}
            <div className="space-y-4">
              {leaves.length > 0 ? (
                leaves.map((leave) => {
                  const isPending = leave.status === 'PENDING';
                  const isApproved = leave.status === 'APPROVED';
                  const isRejected = leave.status === 'REJECTED';

                  return (
                    <div
                      key={leave.id}
                      className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                      {/* Left: Student & Reason Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center font-heading text-amber-200 text-sm font-semibold">
                            {leave.student?.name ? leave.student.name.charAt(0).toUpperCase() : 'S'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-heading font-medium text-white">
                                {leave.student?.name || 'Unknown Student'}
                              </h3>
                              <span className="text-xs font-mono text-amber-300/90 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-300/20">
                                {leave.student?.studentId || 'STU-0001'}
                              </span>
                            </div>
                            <span className="text-[11px] text-white/50">
                              {leave.student?.email} • {leave.student?.gender || 'N/A'} • {leave.student?.dayScholar ? 'Day Scholar' : 'Hosteller'} • {leave.student?.language?.name || 'Not Specified'}
                            </span>
                          </div>
                        </div>

                        {/* Subject & Reason */}
                        <div className="pl-13 space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold text-white tracking-wide">
                              Subject: {leave.subject}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                              {leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed max-w-2xl bg-white/5 p-3 rounded-xl border border-white/5">
                            {leave.reason}
                          </p>

                          {leave.adminRemarks && (
                            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-300/20 text-xs text-amber-200 flex items-center gap-2">
                              <span className="font-semibold text-white/80">Admin Remark:</span>
                              <span>{leave.adminRemarks}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Date Span & Decision Action */}
                      <div className="flex flex-col items-start md:items-end justify-between self-stretch md:self-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                        {/* Dates */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-white font-mono font-medium text-xs">
                            <CalendarDays className="w-4 h-4 text-amber-300" />
                            <span>{leave.startDate}</span>
                            <span className="text-white/40">→</span>
                            <span>{leave.endDate}</span>
                          </div>
                          <span className="text-[10px] text-white/40 block mt-1">
                            Applied: {new Date(leave.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Status Badge or Decision Action */}
                        <div className="flex items-center gap-2.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => {
                                  setReviewingLeave(leave);
                                  setReviewDecision('APPROVED');
                                  setReviewRemarks('');
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setReviewingLeave(leave);
                                  setReviewDecision('REJECTED');
                                  setReviewRemarks('');
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-emerald-300 bg-emerald-400/15 border border-emerald-300/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  APPROVED
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-rose-300 bg-rose-400/15 border border-rose-300/30">
                                  <XCircle className="w-3.5 h-3.5" />
                                  REJECTED
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setReviewingLeave(leave);
                                  setReviewDecision(leave.status === 'APPROVED' ? 'REJECTED' : 'APPROVED');
                                  setReviewRemarks(leave.adminRemarks || '');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white text-[10px] tracking-wider uppercase transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 rounded-3xl glass-panel text-center">
                  <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-base font-heading text-white mb-1">No Leave Requests</h3>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    {leaveFilter === 'ALL'
                      ? 'No student leave applications have been submitted yet.'
                      : `No leave applications found under the "${leaveFilter}" filter.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-6 border-t border-white/10 text-center text-xs text-white/40 tracking-wider uppercase font-light">
        © 2026 DBSM Academy. All rights reserved.
      </footer>

      {/* ======================================================== */}
      {/* MODAL: ADD STUDENT                                       */}
      {/* ======================================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Register Authorized Student</h3>
            <p className="text-xs text-white/50 mb-5">
              Creating a student automatically authorizes their email for passwordless OTP access.
            </p>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <Input
                label="Full Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                required
              />
              <Input
                type="email"
                label="Institutional Email (Used for OTP)"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="Male" className="bg-neutral-900">Male</option>
                    <option value="Female" className="bg-neutral-900">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Residency</label>
                  <select
                    value={newStudent.dayScholar ? 'Day Scholar' : 'Hosteller'}
                    onChange={(e) => setNewStudent({ ...newStudent, dayScholar: e.target.value === 'Day Scholar' })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="Hosteller" className="bg-neutral-900">Hosteller</option>
                    <option value="Day Scholar" className="bg-neutral-900">Day Scholar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-wider text-white/60">Language</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomLangInput(!isCustomLangInput);
                        setNewStudent({ ...newStudent, languageName: '' });
                      }}
                      className="text-[10px] text-amber-300 hover:text-amber-200 underline cursor-pointer"
                    >
                      {isCustomLangInput ? '↺ Select from list' : '+ Type new language'}
                    </button>
                  </div>

                  {isCustomLangInput ? (
                    <input
                      type="text"
                      placeholder="Type language (e.g. Marathi, French)..."
                      value={newStudent.languageName}
                      onChange={(e) => setNewStudent({ ...newStudent, languageName: e.target.value })}
                      className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                      required
                      autoFocus
                    />
                  ) : (
                    <select
                      value={newStudent.languageName}
                      onChange={(e) => setNewStudent({ ...newStudent, languageName: e.target.value })}
                      className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                      required
                    >
                      <option value="" disabled className="bg-neutral-900">
                        -- Select Student Language --
                      </option>
                      {languages.map((l) => (
                        <option key={l.id} value={l.name} className="bg-neutral-900">
                          {l.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <Input
                  label="Batch / Year"
                  value={newStudent.batch}
                  onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddStudentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Authorize Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IMPORT EXCEL / JSON                               */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Bulk Import Students</h3>
            <p className="text-xs text-white/50 mb-4">
              Paste JSON student array or parsed spreadsheet objects with Name, Email, Gender, Residency, Language.
            </p>
            <textarea
              rows={8}
              placeholder={`[\n  {\n    "name": "Francis Xavier",\n    "email": "francis@gmail.com",\n    "gender": "Male",\n    "residency": "Hosteller",\n    "language": "Tamil"\n  }\n]`}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-4 rounded-2xl glass-input text-xs font-mono text-white outline-none resize-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleImportStudents} isLoading={isProcessing}>
                Run Server Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD LANGUAGE                                      */}
      {/* ======================================================== */}
      {showAddLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm p-7 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-lg text-white mb-2">Add New Language</h3>
            <p className="text-xs text-white/50 mb-4">
              Automatically capitalized and available across all modules.
            </p>
            <form onSubmit={handleAddLanguage} className="space-y-4">
              <Input
                label="Language Title"
                placeholder="e.g. Marathi"
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                required
                autoFocus
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddLanguageModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Save Language
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD DORMITORY ROOM / HALL                         */}
      {/* ======================================================== */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Add Dormitory Hall / Room</h3>
            <p className="text-xs text-white/50 mb-5">
              Configure room name, number, gender allocation, and maximum bed capacity.
            </p>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <Input
                label="Room / Hall Name (e.g. Room 101, St. John Hall)"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Gender Rule</label>
                  <select
                    value={newRoom.gender}
                    onChange={(e) => setNewRoom({ ...newRoom, gender: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="Male" className="bg-neutral-900">Male Only</option>
                    <option value="Female" className="bg-neutral-900">Female Only</option>
                  </select>
                </div>
                <div>
                  <Input
                    type="number"
                    label="Bed Capacity"
                    min={1}
                    max={50}
                    value={newRoom.capacity.toString()}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddRoomModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Save Hall / Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD REFECTORY DINING TABLE                        */}
      {/* ======================================================== */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Add Dining Table</h3>
            <p className="text-xs text-white/50 mb-5">
              Configure dining table name, number, seat capacity, and gender seating rule.
            </p>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <Input
                label="Table Name (e.g. Table 05 - St. Joseph)"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Gender Rule</label>
                  <select
                    value={newTable.genderRule}
                    onChange={(e) => setNewTable({ ...newTable, genderRule: e.target.value })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="ANY" className="bg-neutral-900">Any (Mixed / Co-ed)</option>
                    <option value="MALE_ONLY" className="bg-neutral-900">Male Only</option>
                    <option value="FEMALE_ONLY" className="bg-neutral-900">Female Only</option>
                  </select>
                </div>
                <div>
                  <Input
                    type="number"
                    label="Seat Capacity"
                    min={1}
                    max={30}
                    value={newTable.capacity.toString()}
                    onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTableModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Save Table
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NOTICE                                        */}
      {/* ======================================================== */}
      {showAddNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Publish Institutional Notice</h3>
            <form onSubmit={handleAddNotice} className="space-y-4">
              <Input
                label="Headline"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Content</label>
                <textarea
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full p-4 rounded-2xl glass-input text-xs text-white outline-none resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Target Audience</label>
                  <select
                    value={newNotice.targetAudience}
                    onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="ALL" className="bg-neutral-900">All Users</option>
                    <option value="STUDENT" className="bg-neutral-900">Students Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Priority</label>
                  <select
                    value={newNotice.priority}
                    onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-full glass-input text-xs text-white outline-none"
                  >
                    <option value="NORMAL" className="bg-neutral-900">Normal</option>
                    <option value="HIGH" className="bg-neutral-900">High</option>
                    <option value="URGENT" className="bg-neutral-900">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddNoticeModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Publish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD SPECIAL RESPONSIBILITY                        */}
      {/* ======================================================== */}
      {showAddRespModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <h3 className="font-heading text-xl text-white mb-2">Configure Special Role</h3>
            <form onSubmit={handleAddResp} className="space-y-4">
              <Input
                label="Role Title"
                placeholder="e.g. Sound System Team"
                value={newResp.title}
                onChange={(e) => setNewResp({ ...newResp, title: e.target.value })}
                required
              />
              <Input
                type="number"
                label="Required Number of Students"
                value={newResp.requiredCount}
                onChange={(e) => setNewResp({ ...newResp, requiredCount: parseInt(e.target.value) || 1 })}
                min={1}
                required
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddRespModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
                  Create Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REVIEW & DECIDE LEAVE APPLICATION                  */}
      {/* ======================================================== */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-7 sm:p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-amber-300">
                  Administration Review
                </span>
                <h2 className="font-heading text-xl text-white font-medium">
                  {reviewDecision === 'APPROVED' ? 'Approve Leave Request' : 'Decline Leave Request'}
                </h2>
              </div>
              <button
                onClick={() => setReviewingLeave(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mb-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Student:</span>
                <span className="font-medium text-white">{reviewingLeave.student?.name} ({reviewingLeave.student?.studentId})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Subject:</span>
                <span className="font-medium text-amber-200">{reviewingLeave.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Duration:</span>
                <span className="font-mono text-white">
                  {reviewingLeave.startDate} → {reviewingLeave.endDate} ({reviewingLeave.totalDays} Days)
                </span>
              </div>
              <div className="pt-2 border-t border-white/5 text-white/70 leading-relaxed">
                <span className="text-white/40 block mb-1">Reason:</span>
                {reviewingLeave.reason}
              </div>
            </div>

            {/* Decision Toggle */}
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDecision('APPROVED')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Leave</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision('REJECTED')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    reviewDecision === 'REJECTED'
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Reject Leave</span>
                </button>
              </div>
            </div>

            {/* Admin Remarks Input */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5">
                Administrator Remarks / Instructions (Visible to Student)
              </label>
              <textarea
                rows={3}
                placeholder={
                  reviewDecision === 'APPROVED'
                    ? 'e.g. Leave granted. Report back to hostel warden on completion.'
                    : 'e.g. Attendance is mandatory due to scheduled semester practicals.'
                }
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs outline-none border border-white/15 focus:border-amber-400/60 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReviewingLeave(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => handleProcessLeaveStatus(reviewingLeave.id, reviewDecision, reviewRemarks.trim())}
                disabled={isUpdatingLeave}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                  reviewDecision === 'APPROVED'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isUpdatingLeave
                  ? 'Saving...'
                  : reviewDecision === 'APPROVED'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CUSTOM CONFIRMATION POPUP DIALOG                  */}
      {/* ======================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-7 rounded-3xl glass-panel border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-white font-medium">{confirmModal.title}</h3>
                <span className="text-[10px] uppercase tracking-wider text-red-400/80 font-mono">
                  Permanent Action
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light mb-6">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeConfirm}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmModal.confirmLabel || 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OFFICIAL NOTICE BOARD POSTER GENERATOR & SWAP     */}
      {/* ======================================================== */}
      <NoticeBoardPosterModal
        isOpen={posterConfig.isOpen}
        onClose={() => setPosterConfig((prev) => ({ ...prev, isOpen: false }))}
        title={posterConfig.title}
        subtitle={posterConfig.subtitle}
        moduleType={posterConfig.moduleType}
        effectivePeriod={posterConfig.effectivePeriod}
        groups={posterConfig.groups}
        onAllocationsSaved={() => {
          showToast('Allocations synchronized across all academy portals.');
          loadTabContent();
        }}
      />
    </div>
  );
};
