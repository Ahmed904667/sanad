'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Star, 
  Award, 
  ArrowRight, 
  Mail, 
  Phone, 
  Video, 
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Check,
  Building2
} from 'lucide-react';

export default function AdminTeacherDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const { language, teachers, userAccounts, lessons, reviews, plans } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'STUDENTS' | 'REVIEWS'>('CALENDAR');

  // Find target teacher object
  const teacher = teachers.find(t => t.id === teacherId);

  if (!teacher) {
    return (
      <div className="py-24 text-center space-y-4 bg-slate-50 min-h-screen">
        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900">
          {isAr ? 'لم يتم العثور على معلم بهذا المعرّف' : 'Teacher Not Found'}
        </h2>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-950 text-amber-400 font-extrabold text-xs shadow-md"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{isAr ? 'العودة لمركز تحكم الإدارة' : 'Back to Admin Control Center'}</span>
        </Link>
      </div>
    );
  }

  // Teacher-specific lessons
  const teacherLessons = lessons.filter(l => 
    l.teacherId === teacher.id || 
    l.teacherNameAr === teacher.nameAr || 
    l.teacherNameEn === teacher.nameEn
  );

  // Assigned students to this teacher
  const assignedStudentAccounts = userAccounts.filter(a => {
    if (a.role !== 'STUDENT') return false;
    const prof = a.studentProfile;
    if (prof?.assignedTeacherId === teacher.id) return true;
    const hasLesson = lessons.some(l => l.studentId === a.id && l.teacherId === teacher.id);
    if (hasLesson) return true;
    if (!prof?.assignedTeacherId && teacher.id === 'tech-sulami') return true;
    return false;
  });

  // Calculate stats dynamically from state & database records
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  
  const completedThisMonthCount = teacherLessons.filter(l => 
    l.status === 'COMPLETED' && l.date.startsWith(currentMonthStr)
  ).length;

  const completedLessonsInState = teacherLessons.filter(l => l.status === 'COMPLETED').length;
  const completedFromStudentProfiles = assignedStudentAccounts.reduce((sum, acc) => {
    return sum + (acc.studentProfile?.totalLessonsCompleted || 0);
  }, 0);
  const completedAllTimeCount = completedLessonsInState + completedFromStudentProfiles;

  // Pages of Quran read under this teacher's supervision (Calculated dynamically)
  const totalPagesReadCount = useMemo(() => {
    let pages = 0;
    
    // Add pages from completed lessons in database/state
    teacherLessons.forEach(l => {
      if (l.status === 'COMPLETED') {
        if (l.surahTargetAr && l.surahTargetAr.includes('صفحة')) {
          const match = l.surahTargetAr.match(/\d+/);
          if (match) {
            pages += parseInt(match[0], 10);
            return;
          }
        }
        pages += Math.round((l.durationMinutes || 30) / 7.5); // ~4 pages per 30 mins
      }
    });

    // Add pages from assigned student total hours learned (8 pages per hour)
    assignedStudentAccounts.forEach(acc => {
      const hours = acc.studentProfile?.totalHoursLearned || 0;
      pages += Math.round(hours * 8);
    });

    return pages;
  }, [teacherLessons, assignedStudentAccounts]);

  const teacherReviews = reviews.filter(r => r.teacherId === teacher.id);

  return (
    <div className="py-10 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/admin/dashboard" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'لوحة تحكم الإدارة' : 'Admin Control'}
            </Link>
            <span>/</span>
            <span className="text-slate-400">{isAr ? 'دليل المعلمين' : 'Teachers'}</span>
            <span>/</span>
            <span className="text-emerald-950 font-black truncate max-w-xs">
              {isAr ? teacher.nameAr : teacher.nameEn}
            </span>
          </div>

          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all hover:bg-slate-50 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{isAr ? 'العودة لمركز الإدارة' : 'Back to Control Center'}</span>
          </Link>
        </div>

        {/* HERO TEACHER PROFILE CARD (ADMIN VIEW) */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-5">
              <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="xl" />

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    {isAr ? teacher.nameAr : teacher.nameEn}
                  </h1>
                  <span className="bg-amber-400 text-emerald-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-2xs">
                    {teacher.approvalStatus === 'APPROVED' ? (isAr ? 'معلم معتمد' : 'Approved') : (isAr ? 'قيد المراجعة' : 'Pending')}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-0.5 rounded-full border border-emerald-500/30">
                    ID: {teacher.id}
                  </span>
                </div>

                <p className="text-xs text-amber-300 font-bold">
                  {isAr ? teacher.titleAr : teacher.titleEn}
                </p>

                <p className="text-xs text-emerald-200/90 font-medium">
                  {teacher.email} • {teacher.languagesSpoken.join(' • ')} • {teacher.experienceYears} {isAr ? 'سنوات خبرة' : 'years experience'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs space-y-1 self-stretch md:self-auto min-w-[220px]">
              <span className="text-emerald-200 font-bold block">{isAr ? 'تفاصيل السند بالإجازة:' : 'Ijazah Chain:'}</span>
              <p className="text-amber-200 font-serif font-bold text-[11px] leading-relaxed">
                {isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}
              </p>
            </div>
          </div>

          {/* 5 DETAILED STAT METRICS GRID FOR ADMIN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 border-t border-emerald-800/60 relative z-10">
            
            {/* 1. Assigned Students */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200 font-bold block">{isAr ? 'الطلاب الموكلون' : 'Assigned Students'}</span>
              <p className="font-black text-xl text-amber-300">{assignedStudentAccounts.length} {isAr ? 'طالب' : 'students'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'تحت الإشراف المباشر' : 'Active roster'}</span>
            </div>

            {/* 2. Rating */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200 font-bold block">{isAr ? 'التقييم العام' : 'Teacher Rating'}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-black text-xl text-white">{teacher.rating}</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold block">({teacher.reviewsCount} {isAr ? 'تقييم طالب' : 'reviews'})</span>
            </div>

            {/* 3. Monthly Completed Classes */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200 font-bold block">{isAr ? 'حصص الشهر الحالي' : 'Classes (This Month)'}</span>
              <p className="font-black text-xl text-white">{completedThisMonthCount} {isAr ? 'حصة مكتملة' : 'completed'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'الشهر الحالي' : 'Current month'}</span>
            </div>

            {/* 4. All-Time Completed Classes */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200 font-bold block">{isAr ? 'إجمالي الحصص كلياً' : 'All-Time Completed'}</span>
              <p className="font-black text-xl text-white">{completedAllTimeCount} {isAr ? 'حصة' : 'classes'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'منذ انضمام المعلم' : 'Since joining'}</span>
            </div>

            {/* 5. Quran Pages Read by Students */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-emerald-200 font-bold block">{isAr ? 'صفحات المصحف المقروءة' : 'Pages Recited'}</span>
              <p className="font-black text-xl text-amber-300">{totalPagesReadCount} {isAr ? 'صفحة' : 'pages'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'مُسمّعة ومصححة' : 'Recited & verified'}</span>
            </div>

          </div>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'CALENDAR'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{isAr ? `جدول وتقويم المعلم (${teacherLessons.length})` : `Teacher Calendar (${teacherLessons.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'STUDENTS'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? `الطلاب الموكلون للمعلم (${assignedStudentAccounts.length})` : `Assigned Students (${assignedStudentAccounts.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'REVIEWS'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>{isAr ? `التقييمات والملاحظات (${teacherReviews.length})` : `Reviews (${teacherReviews.length})`}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TEACHER CALENDAR FOR ADMIN */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? `جدول حصص فضيلة الشيخ: ${teacher.nameAr}` : `Class Timetable for ${teacher.nameEn}`}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {isAr ? 'عرض الحصص المجدولة والمكتملة الخاصة بهذا المعلم مع صلاحية إدارة روابط القاعات' : 'Teacher-specific timetable with full Meet URL access'}
                </p>
              </div>

              <span className="bg-emerald-950 text-amber-400 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs">
                {teacherLessons.length} {isAr ? 'حصة في الجدول' : 'classes'}
              </span>
            </div>

            {/* Teacher Calendar Render */}
            <ClassCalendar lessons={teacherLessons} userRole="ADMIN" />
          </div>
        )}

        {/* TAB 2: ASSIGNED STUDENTS LIST UNDER THIS TEACHER */}
        {activeTab === 'STUDENTS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {isAr ? `قائمة الطلاب الموكلين لفضيلة المعلم (${assignedStudentAccounts.length})` : `Assigned Students Roster (${assignedStudentAccounts.length})`}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'الطلاب المسجلون تحت إشراف هذا المعلم ومتابعة تقدمهم' : 'Students under this scholar\'s supervision'}
                  </p>
                </div>
              </div>
            </div>

            {assignedStudentAccounts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {assignedStudentAccounts.map((acc) => {
                  const prof = acc.studentProfile || {
                    id: acc.id,
                    nameAr: acc.name,
                    nameEn: acc.name,
                    email: acc.email,
                    phone: acc.phone,
                    activePlanId: 'plan-standard',
                    remainingLessons: 8,
                    verificationStatus: 'VERIFIED' as const,
                    quranGoal: { targetSurahOrJuzAr: 'سورة البقرة والجزء الثلاثون' }
                  };

                  const planId = prof.activePlanId || 'plan-standard';
                  const plan = plans.find(p => p.id === planId) || plans[1];

                  return (
                    <div
                      key={acc.id}
                      className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <AvatarBadge nameAr={acc.name} nameEn={acc.name} size="lg" />
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-slate-900">
                              {acc.name}
                            </h4>
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px]">
                              ID: {acc.id}
                            </span>
                          </div>

                          <p className="text-slate-500 font-medium">
                            {acc.email} • {acc.phone || '+966 50 000 0000'}
                          </p>

                          <div className="flex items-center gap-2 pt-1 text-xs">
                            <span className="bg-white text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                              {plan.titleAr}
                            </span>
                            <span className="text-emerald-800 font-bold">
                              {prof.remainingLessons ?? 8} {isAr ? 'دروس متبقية' : 'lessons left'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-right hidden sm:block">
                          <span className="text-slate-400 font-bold block text-[10px]">{isAr ? 'الهدف القرآني:' : 'Target:'}</span>
                          <span className="font-extrabold text-emerald-950 font-serif">{prof.quranGoal?.targetSurahOrJuzAr || 'سورة البقرة'}</span>
                        </div>

                        <Link
                          href={`/teacher/students/${acc.id}`}
                          className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center gap-1"
                        >
                          <span>{isAr ? 'عرض ملف الطالب الكامل ↗' : 'View Profile ↗'}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                {isAr ? 'لا يوجد طلاب موكلون لهذا المعلم حالياً.' : 'No students assigned to this teacher currently.'}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEACHER REVIEWS & FEEDBACK */}
        {activeTab === 'REVIEWS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {isAr ? `تقييمات وآراء الطلاب (${teacherReviews.length})` : `Student Reviews (${teacherReviews.length})`}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'انطباعات الطلاب وتقييم أداء المعلم' : 'Student feedback and star ratings'}
                  </p>
                </div>
              </div>
            </div>

            {teacherReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacherReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-slate-900">{rev.studentNameAr}</h5>
                      <div className="flex items-center gap-1 text-amber-500 font-black">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 italic">"{isAr ? rev.commentAr : rev.commentEn}"</p>
                    <span className="text-[10px] text-slate-400 block">{rev.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                {isAr ? 'لا توجد تقييمات مسجلة لهذا المعلم بعد.' : 'No reviews recorded for this teacher yet.'}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
