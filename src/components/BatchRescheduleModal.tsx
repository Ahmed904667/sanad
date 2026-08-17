'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Lesson } from '@/types';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Check,
  ChevronRight,
  ChevronLeft,
  Wand2,
  AlertCircle
} from 'lucide-react';

interface BatchRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Helper to get Arabic weekday name from a date string (YYYY-MM-DD)
const getDayNameArFromDate = (dateStr: string): string => {
  if (!dateStr) return 'الإثنين';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return WEEKDAYS_AR[dt.getDay()] || 'الإثنين';
  }
  return 'الإثنين';
};

interface AffectedDayGroup {
  originalDayAr: string;
  lessons: Lesson[];
}

export function BatchRescheduleModal({ isOpen, onClose }: BatchRescheduleModalProps) {
  const { 
    language, 
    lessons, 
    rescheduleLesson, 
    student, 
    currentUser, 
    teachers,
    plans 
  } = useApp();

  const isAr = language === 'ar';
  const currentStudentId = currentUser?.id || student.id;

  const assignedTeacher = useMemo(() => {
    return teachers.find(t => t.id === student.assignedTeacherId) || teachers[0];
  }, [teachers, student]);

  const teacherWorkingDays = useMemo(() => {
    return assignedTeacher.workingDaysAr && assignedTeacher.workingDaysAr.length > 0
      ? assignedTeacher.workingDaysAr
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  }, [assignedTeacher]);

  const teacherSlots = useMemo(() => {
    if (assignedTeacher.availableSlots && assignedTeacher.availableSlots.length > 0) {
      return assignedTeacher.availableSlots;
    }
    const s = parseInt((assignedTeacher.workingHoursStart || '12:00').split(':')[0], 10);
    const e = parseInt((assignedTeacher.workingHoursEnd || '18:00').split(':')[0], 10);
    const slots: string[] = [];
    for (let h = s; h < e; h++) {
      const pad = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${pad}:00`);
      slots.push(`${pad}:30`);
    }
    return slots.length > 0 ? slots : ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
  }, [assignedTeacher]);

  const teacherBookedSlots = useMemo(() => {
    const set = new Set<string>();
    if (assignedTeacher.bookedTimeSlots) {
      assignedTeacher.bookedTimeSlots.forEach(s => set.add(s));
    }
    lessons.forEach(l => {
      if (l.teacherId === assignedTeacher.id && l.status === 'SCHEDULED' && l.studentId !== currentStudentId) {
        set.add(`${l.date}_${l.time}`);
      }
    });
    return set;
  }, [assignedTeacher, lessons, currentStudentId]);

  const activePlanCount = useMemo(() => {
    const plan = plans.find(p => p.id === student.activePlanId) || plans[1];
    return plan?.lessonsPerMonth || 8;
  }, [plans, student]);

  // Filter STRICTLY for cancelled regular lessons belonging to the logged in student in current active cycle
  const affectedLessons = useMemo(() => {
    const allCancelled = lessons.filter(l => 
      (l.studentId === currentStudentId || 
       (currentUser?.email && l.studentId === currentUser.email.toLowerCase())) &&
      l.status === 'CANCELLED' &&
      !l.isOrientationSession
    );
    return allCancelled.slice(-activePlanCount);
  }, [lessons, currentStudentId, currentUser, activePlanCount]);

  // Group affected lessons BY ORIGINAL CANCELLED DAY OF WEEK
  const affectedDayGroups: AffectedDayGroup[] = useMemo(() => {
    const groupMap: Record<string, Lesson[]> = {};
    affectedLessons.forEach(l => {
      const dayName = getDayNameArFromDate(l.date);
      if (!groupMap[dayName]) {
        groupMap[dayName] = [];
      }
      groupMap[dayName].push(l);
    });

    return Object.keys(groupMap).map(dayName => ({
      originalDayAr: dayName,
      lessons: groupMap[dayName]
    }));
  }, [affectedLessons]);

  // Active step index for focused affected day group view
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Replacement Day & Time selections per affected original day name
  // { 'الإثنين': { replacementDayAr: 'الثلاثاء', replacementTime: '14:00' } }
  const [daySelections, setDaySelections] = useState<Record<string, { replacementDayAr: string; replacementTime: string }>>(() => {
    const initialMap: Record<string, { replacementDayAr: string; replacementTime: string }> = {};
    affectedDayGroups.forEach((group, idx) => {
      const targetRepDay = teacherWorkingDays[idx % teacherWorkingDays.length] || 'الإثنين';
      const targetRepTime = teacherSlots[idx % teacherSlots.length] || '12:00';
      initialMap[group.originalDayAr] = {
        replacementDayAr: targetRepDay,
        replacementTime: targetRepTime
      };
    });
    return initialMap;
  });

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentGroup = affectedDayGroups[activeGroupIndex] || affectedDayGroups[0];

  const handleUpdateGroupSelection = (
    targetOriginalDayAr: string, 
    field: 'replacementDayAr' | 'replacementTime', 
    value: string
  ) => {
    setDaySelections(prev => {
      const updated = { ...prev };
      const currentSel = updated[targetOriginalDayAr] || {
        replacementDayAr: teacherWorkingDays[0],
        replacementTime: teacherSlots[0]
      };

      const newDay = field === 'replacementDayAr' ? value : currentSel.replacementDayAr;
      const newTime = field === 'replacementTime' ? value : currentSel.replacementTime;

      updated[targetOriginalDayAr] = {
        replacementDayAr: newDay,
        replacementTime: newTime
      };

      // Conflict prevention: If another affected day group has the exact same replacement day AND replacement time,
      // automatically assign that other group to the next available free time slot on that same day!
      affectedDayGroups.forEach(g => {
        if (g.originalDayAr !== targetOriginalDayAr) {
          const otherSel = updated[g.originalDayAr];
          if (otherSel && otherSel.replacementDayAr === newDay && otherSel.replacementTime === newTime) {
            const takenTimesOnNewDay = new Set(
              Object.entries(updated)
                .filter(([dayKey, sel]) => dayKey !== g.originalDayAr && sel.replacementDayAr === newDay)
                .map(([_, sel]) => sel.replacementTime)
            );
            const freeSlot = teacherSlots.find(slot => !takenTimesOnNewDay.has(slot)) || teacherSlots[0];
            updated[g.originalDayAr] = {
              replacementDayAr: newDay,
              replacementTime: freeSlot
            };
          }
        }
      });

      return updated;
    });
  };

  const handleAutoAssignAllGroups = () => {
    const newMap: Record<string, { replacementDayAr: string; replacementTime: string }> = {};
    const takenSlotsPerDay: Record<string, Set<string>> = {};

    affectedDayGroups.forEach((group, idx) => {
      const repDay = teacherWorkingDays[idx % teacherWorkingDays.length] || 'الإثنين';
      if (!takenSlotsPerDay[repDay]) {
        takenSlotsPerDay[repDay] = new Set();
      }

      const freeSlot = teacherSlots.find(slot => !takenSlotsPerDay[repDay].has(slot)) || teacherSlots[0];
      takenSlotsPerDay[repDay].add(freeSlot);

      newMap[group.originalDayAr] = {
        replacementDayAr: repDay,
        replacementTime: freeSlot
      };
    });
    setDaySelections(newMap);
  };

  // Helper to generate next date for a weekday
  const getNextDateForWeekday = (dayNameAr: string, offsetWeeks: number = 0): string => {
    const targetDayIndex = WEEKDAYS_AR.indexOf(dayNameAr);
    let dt = new Date();
    dt.setDate(dt.getDate() + 1);
    while (dt.getDay() !== targetDayIndex) {
      dt.setDate(dt.getDate() + 1);
    }
    if (offsetWeeks > 0) {
      dt.setDate(dt.getDate() + offsetWeeks * 7);
    }
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    affectedDayGroups.forEach(group => {
      const sel = daySelections[group.originalDayAr] || {
        replacementDayAr: teacherWorkingDays[0],
        replacementTime: teacherSlots[0]
      };

      // Reschedule each lesson in this day group to the replacement day & time across weeks
      group.lessons.forEach((l, lessonIdx) => {
        const targetDate = getNextDateForWeekday(sel.replacementDayAr, lessonIdx);
        rescheduleLesson(l.id, targetDate, sel.replacementTime);
      });
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {isAr ? 'إعادة جدولة حسب الأيام المتأثرة' : 'Day-Based Reschedule'}
                </span>
                <span className="text-emerald-200 text-xs font-bold">
                  {isAr ? `تعديل (${affectedDayGroups.length}) أيام متأثرة` : `${affectedDayGroups.length} affected days`}
                </span>
              </div>
              <h3 className="text-lg font-black mt-1">
                {isAr ? 'إعادة جدولة الأيام المتأثرة' : 'Reschedule Affected Days'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-emerald-950">
                {isAr ? 'تمت إعادة جدولة الأيام المتأثرة بنجاح!' : 'Affected Days Rescheduled Successfully!'}
              </h4>
              <p className="text-xs text-slate-500 font-bold">
                {isAr ? 'تم نقل جميع حصص الأيام الملغاة إلى الأيام والتوقيتات الجديدة بنجاح.' : 'All cancelled day slots updated.'}
              </p>
            </div>
          ) : (
            <>
              {affectedDayGroups.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-slate-800 text-sm">
                    {isAr ? 'جميع الحصص مجدولة ومثبتة بنجاح! لا توجد أيام متأثرة.' : 'All days are scheduled!'}
                  </h4>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* QUICK SMART AUTO-DISTRIBUTE BUTTON */}
                  <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-bold text-amber-950">
                        {isAr ? 'تخصيص تلقائي للأيام المتأثرة بنقرة واحدة؟' : '1-click auto assign for affected days?'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoAssignAllGroups}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'توزيع الأيام تلقائياً' : 'Auto-Assign Days'}</span>
                    </button>
                  </div>

                  {/* AFFECTED DAY TABS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">
                        {isAr ? `الأيام المتأثرة التي تتطلب اختيار موعد بديل (${activeGroupIndex + 1} من ${affectedDayGroups.length}):` : `Affected Day ${activeGroupIndex + 1} of ${affectedDayGroups.length}:`}
                      </span>
                      <span className="text-amber-900 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full font-black text-[11px]">
                        {isAr ? `${affectedDayGroups.length} أيام متأثرة` : `${affectedDayGroups.length} affected days`}
                      </span>
                    </div>

                    {/* Day Group Selector Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {affectedDayGroups.map((group, idx) => {
                        const isCurrent = idx === activeGroupIndex;
                        const sel = daySelections[group.originalDayAr];
                        const isSet = Boolean(sel && sel.replacementDayAr && sel.replacementTime);

                        return (
                          <button
                            key={group.originalDayAr}
                            type="button"
                            onClick={() => setActiveGroupIndex(idx)}
                            className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm scale-[1.02]'
                                : isSet
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isAr ? `يوم ${group.originalDayAr} (${group.lessons.length} حصص)` : `${group.originalDayAr} (${group.lessons.length} classes)`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* FOCUSED AFFECTED DAY CARD */}
                  {currentGroup && (
                    <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200 space-y-5 animate-in fade-in">
                      
                      {/* Affected Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-950 flex items-center justify-center font-black shrink-0">
                            <AlertCircle className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'اليوم المتأثر بتعديل المعلم:' : 'Affected Original Day:'}</span>
                            <h4 className="font-black text-sm text-slate-900">
                              {isAr ? `يوم ${currentGroup.originalDayAr} (${currentGroup.lessons.length} حصص ملغاة)` : `Day ${currentGroup.originalDayAr} (${currentGroup.lessons.length} cancelled classes)`}
                            </h4>
                          </div>
                        </div>

                        {daySelections[currentGroup.originalDayAr] && (
                          <div className="bg-emerald-100 text-emerald-900 font-mono text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-300">
                            {daySelections[currentGroup.originalDayAr].replacementDayAr} • {daySelections[currentGroup.originalDayAr].replacementTime} {isAr ? 'م' : 'PM'}
                          </div>
                        )}
                      </div>

                      {/* REPLACEMENT DAY PICKER */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          {isAr ? `1. اختر اليوم البديل ليوم (${currentGroup.originalDayAr}):` : `1. Select Replacement Day for (${currentGroup.originalDayAr}):`}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {teacherWorkingDays.map(day => {
                            const curSel = daySelections[currentGroup.originalDayAr];
                            const isSelected = curSel?.replacementDayAr === day;

                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleUpdateGroupSelection(currentGroup.originalDayAr, 'replacementDayAr', day)}
                                className={`py-2.5 px-3 rounded-2xl border text-center text-xs font-black transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs scale-[1.02]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 30-MIN TIME SLOTS FOR REPLACEMENT DAY */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>{isAr ? '2. حدد التوقيت البديل (30 دقيقة):' : '2. Select Replacement Time Slot:'}</span>
                          <span className="text-[11px] text-slate-400 font-semibold">{isAr ? 'ساعات دوام المعلم' : 'Scholar Hours'}</span>
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {teacherSlots.map(slot => {
                            const curSel = daySelections[currentGroup.originalDayAr];
                            const currentRepDay = curSel?.replacementDayAr || teacherWorkingDays[0];
                            const isSelected = curSel?.replacementTime === slot;
                            const repDate = getNextDateForWeekday(currentRepDay);
                            const isTeacherBooked = teacherBookedSlots.has(`${repDate}_${slot}`) || teacherBookedSlots.has(slot);

                            // Check if this slot on the currentRepDay is taken by any OTHER affected day group
                            const takenByOtherGroup = affectedDayGroups.find(g => {
                              if (g.originalDayAr === currentGroup.originalDayAr) return false;
                              const otherSel = daySelections[g.originalDayAr];
                              return otherSel && otherSel.replacementDayAr === currentRepDay && otherSel.replacementTime === slot;
                            });

                            const isTakenByOther = Boolean(takenByOtherGroup);
                            const isDisabled = isTakenByOther || isTeacherBooked;

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => !isDisabled && handleUpdateGroupSelection(currentGroup.originalDayAr, 'replacementTime', slot)}
                                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs scale-[1.02] cursor-pointer'
                                    : isDisabled
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                }`}
                              >
                                <span>{slot} {isAr ? 'م' : 'PM'}</span>
                                {isTeacherBooked ? (
                                  <span className="text-[9px] font-black text-rose-800 bg-rose-100/80 px-1.5 py-0.2 rounded">
                                    {isAr ? 'محجوز مع معلمك' : 'Booked'}
                                  </span>
                                ) : isTakenByOther ? (
                                  <span className="text-[9px] font-black text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
                                    {isAr ? 'محجوز ليوم آخر' : 'Taken'}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* STEP NAVIGATION BUTTONS */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
                        <button
                          type="button"
                          disabled={activeGroupIndex === 0}
                          onClick={() => setActiveGroupIndex(prev => Math.max(0, prev - 1))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            activeGroupIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200/60 cursor-pointer'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>{isAr ? 'اليوم المتأثر السابق' : 'Previous Affected Day'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={activeGroupIndex === affectedDayGroups.length - 1}
                          onClick={() => setActiveGroupIndex(prev => Math.min(affectedDayGroups.length - 1, prev + 1))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            activeGroupIndex === affectedDayGroups.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-800 font-black hover:bg-emerald-100/60 cursor-pointer'
                          }`}
                        >
                          <span>{isAr ? 'اليوم المتأثر التالي' : 'Next Affected Day'}</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        {!isSuccess && affectedDayGroups.length > 0 && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? `إجمالي الأيام المتأثرة: ${affectedDayGroups.length} أيام (${affectedLessons.length} حصص)` : `Total Affected: ${affectedDayGroups.length} days (${affectedLessons.length} classes)`}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isAr ? `تثبيت مواعيد الأيام الجديدة (${affectedLessons.length} حصص)` : `Confirm All Days (${affectedLessons.length})`}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
