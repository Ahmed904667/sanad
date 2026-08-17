'use client';

import React, { useState, useEffect } from 'react';
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

export default function TeacherDashboard() {
  const { language, teacherProfile, currentUser, lessons, student, teachers, userAccounts } = useApp();
  const isAr = language === 'ar';

  // Determine initial active teacher ID
  const isTeacherRole = currentUser?.role === 'TEACHER';
  const initialTeacherId = isTeacherRole 
    ? currentUser.id 
    : (student.assignedTeacherId || teacherProfile.id || 'tech-sulami');

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  // Sync selected teacher ID if currentUser or student assigned teacher updates
  useEffect(() => {
    if (currentUser?.role === 'TEACHER') {
      setSelectedTeacherId(currentUser.id);
    } else if (student.assignedTeacherId) {
      setSelectedTeacherId(student.assignedTeacherId);
    }
  }, [currentUser, student.assignedTeacherId]);

  // Find active teacher object
  const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || 
    teachers.find(t => t.id === teacherProfile.id) || 
    teachers[0];

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

          {/* Teacher Selector Control */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-emerald-950/70 backdrop-blur-md p-3 rounded-2xl border border-emerald-700/60 text-white space-y-1.5 shrink-0">
              <label className="text-[11px] font-bold text-amber-300 block flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{isAr ? 'اختر المعلم لعرض جدوله:' : 'Select Scholar View:'}</span>
              </label>
              <select
                value={activeTeacher.id}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-900 text-amber-300 font-bold text-xs p-2.5 rounded-xl border border-amber-400/40 focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-xs"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.nameAr : t.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="px-4.5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Clock className="w-4 h-4" />
              <span>{isAr ? 'تعديل أوقات وساعات العمل' : 'Manage Working Hours'}</span>
            </button>
          </div>
        </div>

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
