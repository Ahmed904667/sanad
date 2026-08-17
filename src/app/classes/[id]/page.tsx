'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { 
  Video, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink, 
  BookOpen, 
  Target, 
  FileText, 
  Lock, 
  User, 
  Sparkles, 
  CalendarDays, 
  ShieldCheck, 
  Award,
  Copy,
  Check,
  Star,
  UserCheck,
  AlertCircle,
  Edit3,
  Save
} from 'lucide-react';

import { getDayNameArFromDate } from '@/data/quranData';
import { TeacherDatePicker } from '@/components/TeacherDatePicker';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const { language, lessons, teachers, student, role, rescheduleLesson, completeLesson, updateMeetUrl } = useApp();
  const isAr = language === 'ar';

  const lesson = lessons.find(l => l.id === lessonId);
  const assignedTeacher = teachers.find(t => t.id === (lesson?.teacherId || student.assignedTeacherId)) || teachers[0];

  // RESCHEDULING STATE
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDateInput, setNewDateInput] = useState(lesson?.date || new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(lesson?.time.split('@')[1]?.trim() || '12:00');
  const [completionNotes, setCompletionNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedDayNameAr = getDayNameArFromDate(newDateInput);
  const isTeacherWorkingDay = !assignedTeacher.workingDaysAr || assignedTeacher.workingDaysAr.length === 0 || assignedTeacher.workingDaysAr.includes(selectedDayNameAr);

  // MEET LINK STATE FOR TEACHER
  const [meetUrlInput, setMeetUrlInput] = useState(lesson?.googleMeetUrl || '');
  const [isEditingMeetUrl, setIsEditingMeetUrl] = useState(false);
  const [meetUrlSavedMsg, setMeetUrlSavedMsg] = useState(false);

  // Sync state if lesson updates
  React.useEffect(() => {
    if (lesson?.googleMeetUrl !== undefined) {
      setMeetUrlInput(lesson.googleMeetUrl);
    }
  }, [lesson?.googleMeetUrl]);

  const handleSaveMeetUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    updateMeetUrl(lesson.id, meetUrlInput.trim());
    setIsEditingMeetUrl(false);
    setMeetUrlSavedMsg(true);
    setTimeout(() => setMeetUrlSavedMsg(false), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAr ? 'الحصة غير موجودة' : 'Class Not Found'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'لم نتمكن من العثور على الحصة المطلوبة في جدولك الحالي.' : 'We could not find the requested class session.'}
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 rounded-xl emerald-gradient-bg text-white font-bold text-xs shadow-md cursor-pointer"
          >
            {isAr ? 'العودة لجدول الحصص' : 'Back to Schedule'}
          </button>
        </div>
      </div>
    );
  }

  const isTeacherView = role === 'TEACHER';
  const partnerNameAr = isTeacherView 
    ? (lesson.studentNameAr || student.nameAr || 'عبد الرحمن بن خالد العتيبي') 
    : (lesson.teacherNameAr || assignedTeacher.nameAr || 'الشيخ أ.د. إبراهيم السلمي');
  const partnerNameEn = isTeacherView 
    ? (lesson.studentNameEn || student.nameEn || 'Abdulrahman Al-Otaibi') 
    : (lesson.teacherNameEn || assignedTeacher.nameEn || 'Sheikh Prof. Ibrahim Al-Sulami');

  // GENERATE TEACHER SLOTS STRICTLY MATCHING TEACHER AVAILABILITY
  const generateTeacherSlots = () => {
    const rawSlotsList = (assignedTeacher.availableSlots && assignedTeacher.availableSlots.length > 0)
      ? assignedTeacher.availableSlots
      : null;

    const startHour = parseInt((assignedTeacher.workingHoursStart || '12:00').split(':')[0], 10);
    const endHour = parseInt((assignedTeacher.workingHoursEnd || '18:00').split(':')[0], 10);

    const slots = [];
    if (rawSlotsList) {
      for (const slotStr of rawSlotsList) {
        const h = parseInt(slotStr.split(':')[0], 10);
        const m = slotStr.split(':')[1] || '00';
        const isDateBooked = lessons.some(
          l => l.teacherId === assignedTeacher.id && 
               l.date === newDateInput && 
               l.status === 'SCHEDULED' && 
               l.id !== lesson.id &&
               (l.time.includes(slotStr) || l.time.endsWith(slotStr))
        );
        const isBooked = Boolean(assignedTeacher.bookedTimeSlots?.includes(slotStr) || isDateBooked);
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const periodAr = h >= 12 ? 'م' : 'ص';
        const periodEn = h >= 12 ? 'PM' : 'AM';
        const formattedText = `${displayHour}:${m} ${isAr ? periodAr : periodEn}`;
        slots.push({ rawSlot: slotStr, formattedText, isBooked });
      }
    } else {
      for (let h = startHour; h < endHour; h++) {
        const slotStr = `${h.toString().padStart(2, '0')}:00`;
        const isDateBooked = lessons.some(
          l => l.teacherId === assignedTeacher.id && 
               l.date === newDateInput && 
               l.status === 'SCHEDULED' && 
               l.id !== lesson.id &&
               (l.time.includes(slotStr) || l.time.endsWith(slotStr))
        );
        const isBooked = Boolean(assignedTeacher.bookedTimeSlots?.includes(slotStr) || isDateBooked);
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const periodAr = h >= 12 ? 'م' : 'ص';
        const periodEn = h >= 12 ? 'PM' : 'AM';
        const formattedText = `${displayHour}:00 ${isAr ? periodAr : periodEn}`;
        slots.push({ rawSlot: slotStr, formattedText, isBooked });
      }
    }
    return slots;
  };

  const teacherSlots = generateTeacherSlots();

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lesson.status === 'COMPLETED') return;

    const slotObj = teacherSlots.find(s => s.rawSlot === selectedSlot) || teacherSlots[0];
    const fullTimeStr = `@ ${slotObj.formattedText}`;
    rescheduleLesson(lesson.id, newDateInput, fullTimeStr);
    setIsRescheduling(false);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeLesson(lesson.id, completionNotes || (isAr ? 'تم حفظ التلاوة والأحكام والآيات المقررة بنجاح.' : 'Lesson completed successfully.'));
  };

  const handleCopyMeetUrl = () => {
    if (lesson.googleMeetUrl) {
      navigator.clipboard.writeText(lesson.googleMeetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isCompleted = lesson.status === 'COMPLETED';
  const isExtraClass = lesson.id.startsWith('les-ext') || 
    (lesson.notes && lesson.notes.includes('إضافية')) || 
    (lesson.surahTargetAr && lesson.surahTargetAr.includes('إضافية'));

  return (
    <div className="py-8 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 1. TOP BREADCRUMB & BACK NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/student/dashboard" className="hover:text-emerald-700 transition-colors">
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <span>/</span>
            <Link href="/student/plan" className="hover:text-emerald-700 transition-colors">
              {isAr ? 'الخطة القرآنية' : 'Quran Plan'}
            </Link>
            <span>/</span>
            <span className="text-emerald-800 font-extrabold">{isAr ? 'تفاصيل الحصة' : 'Class Details'}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>
        </div>

        {/* 2. CLASS SESSION HERO BANNER */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isCompleted ? (
                  <span className="bg-emerald-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حصة مكتملة ومنجزة' : 'Completed Session'}</span>
                  </span>
                ) : (
                  <span className="bg-amber-400 text-emerald-950 text-xs font-black px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حصة مجدولة قادمة' : 'Upcoming Scheduled Class'}</span>
                  </span>
                )}

                {isExtraClass && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isAr ? 'حصة إضافية مشتراة' : 'Purchased Extra Class'}</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {isTeacherView 
                    ? (isAr ? `جلسة الطالب: ${partnerNameAr}` : `Student: ${partnerNameEn}`)
                    : (isAr ? `مع الشيخ: ${partnerNameAr}` : `With: ${partnerNameEn}`)}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200 font-semibold flex items-center gap-2">
                  <span>{lesson.date}</span>
                  <span className="text-slate-500">•</span>
                  <span>{lesson.time} ({lesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})</span>
                </p>
              </div>
            </div>

            {/* Top Direct Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              {!isCompleted && (
                lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '' ? (
                  <a
                    href={lesson.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xl hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isAr ? 'دخول القاعة المباشرة' : 'Join Google Meet'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : isTeacherView ? (
                  <button
                    onClick={() => setIsEditingMeetUrl(true)}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isAr ? '+ إضافة رابط القاعة' : '+ Add Meet Link'}</span>
                  </button>
                ) : (
                  <div
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-slate-800/60 text-slate-400 font-bold text-xs border border-slate-700/60 flex items-center justify-center gap-2 cursor-not-allowed opacity-80 select-none"
                    title={isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}
                  >
                    <Video className="w-4 h-4 text-slate-500" />
                    <span>{isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}</span>
                  </div>
                )
              )}

              {!isCompleted && (
                <button
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'تغيير الموعد' : 'Reschedule'}</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 3. RESCHEDULE DRAWER (COLLAPSIBLE) */}
        {isRescheduling && !isCompleted && (
          <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-6 shadow-sm space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-amber-800" />
                <h3 className="font-black text-amber-950 text-sm sm:text-base">
                  {isAr ? `تغيير موعد الحصة مع المعلم (${assignedTeacher.nameAr}):` : `Reschedule Class with ${assignedTeacher.nameEn}:`}
                </h3>
              </div>
              <span className="text-[10px] text-amber-900 font-bold bg-amber-200 px-3 py-1 rounded-full">
                {isAr ? `ساعات المعلم: ${assignedTeacher.workingHoursStart || '12:00'} - ${assignedTeacher.workingHoursEnd || '18:00'}` : `Hours: ${assignedTeacher.workingHoursStart} - ${assignedTeacher.workingHoursEnd}`}
              </span>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <TeacherDatePicker
                selectedDate={newDateInput}
                onSelectDate={setNewDateInput}
                workingDaysAr={assignedTeacher.workingDaysAr}
                isAr={isAr}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-950">
                  {isAr ? '2. اختر الوقت المفضل من ساعات عمل المعلم المتاحة:' : '2. Select Available Time Slot:'}
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {teacherSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.rawSlot;

                    if (slot.isBooked) {
                      return (
                        <div
                          key={slot.rawSlot}
                          className="p-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-bold text-center opacity-60 cursor-not-allowed line-through"
                        >
                          <div>{slot.formattedText}</div>
                          <span className="text-[9px] block font-normal">{isAr ? 'محجوز' : 'Booked'}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.rawSlot}
                        type="button"
                        onClick={() => setSelectedSlot(slot.rawSlot)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white font-black shadow-xs'
                            : 'border-amber-300 bg-white text-slate-900 font-bold hover:bg-amber-100/80'
                        }`}
                      >
                        <div className="text-xs">{slot.formattedText}</div>
                        <span className={`text-[9px] block font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`}>
                          {isAr ? 'متاح' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-700 font-bold text-xs border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!isTeacherWorkingDay}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 transition-all ${
                    isTeacherWorkingDay
                      ? 'gold-gradient-bg text-emerald-950 hover:brightness-105 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد وحفظ الموعد الجديد' : 'Confirm New Time'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. MAIN CONTENT 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: CURRICULUM & VIRTUAL ROOM     */}
          {/* ========================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quran Curriculum Target Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-black text-base text-slate-900">
                    {isAr ? 'مقرر الحصة القرآني' : 'Assigned Quran Curriculum'}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {isAr ? 'تلاوة وحفظ وتجويد' : 'Recitation & Tajweed'}
                </span>
              </div>

              {lesson.surahTargetAr ? (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl space-y-2">
                  <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-md inline-block">
                    {isAr ? 'المقرر المحدد' : 'Selected Scope'}
                  </span>
                  <p className="text-base sm:text-lg font-bold text-emerald-950 font-serif leading-relaxed">
                    {lesson.surahTargetAr}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'مقرر الحصة موزع تلقائياً ضمن خطتك القرآنية المعتمدة.' : 'Curriculum is distributed based on your active plan.'}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'تتم قراءة ومراجعة الآيات مباشرة مع المعلم المجاز بالسند.' : 'Recited directly under the supervision of a certified scholar.'}</span>
              </div>
            </div>

            {/* Virtual Classroom Info Card (Google Meet) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-base text-slate-900">
                    {isAr ? 'القاعة الافتراضية (Google Meet)' : 'Virtual Classroom'}
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {isAr ? 'مباشر وتفاعلي 1-على-1' : '1-on-1 Live HD'}
                </span>
              </div>

              {/* Success Notification Message when teacher updates link */}
              {meetUrlSavedMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isAr ? 'تم حفظ وتحديث رابط القاعة الافتراضية بنجاح!' : 'Meet link saved and updated successfully!'}</span>
                </div>
              )}

              {/* TEACHER MEET LINK EDIT FORM */}
              {isTeacherView ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-emerald-700" />
                      <span>{isAr ? 'رابط القاعة الافتراضية للمعلم (Google Meet):' : 'Teacher Meet Link (Google Meet):'}</span>
                    </label>
                    {lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '' && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                        {isAr ? 'تم إضافة الرابط' : 'Link Active'}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveMeetUrlSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      value={meetUrlInput}
                      onChange={(e) => setMeetUrlInput(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      required
                      className="flex-1 p-3 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 shadow-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl emerald-gradient-bg text-white font-black text-xs shadow-md hover:brightness-110 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isAr ? 'حفظ الرابط' : 'Save Link'}</span>
                    </button>
                  </form>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isAr
                      ? 'عند إضافة الرابط أو تحديثه، سيتمكن الطالب فوراً من النقر على زر دخول القاعة.'
                      : 'Once added or updated, students can immediately click to join the class session.'}
                  </p>
                </div>
              ) : (
                /* STUDENT VIEW OF VIRTUAL CLASSROOM */
                lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '' ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="font-mono text-xs text-slate-700 truncate select-all font-semibold">
                      {lesson.googleMeetUrl}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyMeetUrl}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرابط' : 'Copy Link')}</span>
                      </button>

                      <a
                        href={lesson.googleMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 flex items-center gap-1.5 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isAr ? 'دخول القاعة' : 'Join'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs font-semibold text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>{isAr ? 'رابط القاعة الافتراضية غير متاح حالياً' : 'Class link not added yet'}</span>
                    </div>
                    <p className="text-amber-800 text-xs leading-relaxed font-medium">
                      {isAr
                        ? 'لم يقم المعلم بإضافة رابط Google Meet لهذه الحصة بعد. سيتم تفعيل زر دخول القاعة تلقائياً فور إضافة المعلم للرابط.'
                        : 'The teacher has not added the Google Meet link for this session yet. The join button will be activated once the teacher adds the link.'}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Teacher Notes & Feedback (if completed) */}
            {lesson.notes && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <h4>{isAr ? 'ملاحظات المعلم وتقييم التسميع' : 'Instructor Feedback & Notes'}</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                  {lesson.notes}
                </div>
              </div>
            )}

            {/* Teacher Approval Form (Only for Teacher view) */}
            {isTeacherView && !isCompleted && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                  <Award className="w-5 h-5 text-emerald-700" />
                  <h4>{isAr ? 'اعتماد الحصة وتوثيق التسميع للطالب:' : 'Approve Lesson & Record Recitation:'}</h4>
                </div>

                <form onSubmit={handleCompleteSubmit} className="space-y-3">
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder={isAr ? 'أدخل ملاحظات التسميع والتجويد للطالب...' : 'Enter recitation notes & feedback for student...'}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-emerald-300 text-xs font-semibold text-slate-900 bg-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl emerald-gradient-bg text-white font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'تأكيد اكتمال الحصة وتوثيق الإنجاز' : 'Mark Lesson Completed'}</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* ========================================== */}
          {/* RIGHT SIDEBAR: INSTRUCTOR & SESSION SPECS  */}
          {/* ========================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Instructor Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500">
                  {isTeacherView ? (isAr ? 'الطالب المسجل' : 'Enrolled Student') : (isAr ? 'المعلم المشرف' : 'Assigned Instructor')}
                </span>
                <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{assignedTeacher.rating}</span>
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <AvatarBadge nameAr={partnerNameAr} nameEn={partnerNameEn} size="lg" />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="font-black text-base text-slate-900 truncate">
                    {isAr ? partnerNameAr : partnerNameEn}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold line-clamp-1">
                    {isAr ? assignedTeacher.titleAr : assignedTeacher.titleEn}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 font-medium space-y-1">
                <div>{isAr ? `الساعات المتاحة: ${assignedTeacher.workingHoursStart || '12:00'} إلى ${assignedTeacher.workingHoursEnd || '18:00'}` : `Hours: ${assignedTeacher.workingHoursStart} - ${assignedTeacher.workingHoursEnd}`}</div>
                <div>{isAr ? 'جلسة فردية مباشرة 1-على-1' : 'Individual 1-on-1 Session'}</div>
              </div>
            </div>

            {/* Session Specifications Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h4 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">
                {isAr ? 'معلومات الجلسة' : 'Session Specifications'}
              </h4>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-bold">{isAr ? 'المدة الزمنية:' : 'Duration:'}</span>
                <span className="font-black text-slate-900">{lesson.durationMinutes} {isAr ? 'دقيقة' : 'minutes'}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-bold">{isAr ? 'حالة الحصة:' : 'Status:'}</span>
                <span className={`font-black ${isCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isCompleted ? (isAr ? 'مكتملة' : 'Completed') : (isAr ? 'مجدولة' : 'Scheduled')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-bold">{isAr ? 'نوع الحصة:' : 'Type:'}</span>
                <span className="font-bold text-slate-800">
                  {isExtraClass ? (isAr ? 'حصة إضافية' : 'Extra Class') : (isAr ? 'ضمن الباقة الشهرية' : 'Monthly Plan')}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
