import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  X, 
  Download, 
  Printer, 
  ArrowLeftRight, 
  Save, 
  Crown, 
  Star, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export interface PosterGroupItem {
  id: string;
  name: string;
  capacity: number;
  gender?: string;
  genderRule?: string;
  students: {
    id: string;
    name: string;
    studentId?: string;
    batch?: string;
    language?: string;
    gender?: string;
  }[];
}

interface NoticeBoardPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  moduleType: 'dormitory' | 'refectory' | 'responsibilities' | 'duties';
  effectivePeriod?: string;
  groups: PosterGroupItem[];
  onAllocationsSaved?: () => void;
}

export const NoticeBoardPosterModal: React.FC<NoticeBoardPosterModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  moduleType,
  effectivePeriod = 'Term 1 - 2026 (Valid for Current Session)',
  groups: initialGroups,
  onAllocationsSaved,
}) => {
  const [groups, setGroups] = useState<PosterGroupItem[]>(initialGroups);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Swap modal state
  const [swapSource, setSwapSource] = useState<{
    groupId: string;
    groupName: string;
    studentIndex: number;
    student: any;
  } | null>(null);

  const [swapTarget, setSwapTarget] = useState<{
    groupId: string;
    studentIndex: number;
  } | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  // Sync when initialGroups changes
  React.useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  if (!isOpen) return null;

  // Handle Download as PNG image
  const handleDownloadImage = async () => {
    if (!posterRef.current) return;
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      // Temporarily exit edit mode visuals for crisp poster print
      const wasEdit = isEditMode;
      if (wasEdit) setIsEditMode(false);

      // Wait brief tick for render
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(posterRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#0c1017',
      });

      const link = document.createElement('a');
      const filename = `DBSM_${moduleType.toUpperCase()}_NOTICE_BOARD_POSTER.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();

      if (wasEdit) setIsEditMode(true);
    } catch (err: any) {
      console.error('Poster export error:', err);
      setErrorMessage('Failed to generate high-resolution image. Please try again or use the Print button.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Native Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Atomic zero-duplication student swap between any two groups and positions
  const executeSwap = () => {
    if (!swapSource || !swapTarget) return;

    const newGroups = groups.map((g) => ({
      ...g,
      students: [...g.students],
    }));

    const sourceGroup = newGroups.find((g) => g.id === swapSource.groupId);
    const targetGroup = newGroups.find((g) => g.id === swapTarget.groupId);

    if (!sourceGroup || !targetGroup) return;

    const studentA = sourceGroup.students[swapSource.studentIndex];
    const studentB = targetGroup.students[swapTarget.studentIndex];

    if (!studentA || !studentB) return;

    // Swap positions
    sourceGroup.students[swapSource.studentIndex] = studentB;
    targetGroup.students[swapTarget.studentIndex] = studentA;

    setGroups(newGroups);
    setSwapSource(null);
    setSwapTarget(null);
  };

  // Save modified roster back to server
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      if (moduleType === 'dormitory') {
        const payload = groups.map((g) => ({
          roomId: g.id,
          studentIds: g.students.map((s) => s.id),
        }));
        await api.saveDormitoryAllocations(payload);
      } else if (moduleType === 'refectory') {
        const payload = groups.map((g) => ({
          tableId: g.id,
          studentIds: g.students.map((s) => s.id),
        }));
        await api.saveRefectoryAllocations(payload);
      }

      setSaveSuccess(true);
      if (onAllocationsSaved) onAllocationsSaved();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Save matrix error:', err);
      setErrorMessage(err.message || 'Failed to save updated allocations to server');
    } finally {
      setIsSaving(false);
    }
  };

  const isLeaderDesignationApplicable = moduleType === 'dormitory' || moduleType === 'refectory';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl bg-neutral-950 border border-white/20 shadow-2xl overflow-hidden my-auto animate-fadeIn">
        
        {/* Top Floating Control Bar */}
        <div className="px-6 py-4 bg-neutral-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide flex items-center gap-2">
                <span>Official Notice Board Poster</span>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider bg-amber-400 text-black font-bold">
                    Edit & Swap Mode Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/50">
                Print or download high-resolution notice board rosters with leader designations.
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
              <span>{isEditMode ? 'Done Editing' : 'Edit / Swap Students'}</span>
            </Button>

            {/* Save to Server Button (when in edit mode) */}
            {isEditMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToDatabase}
                isLoading={isSaving}
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Allocations</span>
              </Button>
            )}

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
              <span>Print</span>
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

        {saveSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Allocations successfully saved and synchronized across all portals!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-300 hover:text-white">✕</button>
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
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-400 uppercase font-heading leading-tight drop-shadow-sm">
                    Don Bosco Skill Mission (DBSM)
                  </h1>
                  <p className="text-xs text-neutral-200 font-medium tracking-wide mt-1.5">
                    Empowering Youth Through Technical Skills & Values • DBSM Campus, Bengaluru, Karnataka
                  </p>
                  <div className="mt-3">
                    <span className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-400 text-neutral-950 shadow-sm">
                      Official Notice Board Poster
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Roster Title & Effective Period */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-neutral-300 pb-3.5 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 leading-tight">
                    {title}
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium mt-0.5">
                    {subtitle || 'Language-Balanced Dynamic Institutional Allocation'}
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold tracking-wide shrink-0">
                  Effective Period: <span className="font-mono">{effectivePeriod}</span>
                </div>
              </div>

              {/* 3. Grid of Cards (Compact A4 Responsive 3-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl bg-[#fefefe] border-2 border-amber-200/80 shadow-xs p-3.5 flex flex-col justify-between"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-center justify-between gap-1.5 border-b border-neutral-200 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            {isLeaderDesignationApplicable ? <Crown className="w-3 h-3 text-amber-600" /> : <ShieldCheck className="w-3 h-3 text-indigo-600" />}
                          </span>
                          <h4 className="font-bold text-xs text-neutral-900 uppercase tracking-tight truncate">
                            {group.name}
                          </h4>
                        </div>

                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold font-mono shrink-0">
                          {group.students.length} Allocated
                        </span>
                      </div>

                      {/* Student List (Only Assigned Students - No Empty Placeholders) */}
                      <div className="space-y-1.5">
                        {group.students.map((student, sIdx) => {
                          const isLeader = isLeaderDesignationApplicable && sIdx === 0;
                          const isAsstLeader = isLeaderDesignationApplicable && sIdx === 1;

                          return (
                            <div
                              key={student.id}
                              className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                isLeader
                                  ? 'bg-amber-50/95 border border-amber-300 font-semibold text-neutral-900 shadow-2xs'
                                  : isAsstLeader
                                  ? 'bg-indigo-50/90 border border-indigo-200 font-medium text-neutral-900'
                                  : 'bg-neutral-50 border border-neutral-200/70 text-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[10px] text-neutral-500 shrink-0 w-3.5">
                                  {sIdx + 1}.
                                </span>

                                <div className="truncate">
                                  <span className="text-neutral-900 font-medium truncate block text-xs">
                                    {student.name}
                                  </span>
                                  <div className="flex items-center gap-1 text-[9px] text-neutral-500 font-normal">
                                    {student.batch && <span>({student.batch})</span>}
                                    {student.language && <span>• {student.language}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                {/* Designation Badge */}
                                {isLeader && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 font-bold text-[8px] uppercase tracking-wider shadow-2xs">
                                    <Crown className="w-2.5 h-2.5" />
                                    Leader
                                  </span>
                                )}

                                {isAsstLeader && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-[8px] uppercase tracking-wider shadow-2xs">
                                    <Star className="w-2.5 h-2.5" />
                                    Asst. Leader
                                  </span>
                                )}

                                {/* Edit / Swap Button (Visible in Edit Mode) */}
                                {isEditMode && (
                                  <button
                                    onClick={() =>
                                      setSwapSource({
                                        groupId: group.id,
                                        groupName: group.name,
                                        studentIndex: sIdx,
                                        student,
                                      })
                                    }
                                    className="px-1.5 py-0.5 rounded bg-neutral-900 text-white hover:bg-neutral-800 text-[9px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ml-1"
                                  >
                                    <ArrowLeftRight className="w-2.5 h-2.5" />
                                    <span>Swap</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* If no students are allocated to this group */}
                        {group.students.length === 0 && (
                          <div className="py-3 text-center text-[11px] text-neutral-400 italic">
                            No students assigned
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM SECTION: 4. Official Signatures Footer */}
            <div className="pt-6 border-t-2 border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-xs text-neutral-700 mt-auto">
              <div className="w-48">
                <div className="border-t border-neutral-800 pt-1.5 font-bold text-neutral-900 uppercase text-[11px]">
                  Warden / In-Charge Officer
                </div>
                <div className="text-[9px] text-neutral-500">Don Bosco Skill Mission</div>
              </div>

              <div className="text-center font-mono text-[9px] text-neutral-400">
                <div>Generated via DBSM Smart Academy Generator</div>
                <div>Campus Notice Board Expiry: {effectivePeriod}</div>
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

        {/* INTERACTIVE SWAP MODAL DIALOG (Zero-Duplication) */}
        {swapSource && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                  <h4 className="font-semibold text-white text-base">
                    Swap Student Placement
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
                <span className="text-white/50 block mb-1">Source Student:</span>
                <div className="text-sm font-bold text-amber-300">
                  {swapSource.student.name}
                </div>
                <div className="text-white/60 mt-0.5">
                  Currently in: <span className="text-white font-medium">{swapSource.groupName}</span> (Slot #{swapSource.studentIndex + 1})
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold text-white/80 block mb-2">
                  Select Target Placement to Swap With:
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {groups.map((group) => (
                    <div key={group.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs font-bold text-amber-200/90 mb-1.5 uppercase">
                        {group.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.students.map((targetStudent, tIdx) => {
                          const isCurrentSource = group.id === swapSource.groupId && tIdx === swapSource.studentIndex;
                          const isSelectedTarget = swapTarget?.groupId === group.id && swapTarget?.studentIndex === tIdx;

                          if (isCurrentSource) return null;

                          return (
                            <button
                              key={targetStudent.id}
                              onClick={() =>
                                setSwapTarget({
                                  groupId: group.id,
                                  studentIndex: tIdx,
                                })
                              }
                              className={`px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                                isSelectedTarget
                                  ? 'bg-amber-400 text-black font-bold shadow-lg'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <span className="truncate">{tIdx + 1}. {targetStudent.name}</span>
                              {tIdx === 0 && isLeaderDesignationApplicable && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 shrink-0 ml-1">
                                  Leader
                                </span>
                              )}
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
                  <span>Confirm Swap & Switch</span>
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
