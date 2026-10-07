'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { AuthGuard } from '@/components/AuthGuard';
import {
  GraduationCap,
  Users,
  Calendar,
  Star,
  ArrowRight,
} from 'lucide-react';

function AdminTeacherDetailsContent() {
  const params = useParams();
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
    l.teacherId === teacher.id
  );

  // Assigned students to this teacher
  const assignedStudentAccounts = userAccounts.filter(a => {
    if (a.role !== 'STUDENT') return false;
    const prof = a.studentProfile;
    if (prof?.assignedTeacherId === teacher.id) return true;
    const hasLesson = lessons.some(l => l.studentId === a.id && l.teacherId === teacher.id);
    if (hasLesson) return true;
    return false;
  });

  // Calculate stats dynamically from state & database records
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

  const completedThisMonthCount = teacherLessons.filter(l =>
    l.status === 'COMPLETED' && l.date.startsWith(currentMonthStr)
  ).length;

  const completedLessonsInState = teacherLessons.filter(l => l.status === 'COMPLETED').length;
  const completedAllTimeCount = completedLessonsInState;

  const teacherReviews = reviews.filter(r => r.teacherId === teacher.id);

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">

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

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-950">{isAr ? teacher.nameAr : teacher.nameEn}</h1>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${teacher.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                    {teacher.approvalStatus === 'APPROVED' ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'قيد المراجعة' : 'Pending review')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{isAr ? teacher.titleAr : teacher.titleEn}</p>
                <p className="mt-1 text-xs text-slate-500">{teacher.experienceYears} {isAr ? 'سنوات خبرة' : 'years experience'} · {teacher.languagesSpoken.join(' · ')}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-600 sm:text-right">
              <p>{teacher.email || '—'}</p>
              <p>{teacher.phone || '—'}</p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">{isAr ? 'الإجازة والسند' : 'Ijazah and chain'}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}</p>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{isAr ? 'نبذة وتخصصات' : 'About and specialties'}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{isAr ? (teacher.bioAr || 'لم تُضف نبذة بعد.') : (teacher.bioEn || teacher.bioAr || 'No biography added yet.')}</p>
              <p className="mt-1 text-xs text-slate-500">{(isAr ? teacher.specializationsAr : teacher.specializationsEn).join(' · ') || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{isAr ? 'الطلاب' : 'Students'}</p><p className="mt-1 text-lg font-black text-slate-900">{assignedStudentAccounts.length}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{isAr ? 'التقييم' : 'Rating'}</p><p className="mt-1 text-lg font-black text-slate-900">{teacherReviews.length ? teacher.rating : (isAr ? 'لا توجد تقييمات' : 'No reviews')} <span className="text-xs font-medium text-slate-500">({teacherReviews.length})</span></p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{isAr ? 'حصص مكتملة هذا الشهر' : 'Completed this month'}</p><p className="mt-1 text-lg font-black text-slate-900">{completedThisMonthCount}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{isAr ? 'إجمالي الحصص المكتملة' : 'Completed all time'}</p><p className="mt-1 text-lg font-black text-slate-900">{completedAllTimeCount}</p></div>
          </div>
        </section>

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'CALENDAR'
                  ? 'border-emerald-700 text-emerald-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{isAr ? `الحصص (${teacherLessons.length})` : `Classes (${teacherLessons.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'STUDENTS'
                  ? 'border-emerald-700 text-emerald-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? `الطلاب (${assignedStudentAccounts.length})` : `Students (${assignedStudentAccounts.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'REVIEWS'
                  ? 'border-emerald-700 text-emerald-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>{isAr ? `التقييمات (${teacherReviews.length})` : `Reviews (${teacherReviews.length})`}</span>
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
                    remainingLessons: 16,
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
                    <p className="text-slate-700 italic">&ldquo;{isAr ? rev.commentAr : rev.commentEn}&rdquo;</p>
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

export default function AdminTeacherDetailsPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminTeacherDetailsContent />
    </AuthGuard>
  );
}
