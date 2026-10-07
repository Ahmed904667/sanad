'use client';

import { AccessibleModal } from '@/components/AccessibleModal';

import React, { useState } from 'react';
import Link from 'next/link';
import { localizeQuranScope } from '@/utils/localization';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { AuthGuard } from '@/components/AuthGuard';
import { UserAccount, Role, StudentProfile } from '@/types';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus,
  X,
  Eye,
  AlertTriangle
} from 'lucide-react';

function AdminDashboardContent() {
  const {
    language,
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
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccRole, setNewAccRole] = useState<Role>('STUDENT');
  const [newAccGender, setNewAccGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createError, setCreateError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const runAction = async (key: string, action: () => Promise<void>) => {
    if (busyAction) return;
    setBusyAction(key); setActionError('');
    try { await action(); } catch (error) { setActionError(error instanceof Error ? error.message : (isAr ? 'تعذر حفظ الإجراء.' : 'Unable to save action.')); } finally { setBusyAction(null); }
  };
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // All Classes Search / Filter State
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');

  // Rejection Reason Modal State
  const [rejectingStudent, setRejectingStudent] = useState<{ id: string; name: string } | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('إيصال التحويل البنكي غير واضح أو الصورة تالفة');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');

  const rejectionReasonsEn = ['Bank receipt is unreadable or damaged', 'Amount does not match the selected plan', 'Receipt was already used', 'Sender details do not match the student', 'Other (write a reason)'];
  const PRESET_REJECTION_REASONS = [
    'إيصال التحويل البنكي غير واضح أو الصورة تالفة',
    'المبلغ المحول غير مطابق لسعر الباقة المختارة',
    'إيصال التحويل مكرر وتم استخدامه سابقاً',
    'اسم المحول ورقم الحساب غير متطابق مع بيانات الطالب',
    'أخرى (كتابة سبب مخصص)'
  ];

  const pendingTeachers = teachers.filter(t => t.approvalStatus === 'PENDING_ADMIN');
  const studentAccounts = userAccounts.filter(a => a.role === 'STUDENT');
  const teacherAccounts = userAccounts.filter(a => a.role === 'TEACHER');
  const adminAccounts = userAccounts.filter(a => a.role === 'ADMIN');

  // Both account shortcuts and the queue use the same explicit request state.
  const isPendingPaymentRequest = (profile?: StudentProfile) => {
    if (!profile?.paymentReceiptUrl || !(profile.pendingPlanId || profile.activePlanId)) return false;
    if (profile.paymentRequestStatus) return profile.paymentRequestStatus === 'PENDING';
    // Keep genuine legacy receipt submissions reviewable, without queuing empty onboarding.
    return profile.verificationStatus === 'PENDING_VERIFICATION' || Boolean(profile.pendingPlanId) || profile.subscriptionChangeType === 'NEW';
  };
  const pendingStudentsList = userAccounts
    .filter(account => account.role === 'STUDENT' && isPendingPaymentRequest(account.studentProfile))
    .map(account => account.studentProfile!)
    .concat(isPendingPaymentRequest(student) && !userAccounts.some(account => account.id === student.id) ? [student] : []);

  const pendingStudentsCount = pendingStudentsList.length;

  // Filtered Accounts
  const filteredAccounts = userAccounts.filter(acc => {
    if (accountRoleFilter !== 'ALL' && acc.role !== accountRoleFilter) return false;
    if (accountSearchQuery.trim()) {
      const q = accountSearchQuery.toLowerCase();
      return (acc.name || acc.email || '').toLowerCase().includes(q) || (acc.email || '').toLowerCase().includes(q) || acc.id.toLowerCase().includes(q);
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

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) return;
    if (newAccPassword.trim().length < 8) {
      setCreateError(isAr ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
      return;
    }

    const newId = newAccRole === 'STUDENT' ? `std-${Math.floor(1000 + Math.random() * 9000)}`
                : newAccRole === 'TEACHER' ? `tech-${Math.floor(1000 + Math.random() * 9000)}`
                : `adm-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAccObj: UserAccount = {
      id: newId,
      name: newAccName.trim(),
      email: newAccEmail.trim().toLowerCase(),
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
        // Creating an account does not imply payment or subscription approval.
        verificationStatus: 'PENDING_VERIFICATION',
        activePlanId: null,
        remainingLessons: 0,
        totalLessonsCompleted: 0,
        totalHoursLearned: 0.0,
        assignedTeacherId: null,
        quranGoal: undefined
      } : undefined
    };

    if (creatingAccount) return;
    setCreatingAccount(true); setCreateError(''); setCreateSuccessMsg('');
    try {
      await createAccountByAdmin(newAccObj, newAccPassword.trim());
      setCreateSuccessMsg(isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      setTimeout(() => {
        setCreateSuccessMsg('');
        setIsCreateAccountModalOpen(false);
        setNewAccName('');
        setNewAccEmail('');
        setNewAccPassword('');
      }, 1500);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : (isAr ? 'تعذر إنشاء الحساب.' : 'Unable to create account.'));
    } finally { setCreatingAccount(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      {actionError && <p role="alert" className="mx-auto max-w-7xl p-4 text-rose-700">{actionError}</p>}
      {busyAction && <p role="status" className="mx-auto max-w-7xl p-2 text-emerald-800">{isAr ? "جارٍ حفظ الإجراء..." : "Saving action…"}</p>}
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">

        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700">{isAr ? 'إدارة المنصة' : 'Platform admin'}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{isAr ? 'لوحة الإدارة' : 'Admin dashboard'}</h1>
            <p className="mt-1 text-sm text-slate-500">{isAr ? 'إدارة الاشتراكات والمعلمين والحسابات والحصص.' : 'Manage subscriptions, teachers, accounts, and classes.'}</p>
          </div>
          <button
            onClick={() => { setCreateError(''); setCreateSuccessMsg(''); setIsCreateAccountModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isAr ? 'إنشاء حساب' : 'Create account'}</span>
          </button>
        </header>

        {/* PENDING APPLICATIONS ALERT BANNER */}
        {pendingStudentsCount > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-950">
                  {isAr ? `${pendingStudentsCount} طلب اشتراك بانتظار المراجعة` : `${pendingStudentsCount} subscription requests need review`}
                </h4>
                <p className="text-xs text-amber-800">
                  {isAr ? 'راجع الإيصال لتفعيل الخطة.' : 'Review the receipt to activate the plan.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMainTab('RECEIPTS')}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-200 px-3 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-300"
            >
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'مراجعة الطلبات' : 'Review requests'}</span>
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={isAr ? 'ملخص الإدارة' : 'Admin summary'}>
          {[
            { label: isAr ? 'الحصص' : 'Classes', value: lessons.length },
            { label: isAr ? 'الطلاب' : 'Students', value: studentAccounts.length },
            { label: isAr ? 'المعلمون' : 'Teachers', value: teacherAccounts.length },
            { label: isAr ? 'طلبات تحتاج مراجعة' : 'Needs review', value: pendingStudentsCount + pendingTeachers.length },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav aria-label={isAr ? 'أقسام الإدارة' : 'Admin sections'} className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-2 lg:sticky lg:top-24 lg:grid-cols-1">
            {([
              { id: 'RECEIPTS', label: isAr ? 'طلبات الاشتراك' : 'Subscriptions', count: pendingStudentsCount },
              { id: 'TEACHERS', label: isAr ? 'مراجعة المعلمين' : 'Teacher review', count: pendingTeachers.length },
              { id: 'ACCOUNTS', label: isAr ? 'الحسابات' : 'Accounts', count: userAccounts.length },
              { id: 'CALENDAR', label: isAr ? 'الحصص' : 'Classes', count: lessons.length },
            ] as const).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMainTab(item.id)}
                aria-current={mainTab === item.id ? 'page' : undefined}
                className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${mainTab === item.id ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
              >
                <span>{item.label}</span>
                <span className={`text-xs ${mainTab === item.id ? 'text-emerald-100' : 'text-slate-400'}`}>{item.count}</span>
              </button>
            ))}
          </nav>
          <main className="min-w-0 space-y-4">

        {/* TAB 1: SYSTEM ALL CLASSES CALENDAR & TIMETABLE (FULL ADMIN ACCESS) */}
        {mainTab === 'CALENDAR' && (
          <section className="space-y-4 animate-in fade-in">

            {/* Search & Teacher Filter Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative flex-1 sm:w-72">
                  <Search className={`absolute top-3 h-4 w-4 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث باسم الطالب أو المعلم أو السورة...' : 'Search student, teacher, or surah...'}
                    className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm focus:border-emerald-700 focus:outline-none ${isAr ? 'pl-3 pr-9' : 'pl-9 pr-3'}`}
                  />
                </div>

                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="ALL">{isAr ? 'جميع المعلمين' : 'All Teachers'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-slate-500">
                {isAr ? `يعرض ${filteredSystemLessons.length} حصة من أصل ${lessons.length}` : `Showing ${filteredSystemLessons.length} of ${lessons.length} classes`}
              </div>
            </div>

            {/* Interactive System Calendar */}
            <ClassCalendar lessons={filteredSystemLessons} userRole="ADMIN" />
          </section>
        )}

        {/* TAB 2: MANAGE ACCOUNTS (CREATE & BLOCK USER ACCOUNTS) */}
        {mainTab === 'ACCOUNTS' && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{isAr ? 'الحسابات' : 'Accounts'}</h2>
                <p className="mt-1 text-sm text-slate-500">{isAr ? 'ابحث عن حساب أو غيّر حالته.' : 'Find an account or change its status.'}</p>
              </div>
              <button onClick={() => { setCreateError(''); setCreateSuccessMsg(''); setIsCreateAccountModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                <UserPlus className="h-4 w-4" />{isAr ? 'إنشاء حساب' : 'Create account'}
              </button>
            </header>

            <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
              <select
                value={accountRoleFilter}
                onChange={event => setAccountRoleFilter(event.target.value as 'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN')}
                aria-label={isAr ? 'تصفية حسب نوع الحساب' : 'Filter by account role'}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-700 focus:outline-none"
              >
                <option value="ALL">{isAr ? `كل الحسابات (${userAccounts.length})` : `All accounts (${userAccounts.length})`}</option>
                <option value="STUDENT">{isAr ? `الطلاب (${studentAccounts.length})` : `Students (${studentAccounts.length})`}</option>
                <option value="TEACHER">{isAr ? `المعلمون (${teacherAccounts.length})` : `Teachers (${teacherAccounts.length})`}</option>
                <option value="ADMIN">{isAr ? `الإدارة (${adminAccounts.length})` : `Admins (${adminAccounts.length})`}</option>
              </select>
              <div className="relative">
                <Search className={`absolute top-3 h-4 w-4 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="search"
                  dir={isAr ? 'rtl' : 'ltr'}
                  value={accountSearchQuery}
                  onChange={event => setAccountSearchQuery(event.target.value)}
                  placeholder={isAr ? 'ابحث بالاسم أو البريد' : 'Search name or email'}
                  className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm focus:border-emerald-700 focus:outline-none ${isAr ? 'pl-3 pr-9' : 'pl-9 pr-3'}`}
                />
              </div>
            </div>

            {filteredAccounts.length ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {filteredAccounts.map(acc => {
                  const isBlocked = Boolean(acc.isBlocked);
                  const roleLabel = acc.role === 'ADMIN' ? (isAr ? 'مدير' : 'Admin') : acc.role === 'TEACHER' ? (isAr ? 'معلم' : 'Teacher') : (isAr ? 'طالب' : 'Student');
                  return (
                    <li key={acc.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <AvatarBadge nameAr={acc.name} nameEn={acc.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{acc.name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{roleLabel}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${isBlocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{isBlocked ? (isAr ? 'موقوف' : 'Blocked') : (isAr ? 'نشط' : 'Active')}</span>
                          </div>
                          <p className="truncate text-sm text-slate-500">{acc.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        {acc.role === 'STUDENT' && isPendingPaymentRequest(acc.studentProfile) && (
                          <button onClick={() => setMainTab('RECEIPTS')} className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">{isAr ? 'مراجعة الطلب' : 'Review request'}</button>
                        )}
                        {acc.role === 'STUDENT' && <Link href={`/teacher/students/${acc.id}`} className="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">{isAr ? 'ملف الطالب' : 'Student profile'}</Link>}
                        {acc.role === 'TEACHER' && <Link href={`/admin/teachers/${acc.id}`} className="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">{isAr ? 'ملف المعلم' : 'Teacher profile'}</Link>}
                        <button disabled={Boolean(busyAction)} onClick={() => runAction(acc.id, () => toggleBlockAccount(acc.id))} className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${isBlocked ? 'text-emerald-800 hover:bg-emerald-50' : 'text-red-700 hover:bg-red-50'}`}>
                          {isBlocked ? (isAr ? 'إلغاء الإيقاف' : 'Unblock') : (isAr ? 'إيقاف' : 'Block')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">{isAr ? 'لا توجد حسابات مطابقة.' : 'No matching accounts.'}</p>
            )}
          </section>
        )}

        {/* TAB 3: STUDENT SUBSCRIPTIONS & RECEIPTS APPROVAL */}
        {mainTab === 'RECEIPTS' && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 animate-in fade-in">
            <header className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-950">{isAr ? 'طلبات الاشتراك' : 'Subscription requests'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isAr ? 'راجع الإيصال ثم اعتمد الطلب أو ارفضه.' : 'Review each receipt, then approve or reject the request.'}</p>
            </header>

            {pendingStudentsCount > 0 ? (
              <div className="space-y-4">
                {pendingStudentsList.map(st => {
                  const targetPlan = plans.find(plan => plan.id === (st.pendingPlanId || st.activePlanId)) || plans[0];
                  const targetTeacher = teachers.find(teacher => teacher.id === st.assignedTeacherId);
                  const isExtraClass = st.subscriptionChangeType === 'EXTRA_CLASS';
                  const requestLabel = isExtraClass
                    ? (isAr ? 'حصة إضافية' : 'Extra class')
                    : st.subscriptionChangeType === 'RENEWAL'
                      ? (isAr ? 'تجديد' : 'Renewal')
                      : st.subscriptionChangeType === 'UPGRADE_NEXT_MONTH'
                        ? (isAr ? 'ترقية' : 'Upgrade')
                        : st.subscriptionChangeType === 'DOWNGRADE_NEXT_MONTH'
                          ? (isAr ? 'تغيير الخطة' : 'Plan change')
                          : (isAr ? 'اشتراك جديد' : 'New subscription');

                  return (
                    <article key={st.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarBadge nameAr={st.nameAr} nameEn={st.nameEn} size="md" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-950">{isAr ? st.nameAr : st.nameEn}</h4>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{requestLabel}</span>
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-500">{st.email}{st.phone ? ` · ${st.phone}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:shrink-0">
                          <button
                            onClick={() => {
                              setRejectingStudent({ id: st.id, name: st.nameAr || st.nameEn });
                              setSelectedRejectionReason(PRESET_REJECTION_REASONS[0]);
                              setCustomRejectionReason('');
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                          <button
                            disabled={Boolean(busyAction)} onClick={() => runAction(st.id, () => approveStudentPayment(st.id))}
                            className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                          >
                            {isAr ? 'اعتماد' : 'Approve'}
                          </button>
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-xs text-slate-500">{isAr ? 'الخطة' : 'Plan'}</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {isExtraClass
                              ? (isAr ? `حصة إضافية × ${st.pendingExtraClassQuantity || 1}` : `Extra class × ${st.pendingExtraClassQuantity || 1}`)
                              : `${isAr ? targetPlan.titleAr : targetPlan.titleEn} · ${targetPlan.priceMonthlySar} ${isAr ? 'ر.س' : 'SAR'}`}
                          </dd>
                          {!isExtraClass && <dd className="text-xs text-slate-500">{targetPlan.lessonsPerMonth} {isAr ? 'حصة شهرياً' : 'classes/month'} · {targetPlan.lessonDurationMinutes} {isAr ? 'دقيقة' : 'min'}</dd>}
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">{isAr ? 'المعلم' : 'Teacher'}</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">{targetTeacher ? (isAr ? targetTeacher.nameAr : targetTeacher.nameEn) : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">{isAr ? 'الهدف القرآني' : 'Quran goal'}</dt>
                          <dd className="mt-1 text-sm text-slate-700">{localizeQuranScope(isAr ? st.quranGoal?.targetSurahOrJuzAr : (st.quranGoal?.targetSurahOrJuzEn || st.quranGoal?.targetSurahOrJuzAr), isAr) || '—'}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-slate-600">
                          <span className="font-medium">{isAr ? 'مرجع التحويل:' : 'Transfer reference:'}</span> {st.bankTransferRef || '—'}
                          {st.paymentDate ? <span className="text-slate-400"> · {st.paymentDate}</span> : null}
                        </div>
                        {st.paymentReceiptUrl?.startsWith('data:') ? (
                          <a href={`/api/admin/students/${encodeURIComponent(st.id)}/receipt`} target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 underline underline-offset-2">
                            {isAr ? 'عرض الإيصال' : 'View receipt'}
                          </a>
                        ) : <span className="text-xs text-slate-500">{st.paymentReceiptUrl ? (isAr ? 'أعد رفع الإيصال لفتحه' : 'Re-upload receipt to view') : (isAr ? 'لم يرفق إيصال' : 'No receipt attached')}</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-dashed border-slate-300 py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isAr ? 'لا توجد إيصالات اشتراك معلقة حالياً' : 'No pending subscription receipts'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isAr ? 'جميع إيصالات التحويل البنكي تم اعتمادها بنجاح والحصص مفعلة للطلاب.' : 'All student bank transfers are verified and active.'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: TEACHER APPLICATIONS REVIEW */}
        {mainTab === 'TEACHERS' && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 animate-in fade-in">
            <header className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-950">{isAr ? 'مراجعة المعلمين' : 'Teacher review'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isAr ? 'راجع بيانات المعلم وإجازته قبل تفعيل الحساب.' : 'Check each teacher’s profile and credentials before approval.'}</p>
            </header>

            {pendingTeachers.length > 0 ? (
              <div className="space-y-4">
                {pendingTeachers.map((teacher) => (
                  <article key={teacher.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="lg" />
                      <div className="min-w-0 space-y-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {isAr ? teacher.nameAr : teacher.nameEn}
                          </h3>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            {isAr ? 'بانتظار المراجعة' : 'Pending review'}
                          </span>
                        </div>
                        <p className="text-slate-500">{teacher.email}</p>
                        <p className="max-w-2xl text-sm text-slate-700">
                          <span className="font-medium">{isAr ? 'الإجازة: ' : 'Credentials: '}</span>{isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 justify-end">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? 'عرض الملف' : 'View profile'}</span>
                      </Link>

                      {teacher.approvalStatus === 'PENDING_ADMIN' && (
                        <>
                          <button
                            disabled={Boolean(busyAction)} onClick={() => runAction(teacher.id, () => rejectTeacherByAdmin(teacher.id))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            {isAr ? 'رفض الطلب' : 'Reject'}
                          </button>

                          <button
                            disabled={Boolean(busyAction)} onClick={() => runAction(teacher.id, () => approveTeacherByAdmin(teacher.id))}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isAr ? 'قبول وتفعيل' : 'Approve'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                {isAr ? 'لا توجد طلبات في هذه الفئة حالياً.' : 'No applications found.'}
              </div>
            )}
          </section>
        )}

          </main>
        </div>
      </div>

            {/* CREATE NEW USER ACCOUNT MODAL */}
      {isCreateAccountModalOpen && (
        <AccessibleModal onClose={() => setIsCreateAccountModalOpen(false)} aria-label={isAr ? "إنشاء حساب" : "Create account"} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-950">
                    {isAr ? 'إنشاء حساب' : 'Create account'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isAr ? 'إضافة طالب أو معلم أو مدير جديد للنظام' : 'Add new student, teacher, or admin account'}
                  </p>
                </div>
              </div>
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setIsCreateAccountModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && <p role="alert" className="mb-3 text-rose-700 text-sm">{createError}</p>}
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
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        newAccRole === 'STUDENT' ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {isAr ? 'طالب' : 'Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccRole('TEACHER')}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        newAccRole === 'TEACHER' ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {isAr ? 'معلم' : 'Teacher'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccRole('ADMIN')}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        newAccRole === 'ADMIN' ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-white text-slate-700'
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
                      type="password"
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
                    aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setIsCreateAccountModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit" disabled={creatingAccount}
                    className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    {isAr ? 'إنشاء الحساب' : 'Create Account'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </AccessibleModal>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingStudent && (
        <AccessibleModal onClose={() => setRejectingStudent(null)} aria-label={isAr ? "رفض طلب الدفع" : "Reject payment request"} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
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
                    {isAr ? 'سيتم رفض الطلب وإرسال السبب للطالب، مع الحفاظ على الحصص المدفوعة الحالية.' : 'The request will be rejected and the student notified. Existing paid classes are preserved.'}
                  </p>
                </div>
              </div>
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setRejectingStudent(null)}
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
                  {PRESET_REJECTION_REASONS.map((r, index) => (
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
                      <span>{isAr ? r : rejectionReasonsEn[index]}</span>
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

            {actionError && <p role="alert" className="text-rose-700 text-sm">{actionError}</p>}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setRejectingStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={Boolean(busyAction)} onClick={async () => {
                  const finalReason = selectedRejectionReason === 'أخرى (كتابة سبب مخصص)'
                    ? (customRejectionReason.trim() || 'تم رفض الإيصال من الإدارة.')
                    : isAr ? selectedRejectionReason : rejectionReasonsEn[PRESET_REJECTION_REASONS.indexOf(selectedRejectionReason)];
                  await runAction(rejectingStudent.id, async () => { await rejectStudentPayment(rejectingStudent.id, finalReason); setRejectingStudent(null); });
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{isAr ? 'تأكيد الرفض والإرسال' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}
