'use client';

import { AccessibleModal } from '@/components/AccessibleModal';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UNAVAILABLE_TEACHER } from '@/utils/unavailableTeacher';
import { useApp } from '@/context/AppContext';
import { localizeQuranScope } from '@/utils/localization';
import { receiptFileToDataUrl } from '@/lib/receiptFile';
import { formatAvailabilityRanges } from '@/utils/timeFormat';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { PaymentWizardModal } from '@/components/PaymentWizardModal';
import { TeacherReviewsModal } from '@/components/TeacherReviewsModal';
import { AuthGuard } from '@/components/AuthGuard';
import { Teacher } from '@/types';
import { getDayNameArFromDate } from '@/data/quranData';
import { getTeacherAvailableSlots, lessonTimeRange, timeRangesOverlap } from '@/utils/availability';
import { TeacherDatePicker } from '@/components/TeacherDatePicker';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Star,
  Sparkles,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Building2,
  Target,
  Trophy,
  XCircle
} from 'lucide-react';

function StudentDashboardContent() {
  const {
    isHydrated,
    language,
    student,
    currentUser,
    plans,
    lessons,
    teachers,
    selectedPlanForCheckout,
    setSelectedPlanForCheckout,
    scheduleExtraLesson,
    resubmitPaymentReceipt
  } = useApp();
  const isAr = language === 'ar';

  const [showScheduleExtraModal, setShowScheduleExtraModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  const [modalReviewsTeacher, setModalReviewsTeacher] = useState<Teacher | null>(null);
  const [newReceiptFile, setNewReceiptFile] = useState<File | null>(null);
  const [newBankRef, setNewBankRef] = useState('');
  const [receiptUploadError, setReceiptUploadError] = useState('');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [extraDate, setExtraDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [extraTime, setExtraTime] = useState('14:00');
  const [extraSurah, setExtraSurah] = useState('');

  const activePlan = plans.find(p => p.id === student.activePlanId)
    || plans.find(p => p.id === student.pendingPlanId)
    || plans[0];
  const hasActiveSubscription = student.verificationStatus === 'VERIFIED' && Boolean(student.activePlanId);
  const assignedTeacher = teachers.find(t => t.id === student.assignedTeacherId) || UNAVAILABLE_TEACHER;

  // STRICT STUDENT DATA ISOLATION & PLAN QUOTA ENFORCEMENT
  const currentStudentId = currentUser?.id || student.id;
  const rawStudentLessons = lessons.filter(l =>
    (l.studentId === currentStudentId ||
     l.studentId === student.id ||
     (currentUser?.email && l.studentId.toLowerCase() === currentUser.email.toLowerCase())) &&
    l.status !== 'CANCELLED'
  );

  const orientationLesson = rawStudentLessons.find(l => l.isOrientationSession);
  const regularLessons = rawStudentLessons.filter(l => !l.isOrientationSession);


  const completedRegularLessons = regularLessons.filter(l => l.status === 'COMPLETED');
  const totalPlanLessons = hasActiveSubscription ? activePlan.lessonsPerMonth + (student.extraPurchasedClassesCount || 0) : 0;
  const remainingLessonsCount = hasActiveSubscription ? Math.max(0, student.remainingLessons || 0) : 0;
  const actualCompletedCount = completedRegularLessons.length;
  const scheduledRegularLessons = regularLessons.filter(lesson => lesson.status === 'SCHEDULED');
  const unscheduledPaidCredits = hasActiveSubscription ? Math.max(0, remainingLessonsCount - scheduledRegularLessons.length) : 0;
  const affectedScheduledCount = hasActiveSubscription ? scheduledRegularLessons.filter(lesson => lesson.needsRescheduling).length : 0;
  const scheduleAttentionCount = unscheduledPaidCredits + affectedScheduledCount;


  // Allowed upcoming scheduled classes strictly constrained by active plan quota (e.g. all 8 regular classes)
  const allowedUpcomingCount = hasActiveSubscription ? remainingLessonsCount : 0;
  const upcomingRegularLessons = regularLessons
    .filter(l => l.status === 'SCHEDULED')
    .slice(0, allowedUpcomingCount);

  // Combined active lessons: exactly all 8 regular plan lessons PLUS the +1 Free orientation session
  const studentLessons = orientationLesson
    ? [orientationLesson, ...completedRegularLessons, ...upcomingRegularLessons]
    : [...completedRegularLessons, ...upcomingRegularLessons];

  // Calculate exact hours learned dynamically from completed lessons
  const dynamicTotalHours = completedRegularLessons.reduce((acc, l) => acc + (l.durationMinutes || 30), 0) / 60;
  const displayHours = dynamicTotalHours.toFixed(1);

  // Legacy lessons store display scopes rather than measured learning outcomes.
  // Count unique scoped pages; do not present this as memorization proficiency.
  const coveredPages = new Set<number>();
  for (const completed of completedRegularLessons) {
    const regex = /صفح(?:ة|ات)\s*\(?(\d+)(?:\s*(?:إلى|-)\s*(\d+))?\)?/g;
    for (const match of (completed.surahTargetAr || '').matchAll(regex)) {
      const from = Number(match[1]); const to = Number(match[2] || match[1]);
      if (from >= 1 && to <= 604 && to >= from) for (let page = from; page <= to; page++) coveredPages.add(page);
    }
  }
  const dynamicPagesMemorized = coveredPages.size;

  const dynamicCompletionPercentage = totalPlanLessons > 0
    ? Math.min(100, Math.round((actualCompletedCount / totalPlanLessons) * 100))
    : 0;
  const nextLesson = studentLessons.find(l => l.status === 'SCHEDULED') || upcomingRegularLessons[0];
  const nextLessonTeacherNameAr = nextLesson?.teacherNameAr || assignedTeacher?.nameAr || 'المعلم';
  const nextLessonTeacherNameEn = nextLesson?.teacherNameEn || assignedTeacher?.nameEn || 'Your teacher';

  const [extraSaving, setExtraSaving] = useState(false);
  const [extraError, setExtraError] = useState('');
  const [receiptSaving, setReceiptSaving] = useState(false);
  const handleScheduleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extraDate < todayStr) return;
    if (extraSaving) return;
    setExtraSaving(true); setExtraError('');
    try { await scheduleExtraLesson(
      extraDate,
      extraTime,
      extraSurah || (isAr ? 'حصة إضافية مدمجة ضمن الخطة' : 'Integrated Extra Class')
    );
    setShowScheduleExtraModal(false);
    setExtraSurah('');
    } catch(error) { setExtraError(error instanceof Error ? error.message : 'Unable to schedule class.'); } finally { setExtraSaving(false); }
  };

  const teacherSlots = useMemo(() => {
    // Get all scheduled lessons for this teacher on extraDate
    const bookedLessonsOnDate = lessons.filter(
      l => l.teacherId === assignedTeacher.id && l.date === extraDate && l.status === 'SCHEDULED'
    );
    const day = getDayNameArFromDate(extraDate);

    const slots: { rawSlot: string; formattedText: string; isBooked: boolean }[] = [];
    const availableTimes = getTeacherAvailableSlots(assignedTeacher, day, activePlan.lessonDurationMinutes);
    for (const slotStr of availableTimes) {
      const [hour, minute] = slotStr.split(':').map(Number);
      const isStaticBooked = assignedTeacher.bookedTimeSlots?.includes(slotStr);
      const candidate = lessonTimeRange(slotStr, activePlan.lessonDurationMinutes);
      const isDateBooked = Boolean(candidate && bookedLessonsOnDate.some(lesson => {
        const booked = lessonTimeRange(lesson.time, lesson.durationMinutes || activePlan.lessonDurationMinutes);
        return booked && timeRangesOverlap(candidate, booked);
      }));
      const isBooked = isStaticBooked || isDateBooked;

      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const periodAr = hour >= 12 ? 'م' : 'ص';
      const periodEn = hour >= 12 ? 'PM' : 'AM';
      const formattedText = `${displayHour}:${String(minute).padStart(2, '0')} ${isAr ? periodAr : periodEn}`;

      slots.push({
        rawSlot: slotStr,
        formattedText,
        isBooked
      });
    }
    return slots;
  }, [assignedTeacher, extraDate, lessons, isAr, activePlan.lessonDurationMinutes]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen py-16 bg-slate-50/70 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">{isAr ? 'جاري تحميل لوحة التحكم...' : 'Loading Dashboard...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* REJECTION ALERT BANNER */}
        {student.verificationStatus === 'UNVERIFIED' && student.rejectionReason && (
          <div className="bg-red-50 border-2 border-red-300 text-red-950 p-5 rounded-3xl space-y-3 shadow-md animate-in fade-in">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-base text-red-950">
                    {isAr ? 'تم رفض إيصال التحويل البنكي وطلب الاشتراك' : 'Application & Payment Receipt Rejected'}
                  </h3>
                  <div className="text-xs font-bold text-red-800 bg-red-100/90 border border-red-200 px-3 py-1.5 rounded-xl">
                    <span className="font-black text-red-950">{isAr ? 'سبب الرفض من الإدارة: ' : 'Reason for rejection: '}</span>
                    {student.rejectionReason}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowResubmitModal(true)}
                className="px-5 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-emerald-950" />
                <span>{isAr ? 'إعادة رفع إيصال جديد مياشرةً ↗' : 'Re-upload Receipt Directly ↗'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN 2-COLUMN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ======================================================== */}
          {/* LEFT MAIN COLUMN: NEXT CLASS HERO & INTERACTIVE SCHEDULE */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">

            {/* NEXT UPCOMING LESSON HERO CARD */}
            {nextLesson ? (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-800/40 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="bg-amber-400 text-emerald-950 text-xs font-black px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'موعد حصتك القادمة' : 'Next Upcoming Class'}</span>
                    </span>
                    <span className="text-emerald-200 text-xs font-bold bg-emerald-900/60 border border-emerald-700/50 px-3 py-1 rounded-full">
                      {nextLesson.date} • {nextLesson.time} ({nextLesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <AvatarBadge nameAr={nextLessonTeacherNameAr} nameEn={nextLessonTeacherNameEn} size="md" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-lg font-black text-white">
                        {isAr ? `مع الشيخ: ${nextLessonTeacherNameAr}` : `Instructor: ${nextLessonTeacherNameEn}`}
                      </h3>
                      {nextLesson.surahTargetAr && (
                        <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-2xl text-xs text-emerald-300 font-semibold leading-relaxed">
                          <span className="font-bold text-amber-200">{isAr ? 'مقرر الحصة:' : 'Lesson Target:'}</span> {localizeQuranScope(isAr ? nextLesson.surahTargetAr : (nextLesson.surahTargetEn || nextLesson.surahTargetAr), isAr)}
                        </div>
                      )}
                    </div>
                  </div>

                  {nextLesson.needsRescheduling && (
                    <div className="bg-amber-500/20 border border-amber-400/50 p-4 rounded-2xl text-amber-200 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
                        <div>
                          <span className="font-extrabold text-amber-300 block">{isAr ? 'تنبيه إعادة الجدولة:' : 'Reschedule Alert:'}</span>
                          <p className="text-amber-100/90 text-[11px]">
                            {isAr ? 'قام المعلم بتعديل جدول مواعيده. يمكنك اختيار موعد جديد يناسبك من جدول المعلم المعدل.' : 'Your teacher updated working schedule. You can pick a new slot.'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/classes/${nextLesson.id}`}
                        className="px-4 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs hover:brightness-110 shrink-0 cursor-pointer"
                      >
                        {isAr ? 'تعديل الموعد' : 'Choose New Time'}
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1 flex-wrap sm:flex-nowrap">
                    {nextLesson.googleMeetUrl && nextLesson.googleMeetUrl.trim() !== '' ? (
                      <a
                        href={nextLesson.googleMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xl hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>{isAr ? 'دخول القاعة المباشرة (Google Meet)' : 'Join Live Class'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div
                        className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-800/60 text-slate-400 font-bold text-xs border border-slate-700/60 flex items-center justify-center gap-2 cursor-not-allowed opacity-75 select-none"
                        title={isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}
                      >
                        <Video className="w-4 h-4 text-slate-500" />
                        <span>{isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد' : 'Teacher has not added link yet'}</span>
                      </div>
                    )}

                    <Link
                      href={`/classes/${nextLesson.id}`}
                      className="px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs text-center transition-all shrink-0"
                    >
                      {isAr ? 'تفاصيل الحصة' : 'View Details'}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-7 border border-slate-200 text-center space-y-3 shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-black text-base text-slate-900">{isAr ? 'لا توجد حصص قادمة مجدولة حالياً' : 'No upcoming classes scheduled'}</h3>
                <p className="text-xs text-slate-500 font-medium">{unscheduledPaidCredits > 0 ? (isAr ? 'لديك رصيد مدفوع متاح. راجع خطتك لاختيار مواعيد الحصص.' : 'You have paid credits available. Review your plan to choose class times.') : (isAr ? 'يمكنك تجديد اشتراكك الشهري أو شراء حصص إضافية لمواصلة الحفظ والتلاوة.' : 'You can renew your plan or buy extra classes to keep learning.')}</p>
              </div>
            )}

            {/* EXTRA CLASS / REPLACEMENT CREDIT ALERT (IF AVAILABLE) */}
            {(scheduleAttentionCount > 0) && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base text-amber-950">
                        {isAr
                          ? `تحتاج ${scheduleAttentionCount} حصص إلى جدولة أو تعديل الموعد`
                          : `${scheduleAttentionCount} classes need scheduling or a new time`}
                      </h4>
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                        {isAr ? 'يتطلب إعادة جدولة' : 'Needs Rescheduling'}
                      </span>
                    </div>
                    <p className="text-amber-900 text-xs font-semibold leading-relaxed">
                      {isAr
                        ? `${unscheduledPaidCredits} أرصدة مدفوعة غير مجدولة، و${affectedScheduledCount} حصص مجدولة تحتاج موعداً جديداً. راجع خطتك لاختيار الأوقات المناسبة.`
                        : `${unscheduledPaidCredits} paid credits are not scheduled; ${affectedScheduledCount} scheduled classes need a new time. Review your plan to choose available slots.`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href="/student/plan-builder#schedule-section"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-950" />
                    <span>{isAr ? 'مراجعة جدول الحصص' : 'Review class schedule'}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* INTERACTIVE CLASS CALENDAR SECTION */}
            <ClassCalendar
              lessons={studentLessons}
              userRole="STUDENT"
            />

          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDEBAR: PROFILE, PROGRESS METRICS & QUICK ACTIONS */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-5">

            {/* STUDENT & PLAN CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <AvatarBadge nameAr={student.nameAr} nameEn={student.nameEn} size="lg" />
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-black text-base text-slate-900 truncate">
                    {isAr ? student.nameAr : student.nameEn}
                  </h3>
                  <span className="inline-block bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {hasActiveSubscription
                      ? (isAr ? activePlan.titleAr : activePlan.titleEn)
                      : student.pendingPlanId
                        ? `${isAr ? 'بانتظار اعتماد: ' : 'Pending approval: '}${isAr ? activePlan.titleAr : activePlan.titleEn}`
                        : (isAr ? 'لا يوجد اشتراك نشط' : 'No active subscription')}
                  </span>
                </div>
              </div>

              {/* Supervising Instructor Info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <AvatarBadge nameAr={assignedTeacher.nameAr} nameEn={assignedTeacher.nameEn} size="sm" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'المعلم المشرف' : 'Instructor'}</span>
                    <span className="font-extrabold text-slate-800">{isAr ? assignedTeacher.nameAr : assignedTeacher.nameEn}</span>
                  </div>
                </div>
                <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{assignedTeacher.reviewsCount ? assignedTeacher.rating : (isAr ? 'لا توجد تقييمات' : 'No reviews yet')}</span>
                </span>
              </div>

              {/* Quick Actions */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setModalReviewsTeacher(assignedTeacher)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs text-center flex items-center justify-center gap-2 border border-amber-300/80 transition-all cursor-pointer shadow-2xs"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{isAr ? 'آراء الطلاب عن المعلم' : 'Instructor reviews'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/student/plan"
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'عرض الخطة' : 'Quran Plan'}</span>
                  </Link>

                  <Link
                    href="/subscriptions"
                    className="py-2.5 px-3 rounded-xl gold-gradient-bg text-emerald-950 font-black text-[11px] text-center flex items-center justify-center gap-1.5 shadow-2xs hover:brightness-105 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حصة إضافية' : 'Buy Class'}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* UNIFIED SLEEK PROGRESS SUMMARY CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-amber-500" />
                  <h4 className="font-extrabold text-sm text-slate-900">{isAr ? 'ملخص إنجازاتك القرآنية' : 'Quran Progress Summary'}</h4>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                  {dynamicCompletionPercentage}%
                </span>
              </div>

              {/* 3 Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">{isAr ? 'صفحات المقرر' : 'Scoped pages'}</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900 block my-0.5">{dynamicPagesMemorized}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">{isAr ? 'صفحة' : 'pages'}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">{isAr ? 'الحصص' : 'Classes'}</span>
                  <span className="text-base sm:text-lg font-black text-amber-600 block my-0.5">{actualCompletedCount}/{totalPlanLessons}</span>
                  <span className="text-[9px] text-emerald-700 font-bold block">{isAr ? `${remainingLessonsCount} متبقية` : `${remainingLessonsCount} left`}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">{isAr ? 'الساعات' : 'Hours'}</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 block my-0.5">{displayHours}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">{isAr ? 'ساعة' : 'hrs'}</span>
                </div>
              </div>

<p className="text-[10px] text-slate-500">{isAr ? 'الصفحات من مقررات الحصص المكتملة؛ لا تمثل قياساً مستقلاً لإتقان الحفظ.' : 'Pages come from completed class scopes; this is not an independent measure of memorization proficiency.'}</p>
              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>{isAr ? 'نسبة إكمال الخطة' : 'Plan Progress'}</span>
                  <span className="text-emerald-800 font-black">{dynamicCompletionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="emerald-gradient-bg h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, dynamicCompletionPercentage)}%` }} />
                </div>
              </div>
            </div>

          </div>

        </div>

      {/* SCHEDULE EXTRA CLASS MODAL */}
      {showScheduleExtraModal && (
        <AccessibleModal onClose={() => setShowScheduleExtraModal(false)} aria-label={isAr ? "جدولة حصة إضافية" : "Schedule extra class"} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-emerald-950 font-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-950">
                    {isAr ? 'جدولة الحصة الإضافية المشتراة' : 'Schedule Extra Lesson'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? `مع المعلم: ${assignedTeacher.nameAr}` : `With: ${assignedTeacher.nameEn}`}
                  </p>
                </div>
              </div>
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setShowScheduleExtraModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {extraError && <p role="alert" className="text-rose-700 text-xs">{extraError}</p>}
            <form onSubmit={handleScheduleExtraSubmit} aria-busy={extraSaving} className="space-y-4 text-xs font-semibold">
              <TeacherDatePicker
                selectedDate={extraDate}
                onSelectDate={setExtraDate}
                workingDaysAr={assignedTeacher.workingDaysAr}
                isAr={isAr}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold">
                    {isAr ? 'الوقت المفضل (حسب أوقات المعلم المتاحة):' : 'Available Time Slot:'}
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    {isAr ? 'أوقات المعلم: ' : 'Teacher availability: '}{formatAvailabilityRanges(assignedTeacher.availabilityRanges, assignedTeacher.workingHoursStart, assignedTeacher.workingHoursEnd, isAr, assignedTeacher.availabilityByDay)}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {teacherSlots.map((slot) => {
                    const isSelected = extraTime === slot.rawSlot;

                    return (
                      <button
                        key={slot.rawSlot}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setExtraTime(slot.rawSlot)}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold text-center transition-all ${
                          slot.isBooked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-amber-400 text-emerald-950 border-amber-500 font-black shadow-xs ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer'
                        }`}
                      >
                        <div>{slot.rawSlot}</div>
                        <div className="text-[9px] font-normal opacity-80">
                          {slot.isBooked ? (isAr ? 'محجوز' : 'Booked') : slot.formattedText}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-900 font-medium leading-relaxed space-y-1">
                <div className="font-black flex items-center gap-1.5 text-emerald-950">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'دمج تلقائي ضمن تقسيم الخطة القرآنية:' : 'Automatic Plan Division Integration:'}</span>
                </div>
                <p>
                  {isAr
                    ? 'عند تأكيد الحصة، ستتم إضافتها وإعادة توزيع صفحات ومقرر الخطة القرآنية تلقائياً بالتساوي على إجمالي الحصص.'
                    : 'Upon confirming, this class will be integrated, and your target pages will be redistributed evenly across all classes.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold text-xs">
                  {isAr ? 'مقرر الحصة (اختياري - يترك فارغاً للدمج التلقائي بالخطة):' : 'Custom Target (Optional):'}
                </label>
                <input
                  type="text"
                  value={extraSurah}
                  onChange={(e) => setExtraSurah(e.target.value)}
                  placeholder={isAr ? 'دمج تلقائي ضمن تقسيم الخطة (أو اكتب هدفاً مخصصاً)' : 'Auto-divided from plan target (or custom)'}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              {(() => {
                const extraDateDayNameAr = getDayNameArFromDate(extraDate);
                const isExtraDateWorkingDay = !assignedTeacher.workingDaysAr || assignedTeacher.workingDaysAr.length === 0 || assignedTeacher.workingDaysAr.includes(extraDateDayNameAr);

                return (
                  <>
                    {!isExtraDateWorkingDay && (
                      <div className="bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          {isAr
                            ? `المعلم لا يعمل يوم (${extraDateDayNameAr}). أيام دوام المعلم: ${assignedTeacher.workingDaysAr?.join(' • ')}`
                            : `Teacher does not work on ${extraDateDayNameAr}. Working days: ${assignedTeacher.workingDaysAr?.join(', ')}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setShowScheduleExtraModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={!isExtraDateWorkingDay}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-md ${
                          isExtraDateWorkingDay
                            ? 'gold-gradient-bg text-emerald-950 cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        {isAr ? 'تأكيد وحفظ الموعد بالتقويم' : 'Confirm & Add to Calendar'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </AccessibleModal>
      )}

      {selectedPlanForCheckout && (
        <PaymentWizardModal
          plan={selectedPlanForCheckout}
          teacher={assignedTeacher}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}


      {/* RE-UPLOAD RECEIPT MODAL FOR REJECTED APPLICATIONS */}
      {showResubmitModal && (
        <AccessibleModal onClose={() => setShowResubmitModal(false)} aria-label={isAr ? "إعادة إرسال إيصال الدفع" : "Resubmit payment receipt"} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center font-black">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isAr ? 'إعادة رفع إيصال التحويل المصرفي' : 'Re-upload Payment Receipt'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? 'دون الحاجة لإعادة خطوات التسجيل، فقط ارفع الإيصال الجديد للاعتماد المباشر.' : 'Upload your updated bank transfer receipt directly without restarting.'}
                  </p>
                </div>
              </div>
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setShowResubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1.5 text-amber-950">
                <div className="font-extrabold text-amber-900">
                  {hasActiveSubscription
                    ? (isAr ? `الباقة الحالية: ${activePlan.titleAr} (${activePlan.priceMonthlySar} ر.س)` : `Plan: ${activePlan.titleEn}`)
                    : student.pendingPlanId
                      ? (isAr ? `طلب الاشتراك بانتظار المراجعة: ${activePlan.titleAr}` : `Subscription pending review: ${activePlan.titleEn}`)
                      : (isAr ? 'لا يوجد اشتراك نشط' : 'No active subscription')}
                </div>
                <div className="text-[11px] text-amber-800">
                  {isAr ? `المعلم المختار: ${assignedTeacher.nameAr}` : `Teacher: ${assignedTeacher.nameEn}`}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-bold block">{isAr ? 'بيانات التحويل المصرفي:' : 'Bank Account Details:'}</span>
                <div className="font-mono text-emerald-900 font-black">IBAN: SA03 8000 0000 6080 1010 0000</div>
                <div className="text-slate-700">مصرف الراجحي • حساب شركة سَنَد القرآنية</div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-800 font-bold">
                  {isAr ? '1. رفع الإيصال الجديد (صورة/PDF):' : '1. Upload New Receipt:'}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => {
                    setNewReceiptFile(e.target.files?.[0] || null);
                    setReceiptUploadError('');
                  }}
                  className="block w-full p-2 rounded-xl border border-slate-300 text-xs font-medium cursor-pointer"
                />
              </div>

              {receiptUploadError && <p role="alert" className="text-sm text-red-700">{receiptUploadError}</p>}

              <div className="space-y-2">
                <label className="block text-slate-800 font-bold">
                  {isAr ? '2. رقم المرجع أو العملية البنكية:' : '2. Bank Transfer Reference Number:'}
                </label>
                <input
                  type="text"
                  value={newBankRef}
                  onChange={(e) => setNewBankRef(e.target.value)}
                  placeholder={isAr ? 'مثال: REF-928104' : 'e.g. REF-928104'}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={!newReceiptFile || receiptSaving}
                onClick={async () => {
                  if (!newReceiptFile || receiptSaving) return;
                  setReceiptSaving(true);
                  const refCode = newBankRef.trim() || ('REF-' + Math.floor(100000 + Math.random() * 900000));
                  try {
                    await resubmitPaymentReceipt(await receiptFileToDataUrl(newReceiptFile), refCode);
                  } catch (error) {
                    setReceiptUploadError(error instanceof Error ? error.message : 'Could not read receipt.');
                    return;
                  } finally { setReceiptSaving(false); }
                  setShowResubmitModal(false);
                }}
                className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'إعادة إرسال الإيصال للاعتماد' : 'Resubmit Receipt'}</span>
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}

        {/* TEACHER REVIEWS MODAL */}
        {modalReviewsTeacher && (
          <TeacherReviewsModal
            teacher={modalReviewsTeacher}
            isOpen={!!modalReviewsTeacher}
            onClose={() => setModalReviewsTeacher(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <StudentDashboardContent />
    </AuthGuard>
  );
}
