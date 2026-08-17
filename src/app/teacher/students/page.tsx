'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { getQuranTrackTitle } from '@/data/mockData';
import { 
  Users, 
  Award, 
  Target, 
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function TeacherStudentsPage() {
  const { language, teacherProfile, currentUser, student, plans, userAccounts, lessons } = useApp();
  const isAr = language === 'ar';

  const isTeacherRole = currentUser?.role === 'TEACHER';
  const currentTeacherId = isTeacherRole 
    ? currentUser.id 
    : (student.assignedTeacherId || teacherProfile.id || 'tech-sulami');

  // Filter ONLY students assigned to this teacher
  const studentAccounts = userAccounts.filter(a => {
    if (a.role !== 'STUDENT') return false;

    const prof = a.studentProfile || (a.id === student.id ? student : undefined);
    const assignedId = prof?.assignedTeacherId;

    // Check if student profile explicitly assigns this teacher
    if (assignedId && assignedId === currentTeacherId) {
      return true;
    }

    // Check if student has active or past lessons with this teacher
    const hasLessonWithTeacher = lessons.some(l => 
      l.studentId === a.id && (l.teacherId === currentTeacherId || l.teacherNameAr === teacherProfile.nameAr)
    );
    if (hasLessonWithTeacher) return true;

    // Fallback: If no assignedTeacherId is specified and teacher is default primary (tech-sulami)
    if (!assignedId && currentTeacherId === 'tech-sulami') {
      return true;
    }

    return false;
  });

  const studentsList = studentAccounts.map(acc => {
    const prof = acc.studentProfile || (acc.id === student.id ? student : {
      id: acc.id,
      nameAr: acc.name,
      nameEn: acc.name,
      email: acc.email,
      phone: acc.phone,
      activePlanId: 'plan-standard',
      pendingPlanId: null,
      remainingLessons: 8,
      totalLessonsCompleted: 0,
      totalHoursLearned: 0.0,
      subscriptionStartDate: '2026-08-01',
      subscriptionRenewalDate: '2026-09-01',
      verificationStatus: 'VERIFIED' as const,
      quranGoal: {
        targetSurahOrJuzAr: 'سورة البقرة والجزء الثلاثون',
        targetSurahOrJuzEn: 'Surah Al-Baqarah & Juz 30',
        orientationCompleted: true,
        agreedWeeklyDaysAr: ['الإثنين', 'الأربعاء'],
        agreedWeeklyDaysEn: ['Monday', 'Wednesday'],
        agreedTimeSlot: '12:00',
        track: 'COMBINED' as const
      }
    });

    const planId = prof.activePlanId || prof.pendingPlanId || 'plan-standard';
    const plan = plans.find(p => p.id === planId) || plans[1];
    
    return {
      id: acc.id || prof.id,
      nameAr: acc.name || prof.nameAr,
      nameEn: acc.name || prof.nameEn,
      email: acc.email || prof.email,
      phone: acc.phone || prof.phone || '+966 50 000 0000',
      planTitleAr: plan.titleAr,
      planTitleEn: plan.titleEn,
      remainingLessons: prof.remainingLessons ?? 8,
      totalLessonsCompleted: prof.totalLessonsCompleted || 0,
      totalHoursLearned: prof.totalHoursLearned || 0.0,
      verificationStatus: prof.verificationStatus || 'VERIFIED',
      targetSurahAr: prof.quranGoal?.targetSurahOrJuzAr || 'سورة البقرة والجزء الثلاثون',
      trackAr: getQuranTrackTitle(prof.quranGoal?.track, isAr)
    };
  });

  return (
    <div className="py-10 bg-slate-50/70 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center font-black shadow-md">
              <Users className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{isAr ? 'إدارة طلاب المعلم' : 'Teacher Students Roster'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {isAr ? 'قائمة الطلاب الموكلين لفضيلة المعلم' : 'Assigned Students Roster'}
              </h1>
              <p className="text-emerald-200/80 text-xs sm:text-sm font-medium">
                {isAr ? 'عرض ومتابعة سجلات الطلاب الموكلين لهذا المعلم فقط.' : 'Monitor progress of students assigned to this teacher.'}
              </p>
            </div>
          </div>

          <Link
            href="/student/plan-builder"
            className="px-6 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Target className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'تصميم خطة طالب جديد' : 'Build Custom Student Plan'}</span>
          </Link>
        </div>

        {/* STUDENTS ROSTER CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-emerald-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>{isAr ? `الطلاب الموكلون للمعلم (${studentsList.length}):` : `Assigned Students (${studentsList.length}):`}</span>
            </h3>
          </div>

          {studentsList.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {studentsList.map((std) => (
                <div
                  key={std.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-4">
                    <AvatarBadge nameAr={std.nameAr} nameEn={std.nameEn} size="xl" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-lg group-hover:text-emerald-900 transition-colors">
                          {isAr ? std.nameAr : std.nameEn}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          std.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {std.verificationStatus === 'VERIFIED' ? (isAr ? 'مفعل' : 'Verified') : (isAr ? 'قيد المراجعة' : 'Pending')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {std.email} | {std.phone}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-lg">
                          {std.planTitleAr}
                        </span>
                        <span className="text-emerald-800 font-bold">
                          {std.remainingLessons} {isAr ? 'دروس متبقية' : 'lessons remaining'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Surah & Direct Page Navigation Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 justify-end">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-right min-w-[200px]">
                      <span className="text-slate-400 font-bold block mb-0.5">{isAr ? 'الهدف القرآني المتفق عليه:' : 'Quran Goal:'}</span>
                      <span className="font-extrabold text-emerald-950 block font-serif">{std.targetSurahAr}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* DIRECT LINK TO DEDICATED STUDENT PAGE */}
                      <Link
                        href={`/teacher/students/${std.id}`}
                        className="flex-1 sm:flex-none px-5 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <span>{isAr ? 'عرض ملف الطالب والحصص' : 'View Full Profile'}</span>
                        {isAr ? <ChevronLeft className="w-4 h-4 stroke-[2.5]" /> : <ChevronRight className="w-4 h-4 stroke-[2.5]" />}
                      </Link>

                      {/* EDIT PLAN BUTTON */}
                      <Link
                        href="/student/plan-builder"
                        className="flex-1 sm:flex-none px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isAr ? 'تعديل الخطة' : 'Edit Plan'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-800 text-lg">
                {isAr ? 'لا يوجد طلاب موكلون لهذا المعلم حالياً' : 'No students currently assigned to this teacher'}
              </h4>
              <p className="text-xs text-slate-500">
                {isAr ? 'سيتم إدراج الطلاب هنا عند اختيار هذا المعلم أثناء التسجيل أو تحديد الخطة الدراسية.' : 'Students assigned to this teacher during registration will appear here.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
