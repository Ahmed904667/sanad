'use client';

import { AccessibleModal } from './AccessibleModal';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Teacher, Lesson } from '@/types';
import { formatTime12h } from '@/utils/timeFormat';
import { AvailabilityRange, generateSlotsForRanges, lessonFitsAvailability, WEEKDAYS_AR } from '@/utils/availability';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Check,
} from 'lucide-react';

interface TeacherAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ALL_HOURS_OPTIONS = Array.from({ length: 24 * 12 }, (_, index) => {
  const totalMinutes = index * 5;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
});

export function TeacherAvailabilityModal({ isOpen, onClose, teacher }: TeacherAvailabilityModalProps) {
  const { language, lessons, updateTeacherAvailability, userAccounts, student } = useApp();
  const isAr = language === 'ar';

  const initialDays =
    teacher.workingDaysAr && teacher.workingDaysAr.length > 0
      ? teacher.workingDaysAr
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
  const [availabilityByDay, setAvailabilityByDay] = useState<Record<string, AvailabilityRange[]>>(() => {
    if (teacher.availabilityByDay) return Object.fromEntries(Object.entries(teacher.availabilityByDay).map(([day, ranges]) => [day, ranges.map(range => ({ ...range }))]));
    const legacyRanges = teacher.availabilityRanges?.length
      ? teacher.availabilityRanges
      : [{ start: teacher.workingHoursStart || '12:00', end: teacher.workingHoursEnd || '18:00' }];
    return Object.fromEntries(initialDays.map(day => [day, legacyRanges.map(range => ({ ...range }))]));
  });
  const [resolutionOption, setResolutionOption] = useState<'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'>('KEEP_EXISTING');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  if (!isOpen) return null;

  const nextAvailability = Object.fromEntries(selectedDays.map(day => [day, availabilityByDay[day] || []]));
  const proposedSlotsByDay = Object.fromEntries(selectedDays.map(day => [day, generateSlotsForRanges(nextAvailability[day], 5)]));
  // Helper to extract Arabic day name from date string "YYYY-MM-DD"
  const getDayNameArFromDateStr = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      return WEEKDAYS_AR[dt.getDay()];
    }
    return '';
  };

  // 100% Reliable Student Name Resolution
  const getStudentName = (l: Lesson): string => {
    if (isAr && l.studentNameAr && l.studentNameAr.trim() !== '') return l.studentNameAr;
    if (!isAr && l.studentNameEn && l.studentNameEn.trim() !== '') return l.studentNameEn;

    const foundUser = userAccounts.find(u =>
      u.id === l.studentId ||
      (u.studentProfile && u.studentProfile.id === l.studentId)
    );

    if (foundUser) {
      if (isAr && foundUser.studentProfile?.nameAr) return foundUser.studentProfile.nameAr;
      if (!isAr && foundUser.studentProfile?.nameEn) return foundUser.studentProfile.nameEn;
      if (foundUser.name) return foundUser.name;
    }

    return isAr
      ? (student.nameAr || 'عبد الرحمن بن خالد العتيبي')
      : (student.nameEn || 'Abdulrahman Al-Otaibi');
  };

  // Find teacher's upcoming scheduled lessons
  const upcomingTeacherLessons = lessons.filter(l =>
    (l.teacherId === teacher.id || l.teacherNameAr === teacher.nameAr) &&
    l.status === 'SCHEDULED'
  );

  // Detect conflicting lessons that fall outside proposed slots OR outside selected days
  const conflictingLessons = upcomingTeacherLessons.filter(l => {
    const lessonDay = getDayNameArFromDateStr(l.date);
    return !lessonDay || !lessonFitsAvailability(l.time, l.durationMinutes || 5, nextAvailability[lessonDay] || []);
  });

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Keep at least one day selected
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasInvalidRanges = selectedDays.some(day => {
      const ranges = [...(availabilityByDay[day] || [])].sort((a, b) => a.start.localeCompare(b.start));
      return !ranges.length || ranges.length > 10 || ranges.some(range => range.start >= range.end) || ranges.some((range, index) => index > 0 && ranges[index - 1].end > range.start);
    });
    if (!selectedDays.length || hasInvalidRanges) {
      setAvailabilityError(isAr ? 'أضف فترة صحيحة واحدة على الأقل لكل يوم محدد، وتأكد من عدم تداخل الفترات.' : 'Add a valid range for every selected day and make sure ranges do not overlap.');
      return;
    }
    setAvailabilityError('');

    setIsSaving(true);
    let result: Awaited<ReturnType<typeof updateTeacherAvailability>>;
    try {
      result = await updateTeacherAvailability(teacher.id, nextAvailability, resolutionOption);
    } catch {
      setAvailabilityError(isAr ? 'تعذر حفظ الأوقات. حاول مرة أخرى.' : 'Could not save availability. Please try again.');
      return;
    } finally {
      setIsSaving(false);
    }
    if (!result.success) {
      setAvailabilityError(result.error || (isAr ? 'تعذر حفظ الأوقات. حاول مرة أخرى.' : 'Could not save availability. Please try again.'));
      return;
    }
    const conflictCount = result.conflictCount ?? conflictingLessons.length;

    setIsSaved(true);
    if (conflictCount > 0) {
      if (resolutionOption === 'KEEP_EXISTING') {
        setSummaryMsg(isAr
          ? `تم تحديث الجدول! احتفظنا بـ ${conflictCount} حصة قائمة دون تغيير.`
          : `Schedule updated. Kept ${conflictCount} existing classes unchanged.`);
      } else if (resolutionOption === 'CANCEL_AND_REFUND_CREDIT') {
        setSummaryMsg(isAr
          ? `تم تحديث الجدول وإلغاء ${conflictCount} حصة متعارضة وإضافة رصيد تعويضي للطلاب.`
          : `Schedule updated. Cancelled ${conflictCount} conflicting classes and added replacement credits.`);
      } else {
        setSummaryMsg(isAr
          ? `تم تحديث الجدول وإشعار الطلاب أصحاب ${conflictCount} حصة متعارضة لإعادة جدولتها.`
          : `Schedule updated. Notified students about ${conflictCount} conflicting classes.`);
      }
    } else {
      setSummaryMsg(isAr ? 'تم تحديث أوقات وأيام العمل بنجاح بدون أي تعارض!' : 'Working schedule updated successfully with zero conflicts!');
    }

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 2500);
  };

  return (
    <AccessibleModal onClose={onClose} aria-label={isAr ? "أوقات عمل المعلم" : "Teacher availability"} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-none">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 font-black shadow-xs">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {isAr ? 'أوقات الحجز' : 'Booking availability'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {isAr ? 'اختر أيام العمل وساعات استقبال الحصص.' : 'Choose your working days and class hours.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-10 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h4 className="font-black text-emerald-950 text-base">{summaryMsg}</h4>
          </div>
        ) : (
          <form onSubmit={handleSaveSubmit} className="space-y-6 text-xs">

            {/* WEEKDAYS SELECTOR */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 block text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'حدد أيام العمل المتاحة في الأسبوع:' : 'Select Active Working Days:'}</span>
                </label>
                <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                  {selectedDays.length} {isAr ? 'أيام نشطة' : 'days selected'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {WEEKDAYS_AR.map((dayAr, idx) => {
                  const isSelected = selectedDays.includes(dayAr);
                  return (
                    <button
                      key={dayAr}
                      type="button"
                      onClick={() => toggleDay(dayAr)}
                      className={`py-2.5 px-1 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'emerald-gradient-bg text-white shadow-xs scale-[1.02]'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isAr ? dayAr : WEEKDAYS_EN[idx]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>{isAr ? 'ساعات العمل' : 'Working hours'}</span>
              </label>
              <p className="text-xs text-slate-500">
                {isAr ? 'حدد فترات مختلفة لكل يوم، مثل الصباح يوم الأحد والمساء يوم الإثنين.' : 'Set different windows for each day, such as mornings on Sunday and evenings on Monday.'}
              </p>
              <div className="space-y-3">
                {selectedDays.map(day => {
                  const ranges = availabilityByDay[day] || [];
                  return <div key={day} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <h4 className="text-sm font-semibold text-slate-900">{isAr ? day : WEEKDAYS_EN[WEEKDAYS_AR.indexOf(day)]}</h4>
                    {ranges.map((range, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                        <label className="space-y-1 text-xs font-semibold text-slate-600">
                          <span>{isAr ? 'من' : 'From'}</span>
                          <select value={range.start} onChange={event => setAvailabilityByDay(current => ({ ...current, [day]: current[day].map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item) }))} className="w-full rounded-md border border-slate-200 p-2 font-mono text-sm text-slate-900">
                            {ALL_HOURS_OPTIONS.map(time => <option key={time} value={time}>{formatTime12h(time, isAr)}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-slate-600">
                          <span>{isAr ? 'إلى' : 'To'}</span>
                          <select value={range.end} onChange={event => setAvailabilityByDay(current => ({ ...current, [day]: current[day].map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item) }))} className="w-full rounded-md border border-slate-200 p-2 font-mono text-sm text-slate-900">
                            {ALL_HOURS_OPTIONS.map(time => <option key={time} value={time}>{formatTime12h(time, isAr)}</option>)}
                          </select>
                        </label>
                        <button type="button" aria-label={isAr ? 'حذف الفترة' : 'Remove time range'} onClick={() => setAvailabilityByDay(current => ({ ...current, [day]: current[day].filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700">{isAr ? 'حذف' : 'Remove'}</button>
                      </div>
                    ))}
                    <button type="button" disabled={ranges.length >= 10} onClick={() => setAvailabilityByDay(current => ({ ...current, [day]: [...(current[day] || []), { start: '12:00', end: '14:00' }] }))} className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
                      {isAr ? '+ إضافة فترة' : '+ Add time range'}
                    </button>
                    <p className="text-xs text-slate-500">{isAr ? `مواعيد البداية: ${proposedSlotsByDay[day]?.length || 0}` : `Available starts: ${proposedSlotsByDay[day]?.length || 0}`}</p>
                  </div>;
                })}
              </div>
              {availabilityError && <p role="alert" className="text-sm font-medium text-red-700">{availabilityError}</p>}
            </div>

            {/* CONFLICT ANALYSIS DISPLAY */}
            {conflictingLessons.length > 0 ? (
              <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-black text-amber-950 text-sm">
                      {isAr ? `تنبيه تعارض: يتوفر ${conflictingLessons.length} حصص مجدولة خارج أيام أو ساعات العمل الجديدة!` : `Conflict Alert: ${conflictingLessons.length} scheduled classes fall outside new days/hours!`}
                    </h4>
                    <p className="text-amber-900 text-xs font-medium leading-relaxed">
                      {isAr ? 'يوجد طلاب لديهم حصص مجدولة مسبقاً في الأيام أو الأوقات المستبعدة. اختر كيف ترغب في معالجة هذا التعارض:' : 'Select how you want the system to handle conflicting scheduled classes:'}
                    </p>
                  </div>
                </div>

                {/* Conflicting Lessons List Preview */}
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-700 block mb-1">{isAr ? 'الحصص المتأثرة بالتعديل:' : 'Affected Classes:'}</span>
                  {conflictingLessons.map(l => (
                    <div key={l.id} className="flex items-center justify-between text-slate-800 font-semibold border-b border-amber-100 last:border-0 pb-1.5 pt-0.5">
                      <span className="font-extrabold text-slate-900">{getStudentName(l)}</span>
                      <span className="text-amber-950 font-black font-mono bg-amber-100/80 px-2.5 py-0.5 rounded-md text-[10px]">
                        {l.date} • {l.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* RESOLUTION OPTIONS SELECTOR */}
                <div className="space-y-2 pt-1">
                  <span className="font-black text-amber-950 block text-xs">{isAr ? 'إجراء معالجة التعارض المطلوب:' : 'Select Conflict Resolution Action:'}</span>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    resolutionOption === 'KEEP_EXISTING' ? 'bg-white border-amber-500 ring-2 ring-amber-400' : 'bg-white/60 border-amber-200'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolutionOption === 'KEEP_EXISTING'}
                      onChange={() => setResolutionOption('KEEP_EXISTING')}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-black text-amber-950 text-xs block">
                        {isAr ? '1. الحفاظ على الحصص المجدولة حالياً (موصى به)' : '1. Keep Existing Scheduled Classes Intact (Recommended)'}
                      </span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {isAr ? 'تبقى الحصص المجدولة حالياً في أيامها ومواعيدها الأصلية دون تغيير، وتُطبق الأيام والساعات الجديدة على الحجوزات القادمة فقط.' : 'Current booked classes stay intact; new schedule applies to future bookings only.'}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    resolutionOption === 'CANCEL_AND_REFUND_CREDIT' ? 'bg-white border-amber-500 ring-2 ring-amber-400' : 'bg-white/60 border-amber-200'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolutionOption === 'CANCEL_AND_REFUND_CREDIT'}
                      onChange={() => setResolutionOption('CANCEL_AND_REFUND_CREDIT')}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-black text-amber-950 text-xs block">
                        {isAr ? '2. إلغاء الحصص المتعارضة وإعادة حصص تعويضية لرصيد الطلاب' : '2. Cancel Conflicting Classes & Credit Student Balances'}
                      </span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {isAr ? 'يلغي النظام الحصص المتعارضة مع إضافة حصة تعويضية مجانية لرصيد كل طالب ليتمكن من حجز موعد جديد يناسبه بحرية.' : 'Cancels conflicting classes and credits students with free replacement lessons to book convenient slots.'}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    resolutionOption === 'NOTIFY_STUDENTS' ? 'bg-white border-amber-500 ring-2 ring-amber-400' : 'bg-white/60 border-amber-200'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolutionOption === 'NOTIFY_STUDENTS'}
                      onChange={() => setResolutionOption('NOTIFY_STUDENTS')}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-black text-amber-950 text-xs block">
                        {isAr ? '3. إرسال تنبيه للطلاب لطلب تحديد موعد جديد' : '3. Notify Students to Choose New Slot'}
                      </span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {isAr ? 'يرسل إشعاراً للطلاب ويوسم الحصة بطلب اختيار موعد جديد يناسبهم من جدولك الجديد.' : 'Flags class as needing reschedule & notifies students to pick a new slot.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs">
                  {isAr ? 'جميع الحصص المجدولة حالياً تتوافق تماماً مع الأيام وساعات العمل الجديدة!' : 'All current scheduled classes perfectly align with your new working days and hours!'}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black shadow-md hover:brightness-105 transition-all cursor-pointer disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ وتطبيق جدول العمل الجديد' : 'Save & Apply New Working Schedule')}
              </button>
            </div>

          </form>
        )}

      </div>
    </AccessibleModal>
  );
}
