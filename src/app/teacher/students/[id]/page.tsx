'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { getQuranTrackTitle } from '@/data/mockData';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Hourglass, 
  Award, 
  Target, 
  Edit3,
  Video,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  CreditCard,
  Grid,
  Filter,
  Check,
  Copy,
  UserCheck
} from 'lucide-react';

export default function DedicatedStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { language, currentUser, student, plans, userAccounts, lessons, updateMeetUrl } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'CLASSES' | 'GOAL' | 'BILLING'>('CLASSES');
  const [classFilter, setClassFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [editingMeetUrlId, setEditingMeetUrlId] = useState<string | null>(null);
  const [tempMeetUrl, setTempMeetUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Find target student account
  const studentAccount = userAccounts.find(a => a.id === studentId || a.studentProfile?.id === studentId);
  const studentProfile = studentAccount?.studentProfile || (student.id === studentId ? student : null);

  if (!studentAccount && !studentProfile) {
    return (
      <div className="py-24 text-center space-y-5 bg-slate-50 min-h-screen">
        <Users className="w-16 h-16 text-slate-300 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">
            {isAr ? 'لم يتم العثور على سجل لهذا الطالب' : 'Student Record Not Found'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            {isAr ? 'تأكد من صحة رابط الصفحة أو اختيار طالب موكل من القائمة.' : 'Verify student ID or select from assigned roster.'}
          </p>
        </div>
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-950 text-amber-400 font-extrabold text-xs shadow-md hover:brightness-110 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{isAr ? 'العودة لقائمة الطلاب الموكلين' : 'Back to Assigned Roster'}</span>
        </Link>
      </div>
    );
  }

  const prof = studentProfile || {
    id: studentAccount?.id || studentId,
    nameAr: studentAccount?.name || 'طالب مجهول',
    nameEn: studentAccount?.name || 'Unknown Student',
    email: studentAccount?.email || '',
    phone: studentAccount?.phone || '+966 50 000 0000',
    verificationStatus: 'VERIFIED' as const,
    activePlanId: 'plan-standard',
    remainingLessons: 8,
    totalLessonsCompleted: 0,
    totalHoursLearned: 0.0,
    subscriptionStartDate: '2026-08-01',
    subscriptionRenewalDate: '2026-09-01',
    assignedTeacherId: 'tech-sulami',
    quranGoal: {
      track: 'COMBINED' as const,
      targetSurahOrJuzAr: 'الحفظ: سورة البقرة | التلاوة: سورة يس',
      agreedWeeklyDaysAr: ['الإثنين', 'الأربعاء'],
      agreedWeeklyDaysEn: ['Monday', 'Wednesday'],
      agreedTimeSlot: '12:00'
    }
  };

  const activePlan = plans.find(p => p.id === (prof.activePlanId || 'plan-standard')) || plans[1];
  const allStudentLessons = lessons.filter(l => l.studentId === prof.id);

  const filteredStudentLessons = allStudentLessons.filter(l => {
    if (classFilter === 'UPCOMING') return l.status === 'SCHEDULED';
    if (classFilter === 'COMPLETED') return l.status === 'COMPLETED';
    return true;
  });

  const handleSaveMeetUrl = (lessonId: string) => {
    if (updateMeetUrl) {
      updateMeetUrl(lessonId, tempMeetUrl);
    }
    setEditingMeetUrlId(null);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="py-10 bg-slate-50/80 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/teacher/dashboard" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'لوحة المعلم' : 'Dashboard'}
            </Link>
            <span>/</span>
            <Link href="/teacher/students" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'إدارة الطلاب' : 'Students'}
            </Link>
            <span>/</span>
            <span className="text-emerald-950 font-black truncate max-w-xs">
              {isAr ? prof.nameAr : prof.nameEn}
            </span>
          </div>

          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all hover:bg-slate-50 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{isAr ? 'العودة لقائمة الطلاب' : 'Back to Roster'}</span>
          </Link>
        </div>

        {/* HERO PROFILE HEADER CARD */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 space-y-6 relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <AvatarBadge nameAr={prof.nameAr} nameEn={prof.nameEn} size="xl" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center text-[10px] font-black shadow-xs ring-2 ring-emerald-950">
                  ✓
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {isAr ? prof.nameAr : prof.nameEn}
                  </h1>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-0.5 rounded-full border border-emerald-500/30">
                    ID: {prof.id}
                  </span>
                  <span className="bg-amber-400 text-emerald-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-2xs">
                    {prof.verificationStatus === 'VERIFIED' ? (isAr ? 'حساب مفعّل' : 'Verified') : (isAr ? 'قيد التفعيل' : 'Pending')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-emerald-200/90 font-medium flex-wrap pt-0.5">
                  <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{prof.email}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{prof.phone || '+966 50 000 0000'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 relative z-10">
              <Link
                href="/student/plan-builder"
                className="px-5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Edit3 className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'تعديل السور والجدول' : 'Edit Plan & Surahs'}</span>
              </Link>
            </div>
          </div>

          {/* 4 STAT WIDGETS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-emerald-800/60 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200/90 font-bold block">{isAr ? 'الباقة المعتمدة' : 'Active Subscription'}</span>
              <p className="font-black text-base text-amber-300 truncate">{activePlan.titleAr}</p>
              <span className="text-[10px] text-slate-300 font-semibold block">{activePlan.priceMonthlySar} ر.س / شهرياً</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200/90 font-bold block">{isAr ? 'الدروس المتبقية' : 'Remaining Classes'}</span>
              <p className="font-black text-base text-white">{prof.remainingLessons} {isAr ? 'دروس متبقية' : 'lessons'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'جاهزة للحضور' : 'Ready to attend'}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200/90 font-bold block">{isAr ? 'الحصص المكتملة' : 'Completed Classes'}</span>
              <p className="font-black text-base text-white">{prof.totalLessonsCompleted || 0} {isAr ? 'حصة متممة' : 'completed'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'تم إنجازها بنجاح' : 'Fulfilled'}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[11px] text-emerald-200/90 font-bold block">{isAr ? 'إجمالي ساعات التعلم' : 'Total Hours Learned'}</span>
              <p className="font-black text-base text-white">{prof.totalHoursLearned || 0.0} {isAr ? 'ساعة' : 'hours'}</p>
              <span className="text-[10px] text-emerald-300 font-semibold block">{isAr ? 'ساعات التسميع المباشر' : 'Direct practice'}</span>
            </div>
          </div>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CLASSES')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'CLASSES'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>{isAr ? `جدول الحصص والقاعات (${allStudentLessons.length})` : `Class Schedule (${allStudentLessons.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('GOAL')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'GOAL'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? 'الهدف القرآني والمقرر' : 'Quran Target Scope'}</span>
            </button>

            <button
              onClick={() => setActiveTab('BILLING')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-xs transition-all cursor-pointer border-b-2 ${
                activeTab === 'BILLING'
                  ? 'border-emerald-700 bg-white text-emerald-950 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span>{isAr ? 'بيانات الاشتراك والتجديد' : 'Subscription & Billing'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CLASSES SCHEDULE & MEET LINKS */}
        {activeTab === 'CLASSES' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            
            {/* Filter Pills */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-black text-lg text-slate-900">
                  {isAr ? 'جدول مواعيد الحصص وروابط قاعات التدريس' : 'Classes Timetable & Live Links'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {isAr ? 'إدارة روابط القاعات وتتبع المواعيد المجدولة والمكتملة للطالب' : 'Manage Google Meet URLs and lesson statuses'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-stretch sm:self-auto justify-end">
                <button
                  onClick={() => setClassFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    classFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? `الكل (${allStudentLessons.length})` : `All (${allStudentLessons.length})`}
                </button>
                <button
                  onClick={() => setClassFilter('UPCOMING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    classFilter === 'UPCOMING' ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? `المجدولة (${allStudentLessons.filter(l => l.status === 'SCHEDULED').length})` : `Scheduled`}
                </button>
                <button
                  onClick={() => setClassFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    classFilter === 'COMPLETED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? `المكتملة (${allStudentLessons.filter(l => l.status === 'COMPLETED').length})` : `Completed`}
                </button>
              </div>
            </div>

            {/* Class Cards Grid */}
            {filteredStudentLessons.length > 0 ? (
              <div className="space-y-4">
                {filteredStudentLessons.map((lesson) => {
                  const isCompleted = lesson.status === 'COMPLETED';
                  const isEditingThis = editingMeetUrlId === lesson.id;
                  const hasMeetLink = lesson.googleMeetUrl && lesson.googleMeetUrl.trim() !== '';

                  return (
                    <div
                      key={lesson.id}
                      className={`p-5 rounded-3xl border transition-all space-y-4 ${
                        isCompleted
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : hasMeetLink
                          ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-base">
                              {lesson.date} • {lesson.time} ({lesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                              isCompleted
                                ? 'bg-emerald-700 text-white'
                                : 'bg-amber-400 text-emerald-950 shadow-2xs'
                            }`}>
                              {isCompleted ? (isAr ? 'حصة مكتملة' : 'Completed') : (isAr ? 'حصة مجدولة' : 'Scheduled')}
                            </span>
                          </div>

                          {lesson.surahTargetAr && (
                            <p className="text-xs text-slate-800 font-bold font-serif leading-relaxed">
                              <span className="text-emerald-900 font-extrabold">{isAr ? 'المقرر:' : 'Scope:'}</span> {lesson.surahTargetAr}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                          {hasMeetLink && !isCompleted && (
                            <a
                              href={lesson.googleMeetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-sm hover:brightness-105 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Video className="w-4 h-4" />
                              <span>{isAr ? 'دخول القاعة المباشرة' : 'Join Google Meet'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Link
                            href={`/classes/${lesson.id}`}
                            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                          >
                            {isAr ? 'تفاصيل الحصة' : 'Details'}
                          </Link>
                        </div>
                      </div>

                      {/* Google Meet Link Edit Bar */}
                      <div className="pt-3 border-t border-slate-100/80">
                        {isEditingThis ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-300">
                            <span className="text-xs font-bold text-emerald-950 shrink-0">{isAr ? 'رابط القاعة الجديد:' : 'New Meet Link:'}</span>
                            <input
                              type="text"
                              value={tempMeetUrl}
                              onChange={(e) => setTempMeetUrl(e.target.value)}
                              placeholder="https://meet.google.com/xxx-xxxx-xxx"
                              className="flex-1 px-3 py-1.5 text-xs border border-emerald-400 rounded-xl bg-white text-slate-900 font-mono shadow-inner"
                            />
                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                              <button
                                onClick={() => handleSaveMeetUrl(lesson.id)}
                                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                              >
                                {isAr ? 'حفظ الرابط' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingMeetUrlId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 cursor-pointer"
                              >
                                {isAr ? 'إلغاء' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400 font-bold">{isAr ? 'رابط لقاء القاعة:' : 'Google Meet URL:'}</span>
                              {hasMeetLink ? (
                                <a
                                  href={lesson.googleMeetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-emerald-700 underline font-extrabold hover:text-emerald-900 truncate max-w-sm"
                                >
                                  {lesson.googleMeetUrl}
                                </a>
                              ) : (
                                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  {isAr ? 'لم يقم المعلم بإضافة رابط القاعة بعد (الزر معطل لدى الطالب)' : 'Meet link not added by teacher yet'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0">
                              {hasMeetLink && (
                                <button
                                  onClick={() => handleCopyLink(lesson.googleMeetUrl, lesson.id)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedId === lesson.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700">{isAr ? 'تم النسخ' : 'Copied'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingMeetUrlId(lesson.id);
                                  setTempMeetUrl(lesson.googleMeetUrl || '');
                                }}
                                className="px-3 py-1 bg-emerald-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                {hasMeetLink ? (isAr ? 'تعديل الرابط' : 'Edit Link') : (isAr ? '+ إضافة رابط القاعة' : '+ Add Meet Link')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500 font-bold bg-slate-50 rounded-3xl border border-slate-200/60 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p>{isAr ? 'لا توجد حصص تطابق التصفية المحددة لهذا الطالب.' : 'No classes matching filter for this student.'}</p>
                <Link
                  href="/student/plan-builder"
                  className="inline-block text-emerald-700 font-bold hover:underline pt-1"
                >
                  {isAr ? '+ جدولة حصص جديدة وتحديث السور' : '+ Build Custom Plan'}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QURAN GOAL & SCOPE */}
        {activeTab === 'GOAL' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {isAr ? 'الهدف القرآني والمنهج المعتمد' : 'Quran Target & Pedagogy Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'خطة السور، الأجزاء، وأيام التسميع الأسبوعية' : 'Surahs and memorization scope details'}
                  </p>
                </div>
              </div>

              <Link
                href="/student/plan-builder"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'تعديل الخطة بالسور' : 'Edit Surah Plan'}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Surahs Box */}
              <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">{isAr ? 'المقرر والسور المحددة:' : 'Target Surahs / Scope:'}</span>
                <p className="font-bold text-slate-900 text-base font-serif leading-relaxed">
                  {prof.quranGoal?.targetSurahOrJuzAr || 'لم يتم تحديد السور بعد'}
                </p>
                <div className="text-xs text-slate-600 font-medium border-t border-emerald-200/80 pt-2">
                  {isAr ? 'ملاحظات المعلم:' : 'Scholar Notes:'} يتم توزيع السور على الحصص تلقائياً حسب الفهرس القرآني المعتمد.
                </div>
              </div>

              {/* Track & Days Box */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">{isAr ? 'مسار الخطة القرآني:' : 'Quran Track:'}</span>
                  <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200">
                    {getQuranTrackTitle(prof.quranGoal?.track, isAr)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{isAr ? 'أيام التسميع الأسبوعية:' : 'Agreed Days:'}</span>
                  <span className="font-extrabold text-emerald-800">
                    {prof.quranGoal?.agreedWeeklyDaysAr?.join(' • ') || 'الإثنين والأربعاء'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{isAr ? 'توقيت الحصة المعتمد:' : 'Time Slot:'}</span>
                  <span className="font-extrabold text-slate-900">
                    {prof.quranGoal?.agreedTimeSlot || '12:00 م'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTION & BILLING */}
        {activeTab === 'BILLING' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {isAr ? 'تفاصيل الاشتراك والدورة المالية' : 'Subscription & Billing History'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'بيانات الباقة، تاريخ التجديد، والحسابات المالية' : 'Monthly subscription cycle details'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-bold block">{isAr ? 'الباقة الفعالة:' : 'Active Plan:'}</span>
                <h5 className="font-extrabold text-slate-900 text-sm">{activePlan.titleAr}</h5>
                <p className="text-slate-600">{activePlan.priceMonthlySar} ر.س / شهرياً</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-bold block">{isAr ? 'تاريخ بداية الاشتراك:' : 'Start Date:'}</span>
                <h5 className="font-extrabold text-slate-900 text-sm">{prof.subscriptionStartDate || '2026-08-01'}</h5>
                <p className="text-slate-500">{isAr ? 'تفعيل الدورة الحالية' : 'Current cycle start'}</p>
              </div>

              <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <span className="text-emerald-800 font-bold block">{isAr ? 'تاريخ التجديد القادم:' : 'Next Renewal:'}</span>
                <h5 className="font-black text-emerald-950 text-sm">{prof.subscriptionRenewalDate || '2026-09-01'}</h5>
                <p className="text-emerald-700 font-semibold">{isAr ? 'تجديد تلقائي قائم' : 'Active renewal'}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
