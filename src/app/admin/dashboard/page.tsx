'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { UserAccount, Role } from '@/types';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Search, 
  Star, 
  FileText,
  DollarSign,
  Calendar,
  UserPlus,
  Ban,
  Unlock,
  Video,
  ExternalLink,
  Plus,
  X,
  Filter,
  Eye,
  Check,
  Clock,
  Sparkles,
  Lock,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    language, 
    currentUser, 
    teachers, 
    student, 
    userAccounts,
    plans,
    lessons,
    approveTeacherByAdmin, 
    rejectTeacherByAdmin,
    approveStudentPayment,
    rejectStudentPayment,
    toggleBlockAccount,
    createAccountByAdmin,
    updateMeetUrl
  } = useApp();
  const isAr = language === 'ar';

  const [mainTab, setMainTab] = useState<'CALENDAR' | 'ACCOUNTS' | 'RECEIPTS' | 'TEACHERS'>('RECEIPTS');
  
  // Account Management States
  const [accountRoleFilter, setAccountRoleFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('ALL');
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('123456');
  const [newAccRole, setNewAccRole] = useState<Role>('STUDENT');
  const [newAccGender, setNewAccGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newAccPhone, setNewAccPhone] = useState('+966 50 ');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // All Classes Search / Filter State
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');

  // Rejection Reason Modal State
  const [rejectingStudent, setRejectingStudent] = useState<{ id: string; name: string } | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('إيصال التحويل البنكي غير واضح أو الصورة تالفة');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');

  const PRESET_REJECTION_REASONS = [
    'إيصال التحويل البنكي غير واضح أو الصورة تالفة',
    'المبلغ المحول غير مطابق لسعر الباقة المختارة',
    'إيصال التحويل مكرر وتم استخدامه سابقاً',
    'اسم المحول ورقم الحساب غير متطابق مع بيانات الطالب',
    'أخرى (كتابة سبب مخصص)'
  ];

  const pendingTeachers = teachers.filter(t => t.approvalStatus === 'PENDING_ADMIN');
  const approvedTeachers = teachers.filter(t => t.approvalStatus === 'APPROVED');
  const studentAccounts = userAccounts.filter(a => a.role === 'STUDENT');
  const teacherAccounts = userAccounts.filter(a => a.role === 'TEACHER');
  const adminAccounts = userAccounts.filter(a => a.role === 'ADMIN');
  const totalStudentsCount = Math.max(studentAccounts.length, 1);

  // Pending student payments/receipts & onboarding applications
  const pendingStudentsList = userAccounts
    .filter(a => a.role === 'STUDENT' && (
      a.studentProfile?.verificationStatus === 'PENDING_VERIFICATION' || 
      Boolean(a.studentProfile?.pendingPlanId) ||
      a.studentProfile?.subscriptionChangeType === 'NEW'
    ))
    .map(a => a.studentProfile!)
    .concat(
      (student.verificationStatus === 'PENDING_VERIFICATION' || Boolean(student.pendingPlanId) || student.subscriptionChangeType === 'NEW') && 
      !userAccounts.some(a => a.id === student.id && (a.studentProfile?.verificationStatus === 'PENDING_VERIFICATION' || Boolean(a.studentProfile?.pendingPlanId)))
        ? [student]
        : []
    );

  const pendingStudentsCount = pendingStudentsList.length;

  // Dynamic revenue calculation from active student plans
  const totalRevenueSar = studentAccounts.reduce((sum, acc) => {
    const planId = acc.studentProfile?.activePlanId || acc.studentProfile?.pendingPlanId || 'plan-standard';
    const plan = plans.find(p => p.id === planId) || plans[1];
    return sum + (plan.priceMonthlySar || 240);
  }, 0);

  // Filtered Accounts
  const filteredAccounts = userAccounts.filter(acc => {
    if (accountRoleFilter !== 'ALL' && acc.role !== accountRoleFilter) return false;
    if (accountSearchQuery.trim()) {
      const q = accountSearchQuery.toLowerCase();
      return acc.name.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q) || acc.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered System Lessons for Admin View
  const filteredSystemLessons = lessons.filter(l => {
    if (selectedTeacherFilter !== 'ALL' && l.teacherId !== selectedTeacherFilter) return false;
    if (classSearchQuery.trim()) {
      const q = classSearchQuery.toLowerCase();
      return l.studentNameAr.toLowerCase().includes(q) || 
             l.teacherNameAr.toLowerCase().includes(q) || 
             l.date.includes(q) ||
             (l.surahTargetAr && l.surahTargetAr.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) return;

    const newId = newAccRole === 'STUDENT' ? `std-${Math.floor(1000 + Math.random() * 9000)}`
                : newAccRole === 'TEACHER' ? `tech-${Math.floor(1000 + Math.random() * 9000)}`
                : `adm-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAccObj: UserAccount = {
      id: newId,
      name: newAccName.trim(),
      email: newAccEmail.trim().toLowerCase(),
      password: newAccPassword.trim() || '123456',
      role: newAccRole,
      gender: newAccGender,
      phone: newAccPhone,
      isBlocked: false,
      studentProfile: newAccRole === 'STUDENT' ? {
        id: newId,
        nameAr: newAccName.trim(),
        nameEn: newAccName.trim(),
        email: newAccEmail.trim().toLowerCase(),
        phone: newAccPhone,
        gender: newAccGender,
        verificationStatus: 'VERIFIED',
        activePlanId: 'plan-standard',
        remainingLessons: 8,
        totalLessonsCompleted: 0,
        totalHoursLearned: 0.0,
        assignedTeacherId: 'tech-sulami',
        quranGoal: {
          track: 'COMBINED',
          targetSurahOrJuzAr: 'الحفظ: سورة البقرة | التلاوة: سورة يس',
          targetSurahOrJuzEn: 'Hifz: Surah Al-Baqarah | Tilawah: Surah Ya-Sin',
          orientationCompleted: true,
          agreedWeeklyDaysAr: ['الإثنين', 'الأربعاء'],
          agreedWeeklyDaysEn: ['Monday', 'Wednesday'],
          agreedTimeSlot: '12:00'
        }
      } : undefined
    };

    createAccountByAdmin(newAccObj);
    setCreateSuccessMsg(isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
    setTimeout(() => {
      setCreateSuccessMsg('');
      setIsCreateAccountModalOpen(false);
      setNewAccName('');
      setNewAccEmail('');
    }, 1500);
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/40">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 shadow-md shrink-0">
              <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{isAr ? 'مركز التحكم الشامل بالمنصة (Super Admin)' : 'Super Admin Control Center'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {isAr ? 'مرحباً، مدير منصة سَنَد' : 'Platform Control Center'}
              </h1>
              <p className="text-emerald-200/80 text-xs sm:text-sm font-medium">
                {isAr ? 'إدارة جميع الحصص، الحسابات (حظر/إنشاء)، واعتماد الاشتراكات للمعلمين والطلاب.' : 'Full access to all system classes, user accounts, and subscription approvals.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateAccountModalOpen(true)}
              className="px-5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? '+ إنشاء حساب جديد' : '+ Create User Account'}</span>
            </button>
          </div>
        </div>

        {/* PENDING APPLICATIONS ALERT BANNER */}
        {pendingStudentsCount > 0 && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-amber-950">
                  {isAr ? `تنبيه: يوجد ${pendingStudentsCount} طلب اشتراك جديد في انتظار الاعتماد!` : `${pendingStudentsCount} New Subscription Requests Awaiting Approval!`}
                </h4>
                <p className="text-xs text-amber-800/90 font-medium">
                  {isAr ? 'قام الطلاب بالتسجيل ورفع إيصال التحويل، في انتظار اعتماد الإدارة لتفعيل الخطة والجداول.' : 'Students have signed up & uploaded receipts. Verification is required to activate classes.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMainTab('RECEIPTS')}
              className="px-5 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 text-xs font-black shrink-0 hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'مراجعة الطلبات والاعتماد ↗' : 'Review Applications ↗'}</span>
            </button>
          </div>
        )}

        {/* SYSTEM KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'إجمالي حصص النظام:' : 'Total System Classes:'}</span>
              <span className="text-3xl font-black text-emerald-950">{lessons.length}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'إجمالي حسابات الأعضاء:' : 'Total User Accounts:'}</span>
              <span className="text-3xl font-black text-slate-900">{userAccounts.length}</span>
              <span className="text-[10px] text-slate-500 font-semibold block">{studentAccounts.length} طالب • {teacherAccounts.length} معلم</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-300 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'طلبات الاشتراكات المعلقة:' : 'Pending Approvals:'}</span>
              <span className="text-3xl font-black text-amber-600">{pendingStudentsCount + pendingTeachers.length}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'إيرادات الاشتراكات (SAR):' : 'Total Revenue (SAR):'}</span>
              <span className="text-3xl font-black text-emerald-800">{totalRevenueSar} ر.س</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* PRIMARY TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setMainTab('CALENDAR')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'CALENDAR'
                ? 'bg-emerald-950 text-amber-400 shadow-md ring-2 ring-emerald-800'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{isAr ? `تقويم وجدول جميع حصص النظام (${lessons.length})` : `All Classes Calendar (${lessons.length})`}</span>
          </button>

          <button
            onClick={() => setMainTab('ACCOUNTS')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'ACCOUNTS'
                ? 'bg-emerald-950 text-amber-400 shadow-md ring-2 ring-emerald-800'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{isAr ? `إدارة كافة الحسابات والتعطيل (${userAccounts.length})` : `Manage Accounts (${userAccounts.length})`}</span>
          </button>

          <button
            onClick={() => setMainTab('RECEIPTS')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'RECEIPTS'
                ? 'gold-gradient-bg text-emerald-950 shadow-md ring-2 ring-amber-300'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isAr ? 'اعتماد إيصالات الطلاب' : 'Subscription Receipts'}</span>
            {pendingStudentsCount > 0 && (
              <span className="bg-emerald-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pendingStudentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('TEACHERS')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'TEACHERS'
                ? 'emerald-gradient-bg text-white shadow-md ring-2 ring-emerald-300'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isAr ? 'اعتماد المعلمين' : 'Teacher Approvals'}</span>
            {pendingTeachers.length > 0 && (
              <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pendingTeachers.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: SYSTEM ALL CLASSES CALENDAR & TIMETABLE (FULL ADMIN ACCESS) */}
        {mainTab === 'CALENDAR' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Search & Teacher Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث باسم الطالب أو المعلم أو السورة...' : 'Search student, teacher, or surah...'}
                    className="w-full pl-4 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isAr ? 'جميع المعلمين' : 'All Teachers'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 font-bold">
                {isAr ? `يعرض ${filteredSystemLessons.length} حصة من أصل ${lessons.length}` : `Showing ${filteredSystemLessons.length} of ${lessons.length} classes`}
              </div>
            </div>

            {/* Interactive System Calendar */}
            <ClassCalendar lessons={filteredSystemLessons} userRole="ADMIN" />
          </div>
        )}

        {/* TAB 2: MANAGE ACCOUNTS (CREATE & BLOCK USER ACCOUNTS) */}
        {mainTab === 'ACCOUNTS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-black text-lg text-slate-900">
                  {isAr ? 'سجل حسابات منصة سَنَد والتحكم في الوصول' : 'User Accounts Directory & Access Control'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {isAr ? 'إمكانية حظر أو إلغاء حظر الحسابات، وإنشاء حسابات جديدة مباشرة' : 'Block or unblock user accounts and create new accounts'}
                </p>
              </div>

              <button
                onClick={() => setIsCreateAccountModalOpen(true)}
                className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? '+ إضافة حساب جديد' : '+ Add Account'}</span>
              </button>
            </div>

            {/* Role Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                <button
                  onClick={() => setAccountRoleFilter('ALL')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    accountRoleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {isAr ? `الكل (${userAccounts.length})` : `All (${userAccounts.length})`}
                </button>
                <button
                  onClick={() => setAccountRoleFilter('STUDENT')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    accountRoleFilter === 'STUDENT' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {isAr ? `الطلاب (${studentAccounts.length})` : `Students (${studentAccounts.length})`}
                </button>
                <button
                  onClick={() => setAccountRoleFilter('TEACHER')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    accountRoleFilter === 'TEACHER' ? 'bg-amber-500 text-emerald-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {isAr ? `المعلمون (${teacherAccounts.length})` : `Teachers (${teacherAccounts.length})`}
                </button>
                <button
                  onClick={() => setAccountRoleFilter('ADMIN')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    accountRoleFilter === 'ADMIN' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {isAr ? `الإدارة (${adminAccounts.length})` : `Admins (${adminAccounts.length})`}
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
                  className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Accounts Table / Cards Grid */}
            {filteredAccounts.length > 0 ? (
              <div className="space-y-3">
                {filteredAccounts.map((acc) => {
                  const isBlocked = acc.isBlocked || acc.studentProfile?.verificationStatus === 'PAUSED' || acc.studentProfile?.verificationStatus === 'CANCELLED';

                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isBlocked
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <AvatarBadge nameAr={acc.name} nameEn={acc.name} size="md" />
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {acc.name}
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                              acc.role === 'ADMIN' ? 'bg-slate-900 text-amber-300' :
                              acc.role === 'TEACHER' ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {acc.role === 'ADMIN' ? 'مدير نظام' : acc.role === 'TEACHER' ? 'معلم مجاز' : 'طالب'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isBlocked ? 'bg-red-600 text-white' : 'bg-emerald-700 text-white'
                            }`}>
                              {isBlocked ? (isAr ? 'محظور' : 'Blocked') : (isAr ? 'مفعل' : 'Active')}
                            </span>
                          </div>

                          <p className="text-slate-500 font-medium">
                            ID: {acc.id} • {acc.email} • {acc.phone || '+966 50 000 0000'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end pt-2 md:pt-0">
                        {/* Profile Link for Students */}
                        {acc.role === 'STUDENT' && (
                          <>
                            {acc.studentProfile?.verificationStatus === 'PENDING_VERIFICATION' && (
                              <button
                                onClick={() => setMainTab('RECEIPTS')}
                                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Building2 className="w-3.5 h-3.5 text-amber-800" />
                                <span>{isAr ? 'اعتماد الإيصال ↗' : 'Approve Receipt ↗'}</span>
                              </button>
                            )}
                            <Link
                              href={`/teacher/students/${acc.id}`}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
                            >
                              {isAr ? 'عرض الملف' : 'View Profile'}
                            </Link>
                          </>
                        )}

                        {/* Profile Link for Teachers */}
                        {acc.role === 'TEACHER' && (
                          <Link
                            href={`/admin/teachers/${acc.id}`}
                            className="px-3.5 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs transition-all shadow-xs hover:brightness-105 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAr ? 'عرض المعلم والجدول ↗' : 'View Teacher Profile ↗'}</span>
                          </Link>
                        )}

                        {/* BLOCK / UNBLOCK TOGGLE BUTTON */}
                        <button
                          onClick={() => toggleBlockAccount(acc.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            isBlocked
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إلغاء الحظر والتفعيل' : 'Unblock Account'}</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>{isAr ? 'حظر وتجميد الحساب' : 'Block Account'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                {isAr ? 'لا توجد حسابات تطابق البحث المحدد.' : 'No user accounts found.'}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENT SUBSCRIPTIONS & RECEIPTS APPROVAL */}
        {mainTab === 'RECEIPTS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-emerald-950 font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-emerald-950">
                    {isAr ? 'مركز اعتماد اشتراكات وإيصالات الطلاب (Admin Verification)' : 'Student Subscription Approvals'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? 'مراجعة إيصال التحويل البنكي لكل طالب واعتماد الحصص الشهرية مباشرة.' : 'Verify student bank transfer receipts to activate class allowances.'}
                  </p>
                </div>
              </div>
            </div>

            {pendingStudentsCount > 0 ? (
              <div className="space-y-4">
                {pendingStudentsList.map(st => {
                  const targetPlan = plans.find(p => p.id === (st.pendingPlanId || st.activePlanId)) || plans[1];
                  const targetTeacher = teachers.find(t => t.id === st.assignedTeacherId) || teachers[0];

                  return (
                    <div key={st.id} className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 space-y-4 shadow-xs">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <AvatarBadge nameAr={st.nameAr} nameEn={st.nameEn} size="lg" />
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-base text-slate-900">
                                {isAr ? st.nameAr : st.nameEn}
                              </h4>
                              <span className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                                st.subscriptionChangeType === 'EXTRA_CLASS'
                                  ? 'bg-purple-100 text-purple-950 border border-purple-300'
                                  : st.subscriptionChangeType === 'UPGRADE_NEXT_MONTH'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : st.subscriptionChangeType === 'DOWNGRADE_NEXT_MONTH'
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : st.subscriptionChangeType === 'RENEWAL'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'bg-amber-200 text-amber-900'
                              }`}>
                                {st.subscriptionChangeType === 'EXTRA_CLASS' && (isAr ? 'طلب شراء حصة إضافية (20 ر.س)' : 'Extra Class (20 SAR)')}
                                {st.subscriptionChangeType === 'UPGRADE_NEXT_MONTH' && (isAr ? 'ترقية للشهر القادم' : 'Upgrade Next Month')}
                                {st.subscriptionChangeType === 'DOWNGRADE_NEXT_MONTH' && (isAr ? 'تقليص للشهر القادم' : 'Downgrade Next Month')}
                                {st.subscriptionChangeType === 'RENEWAL' && (isAr ? 'تجديد اشتراك شهري' : 'Monthly Renewal')}
                                {(!st.subscriptionChangeType || st.subscriptionChangeType === 'NEW') && (isAr ? 'اشتراك شهري جديد' : 'New Monthly Subscription')}
                              </span>
                            </div>
                            <p className="text-slate-600 font-semibold">{st.email} • {st.phone}</p>
                            <p className="text-emerald-900 font-extrabold pt-1">
                              {st.subscriptionChangeType === 'EXTRA_CLASS' ? (
                                isAr ? 'الطلب: حصة إضافية فردية (20 ر.س) للتسميع والمراجعة' : 'Request: Single Extra Class (20 SAR)'
                              ) : (
                                <>
                                  {isAr ? `الخطة المطلوبة: ${targetPlan.titleAr} (${targetPlan.priceMonthlySar} ر.س • ${targetPlan.lessonsPerMonth} حصص)` : `Plan: ${targetPlan.titleEn}`}
                                  {' • '}
                                  {isAr ? `المعلم المختار: ${targetTeacher.nameAr}` : `Teacher: ${targetTeacher.nameEn}`}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs space-y-2 min-w-64 shadow-2xs">
                          <span className="text-slate-500 font-bold block border-b border-slate-100 pb-1">{isAr ? 'تفاصيل الطلب والجدول:' : 'Application & Schedule Details:'}</span>
                          
                          {st.quranGoal && (
                            <div className="space-y-1 text-[11px] text-slate-700 font-medium">
                              {st.quranGoal.targetSurahOrJuzAr && (
                                <div className="text-emerald-950 font-bold">
                                  🎯 {st.quranGoal.targetSurahOrJuzAr}
                                </div>
                              )}
                              {st.quranGoal.agreedWeeklyDaysAr && st.quranGoal.agreedWeeklyDaysAr.length > 0 && (
                                <div className="text-slate-700 font-semibold">
                                  📅 {isAr ? 'الأيام المختارة:' : 'Days:'} {st.quranGoal.agreedWeeklyDaysAr.join(' • ')}
                                </div>
                              )}
                              {st.quranGoal.dayTimeSlots && Object.keys(st.quranGoal.dayTimeSlots).length > 0 && (
                                <div className="text-slate-600 font-mono text-[10px]">
                                  ⏰ {Object.entries(st.quranGoal.dayTimeSlots).map(([d, t]) => `${d} @ ${t}`).join(' | ')}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-slate-100 space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px]">{isAr ? 'بيانات التحويل البنكي:' : 'Bank Transfer Info:'}</span>
                            <div className="font-mono text-emerald-900 font-black">{st.bankTransferRef || 'REF-829104'}</div>
                            <div className="text-slate-600 text-[11px]">{st.paymentReceiptUrl || 'إيصال_تحويل_مصرف_الراجحي.png'}</div>
                            <div className="text-slate-400 text-[10px]">{st.paymentDate || new Date().toISOString().split('T')[0]}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200/80">
                        <button
                          onClick={() => {
                            setRejectingStudent({ id: st.id, name: st.nameAr || st.nameEn });
                            setSelectedRejectionReason(PRESET_REJECTION_REASONS[0]);
                            setCustomRejectionReason('');
                          }}
                          className="px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isAr ? 'رفض الإيصال' : 'Reject Receipt'}</span>
                        </button>

                        <button
                          onClick={() => approveStudentPayment(st.id)}
                          className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>
                            {st.subscriptionChangeType === 'EXTRA_CLASS'
                              ? (isAr ? 'اعتماد الإيصال وتفعيل الحصة الإضافية (+1)' : 'Approve & Add Extra Class')
                              : (isAr ? 'اعتماد الإيصال وتفعيل الخطة' : 'Approve & Activate Plan')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isAr ? 'لا توجد إيصالات اشتراك معلقة حالياً' : 'No pending subscription receipts'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isAr ? 'جميع إيصالات التحويل البنكي تم اعتمادها بنجاح والحصص مفعلة للطلاب.' : 'All student bank transfers are verified and active.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TEACHER APPLICATIONS REVIEW */}
        {mainTab === 'TEACHERS' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl emerald-gradient-bg flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-emerald-950">
                    {isAr ? 'مركز مراجعة واعتماد طلبات المعلمين' : 'Teacher Applications Review Center'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? 'تحقق من السند والإجازة القرآنية لكل معلم قبل قبول حسابه في الدليل العام.' : 'Review teacher Ijazah credentials before activating account.'}
                  </p>
                </div>
              </div>
            </div>

            {teachers.length > 0 ? (
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="lg" />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-emerald-950">
                            {isAr ? teacher.nameAr : teacher.nameEn}
                          </h4>
                          <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] ${
                            teacher.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : teacher.approvalStatus === 'PENDING_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {teacher.approvalStatus === 'APPROVED' && (isAr ? 'معتمد' : 'Approved')}
                            {teacher.approvalStatus === 'PENDING_ADMIN' && (isAr ? 'قيد مراجعة الإدارة' : 'Pending Admin')}
                            {teacher.approvalStatus === 'REJECTED' && (isAr ? 'مرفوض' : 'Rejected')}
                          </span>
                        </div>
                        <p className="text-slate-600 font-semibold">{teacher.email}</p>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 text-[11px] font-serif max-w-xl">
                          <strong>{isAr ? 'تفاصيل السند بالإجازة:' : 'Ijazah Chain:'}</strong> {isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 justify-end">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? 'عرض ملف المعلم والجدول ↗' : 'View Teacher Profile & Schedule ↗'}</span>
                      </Link>

                      {teacher.approvalStatus === 'PENDING_ADMIN' && (
                        <>
                          <button
                            onClick={() => rejectTeacherByAdmin(teacher.id)}
                            className="px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {isAr ? 'رفض الطلب' : 'Reject'}
                          </button>

                          <button
                            onClick={() => approveTeacherByAdmin(teacher.id)}
                            className="px-5 py-2.5 rounded-xl emerald-gradient-bg text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            <span>{isAr ? 'قبول وتفعيل' : 'Approve'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                {isAr ? 'لا توجد طلبات في هذه الفئة حالياً.' : 'No applications found.'}
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE NEW USER ACCOUNT MODAL */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {isAr ? 'إنشاء حساب عضو جديد' : 'Create New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'إضافة طالب أو معلم أو مدير جديد للنظام' : 'Add new student, teacher, or admin account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAccountModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccessMsg ? (
              <div className="py-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-emerald-950 text-base">{createSuccessMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleCreateAccountSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">{isAr ? 'نوع الحساب / الصلاحية:' : 'Role:'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAccRole('STUDENT')}
                      className={`py-2 rounded-xl font-black border transition-all cursor-pointer ${
                        newAccRole === 'STUDENT' ? 'bg-emerald-950 text-amber-400 border-emerald-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAr ? 'طالب' : 'Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccRole('TEACHER')}
                      className={`py-2 rounded-xl font-black border transition-all cursor-pointer ${
                        newAccRole === 'TEACHER' ? 'bg-emerald-950 text-amber-400 border-emerald-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAr ? 'معلم' : 'Teacher'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccRole('ADMIN')}
                      className={`py-2 rounded-xl font-black border transition-all cursor-pointer ${
                        newAccRole === 'ADMIN' ? 'bg-emerald-950 text-amber-400 border-emerald-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAr ? 'مدير' : 'Admin'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">{isAr ? 'الاسم الكامل:' : 'Full Name:'}</label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder={isAr ? 'مثال: عبد العزيز بن محمد الشمري' : 'Full Name'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                  <input
                    type="email"
                    required
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">{isAr ? 'كلمة المرور:' : 'Password:'}</label>
                    <input
                      type="text"
                      required
                      value={newAccPassword}
                      onChange={(e) => setNewAccPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">{isAr ? 'الجنس:' : 'Gender:'}</label>
                    <select
                      value={newAccGender}
                      onChange={(e) => setNewAccGender(e.target.value as 'MALE' | 'FEMALE')}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="MALE">{isAr ? 'ذكر' : 'Male'}</option>
                      <option value="FEMALE">{isAr ? 'أنثى' : 'Female'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">{isAr ? 'رقم الهاتف / الجوال:' : 'Phone Number:'}</label>
                  <input
                    type="text"
                    value={newAccPhone}
                    onChange={(e) => setNewAccPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    {isAr ? 'إنشاء وتفعيل الحساب' : 'Create Account'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isAr ? `رفض طلب الطالب: ${rejectingStudent.name}` : `Reject Application: ${rejectingStudent.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? 'سيتم حذف الحصص وإلغاء المواعيد وإرسال السبب للطالب.' : 'Classes will be deleted and reason sent to student.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isAr ? 'اختر سبب الرفض:' : 'Select Rejection Reason:'}
                </label>
                <div className="space-y-2">
                  {PRESET_REJECTION_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                        selectedRejectionReason === r
                          ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={r}
                        checked={selectedRejectionReason === r}
                        onChange={() => setSelectedRejectionReason(r)}
                        className="accent-red-600"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedRejectionReason === 'أخرى (كتابة سبب مخصص)' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700">
                    {isAr ? 'اكتب سبب الرفض المخصص:' : 'Custom Rejection Reason:'}
                  </label>
                  <textarea
                    rows={3}
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder={isAr ? 'يرجى كتابة توضيح دقيق لسبب الرفض للطالب...' : 'Provide details...'}
                    className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setRejectingStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const finalReason = selectedRejectionReason === 'أخرى (كتابة سبب مخصص)'
                    ? (customRejectionReason.trim() || 'تم رفض الإيصال من الإدارة.')
                    : selectedRejectionReason;
                  rejectStudentPayment(rejectingStudent.id, finalReason);
                  setRejectingStudent(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{isAr ? 'تأكيد الرفض والإرسال' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
