import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  RefreshCw,
  Printer,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { SacredChapelPosterModal, type LiturgyDaySchedule } from '../posters/SacredChapelPosterModal';

export const LiturgyManagementView: React.FC = () => {
  const [schedule, setSchedule] = useState<LiturgyDaySchedule[]>([]);
  const [poolStats, setPoolStats] = useState<{
    totalEligible: number;
    cycleLengthDays: number;
    daysSpan: number;
    startDate: string;
    endDate: string;
  }>({
    totalEligible: 0,
    cycleLengthDays: 0,
    daysSpan: 7,
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [daysSpan, setDaysSpan] = useState<number>(7);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poster Modal State
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  // Quick Swap State
  const [isSwapMode, setIsSwapMode] = useState(false);
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

  const loadLiturgyData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getLiturgy({ startDate: selectedStartDate, days: daysSpan });
      if (res.success) {
        setSchedule(res.schedule || []);
        setPoolStats(res.poolStats || { totalEligible: 0, cycleLengthDays: 0, daysSpan, startDate: '', endDate: '' });
      }
    } catch (err: any) {
      console.error('Fetch liturgy error:', err);
      setErrorMessage(err.message || 'Failed to load liturgical schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiturgyData();
  }, [daysSpan, selectedStartDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await api.generateLiturgy({
        startDate: selectedStartDate,
        days: daysSpan,
        includeFaithfulPrayers: false,
      });
      if (res.success) {
        showToast(res.message);
        await loadLiturgyData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate liturgical schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const executeSwap = async () => {
    if (!swapSource || !swapTarget) return;

    try {
      await api.swapLiturgy({
        assignmentAId: swapSource.assignmentId,
        assignmentBId: swapTarget.assignmentId,
      });

      showToast('Lector assignments swapped successfully with zero duplication.');
      setSwapSource(null);
      setSwapTarget(null);
      await loadLiturgyData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to swap lector assignments');
    }
  };

  const effectivePeriod = `${poolStats.startDate || selectedStartDate} to ${poolStats.endDate || ''}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner & Main Actions */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden border border-amber-400/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/30">
                ✝️
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300 font-mono font-semibold">
                Sacred Chapel Ministry Engine
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-white tracking-tight">
              Mass Reading &amp; Liturgical Ministry
            </h1>
            <p className="text-xs text-white/50 max-w-2xl mt-1.5 leading-relaxed">
              Automated, unbiased liturgical scheduling using the Pop-Bucket Draw Engine. 
              Dynamically activates 3 readings for Sunday Solemnities and 2 readings for Weekday morning Mass (6:30 AM).
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Start Date Picker */}
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5">
              <span className="text-[10px] text-white/50 uppercase font-mono">From:</span>
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer"
              />
            </div>

            {/* Range Span Picker */}
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-1">
              {[
                { label: '7 Days', val: 7 },
                { label: '14 Days', val: 14 },
                { label: '30 Days', val: 30 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setDaysSpan(opt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    daysSpan === opt.val
                      ? 'bg-amber-400 text-black font-bold shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Poster Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPosterOpen(true)}
              icon={<Printer className="w-3.5 h-3.5 text-amber-300" />}
            >
              Noticeboard Poster (A4)
            </Button>

            {/* Generate Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              isLoading={isGenerating}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Generate Liturgical Roster
            </Button>
          </div>
        </div>

        {/* 2. Pool Statistics Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-400/10 text-amber-300">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block">Eligible Pool</span>
              <span className="text-sm sm:text-base font-bold text-white font-mono">
                {poolStats.totalEligible} Hostellers
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-400/10 text-indigo-300">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block">Cycle Length</span>
              <span className="text-sm sm:text-base font-bold text-indigo-300 font-mono">
                ~{poolStats.cycleLengthDays} Days
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-400/10 text-purple-300">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block">Schedule Span</span>
              <span className="text-sm sm:text-base font-bold text-white font-mono">
                {daysSpan} Days Active
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block">Cross-Module Lock</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                Conflict Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. Daily Liturgical Matrix / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl text-white">Liturgical Day-by-Day Roster</h3>
            <p className="text-xs text-white/50">
              Click &ldquo;Swap&rdquo; on any student to switch placements across dates with zero duplication.
            </p>
          </div>
          <Button
            variant={isSwapMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsSwapMode(!isSwapMode)}
            icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
          >
            {isSwapMode ? 'Done Swapping' : 'Quick Swap Mode'}
          </Button>
        </div>

        {/* Schedule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {schedule.map((day) => {
            const isSunday = day.isSunday;

            return (
              <div
                key={day.date}
                className={`p-5 rounded-3xl transition-all border ${
                  isSunday
                    ? 'glass-panel border-amber-400/40 bg-amber-400/5'
                    : 'glass-panel border-white/10'
                }`}
              >
                {/* Header of Day Card */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{isSunday ? '⭐' : '📖'}</span>
                    <div>
                      <h4 className="font-heading text-base text-white">
                        {day.dayName}, {day.date}
                      </h4>
                      <span className="text-[10px] text-white/50 font-mono">
                        {day.fullDayName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                      isSunday
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {isSunday ? 'Sunday Solemnity (3 Roles)' : 'Weekday Mass (2 Roles)'}
                  </span>
                </div>

                {/* Liturgical Roles */}
                <div className="space-y-2.5">
                  {day.assignments.map((assign) => {
                    const isFirstReading = assign.title.toLowerCase().includes('first');
                    const isPsalm = assign.title.toLowerCase().includes('psalm');
                    const isSecondReading = assign.title.toLowerCase().includes('second');

                    return (
                      <div
                        key={assign.id}
                        className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                          isFirstReading
                            ? 'bg-amber-400/10 border-amber-400/30'
                            : isPsalm
                            ? 'bg-indigo-500/10 border-indigo-400/30'
                            : isSecondReading
                            ? 'bg-purple-500/10 border-purple-400/30'
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-300" />
                            {assign.title.split('(')[0].trim()}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setSwapSource({
                                dayDate: day.date,
                                assignmentId: assign.id,
                                roleTitle: assign.title,
                                student: assign.student,
                              })
                            }
                            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowLeftRight className="w-2.5 h-2.5 text-amber-300" />
                            <span>Swap</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <span className="font-medium text-white text-sm truncate">
                            {assign.student?.name || 'Unassigned'}
                          </span>
                          <span className="text-[10px] text-white/50 font-mono">
                            {assign.student?.batch || 'Batch 2026'}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          Language: {assign.student?.language?.name || 'Not Specified'} • {assign.student?.gender}
                        </div>
                      </div>
                    );
                  })}

                  {day.assignments.length === 0 && (
                    <div className="py-6 text-center text-xs text-white/40 italic">
                      No lectors assigned for this date.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {schedule.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-white/40 glass-panel rounded-3xl">
              No liturgical assignments generated yet. Click &ldquo;Generate Liturgical Roster&rdquo; to build the schedule.
            </div>
          )}
        </div>
      </div>

      {/* SWAP MODAL */}
      {swapSource && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl">
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

      {/* SACRED CHAPEL POSTER MODAL */}
      <SacredChapelPosterModal
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
        schedule={schedule}
        effectivePeriod={effectivePeriod}
        onRosterUpdated={loadLiturgyData}
      />
    </div>
  );
};
