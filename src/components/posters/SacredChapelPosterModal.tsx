import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Printer,
  ArrowLeftRight,
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export interface LiturgyDaySchedule {
  date: string;
  dayName: string;
  fullDayName: string;
  isSunday: boolean;
  liturgicalType: string;
  requiredRolesCount: number;
  assignments: {
    id: string;
    dutyType: string;
    title: string;
    date: string;
    studentId: string;
    student: {
      id: string;
      name: string;
      studentId: string;
      batch?: string;
      language?: { name: string };
      gender: string;
    };
  }[];
}

interface SacredChapelPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: LiturgyDaySchedule[];
  effectivePeriod?: string;
  onRosterUpdated?: () => void;
}

export const SacredChapelPosterModal: React.FC<SacredChapelPosterModalProps> = ({
  isOpen,
  onClose,
  schedule: initialSchedule,
  effectivePeriod = 'Weekly Liturgical Cycle',
  onRosterUpdated,
}) => {
  const [schedule, setSchedule] = useState<LiturgyDaySchedule[]>(initialSchedule);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState(false);

  // Swap Selection State
  const [swapSource, setSwapSource] = useState<{
    dayDate: string;
    assignmentId: string;
    roleTitle: string;
    student: any;
  } | null>(null);

  const [swapTarget, setSwapTarget] = useState<{
    dayDate: string;
    assignmentId: string;
    roleTitle: string;
    student: any;
  } | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  if (!isOpen) return null;

  // Export to High-Res PNG
  const handleDownloadImage = async () => {
    if (!posterRef.current) return;
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      const wasEdit = isEditMode;
      if (wasEdit) setIsEditMode(false);

      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(posterRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#0c1017',
      });

      const link = document.createElement('a');
      link.download = `DBSM_SACRED_CHAPEL_LITURGY_ROSTER_${effectivePeriod.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      if (wasEdit) setIsEditMode(true);
    } catch (err) {
      console.error('Liturgy poster export error:', err);
      setErrorMessage('Failed to generate high-resolution image. Please use the Print option.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Atomic zero-duplication lector swap
  const executeSwap = async () => {
    if (!swapSource || !swapTarget) return;

    try {
      await api.swapLiturgy({
        assignmentAId: swapSource.assignmentId,
        assignmentBId: swapTarget.assignmentId,
      });

      // Update local schedule state
      const updated = schedule.map((day) => ({
        ...day,
        assignments: day.assignments.map((a) => {
          if (a.id === swapSource.assignmentId) {
            return { ...a, student: swapTarget.student, studentId: swapTarget.student.id };
          }
          if (a.id === swapTarget.assignmentId) {
            return { ...a, student: swapSource.student, studentId: swapSource.student.id };
          }
          return a;
        }),
      }));

      setSchedule(updated);
      setSwapSource(null);
      setSwapTarget(null);
      setSwapSuccess(true);
      if (onRosterUpdated) onRosterUpdated();
      setTimeout(() => setSwapSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to swap lector assignments');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl bg-neutral-950 border border-white/20 shadow-2xl overflow-hidden my-auto animate-fadeIn">
        
        {/* Top Floating Control Bar */}
        <div className="px-6 py-4 bg-neutral-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 text-lg">
              ✝️
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Sacred Chapel Mass Reading Poster</span>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider bg-amber-400 text-black font-bold">
                    Edit & Swap Mode Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/50">
                Print or download liturgical noticeboard posters for the campus chapel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Edit / Swap Mode Toggle */}
            <Button
              variant={isEditMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Done Editing' : 'Quick Swap Lectors'}</span>
            </Button>

            {/* Download PNG Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadImage}
              isLoading={isDownloading}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image (PNG)</span>
            </Button>

            {/* Print Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </Button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Bar */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-red-500/15 border-b border-red-500/30 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-300 hover:text-white">✕</button>
          </div>
        )}

        {swapSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lector assignments swapped and synchronized across all portals!</span>
            </div>
            <button onClick={() => setSwapSuccess(false)} className="text-emerald-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Scrollable Poster Canvas Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-950/60 flex justify-center custom-scrollbar">
          
          {/* POSTER CANVAS ELEMENT (Exact A4 Proportion: 794px x 1123px) */}
          <div
            ref={posterRef}
            className="w-full max-w-[794px] min-h-[1123px] bg-[#fdfbf7] text-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8 border-4 border-[#1e293b] font-sans flex flex-col justify-between box-border my-auto"
            style={{ width: '794px', minHeight: '1123px' }}
          >
            {/* TOP SECTION */}
            <div>
              {/* 1. Header Banner */}
              <div className="rounded-2xl bg-[#0f172a] text-white py-5 px-6 text-center border-2 border-amber-400/50 shadow-md relative mb-5">
                <div className="relative z-10">
                  <div className="text-amber-400 text-base font-bold tracking-[0.25em] uppercase mb-1 flex items-center justify-center gap-2">
                    <span>✝️</span>
                    <span>Sacred Heart Campus Chapel</span>
                    <span>✝️</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-heading leading-tight drop-shadow-sm">
                    Don Bosco Skill Mission (DBSM)
                  </h1>
                  <p className="text-xs text-amber-200/90 font-serif italic mt-1">
                    &ldquo;Your Word is a lamp to my feet and a light to my path&rdquo; — Psalm 119:105
                  </p>
                  <div className="mt-3">
                    <span className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-400 text-neutral-950 shadow-sm">
                      Official Liturgical Ministry Roster
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Roster Title & Effective Period */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-neutral-300 pb-3.5 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 leading-tight">
                    Daily Holy Mass &amp; Ministry Roster
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium mt-0.5">
                    Weekday Mass (6:30 AM) • Sunday Solemnity Holy Mass (7:00 AM)
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold tracking-wide shrink-0">
                  Cycle Span: <span className="font-mono">{effectivePeriod}</span>
                </div>
              </div>

              {/* 3. Grid of Days (Responsive Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
                {schedule.map((day) => {
                  const isSunday = day.isSunday;

                  return (
                    <div
                      key={day.date}
                      className={`rounded-xl border-2 shadow-xs p-3.5 flex flex-col justify-between transition-all ${
                        isSunday
                          ? 'bg-amber-50/70 border-amber-400/90 shadow-sm'
                          : 'bg-[#fefefe] border-neutral-200'
                      }`}
                    >
                      {/* Card Day Header */}
                      <div>
                        <div className="flex items-center justify-between gap-1.5 border-b border-neutral-200 pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">
                              {isSunday ? '⭐' : '📖'}
                            </span>
                            <div>
                              <h4 className="font-bold text-xs text-neutral-900 uppercase tracking-tight">
                                {day.dayName}, {day.date.split('-').slice(1).join('/')}
                              </h4>
                              <span className="text-[10px] text-neutral-500 font-normal">
                                {day.fullDayName}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono shrink-0 ${
                              isSunday
                                ? 'bg-amber-400 text-neutral-950'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {isSunday ? 'Sunday Mass' : 'Weekday'}
                          </span>
                        </div>

                        {/* Liturgical Roles */}
                        <div className="space-y-1.5">
                          {day.assignments.map((assign) => {
                            const isFirstReading = assign.title.toLowerCase().includes('first');
                            const isPsalm = assign.title.toLowerCase().includes('psalm');
                            const isSecondReading = assign.title.toLowerCase().includes('second');

                            return (
                              <div
                                key={assign.id}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                                  isFirstReading
                                    ? 'bg-amber-50/90 border-amber-300'
                                    : isPsalm
                                    ? 'bg-indigo-50/80 border-indigo-200'
                                    : isSecondReading
                                    ? 'bg-purple-50/80 border-purple-200'
                                    : 'bg-neutral-50 border-neutral-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1">
                                    <BookOpen className="w-2.5 h-2.5 text-neutral-600" />
                                    {assign.title.split('(')[0].trim()}
                                  </span>

                                  {isEditMode && (
                                    <button
                                      onClick={() =>
                                        setSwapSource({
                                          dayDate: day.date,
                                          assignmentId: assign.id,
                                          roleTitle: assign.title,
                                          student: assign.student,
                                        })
                                      }
                                      className="px-1.5 py-0.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 text-[9px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                      <ArrowLeftRight className="w-2 h-2" />
                                      <span>Swap</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-neutral-900 text-xs truncate">
                                    {assign.student?.name || 'Assigned Hosteller'}
                                  </span>
                                  <span className="text-[9px] text-neutral-500 font-mono shrink-0 ml-1">
                                    {assign.student?.batch || 'Hosteller'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {day.assignments.length === 0 && (
                            <div className="py-2.5 text-center text-[11px] text-neutral-400 italic">
                              No ministry assigned
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM SECTION: Official Signatures Footer */}
            <div className="pt-6 border-t-2 border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-xs text-neutral-700 mt-auto">
              <div className="w-48">
                <div className="border-t border-neutral-800 pt-1.5 font-bold text-neutral-900 uppercase text-[11px]">
                  Sacristan / Liturgy Lead
                </div>
                <div className="text-[9px] text-neutral-500">Don Bosco Skill Mission</div>
              </div>

              <div className="text-center font-mono text-[9px] text-neutral-400">
                <div>Generated via DBSM Liturgical Scheduling System</div>
                <div>Campus Chapel Notice Board Expiry: {effectivePeriod}</div>
              </div>

              <div className="w-48">
                <div className="border-t border-neutral-800 pt-1.5 font-bold text-neutral-900 uppercase text-[11px]">
                  Rector / Principal Director
                </div>
                <div className="text-[9px] text-neutral-500">Don Bosco Skill Mission</div>
              </div>
            </div>

          </div>
        </div>

        {/* SWAP MODAL */}
        {swapSource && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                  <h4 className="font-semibold text-white text-base">
                    Swap Liturgical Assignment
                  </h4>
                </div>
                <button
                  onClick={() => {
                    setSwapSource(null);
                    setSwapTarget(null);
                  }}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-4 text-xs">
                <span className="text-white/50 block mb-1">Source Lector:</span>
                <div className="text-sm font-bold text-amber-300">
                  {swapSource.student?.name}
                </div>
                <div className="text-white/60 mt-0.5">
                  Date: <span className="text-white font-medium">{swapSource.dayDate}</span> • Role: <span className="text-white font-medium">{swapSource.roleTitle}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold text-white/80 block mb-2">
                  Select Target Lector Slot to Swap With:
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {schedule.map((day) => (
                    <div key={day.date} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs font-bold text-amber-200/90 mb-1.5 uppercase">
                        {day.dayName}, {day.date} ({day.fullDayName})
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {day.assignments.map((assign) => {
                          const isCurrent = assign.id === swapSource.assignmentId;
                          const isSelected = swapTarget?.assignmentId === assign.id;

                          if (isCurrent) return null;

                          return (
                            <button
                              key={assign.id}
                              onClick={() =>
                                setSwapTarget({
                                  dayDate: day.date,
                                  assignmentId: assign.id,
                                  roleTitle: assign.title,
                                  student: assign.student,
                                })
                              }
                              className={`px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-400 text-black font-bold shadow-lg'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <span className="truncate">{assign.student?.name}</span>
                              <span className="text-[10px] text-amber-200/80 shrink-0 ml-1">
                                {assign.title.split('(')[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSwapSource(null);
                    setSwapTarget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!swapTarget}
                  onClick={executeSwap}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Confirm Swap</span>
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
