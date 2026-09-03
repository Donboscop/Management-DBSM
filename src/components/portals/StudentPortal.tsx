import React, { useState, useEffect } from 'react';
import {
  LogOut,
  User,
  Home,
  Utensils,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

export const StudentPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'dormitory' | 'refectory' | 'duties' | 'notices'>('overview');

  const [studentData, setStudentData] = useState<any>(null);
  const [dormitory, setDormitory] = useState<any>(null);
  const [refectory, setRefectory] = useState<any>(null);
  const [duties, setDuties] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllStudentData();
  }, []);

  const loadAllStudentData = async () => {
    setIsLoading(true);
    try {
      const [meRes, dormRes, refRes, dutyRes, notRes] = await Promise.all([
        api.getStudentMe().catch(() => ({ student: null })),
        api.getStudentDormitory().catch(() => ({ allocation: null })),
        api.getStudentRefectory().catch(() => ({ allocation: null })),
        api.getStudentDuties().catch(() => ({ assignments: [], grouped: {} })),
        api.getStudentNotices().catch(() => ({ notices: [] })),
      ]);

      setStudentData(meRes.student);
      setDormitory(dormRes.allocation);
      setRefectory(refRes.allocation);
      setDuties(dutyRes);
      setNotices(notRes.notices || []);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <img
          src="/background.jpg"
          alt=""
          className="w-full h-full object-cover filter blur-3xl"
        />
      </div>

      {/* Top Editorial Navbar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-heading text-base sm:text-lg tracking-[0.2em] uppercase font-semibold text-white">
              DON BOSCO SKILL MISSION<sup className="text-amber-400 font-normal">®</sup>
            </span>
            <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase font-light">
              Student Academic & Duty Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{user?.studentCustomId || 'STUDENT'}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Hero Student Identity Strip */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-8 pb-4">
        <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-300/30 flex items-center justify-center text-2xl sm:text-3xl font-heading text-amber-200 shadow-inner">
              {studentData?.name ? studentData.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-medium text-white tracking-tight">
                  {studentData?.name || user?.name || 'Student'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono">
                  {studentData?.studentId || user?.studentCustomId || 'STU-0001'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 tracking-wide mt-1">
                {studentData?.email || user?.email} • {studentData?.batch || 'Batch 2026'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] text-white/70 border border-white/10">
                  {studentData?.dayScholar ? 'Day Scholar' : 'Hosteller'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] text-white/70 border border-white/10">
                  Language: {studentData?.language?.name || 'Not Specified'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] text-white/70 border border-white/10">
                  Gender: {studentData?.gender || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 self-stretch md:self-auto justify-between md:justify-start">
            <div className="text-left">
              <span className="text-[10px] tracking-wider uppercase text-white/40 block">Authentication Mode</span>
              <span className="text-xs text-amber-200 font-medium">Passwordless Email OTP</span>
            </div>
            <Shield className="w-5 h-5 text-emerald-400 ml-3" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-white/10 text-xs tracking-wider uppercase">
          {[
            { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5 mr-1.5" /> },
            { id: 'dormitory', label: 'My Dormitory', icon: <Home className="w-3.5 h-3.5 mr-1.5" /> },
            { id: 'refectory', label: 'My Refectory', icon: <Utensils className="w-3.5 h-3.5 mr-1.5" /> },
            { id: 'duties', label: 'Daily Duties', icon: <Calendar className="w-3.5 h-3.5 mr-1.5" /> },
            { id: 'notices', label: 'Notice Board', icon: <Bell className="w-3.5 h-3.5 mr-1.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-5 py-2.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black font-semibold shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-6">
        {isLoading ? (
          <div className="py-16 text-center text-white/40">Loading your profile records...</div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                {/* Dormitory Card */}
                <div className="p-6 rounded-3xl glass-panel relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-white/50 text-xs uppercase tracking-wider mb-3">
                      <span>Dormitory</span>
                      <Home className="w-4 h-4 text-amber-300" />
                    </div>
                    {dormitory ? (
                      <div>
                        <h3 className="text-xl font-heading text-white">{dormitory.room?.name}</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Term: {dormitory.term || 'Term 1 - 2026'}
                        </p>
                        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/80">
                          Room Capacity: {dormitory.room?.capacity || 6} students
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/50 py-4">
                        {studentData?.dayScholar
                          ? 'Day Scholar (No Dormitory assignment required)'
                          : 'No room allocation generated yet'}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('dormitory')}
                    className="mt-4 text-xs"
                  >
                    View room details →
                  </Button>
                </div>

                {/* Refectory Card */}
                <div className="p-6 rounded-3xl glass-panel relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-white/50 text-xs uppercase tracking-wider mb-3">
                      <span>Refectory Dining</span>
                      <Utensils className="w-4 h-4 text-amber-300" />
                    </div>
                    {refectory ? (
                      <div>
                        <h3 className="text-xl font-heading text-white">{refectory.table?.name}</h3>
                        <p className="text-xs text-white/60 mt-1">Seat Number: #{refectory.seatNumber}</p>
                        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/80">
                          Table Capacity: {refectory.table?.capacity || 8} students
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/50 py-4">No table allocation generated yet</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('refectory')}
                    className="mt-4 text-xs"
                  >
                    View table details →
                  </Button>
                </div>

                {/* Active Duties Card */}
                <div className="p-6 rounded-3xl glass-panel relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-white/50 text-xs uppercase tracking-wider mb-3">
                      <span>Today's Assignments</span>
                      <Calendar className="w-4 h-4 text-amber-300" />
                    </div>
                    {duties?.assignments?.length > 0 ? (
                      <div className="space-y-2">
                        {duties.assignments.slice(0, 3).map((d: any) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                          >
                            <span className="text-white font-medium">{d.title}</span>
                            <span className="text-[10px] text-amber-300 uppercase tracking-wider">
                              {d.dutyType.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/50 py-4">No duties scheduled for today</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('duties')}
                    className="mt-4 text-xs"
                  >
                    View all assignments →
                  </Button>
                </div>
              </div>
            )}

            {/* DORMITORY TAB */}
            {activeTab === 'dormitory' && (
              <div className="p-8 rounded-3xl glass-panel animate-fadeIn">
                <h2 className="font-heading text-2xl text-white mb-2">My Dormitory Allocation</h2>
                <p className="text-xs text-white/50 mb-6">
                  Assigned residential hall for Hostellers with language diversity distribution.
                </p>

                {dormitory ? (
                  <div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-amber-300">Assigned Hall</span>
                        <h3 className="text-2xl font-heading text-white">{dormitory.room?.name}</h3>
                        <p className="text-xs text-white/60">Gender Hall: {dormitory.room?.gender} • Capacity: {dormitory.room?.capacity}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                        Active Allocation
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">Roommates</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {dormitory.room?.allocations?.map((alloc: any) => (
                        <div
                          key={alloc.id}
                          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                            alloc.student.studentId === (studentData?.studentId || user?.studentCustomId)
                              ? 'bg-amber-400/15 border-amber-400/40 text-white'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                              {alloc.student.name.charAt(0)}
                            </span>
                            <div>
                              <div className="font-medium">{alloc.student.name}</div>
                              <div className="text-[10px] text-white/50">{alloc.student.studentId}</div>
                            </div>
                          </div>
                          {alloc.student.studentId === (studentData?.studentId || user?.studentCustomId) && (
                            <span className="text-[10px] text-amber-300 font-semibold uppercase">You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40">
                    No dormitory room allocated for this student.
                  </div>
                )}
              </div>
            )}

            {/* REFECTORY TAB */}
            {activeTab === 'refectory' && (
              <div className="p-8 rounded-3xl glass-panel animate-fadeIn">
                <h2 className="font-heading text-2xl text-white mb-2">My Refectory Dining Table</h2>
                <p className="text-xs text-white/50 mb-6">
                  Daily meal seating allocation with language integration.
                </p>

                {refectory ? (
                  <div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-amber-300">Dining Table</span>
                        <h3 className="text-2xl font-heading text-white">{refectory.table?.name}</h3>
                        <p className="text-xs text-white/60">Assigned Seat: #{refectory.seatNumber} • Capacity: {refectory.table?.capacity}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                        Seat #{refectory.seatNumber}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">Table Members</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {refectory.table?.allocations?.map((alloc: any) => (
                        <div
                          key={alloc.id}
                          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                            alloc.student.studentId === (studentData?.studentId || user?.studentCustomId)
                              ? 'bg-amber-400/15 border-amber-400/40 text-white'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] text-white/40">Seat #{alloc.seatNumber}</div>
                            <div className="font-medium mt-0.5">{alloc.student.name}</div>
                          </div>
                          {alloc.student.studentId === (studentData?.studentId || user?.studentCustomId) && (
                            <span className="text-[10px] text-amber-300 font-semibold uppercase">You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40">
                    No refectory table allocated yet.
                  </div>
                )}
              </div>
            )}

            {/* DAILY DUTIES TAB */}
            {activeTab === 'duties' && (
              <div className="p-8 rounded-3xl glass-panel animate-fadeIn space-y-6">
                <div>
                  <h2 className="font-heading text-2xl text-white mb-2">My Daily Duty Schedule</h2>
                  <p className="text-xs text-white/50">
                    Personalized duties rotated fairly without daily conflicts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Morning Job */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-heading tracking-wider uppercase text-amber-300 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Morning Job
                    </h3>
                    {duties?.grouped?.morningJob?.length > 0 ? (
                      <div className="space-y-2">
                        {duties.grouped.morningJob.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between">
                            <span className="font-medium text-white">{d.title}</span>
                            <span className="text-white/50 font-mono">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">No morning job assignments</p>
                    )}
                  </div>

                  {/* House Cleaning */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-heading tracking-wider uppercase text-amber-300 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> House Cleaning
                    </h3>
                    {duties?.grouped?.houseCleaning?.length > 0 ? (
                      <div className="space-y-2">
                        {duties.grouped.houseCleaning.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between">
                            <span className="font-medium text-white">{d.title}</span>
                            <span className="text-white/50 font-mono">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">No cleaning assignments</p>
                    )}
                  </div>

                  {/* Special Responsibilities */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-heading tracking-wider uppercase text-amber-300 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Special Responsibilities
                    </h3>
                    {duties?.grouped?.specialResponsibility?.length > 0 ? (
                      <div className="space-y-2">
                        {duties.grouped.specialResponsibility.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between">
                            <span className="font-medium text-white">{d.title}</span>
                            <span className="text-white/50 font-mono">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">No special responsibilities</p>
                    )}
                  </div>

                  {/* Mass Reading & Assembly */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-heading tracking-wider uppercase text-amber-300 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Liturgy & Assembly
                    </h3>
                    {duties?.grouped?.massReading?.length > 0 || duties?.grouped?.assembly?.length > 0 ? (
                      <div className="space-y-2">
                        {duties.grouped.massReading?.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between">
                            <span className="font-medium text-white">Mass: {d.title}</span>
                            <span className="text-white/50 font-mono">{d.date}</span>
                          </div>
                        ))}
                        {duties.grouped.assembly?.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between">
                            <span className="font-medium text-white">Assembly: {d.title}</span>
                            <span className="text-white/50 font-mono">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">No liturgical or assembly assignments</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NOTICES TAB */}
            {activeTab === 'notices' && (
              <div className="p-8 rounded-3xl glass-panel animate-fadeIn">
                <h2 className="font-heading text-2xl text-white mb-2">Institutional Notice Board</h2>
                <p className="text-xs text-white/50 mb-6">Official circulars and announcements.</p>

                {notices.length > 0 ? (
                  <div className="space-y-4">
                    {notices.map((n) => (
                      <div key={n.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-heading text-white">{n.title}</h3>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 px-2 py-0.5 rounded bg-amber-400/10">
                            {n.priority}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{n.content}</p>
                        <div className="mt-4 text-[10px] text-white/40">
                          Posted on {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40">No active notices at this time.</div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
