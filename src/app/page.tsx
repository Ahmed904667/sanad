'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PlansGrid } from '@/components/PlansGrid';
import { TeacherCard } from '@/components/TeacherCard';
import { 
  BookOpen, 
  Award, 
  Video, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  User,
  GraduationCap,
  Building2,
  LogIn
} from 'lucide-react';

export default function Home() {
  const { language, teachers } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-0">
      {/* HERO SECTION - CLEAN & HIGH-IMPACT */}
      <section className="relative overflow-hidden bg-quran-pattern text-white pt-16 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/85 via-slate-950/90 to-slate-950"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          
          <div className="inline-flex items-center gap-2 bg-emerald-900/90 border border-amber-500/30 text-amber-300 px-4 py-1 rounded-full text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'منصة سَنَد التعليمية | لتعليم القرآن بالسند المتصل' : 'Sanad Platform | Quran Education'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-4xl mx-auto">
            {isAr ? (
              <>
                اتلُ القرآن <span className="gold-gradient-text">بسند متصل</span> مع نخبة المقرئين المجازين
              </>
            ) : (
              <>
                Learn Quran <span className="gold-gradient-text">With Perfection</span> Under Certified Scholars
              </>
            )}
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'منصة معتمدة لمدارسة القرآن الكريم بالحفظ والتلاوة والمراجعة بالريال السعودي مع جدول حصص ذكي بروابط Google Meet مباشرة.'
              : 'Certified platform for Quran memorization and recitation in SAR with Google Meet integration.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/register/student"
              className="px-7 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-sm shadow-xl hover:brightness-110 transition-all flex items-center gap-2"
            >
              <User className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>{isAr ? 'ابدأ الآن (حصة تمهيدية مجانية)' : 'Start Free Orientation'}</span>
            </Link>

            <Link
              href="/login"
              className="px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 shadow-md transition-all flex items-center gap-2"
            >
              <LogIn className="w-4.5 h-4.5 text-amber-400" />
              <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
            </Link>
          </div>

          {/* Core Trust Badges */}
          <div className="pt-8 border-t border-emerald-800/40 grid grid-cols-3 gap-3 max-w-2xl mx-auto text-xs font-bold text-emerald-200">
            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/70 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'إجازة بالسند' : 'Ijazah Chain'}</span>
            </div>

            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/70 flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'تحويل بالريال (SAR)' : 'Saudi SAR'}</span>
            </div>

            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/70 flex items-center justify-center gap-2">
              <Video className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'حصص Google Meet' : 'Google Meet'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 6 SUBSCRIPTION PLANS MATRIX */}
      <PlansGrid />

      {/* HOW IT WORKS - SLEEK & CONCISE */}
      <section className="py-14 bg-white border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isAr ? 'كيف تعمل منصة سَنَد؟' : 'How Sanad Works'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              {isAr ? '3 خطوات بسيطة لبدء رحلتك القرآنية' : '3 simple steps to start learning'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/90 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg text-amber-400 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                1
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isAr ? '1. التسجيل وااختيار الباقة' : '1. Select Plan'}
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                {isAr 
                  ? 'أنشئ حسابك واختر الباقة المناسبة لك بالريال السعودي.' 
                  : 'Register student account and select subscription in SAR.'}
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/90 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                2
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isAr ? '2. التحويل البنكي' : '2. Bank Transfer'}
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                {isAr 
                  ? 'حوّل الرسوم عبر الراجحي وارفِع الإيصال ليتم توثيقه فوراً.' 
                  : 'Transfer to Al Rajhi account & upload payment receipt.'}
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/90 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-100 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                3
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isAr ? '3. حضور الجلسات المباشرة' : '3. Live Classes'}
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                {isAr 
                  ? 'تنشأ جميع حصصك تلقائياً بروابط Google Meet مباشرة.' 
                  : 'Automated conflict-free schedule with Google Meet links.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOP CERTIFIED SCHOLARS SPOTLIGHT */}
      <section className="py-14 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-0.5 rounded-full text-xs font-extrabold mb-1">
                <Star className="w-3.5 h-3.5 fill-emerald-800" />
                <span>{isAr ? 'نخبة المقرئين' : 'Certified Scholars'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isAr ? 'معلمون مجازون بالسند المتصل' : 'Our Certified Scholars'}
              </h2>
            </div>

            <Link
              href="/teachers"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>{isAr ? 'عرض جميع المعلمين' : 'View All Scholars'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teachers.slice(0, 3).map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </div>
      </section>

      {/* SECONDARY TEACHER SIGNUP SECTION AT BOTTOM */}
      <section className="py-14 bg-emerald-950 text-white border-t border-emerald-800">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7 stroke-[2.3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            {isAr ? 'هل أنت معلم قرآن كريم مجاز بالسند المتصل؟' : 'Are You a Certified Quran Scholar?'}
          </h2>

          <p className="text-emerald-200/80 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            {isAr 
              ? 'انضم لمنصة سَنَد ودرّس الطلاب في جميع أنحاء العالم الإسـلامي.' 
              : 'Join Sanad platform to teach students worldwide.'}
          </p>

          <Link
            href="/register/teacher"
            className="inline-block px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-lg transition-all"
          >
            {isAr ? 'التقديم كمعلم مجاز الآن' : 'Apply as Certified Scholar'}
          </Link>
        </div>
      </section>
    </div>
  );
}
