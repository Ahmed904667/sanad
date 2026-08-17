'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  LogIn,
  Star
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { language, teachers } = useApp();
  const isAr = language === 'ar';
  const topScholars = teachers.slice(0, 3);

  return (
    <div className="space-y-0">
      {/* HERO SECTION - MODERN 2-COLUMN PREMIUM LAYOUT */}
      <section className="relative overflow-hidden bg-quran-pattern text-white pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-emerald-900/40">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-slate-950/95 to-slate-950"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* COLUMN 1: TEXT CONTENT & CTAS (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'منصة سَنَد المعتمدة لتعليم القرآن بالسند المتصل' : 'Sanad Platform | Continuous Ijazah Chain'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black leading-tight tracking-tight text-white">
                {isAr ? (
                  <>
                    اتلُ القرآن <span className="gold-gradient-text">بسند متصل</span> مع نخبة المقرئين المعتمدين
                  </>
                ) : (
                  <>
                    Learn Quran <span className="gold-gradient-text">With Perfection</span> Under Certified Scholars
                  </>
                )}
              </h1>

              <p className="text-emerald-100/90 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                {isAr
                  ? 'منصة سعودية معتمدة لمدارسة القرآن الكريم بالحفظ والتلاوة والمراجعة بجلسات إفتراضية مباشرة عبر Google Meet بدون أي تعارض، ومعالجة فورية للتحويل البنكي بالريال السعودي.'
                  : 'Certified platform for Quran memorization and recitation in SAR with conflict-free Google Meet integration.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/register/student"
                  className="px-7 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-sm shadow-xl hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <User className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>{isAr ? 'ابدأ الآن (حصة تمهيدية مجانية)' : 'Start Free Orientation'}</span>
                </Link>

                <Link
                  href="/teachers"
                  className="px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 shadow-md transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-4.5 h-4.5 text-amber-400" />
                  <span>{isAr ? 'تصفح المقرئين' : 'Explore Scholars'}</span>
                </Link>
              </div>

              {/* Trust Metrics & Proof Grid */}
              <div className="pt-6 border-t border-emerald-800/40 grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-black text-lg text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.9 / 5</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'تقييم الطلاب المعلمين' : 'Student Rating'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-black text-lg text-emerald-300">
                    100%
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'إجازة بالسند المتصل' : 'Certified Ijazah'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-black text-lg text-white">
                    SAR
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'تحويل الراجحي المباشر' : 'Saudi Banking SAR'}</p>
                </div>
              </div>

            </div>

            {/* COLUMN 2: LIVE INTERACTIVE PREVIEW GLASS CARD (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl p-6 bg-emerald-950/60 backdrop-blur-xl border border-emerald-700/40 shadow-2xl space-y-5 group hover:border-amber-400/50 transition-all duration-500">
                
                {/* Live Status Badge Header */}
                <div className="flex items-center justify-between gap-2 border-b border-emerald-800/50 pb-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-900/90 text-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-700/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{isAr ? 'حصة مباشرة آمنة مع المعلم' : 'Live Class Preview'}</span>
                  </div>

                  <span className="text-[11px] font-extrabold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                    Google Meet
                  </span>
                </div>

                {/* Scholar Profile Summary */}
                <div className="flex items-center gap-3.5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                    ش
                  </div>
                  <div className="space-y-0.5 text-right">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>{isAr ? 'الشيخ د. توفيق الضبع' : 'Dr. Tawfiq Al-Dhabba'}</span>
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 font-medium">
                      {isAr ? 'مجاز بالسند المتصل في القراءات العشر' : 'Certified 10 Recitations Ijazah'}
                    </p>
                  </div>
                </div>

                {/* Lesson Goal Widget */}
                <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800/60 space-y-2 text-right">
                  <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
                    <span>{isAr ? 'مقرر الحصة اليوم:' : 'Today Lesson Goal:'}</span>
                    <span className="text-amber-300 font-mono text-[11px]">30 {isAr ? 'دقيقة' : 'min'}</span>
                  </div>
                  <div className="font-extrabold text-xs text-white bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isAr ? 'سورة البقرة (الآيات 1 - 50)' : 'Surah Al-Baqarah (1-50)'}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-bold">{isAr ? 'صفحة 1 - 7' : 'Pages 1-7'}</span>
                  </div>
                </div>

                {/* Progress Indicator & Join Button */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>{isAr ? 'نسبة إنجاز الخطة القرآنية' : 'Quran Plan Progress'}</span>
                    <span className="text-amber-400 font-mono">65%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="gold-gradient-bg h-full rounded-full w-[65%] shadow-xs"></div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/register/student"
                      className="w-full py-3 rounded-xl emerald-gradient-bg text-white font-black text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4 text-amber-300" />
                      <span>{isAr ? 'انضم فوراً للحصة التمهيدية المجانية' : 'Join Orientation Class'}</span>
                    </Link>
                  </div>
                </div>

              </div>
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
              <TeacherCard 
                key={teacher.id} 
                teacher={teacher}
                onBook={() => router.push('/teachers')}
                onViewDetails={() => router.push('/teachers')}
              />
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
