'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { SUBSCRIPTION_GOALS } from '@/data/mockData';
import { getPageMeta } from 'quran-meta/hafs';
import { 
  Target, 
  Edit3, 
  BookOpen, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight,
  Award,
  BookmarkCheck,
  Trophy,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

function calculateExactLessonStats(surahTargetAr?: string) {
  if (!surahTargetAr) return { pages: 0, ayahs: 0 };
  let totalPages = 0;
  let totalAyahs = 0;
  const pageRangeRegex = /صفحات?\s*\(?(\d+)(?:\s*إلى\s*(\d+))?\)?/g;
  let match;
  while ((match = pageRangeRegex.exec(surahTargetAr)) !== null) {
    const startP = parseInt(match[1], 10);
    const endP = match[2] ? parseInt(match[2], 10) : startP;
    if (!isNaN(startP) && startP >= 1 && startP <= 604) {
      const validEndP = !isNaN(endP) && endP >= startP ? Math.min(604, endP) : startP;
      const pagesInChunk = validEndP - startP + 1;
      totalPages += pagesInChunk;
      const firstAyahId = getPageMeta(startP as any).firstAyahId;
      const lastAyahId = getPageMeta(validEndP as any).lastAyahId;
      const ayahsInChunk = Math.max(1, lastAyahId - firstAyahId + 1);
      totalAyahs += ayahsInChunk;
    }
  }
  return { pages: totalPages, ayahs: totalAyahs };
}

export default function StudentPlanOverviewPage() {
  const router = useRouter();
  const { 
    isHydrated,
    language, 
    student, 
    currentUser,
    plans, 
    lessons, 
    teachers 
  } = useApp();
  const isAr = language === 'ar';

  const activePlan = plans.find(p => p.id === (student.activePlanId || student.pendingPlanId)) || plans[1];
  const assignedTeacher = teachers.find(t => t.id === student.assignedTeacherId) || teachers[0];

  // Student lessons isolation & quota calculation
  const currentStudentId = currentUser?.id || student.id;
  const studentLessons = lessons.filter(l => 
    (l.studentId === currentStudentId || 
     (l.studentNameAr && l.studentNameAr === student.nameAr) ||
     (currentUser?.email && l.studentId === currentUser.email.toLowerCase())) && 
    l.status !== 'CANCELLED' &&
    !l.isOrientationSession
  );

  const completedLessons = studentLessons.filter(l => l.status === 'COMPLETED');
  const upcomingLessons = studentLessons.filter(l => l.status === 'SCHEDULED');

  const basePlanLessons = activePlan.lessonsPerMonth;
  const extraClassesCount = student.extraPurchasedClassesCount || 0;
  const totalPlanLessons = basePlanLessons + extraClassesCount;
  
  const actualCompletedCount = completedLessons.length;
  const remainingLessonsCount = Math.max(0, totalPlanLessons - actualCompletedCount);
  const completionPercentage = Math.min(100, Math.round((actualCompletedCount / totalPlanLessons) * 100));

  // Strictly enforce plan quota on displayed classes list (completed + sliced upcoming)
  const displayLessons = useMemo(() => {
    const cappedUpcoming = upcomingLessons.slice(0, remainingLessonsCount);
    return [...completedLessons, ...cappedUpcoming];
  }, [completedLessons, upcomingLessons, remainingLessonsCount]);

  // Goal & Track info
  const goalTrack = student.quranGoal?.track || 'HIFZ';
  const matchingGoal = SUBSCRIPTION_GOALS.find(g => g.id === goalTrack);
  const goalTitle = isAr ? (matchingGoal?.titleAr || 'مسار الحفظ المتقن') : (matchingGoal?.titleEn || 'Quran Memorization Track');
  const targetSummaryText = student.quranGoal?.targetSurahOrJuzAr || 'سورة البقرة (كاملة)';

  // Calculate dynamic stats
  let totalPagesMastered = 0;
  completedLessons.forEach(l => {
    const stats = calculateExactLessonStats(l.surahTargetAr);
    totalPagesMastered += stats.pages;
  });

  const totalLearningHours = ((actualCompletedCount * 30) / 60).toFixed(1);

  if (!isHydrated) {
    return (
      <div className="min-h-screen py-16 bg-slate-50/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">{isAr ? 'جاري تحميل الخطة...' : 'Loading Plan...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 1. TOP HEADER & BREADCRUMB */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Link href="/student/dashboard" className="hover:text-emerald-700 transition-colors">
                {isAr ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-emerald-800 font-extrabold">{isAr ? 'تفاصيل الخطة القرآنية' : 'Quran Plan'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>{isAr ? 'خطتي القرآنية المعتمدة' : 'My Active Quran Plan'}</span>
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full">
                {isAr ? activePlan.titleAr : activePlan.titleEn}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isAr 
                ? 'استعراض شامل لمسارك القرآني، المعلم المشرف، وتوزيع الحصص المكتملة والمتبقية.' 
                : 'Complete overview of your Quran track, supervising instructor, and class distribution.'}
            </p>
          </div>

          {/* EDIT PLAN ACTION BUTTON (Direct link to Plan Builder) */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <Link
              href="/student/plan-builder"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تعديل وتخصيص الخطة' : 'Edit Plan & Goals'}</span>
            </Link>

            <Link
              href="/subscriptions"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'شراء حصة إضافية' : 'Buy Extra Class'}</span>
            </Link>
          </div>
        </div>

        {/* 2. OVERVIEW CARDS: TRACK INFO, TEACHER & STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Quran Track & Goal */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'المسار والهدف القرآني' : 'Quran Goal & Track'}</span>
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">{goalTitle}</h3>
              <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 leading-relaxed">
                {targetSummaryText}
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {isAr 
                ? `نظام الحصص: ${basePlanLessons} حصة أساسية ${extraClassesCount > 0 ? `+ ${extraClassesCount} حصة إضافية` : ''} (30 دقيقة للحصة)` 
                : `${basePlanLessons} base classes ${extraClassesCount > 0 ? `+ ${extraClassesCount} extra` : ''} (30 min each)`}
            </div>
          </div>

          {/* Card 2: Supervising Instructor */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'المعلم المشرف' : 'Supervising Instructor'}</span>
              <UserCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-center gap-3.5">
              <AvatarBadge nameAr={assignedTeacher.nameAr} nameEn={assignedTeacher.nameEn} size="md" />
              <div className="space-y-0.5 min-w-0 flex-1">
                <h4 className="font-black text-sm text-slate-900 truncate">
                  {isAr ? assignedTeacher.nameAr : assignedTeacher.nameEn}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  {isAr ? assignedTeacher.titleAr : assignedTeacher.titleEn}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{assignedTeacher.rating}</span>
                  <span className="text-slate-300">•</span>
                  <span>{isAr ? `الساعات المتاحة: ${assignedTeacher.workingHoursStart || '12:00'} - ${assignedTeacher.workingHoursEnd || '18:00'}` : `Hours: ${assignedTeacher.workingHoursStart} - ${assignedTeacher.workingHoursEnd}`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Classes Progress & Quota */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{isAr ? 'الإنجاز في الخطة' : 'Plan Completion'}</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{actualCompletedCount} / {totalPlanLessons}</span>
                <span className="text-xs font-extrabold text-emerald-700">{completionPercentage}% {isAr ? 'منجز' : 'completed'}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="emerald-gradient-bg h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, completionPercentage)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                <span>{actualCompletedCount} {isAr ? 'حصة مكتملة' : 'completed'}</span>
                <span>{remainingLessonsCount} {isAr ? 'حصة متبقية' : 'remaining'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. CLASS BY CLASS BREAKDOWN (التوزيع والحساب التلقائي لخطة الحصص) */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-6 border border-slate-800 shadow-lg">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-amber-300">
                  {isAr ? 'التوزيع والحساب التلقائي لخطة الحصص (بالصفحات)' : 'Auto-Calculated Class Plan Breakdown'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {isAr 
                    ? `مقسم بالتساوي على (${totalPlanLessons}) حصص [${basePlanLessons} أساسية ${extraClassesCount > 0 ? `+ ${extraClassesCount} إضافية` : ''}] حسب باقتك (${activePlan.titleAr})` 
                    : `Evenly divided across ${totalPlanLessons} classes [${basePlanLessons} base ${extraClassesCount > 0 ? `+ ${extraClassesCount} extra` : ''}] based on ${activePlan.titleEn}`}
                </p>
              </div>
            </div>

            <Link
              href="/student/plan-builder"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تعديل هذا التوزيع' : 'Modify Breakdown'}</span>
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayLessons.map((lesson, idx) => {
              const isCompleted = lesson.status === 'COMPLETED';
              const isExtra = lesson.id.startsWith('les-ext') || 
                (lesson.notes && lesson.notes.includes('إضافية')) || 
                (lesson.surahTargetAr && lesson.surahTargetAr.includes('إضافية')) ||
                (idx + 1 > basePlanLessons);

              return (
                <div 
                  key={lesson.id}
                  className={`p-4 rounded-2xl flex items-start gap-3 transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/40 border-2 border-emerald-500/80 ring-1 ring-emerald-400/30 shadow-xs'
                      : isExtra
                      ? 'bg-slate-800/90 border border-amber-400/60 shadow-xs'
                      : 'bg-slate-800/90 border border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isExtra 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : 'bg-emerald-700/60 text-emerald-200'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-black ${
                          isCompleted 
                            ? 'text-emerald-300' 
                            : isExtra 
                            ? 'text-amber-300' 
                            : 'text-amber-200'
                        }`}>
                          {isAr ? `الحصة ${idx + 1} من ${totalPlanLessons}` : `Class ${idx + 1} of ${totalPlanLessons}`}
                        </span>

                        {isCompleted && (
                          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{isAr ? 'مكتملة' : 'Completed'}</span>
                          </span>
                        )}

                        {isExtra && !isCompleted && (
                          <span className="text-[10px] font-bold text-amber-300/90 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>{isAr ? 'حصة إضافية' : 'Extra'}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-md">
                        {lesson.date}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold leading-relaxed break-words ${
                      isCompleted ? 'text-emerald-100' : 'text-slate-200'
                    }`}>
                      {lesson.surahTargetAr || (isAr ? 'مقرر الحصة' : 'Lesson Target')}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1">
                      <span>{lesson.time} ({lesson.durationMinutes}m)</span>
                      <Link 
                        href={`/classes/${lesson.id}`}
                        className="text-amber-400 hover:text-amber-300 underline font-bold"
                      >
                        {isAr ? 'عرض الحصة' : 'View'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
