'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { ClassCalendar } from '@/components/ClassCalendar';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Calendar as CalendarIcon,
  Video,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Target,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { TeacherAvailabilityModal } from '@/components/TeacherAvailabilityModal';
import { AuthGuard } from '@/components/AuthGuard';

function TeacherDashboardContent() {
  const { language, teacherProfile, currentUser, lessons, student, teachers, userAccounts } = useApp();
  const isAr = language === 'ar';

  // Determine active teacher object (strictly locked to logged-in teacher profile)
  const isTeacherRole = currentUser?.role === 'TEACHER';
  const activeTeacher = useMemo(() => {
    if (isTeacherRole && currentUser) {
      return teachers.find(t => t.id === currentUser.id || t.email.toLowerCase() === currentUser.email.toLowerCase()) || 
        teachers.find(t => t.id === teacherProfile.id) || 
        teacherProfile;
    }
    return teachers.find(t => t.id === (student.assignedTeacherId || teacherProfile.id)) || teachers[0];
  }, [currentUser, isTeacherRole, teachers, teacherProfile, student.assignedTeacherId]);

  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  // Filter lessons belonging to this teacher for VERIFIED students only
  let teacherLessons = lessons.filter(l => {
    const isTeacherMatch = l.teacherId === activeTeacher.id || 
      l.teacherNameAr === activeTeacher.nameAr ||
      l.teacherNameEn === activeTeacher.nameEn;
    if (!isTeacherMatch) return false;

    // Do NOT display lessons for students whose application is pending verification or unverified
    const studentAcc = userAccounts.find(a => a.id === l.studentId || a.email.toLowerCase() === l.studentId.toLowerCase());
    if (studentAcc && studentAcc.studentProfile) {
      return studentAcc.studentProfile.verificationStatus === 'VERIFIED';
    }
    if (l.studentId === student.id) {
      return student.verificationStatus === 'VERIFIED';
    }
    return true;
  });



  const upcomingLessonsCount = teacherLessons.filter(l => l.status === 'SCHEDULED').length;
  const completedLessonsCount = teacherLessons.filter(l => l.status === 'COMPLETED').length;

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Teacher Profile Banner with Scholar Selector */}
        <div className="emerald-gradient-bg rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/60">
          <div className="flex items-center gap-4">
            <AvatarBadge nameAr={activeTeacher.nameAr} nameEn={activeTeacher.nameEn} size="xl" />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'حساب معلم مجاز بالسند المتصل' : 'Verified Scholars Dashboard'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {isAr ? `جدول ومواعيد: ${activeTeacher.nameAr}` : `Schedule & Classes: ${activeTeacher.nameEn}`}
              </h1>
              <p className="text-emerald-100/90 text-xs sm:text-sm font-medium">
                {isAr ? (activeTeacher.ijazahDetailsAr || teacherProfile.ijazahChainAr) : (activeTeacher.ijazahDetailsEn || teacherProfile.ijazahChainEn)}
              </p>
            </div>
          </div>

          {/* Working Hours Management Button */}
          <div className="w-full md:w-auto flex items-center justify-end">
            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="px-4.5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Clock className="w-4 h-4" />
              <span>{isAr ? 'تعديل أوقات وساعات العمل' : 'Manage Working Hours'}</span>
            </button>
          </div>
        </div>

        {/* ACCOUNT VERIFICATION STATUS ALERT BANNERS */}
        {activeTeacher.approvalStatus === 'PENDING_ADMIN' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-2 text-amber-950 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-sm sm:text-base text-amber-950">
                  {isAr ? 'حساب المعلم قيد التدقيق والمراجعة الإدارية (غير متاح للطلاب بعد)' : 'Teacher Account Pending Admin Review'}
                </h3>
                <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                  {isAr 
                    ? 'تم تسجيل طلبك بنجاح. يتم حالياً تدقيق وتوثيق إجازتك وسندك القرآني من قبل إدارة منصة سَنَد. سيتم تفعيل حسابك بالكامل وإتاحته لحجوزات الطلاب فور اعتماد الإدارة.' 
                    : 'Your account is under admin review. Once verified and approved by admin, your profile will be active for student bookings.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTeacher.approvalStatus === 'REJECTED' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-2 text-rose-950 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-200 text-rose-900 flex items-center justify-center font-bold shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-800" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-sm sm:text-base text-rose-950">
                  {isAr ? 'لم يتم تفعيل حساب المعلم' : 'Teacher Account Not Approved'}
                </h3>
                <p className="text-xs text-rose-900 font-semibold leading-relaxed">
                  {isAr 
                    ? 'يرجى التواصل مع إدارة منصة سَنَد لاستكمال متطلبات وثائق السند بالإجازة.' 
                    : 'Please contact Sanad administration to complete your Ijazah verification requirements.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">{isAr ? 'الحصص المجدولة القادمة' : 'Upcoming Scheduled'}</span>
              <span className="text-xl font-black text-slate-900">{upcomingLessonsCount} {isAr ? 'حصة' : 'classes'}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">{isAr ? 'الحصص المنجزة والمكتملة' : 'Completed Sessions'}</span>
              <span className="text-xl font-black text-slate-900">{completedLessonsCount} {isAr ? 'حصة' : 'classes'}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">{isAr ? 'إجمالي الحصص بالجدول' : 'Total Sessions in Calendar'}</span>
              <span className="text-xl font-black text-slate-900">{teacherLessons.length} {isAr ? 'حصة' : 'classes'}</span>
            </div>
          </div>
        </div>

        {/* TEACHER CLASS CALENDAR WITH DYNAMIC TEACHER LESSONS FILTERING */}
        <ClassCalendar lessons={teacherLessons} userRole="TEACHER" />

        {/* Teacher Availability Modal */}
        <TeacherAvailabilityModal
          isOpen={isAvailabilityModalOpen}
          onClose={() => setIsAvailabilityModalOpen(false)}
          teacher={activeTeacher}
        />

      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <AuthGuard allowedRoles={['TEACHER']}>
      <TeacherDashboardContent />
    </AuthGuard>
  );
}
