'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lesson, Role } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarBadge } from './AvatarBadge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  Filter,
  List,
  Grid,
  X,
  RotateCcw,
  CalendarCheck,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  CalendarDays,
  Sun,
  Plus
} from 'lucide-react';

interface ClassCalendarProps {
  lessons: Lesson[];
  userRole: Role;
  onMarkComplete?: (lessonId: string) => void;
  onUpdateMeetUrl?: (lessonId: string, newUrl: string) => void;
}

export const ClassCalendar: React.FC<ClassCalendarProps> = ({
  lessons,
  userRole
}) => {
  const router = useRouter();
  const { language, student, teachers } = useApp();
  const isAr = language === 'ar';
  const assignedTeacher = useMemo(() => {
    return teachers.find(t => t.id === student?.assignedTeacherId) || teachers[0];
  }, [teachers, student]);

  // View modes: 'DAY' (Teams style), 'CALENDAR' (Month grid), 'LIST'
  const [viewMode, setViewMode] = useState<'DAY' | 'CALENDAR' | 'LIST'>(userRole === 'TEACHER' ? 'DAY' : 'CALENDAR');
  const [filterType, setFilterType] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);

  // Day View specific date selection
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  // Month navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Day navigation for Teams-style view
  const prevDay = () => {
    const d = new Date(selectedDayDate);
    d.setDate(d.getDate() - 1);
    setSelectedDayDate(d);
  };

  const nextDay = () => {
    const d = new Date(selectedDayDate);
    d.setDate(d.getDate() + 1);
    setSelectedDayDate(d);
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeekAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysOfWeekArShort = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const daysOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter lessons based on active filter
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (filterType === 'UPCOMING') return l.status === 'SCHEDULED';
      if (filterType === 'COMPLETED') return l.status === 'COMPLETED';
      return true;
    });
  }, [lessons, filterType]);

  // Map lessons by date
  const lessonsByDate = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    filteredLessons.forEach(l => {
      if (!map[l.date]) {
        map[l.date] = [];
      }
      map[l.date].push(l);
    });
    return map;
  }, [filteredLessons]);

  const selectedDayLessons = selectedDateModal ? (lessonsByDate[selectedDateModal] || []) : [];

  const handleDayClick = (dateString: string, hasLessons: boolean) => {
    if (hasLessons) {
      setSelectedDateModal(dateString);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Day View Computations
  const selectedDayDateStr = useMemo(() => {
    const y = selectedDayDate.getFullYear();
    const m = (selectedDayDate.getMonth() + 1).toString().padStart(2, '0');
    const d = selectedDayDate.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDayDate]);

  const isSelectedDayToday = selectedDayDateStr === todayStr;

  const formattedDayTitle = useMemo(() => {
    const dayNameAr = daysOfWeekAr[selectedDayDate.getDay()];
    const dayNameEn = daysOfWeekEn[selectedDayDate.getDay()];
    const dayNum = selectedDayDate.getDate();
    const monthNameAr = monthNamesAr[selectedDayDate.getMonth()];
    const monthNameEn = monthNamesEn[selectedDayDate.getMonth()];
    return isAr ? `${dayNameAr}، ${dayNum} ${monthNameAr}` : `${dayNameEn}, ${monthNameEn} ${dayNum}`;
  }, [selectedDayDate, isAr]);

  const dayLessonsForTeamsView = useMemo(() => {
    return filteredLessons.filter(l => l.date === selectedDayDateStr);
  }, [filteredLessons, selectedDayDateStr]);

  const currentRealHour = useMemo(() => new Date().getHours(), []);
  const HOURS_TIMELINE = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

  return (
    <div className="bg-white rounded-3xl p-3.5 sm:p-7 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-5">
        
        {/* Title & Filter Chips */}
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg text-slate-900">
                {isAr ? 'تقويم وجدول الحصص' : 'Interactive Class Timetable'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                {isAr ? 'متابعة مواعيد الحصص المباشرة والمنجزة' : 'Track your upcoming and completed classes'}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? `الكل (${lessons.length})` : `All (${lessons.length})`}
            </button>
            <button
              onClick={() => setFilterType('UPCOMING')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                filterType === 'UPCOMING'
                  ? 'bg-amber-500 text-emerald-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr 
                ? `القادمة (${lessons.filter(l => l.status === 'SCHEDULED').length})` 
                : `Upcoming (${lessons.filter(l => l.status === 'SCHEDULED').length})`}
            </button>
            <button
              onClick={() => setFilterType('COMPLETED')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                filterType === 'COMPLETED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr 
                ? `المكتملة (${lessons.filter(l => l.status === 'COMPLETED').length})` 
                : `Completed (${lessons.filter(l => l.status === 'COMPLETED').length})`}
            </button>
          </div>
        </div>

        {/* View Mode Toggle Bar */}
        <div className="flex items-center justify-end w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => {
                setViewMode('DAY');
                setSelectedDayDate(new Date());
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'DAY' ? 'bg-emerald-950 text-amber-400 shadow-sm ring-1 ring-emerald-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'اليوم' : 'Today'}</span>
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'CALENDAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{isAr ? 'شهري' : 'Month'}</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{isAr ? 'قائمة' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TODAY's DAILY TIMELINE VIEW MODE */}
      {viewMode === 'DAY' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Today Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-3xl text-white shadow-lg border border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-sm shrink-0">
                <Clock className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-base sm:text-lg text-white">
                    {isAr ? `جدول اليوم: ${formattedDayTitle}` : `Today's Schedule: ${formattedDayTitle}`}
                  </h4>
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                    {isAr ? 'اليوم الحالي' : 'Today'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-medium">
                  {isAr 
                    ? `مواعيد الحصص المباشرة ليومنا هذا • إجمالي ${dayLessonsForTeamsView.length} حصة` 
                    : `Live sessions for today • ${dayLessonsForTeamsView.length} classes scheduled`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setSelectedDayDate(new Date())}
                className="px-3.5 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحديث اليوم' : 'Refresh Today'}</span>
              </button>
            </div>
          </div>

          {/* Teams Hourly Timeline Grid */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
            <div className="divide-y divide-slate-100">
              {HOURS_TIMELINE.map((hour) => {
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                const periodAr = hour >= 12 ? 'م' : 'ص';
                const periodEn = hour >= 12 ? 'PM' : 'AM';
                const formattedHour = `${displayHour}:00 ${isAr ? periodAr : periodEn}`;

                // Filter lessons occurring in this hour slot
                const hourLessons = dayLessonsForTeamsView.filter(l => {
                  const rawHour = parseInt(l.time.split(':')[0] || '12', 10);
                  const isPM = l.time.includes('م') || l.time.includes('PM');
                  const normalizedHour = (isPM && rawHour < 12) ? rawHour + 12 : (!isPM && rawHour === 12) ? 0 : rawHour;
                  return normalizedHour === hour;
                });

                const isCurrentHour = isSelectedDayToday && currentRealHour === hour;

                return (
                  <div
                    key={hour}
                    className={`flex flex-col sm:flex-row items-stretch min-h-[90px] relative transition-colors ${
                      isCurrentHour ? 'bg-emerald-50/50' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    {/* Time Axis Label */}
                    <div className="w-full sm:w-28 p-3 sm:p-4 bg-slate-50/90 border-b sm:border-b-0 sm:border-r border-slate-200/80 shrink-0 flex items-center justify-between sm:justify-start gap-2">
                      <span className="font-mono text-xs font-black text-slate-700">
                        {formattedHour}
                      </span>
                      {isCurrentHour && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                      )}
                    </div>

                    {/* Timeline Slot Content */}
                    <div className="flex-1 p-3 sm:p-4 space-y-3 relative group">
                      {isCurrentHour && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 z-10 flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 -ml-1 border-2 border-white shadow-xs"></div>
                        </div>
                      )}

                      {hourLessons.length > 0 ? (
                        hourLessons.map((lesson) => {
                          const partnerNameAr = userRole === 'TEACHER' 
                            ? (lesson.studentNameAr || 'طالب') 
                            : (lesson.teacherNameAr || assignedTeacher?.nameAr || 'الشيخ المعلم');
                          const partnerNameEn = userRole === 'TEACHER' 
                            ? (lesson.studentNameEn || 'Student') 
                            : (lesson.teacherNameEn || assignedTeacher?.nameEn || 'Instructor');
                          const isCompleted = lesson.status === 'COMPLETED';
                          const isExtraClass = lesson.id.startsWith('les-ext') || 
                            (lesson.notes && lesson.notes.includes('إضافية')) || 
                            (lesson.surahTargetAr && lesson.surahTargetAr.includes('إضافية'));
                          const hasMeetLink = lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '';

                          return (
                            <div
                              key={lesson.id}
                              className={`p-3.5 sm:p-4 rounded-2xl border-l-4 shadow-xs transition-all space-y-3 ${
                                isCompleted
                                  ? 'bg-emerald-50/90 border-l-emerald-600 border-t border-r border-b border-emerald-200'
                                  : isExtraClass
                                  ? 'bg-amber-50/90 border-l-amber-500 border-t border-r border-b border-amber-200'
                                  : hasMeetLink
                                  ? 'bg-slate-900 text-white border-l-amber-400 border-t border-r border-b border-slate-800'
                                  : 'bg-white border-l-slate-400 border-t border-r border-b border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <AvatarBadge nameAr={partnerNameAr} nameEn={partnerNameEn} size="md" />
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className={`font-extrabold text-sm ${hasMeetLink && !isCompleted ? 'text-white' : 'text-slate-900'}`}>
                                        {isAr ? partnerNameAr : partnerNameEn}
                                      </h5>
                                      {isCompleted && (
                                        <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>{isAr ? 'حصة مكتملة' : 'Completed'}</span>
                                        </span>
                                      )}
                                      {isExtraClass && !isCompleted && (
                                        <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" />
                                          <span>{isAr ? 'حصة إضافية' : 'Extra'}</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-xs font-bold flex items-center gap-1.5 ${hasMeetLink && !isCompleted ? 'text-amber-300' : 'text-emerald-800'}`}>
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{lesson.time} ({lesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                                  {!isCompleted && (
                                    hasMeetLink ? (
                                      <a
                                        href={lesson.googleMeetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 flex items-center justify-center gap-1.5 transition-all"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>{isAr ? 'دخول القاعة' : 'Join Class'}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : userRole === 'TEACHER' ? (
                                      <button
                                        onClick={() => router.push(`/classes/${lesson.id}`)}
                                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>{isAr ? '+ إضافة رابط القاعة' : '+ Add Meet Link'}</span>
                                      </button>
                                    ) : (
                                      <div
                                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-200 text-slate-400 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80 select-none"
                                        title={isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}
                                      >
                                        <Video className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{isAr ? 'لم يضف المعلم الرابط' : 'No link added'}</span>
                                      </div>
                                    )
                                  )}

                                  <button
                                    onClick={() => router.push(`/classes/${lesson.id}`)}
                                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                                      hasMeetLink && !isCompleted
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isAr ? 'التفاصيل' : 'Details'}
                                  </button>
                                </div>
                              </div>

                              {lesson.surahTargetAr && (
                                <div className={`text-xs p-2.5 rounded-xl border font-semibold leading-relaxed ${
                                  hasMeetLink && !isCompleted
                                    ? 'bg-slate-800/80 border-slate-700 text-emerald-300'
                                    : 'bg-white/80 border-slate-200 text-slate-800'
                                }`}>
                                  <span className="font-bold">{isAr ? 'المقرر:' : 'Scope:'}</span> {lesson.surahTargetAr}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-between text-xs text-slate-400 font-medium py-1">
                          <span>{isAr ? 'لا توجد حصص مجدولة في هذه الساعة' : 'No classes scheduled for this hour'}</span>
                          {userRole === 'TEACHER' && (
                            <button
                              onClick={() => router.push('/student/plan-builder')}
                              className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                            >
                              {isAr ? '+ جدولة حلقة' : '+ Schedule'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. CALENDAR VIEW MODE */}
      {viewMode === 'CALENDAR' && (
        <div className="space-y-4">
          
          {/* Month Navigation Strip */}
          <div className="flex items-center justify-between bg-slate-50/90 px-3 sm:px-4 py-2.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-xs transition-colors cursor-pointer border border-slate-200/60"
              title={isAr ? 'الشهر السابق' : 'Previous Month'}
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                {isAr ? monthNamesAr[month] : monthNamesEn[month]} {year}
              </h4>
            </div>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-xs transition-colors cursor-pointer border border-slate-200/60"
              title={isAr ? 'الشهر التالي' : 'Next Month'}
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Days of Week Header - SHORT ON MOBILE TO PREVENT OVERFLOW */}
          <div className="grid grid-cols-7 text-center gap-1 sm:gap-1.5">
            {(isAr ? daysOfWeekArShort : daysOfWeekEn).map((day, idx) => (
              <div key={day} className="py-1.5 text-[10px] sm:text-[11px] font-black text-slate-600 bg-slate-100/70 rounded-lg sm:rounded-xl truncate">
                <span className="sm:hidden">{day}</span>
                <span className="hidden sm:inline">{isAr ? daysOfWeekAr[idx] : daysOfWeekEn[idx]}</span>
              </div>
            ))}
          </div>

          {/* Month Grid Cells - COMPACT & CLEAN ON MOBILE */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-14 sm:h-24 bg-slate-50/30 rounded-xl sm:rounded-2xl border border-slate-100/60 opacity-20"></div>
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
              const dayLessons = lessonsByDate[dateString] || [];
              const isToday = dateString === todayStr;
              const hasLessons = dayLessons.length > 0;
              const isAllCompleted = hasLessons && dayLessons.every(l => l.status === 'COMPLETED');
              const hasExtraClass = dayLessons.some(l => 
                l.id.startsWith('les-ext') || 
                (l.notes && l.notes.includes('إضافية')) || 
                (l.surahTargetAr && l.surahTargetAr.includes('إضافية'))
              );

              return (
                <div
                  key={dateString}
                  onClick={() => handleDayClick(dateString, hasLessons)}
                  className={`h-16 sm:h-24 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between ${
                    hasLessons ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : 'cursor-default'
                  } ${
                    isToday
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : isAllCompleted
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-500'
                      : hasExtraClass
                      ? 'border-amber-300 bg-amber-50/40 hover:border-amber-500'
                      : hasLessons
                      ? 'border-slate-300 bg-white hover:border-slate-400 shadow-2xs'
                      : 'border-slate-100 bg-white/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] sm:text-xs font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md sm:rounded-lg ${
                      isToday 
                        ? 'bg-emerald-800 text-white shadow-2xs' 
                        : isAllCompleted
                        ? 'text-emerald-800 font-black'
                        : 'text-slate-700'
                    }`}>
                      {dayNumber}
                    </span>

                    {hasLessons && (
                      <div className="flex items-center gap-1">
                        {isAllCompleted ? (
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-2xs">✓</span>
                        ) : hasExtraClass ? (
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                        ) : (
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                    )}
                  </div>

                  {hasLessons ? (
                    <div className="space-y-0.5">
                      <span className="sm:hidden text-[9px] font-black bg-slate-900 text-amber-400 px-1 py-0.2 rounded-md inline-block">
                        {dayLessons.length}
                      </span>
                      <span className="hidden sm:inline-block text-[10px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-2xs">
                        {dayLessons.length} {isAr ? 'حصة' : 'class'}
                      </span>
                      <p className="text-[9px] text-slate-500 truncate font-semibold hidden sm:block">
                        {dayLessons[0].time}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-300 font-medium hidden sm:inline">--</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LIST VIEW MODE */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {filteredLessons.length > 0 ? (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => {
                const partnerNameAr = userRole === 'TEACHER' 
                  ? (lesson.studentNameAr || 'طالب') 
                  : (lesson.teacherNameAr || assignedTeacher?.nameAr || 'الشيخ المعلم');
                const partnerNameEn = userRole === 'TEACHER' 
                  ? (lesson.studentNameEn || 'Student') 
                  : (lesson.teacherNameEn || assignedTeacher?.nameEn || 'Instructor');
                const isCompleted = lesson.status === 'COMPLETED';
                const isExtraClass = lesson.id.startsWith('les-ext') || 
                  (lesson.notes && lesson.notes.includes('إضافية')) || 
                  (lesson.surahTargetAr && lesson.surahTargetAr.includes('إضافية'));

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : isExtraClass
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge nameAr={partnerNameAr} nameEn={partnerNameEn} size="md" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {isAr ? partnerNameAr : partnerNameEn}
                          </h4>

                          {isCompleted && (
                            <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isAr ? 'حصة مكتملة' : 'Completed'}</span>
                            </span>
                          )}

                          {isExtraClass && !isCompleted && (
                            <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              <span>{isAr ? 'حصة إضافية مشتراة' : 'Extra Class'}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 font-semibold flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-bold">
                            {lesson.date} • {lesson.time} ({lesson.durationMinutes}m)
                          </span>
                          {lesson.surahTargetAr && (
                            <span className="text-emerald-800 font-serif">
                              {lesson.surahTargetAr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto shrink-0">
                      {!isCompleted && (
                        lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '' ? (
                          <a
                            href={lesson.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 flex items-center justify-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isAr ? 'دخول القاعة' : 'Join'}</span>
                          </a>
                        ) : userRole === 'TEACHER' ? (
                          <button
                            onClick={() => router.push(`/classes/${lesson.id}`)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isAr ? '+ إضافة رابط القاعة' : '+ Add Meet Link'}</span>
                          </button>
                        ) : (
                          <div
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-200 text-slate-400 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1 cursor-not-allowed opacity-80 select-none"
                            title={isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}
                          >
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isAr ? 'لم يضف المعلم الرابط' : 'No link added'}</span>
                          </div>
                        )
                      )}

                      <button
                        onClick={() => router.push(`/classes/${lesson.id}`)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold text-center transition-colors cursor-pointer"
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200/60">
              {isAr ? 'لا توجد حصص تطابق التصفية المحددة.' : 'No classes found for this filter.'}
            </div>
          )}
        </div>
      )}

      {/* 5. INTERACTIVE DAY CLASSES MODAL (FOR MONTH VIEW CLICK) */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {isAr ? `حصص يوم ${selectedDateModal}` : `Classes for ${selectedDateModal}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? `إجمالي ${selectedDayLessons.length} حصة مجدولة في هذا اليوم` : `${selectedDayLessons.length} classes on this date`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Classes List */}
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {selectedDayLessons.map((lesson) => {
                const partnerNameAr = userRole === 'TEACHER' 
                  ? (lesson.studentNameAr || 'طالب') 
                  : (lesson.teacherNameAr || assignedTeacher?.nameAr || 'الشيخ المعلم');
                const partnerNameEn = userRole === 'TEACHER' 
                  ? (lesson.studentNameEn || 'Student') 
                  : (lesson.teacherNameEn || assignedTeacher?.nameEn || 'Instructor');
                const isCompleted = lesson.status === 'COMPLETED';
                const isExtraClass = lesson.id.startsWith('les-ext') || 
                  (lesson.notes && lesson.notes.includes('إضافية')) || 
                  (lesson.surahTargetAr && lesson.surahTargetAr.includes('إضافية'));

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isCompleted
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30'
                        : isExtraClass
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/60'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AvatarBadge nameAr={partnerNameAr} nameEn={partnerNameEn} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {isAr ? partnerNameAr : partnerNameEn}
                            </h4>
                            {isCompleted && (
                              <span className="text-[9px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>{isAr ? 'مكتملة' : 'Completed'}</span>
                              </span>
                            )}
                            {isExtraClass && !isCompleted && (
                              <span className="text-[9px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{isAr ? 'حصة إضافية' : 'Extra'}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-800 font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{lesson.time} ({lesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {lesson.surahTargetAr && (
                      <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 font-semibold leading-relaxed">
                        <span className="font-bold text-slate-900">{isAr ? 'المقرر:' : 'Target:'}</span> {lesson.surahTargetAr}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {!isCompleted && (
                        lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '' ? (
                          <a
                            href={lesson.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isAr ? 'دخول القاعة المباشرة' : 'Join Google Meet'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : userRole === 'TEACHER' ? (
                          <button
                            onClick={() => {
                              setSelectedDateModal(null);
                              router.push(`/classes/${lesson.id}`);
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isAr ? '+ إضافة رابط القاعة' : '+ Add Meet Link'}</span>
                          </button>
                        ) : (
                          <div
                            className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-400 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80 select-none"
                            title={isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}
                          >
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Link not added yet'}</span>
                          </div>
                        )
                      )}

                      <button
                        onClick={() => {
                          setSelectedDateModal(null);
                          router.push(`/classes/${lesson.id}`);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold text-center transition-colors cursor-pointer"
                      >
                        {isAr ? 'تفاصيل وملاحظات الحصة' : 'Class Details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDateModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
