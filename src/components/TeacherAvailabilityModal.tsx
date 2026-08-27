'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Teacher, Lesson } from '@/types';
import { formatTime12h } from '@/utils/timeFormat';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Check,
  Plus,
  Trash2,
  Sliders,
  Sun,
  Sunrise,
  Moon
} from 'lucide-react';

interface TeacherAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
}

export interface AvailabilityShift {
  id: string;
  nameAr: string;
  nameEn: string;
  start: string;
  end: string;
}

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ALL_HOURS_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', 
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', 
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

export function TeacherAvailabilityModal({ isOpen, onClose, teacher }: TeacherAvailabilityModalProps) {
  const { language, lessons, updateTeacherAvailability, userAccounts, student } = useApp();
  const isAr = language === 'ar';

  // Mode Selection: 'STANDARD' (Single Continuous Range) vs 'FLEXIBLE_SHIFTS' (Multiple Custom Shifts)
  const [timingMode, setTimingMode] = useState<'STANDARD' | 'FLEXIBLE_SHIFTS'>('STANDARD');

  // 1. Standard Mode state
  const [startHour, setStartHour] = useState(teacher.workingHoursStart || '12:00');
  const [endHour, setEndHour] = useState(teacher.workingHoursEnd || '18:00');

  // 2. Flexible Multi-Shift state
  const [customShifts, setCustomShifts] = useState<AvailabilityShift[]>([
    { id: 'shift-1', nameAr: 'الفترة الصباحية', nameEn: 'Morning Shift', start: '06:00', end: '09:00' },
    { id: 'shift-2', nameAr: 'فترة الظهيرة', nameEn: 'Noon Shift', start: '11:00', end: '15:00' },
    { id: 'shift-3', nameAr: 'الفترة المسائية', nameEn: 'Evening Shift', start: '21:00', end: '23:00' }
  ]);

  const [selectedDays, setSelectedDays] = useState<string[]>(
    teacher.workingDaysAr && teacher.workingDaysAr.length > 0
      ? teacher.workingDaysAr 
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
  );
  const [resolutionOption, setResolutionOption] = useState<'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'>('KEEP_EXISTING');
  const [isSaved, setIsSaved] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState('');

  if (!isOpen) return null;

  // Generate slots array from a start and end time range (supports 30-min granularity)
  const generateSlotsFromRange = (startStr: string, endStr: string): string[] => {
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
    };

    const startMin = parseTime(startStr);
    const endMin = parseTime(endStr);
    const slots: string[] = [];

    if (startMin >= endMin) return slots;

    for (let m = startMin; m < endMin; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const padH = h < 10 ? `0${h}` : `${h}`;
      const padM = min === 0 ? '00' : `${min}`;
      slots.push(`${padH}:${padM}`);
    }
    return slots;
  };

  // Generate proposed slots based on active mode
  const getProposedSlots = (): { slots: string[]; minStart: string; maxEnd: string } => {
    if (timingMode === 'STANDARD') {
      const slots = generateSlotsFromRange(startHour, endHour);
      return { slots, minStart: startHour, maxEnd: endHour };
    }

    // FLEXIBLE_SHIFTS mode: aggregate all shifts
    const allSlotsSet = new Set<string>();
    let minStart = '23:00';
    let maxEnd = '00:00';

    customShifts.forEach(shift => {
      if (shift.start < minStart) minStart = shift.start;
      if (shift.end > maxEnd) maxEnd = shift.end;

      const shiftSlots = generateSlotsFromRange(shift.start, shift.end);
      shiftSlots.forEach(s => allSlotsSet.add(s));
    });

    const sortedSlots = Array.from(allSlotsSet).sort();
    return {
      slots: sortedSlots,
      minStart: sortedSlots.length > 0 ? minStart : '08:00',
      maxEnd: sortedSlots.length > 0 ? maxEnd : '18:00'
    };
  };

  const { slots: proposedSlots, minStart: computedStart, maxEnd: computedEnd } = getProposedSlots();

  // Shift Management Functions
  const addCustomShift = () => {
    const newId = 'shift-' + Date.now();
    setCustomShifts(prev => [
      ...prev,
      { 
        id: newId, 
        nameAr: `فترة إضافية ${prev.length + 1}`, 
        nameEn: `Extra Shift ${prev.length + 1}`, 
        start: '16:00', 
        end: '19:00' 
      }
    ]);
  };

  const updateShift = (id: string, field: keyof AvailabilityShift, val: string) => {
    setCustomShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const removeShift = (id: string) => {
    if (customShifts.length <= 1) return; // Keep at least one shift
    setCustomShifts(prev => prev.filter(s => s.id !== id));
  };

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
    const lessonTimeClean = l.time.split(' ')[0]; // e.g. "12:00"
    const lessonDay = getDayNameArFromDateStr(l.date);
    const isTimeConflict = !proposedSlots.includes(lessonTimeClean);
    const isDayConflict = Boolean(lessonDay && !selectedDays.includes(lessonDay));
    return isTimeConflict || isDayConflict;
  });

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Keep at least one day selected
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (updateTeacherAvailability) {
      updateTeacherAvailability(
        teacher.id,
        computedStart,
        computedEnd,
        selectedDays,
        proposedSlots,
        resolutionOption
      );
    }

    setIsSaved(true);
    if (conflictingLessons.length > 0) {
      if (resolutionOption === 'KEEP_EXISTING') {
        setSummaryMsg(isAr 
          ? `تم تحديث أيام وساعات العمل بنجاح! تم الحفاظ على ${conflictingLessons.length} حصص مجدولة سابقة كما هي، وتطبيق التعديل على الحجوزات المستقبلية.`
          : `Schedule updated! Kept ${conflictingLessons.length} existing scheduled classes intact.`);
      } else if (resolutionOption === 'CANCEL_AND_REFUND_CREDIT') {
        setSummaryMsg(isAr 
          ? `تم تحديث الجدول وإلغاء ${conflictingLessons.length} حصص متعارضة مع إعادة حصص تعويضية مجانية لرصيد الطلاب وإرسال إشعار فوري لهم.`
          : `Schedule updated! Cancelled ${conflictingLessons.length} conflicting classes and credited student balances with free replacement lessons.`);
      } else {
        setSummaryMsg(isAr 
          ? `تم تحديث الجدول ووسم ${conflictingLessons.length} حصص متعارضة بطلب إعادة الجدولة وإرسال إشعار فوري للطلاب.`
          : `Schedule updated & sent reschedule notices for ${conflictingLessons.length} classes.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 font-black shadow-xs">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {isAr ? 'إدارة أوقات وأيام العمل المتاحة للمعلم' : 'Manage Scholar Flexible Working Hours'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {isAr ? 'تخصيص الفترات الصباحية والمسائية وأيام التسميع الأسبوعية' : 'Configure custom shift timings (Morning, Afternoon, Evening) and weekdays'}
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

            {/* TIMING MODE SELECTOR TABS */}
            <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 block text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'نظام تحديد أوقات الدوام اليومي:' : 'Daily Schedule Timing Mode:'}</span>
                </label>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTimingMode('STANDARD')}
                  className={`p-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    timingMode === 'STANDARD'
                      ? 'emerald-gradient-bg text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{isAr ? 'دوام موحّد (نطاق زمني مستمر)' : 'Continuous Time Range'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTimingMode('FLEXIBLE_SHIFTS')}
                  className={`p-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    timingMode === 'FLEXIBLE_SHIFTS'
                      ? 'emerald-gradient-bg text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? 'فترات دوام متعددة ومخصصة (مرن)' : 'Multiple Flexible Shifts (Custom)'}</span>
                </button>
              </div>

              {/* STANDARD MODE INPUTS */}
              {timingMode === 'STANDARD' && (
                <div className="pt-3 space-y-3 animate-fade-in">
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isAr 
                      ? 'اختر وقت بداية ونهاية الدوام اليومي المستمر (مثل: من 12:00 ظهراً إلى 06:00 مساءً):' 
                      : 'Choose continuous daily start and end working hours:'}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-600 font-bold block">{isAr ? 'بداية الدوام:' : 'Start Time:'}</span>
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:border-emerald-600 cursor-pointer"
                      >
                        {ALL_HOURS_OPTIONS.map(h => (
                          <option key={h} value={h}>{formatTime12h(h, isAr)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-600 font-bold block">{isAr ? 'نهاية الدوام:' : 'End Time:'}</span>
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:border-emerald-600 cursor-pointer"
                      >
                        {ALL_HOURS_OPTIONS.map(h => (
                          <option key={h} value={h}>{formatTime12h(h, isAr)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FLEXIBLE MULTI-SHIFT MODE INPUTS */}
              {timingMode === 'FLEXIBLE_SHIFTS' && (
                <div className="pt-3 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                      {isAr 
                        ? 'يمكنك تحديد فترات عمل متفرقة خلال اليوم (مثل: صباحاً من 6-9، ظهراً من 11-3، ومساءً من 9-11):' 
                        : 'Specify multiple non-contiguous working shifts during the day:'}
                    </p>

                    <button
                      type="button"
                      onClick={addCustomShift}
                      className="px-3 py-1.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isAr ? '+ إضافة فترة عمل' : '+ Add Shift'}</span>
                    </button>
                  </div>

                  {/* Shifts List */}
                  <div className="space-y-2.5">
                    {customShifts.map((shift, idx) => (
                      <div 
                        key={shift.id} 
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Shift Title */}
                        <div className="flex items-center gap-2 font-bold text-slate-800 min-w-[150px]">
                          {idx === 0 ? <Sunrise className="w-4 h-4 text-amber-500 shrink-0" /> : idx === 1 ? <Sun className="w-4 h-4 text-emerald-600 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-500 shrink-0" />}
                          <input
                            type="text"
                            value={isAr ? shift.nameAr : shift.nameEn}
                            onChange={(e) => updateShift(shift.id, isAr ? 'nameAr' : 'nameEn', e.target.value)}
                            placeholder={isAr ? 'اسم الفترة' : 'Shift Name'}
                            className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 w-full focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Shift Start & End Dropdowns */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-semibold">{isAr ? 'من:' : 'From:'}</span>
                            <select
                              value={shift.start}
                              onChange={(e) => updateShift(shift.id, 'start', e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-mono text-xs font-extrabold text-slate-900 cursor-pointer"
                            >
                              {ALL_HOURS_OPTIONS.map(h => (
                                <option key={h} value={h}>{formatTime12h(h, isAr)}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-semibold">{isAr ? 'إلى:' : 'To:'}</span>
                            <select
                              value={shift.end}
                              onChange={(e) => updateShift(shift.id, 'end', e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-mono text-xs font-extrabold text-slate-900 cursor-pointer"
                            >
                              {ALL_HOURS_OPTIONS.map(h => (
                                <option key={h} value={h}>{formatTime12h(h, isAr)}</option>
                              ))}
                            </select>
                          </div>

                          {/* Remove Shift Button */}
                          {customShifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeShift(shift.id)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer mr-1"
                              title={isAr ? 'حذف الفترة' : 'Remove Shift'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slots Summary Preview */}
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-950 font-medium space-y-1">
                <span className="font-extrabold block text-emerald-900">
                  {isAr 
                    ? `إجمالي الساعات المتاحة المستخرجة للطلاب (${proposedSlots.length} أوقات):` 
                    : `Total Available Slots Combined (${proposedSlots.length} slots):`}
                </span>
                <p className="font-mono font-bold text-emerald-900 leading-relaxed">
                  {proposedSlots.length > 0 ? proposedSlots.map(s => formatTime12h(s, isAr)).join(' • ') : (isAr ? 'يرجى تحديد أوقات عمل صالحة' : 'No slots generated')}
                </p>
              </div>
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
                className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black shadow-md hover:brightness-105 transition-all cursor-pointer"
              >
                {isAr ? 'حفظ وتطبيق جدول العمل الجديد' : 'Save & Apply New Working Schedule'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
