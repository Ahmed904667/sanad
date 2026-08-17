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
      {/* HERO SECTION - CLEAN LANDING PAGE */}
      <section className="relative overflow-hidden bg-quran-pattern text-white pt-20 pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/90 to-emerald-950"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 bg-emerald-900/90 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'منصة سَنَد التعليمية | لتعليم القرآن الكريم بالريال السعودي' : 'Sanad Platform | Quranic Education'}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-4xl mx-auto">
            {isAr ? (
              <>
                اتلُ القرآن <span className="gold-gradient-text">بسند متصل</span> مع نخبة المقرئين والمعلمين المجازين
              </>
            ) : (
              <>
                Learn the Quran <span className="gold-gradient-text">with Perfection</span> Under Certified Scholars
              </>
            )}
          </h1>

          <p className="text-emerald-100/90 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'اختر خطتك التعليمية المناسبة بالريال السعودي، أتمم التحويل البنكي وارفِع الإيصال، ليقوم معلمك بتوليد حصصك الافتراضية المباشرة عبر Google Meet بدون أي تعارض.'
              : 'Select your subscription plan in SAR, upload your bank receipt, and join automated conflict-free Google Meet classes.'}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register/student"
              className="px-8 py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-base shadow-xl hover:brightness-110 hover:scale-102 transition-all flex items-center gap-2"
            >
              <User className="w-5 h-5 stroke-[2.5]" />
              <span>{isAr ? 'إنشاء حساب طالب جديد' : 'Create Student Account'}</span>
            </Link>

            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 text-white font-bold text-base border border-emerald-700/60 shadow-md transition-all flex items-center gap-2"
            >
              <LogIn className="w-5 h-5 text-amber-400" />
              <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
            </Link>
          </div>

          {/* Core Trust Badges */}
          <div className="pt-10 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-xs font-semibold text-emerald-200">
            <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800 flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{isAr ? 'إجازات معتمدة بالسند المتصل' : 'Verified Ijazah Chains'}</span>
            </div>

            <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800 flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{isAr ? 'تحويل بنكي بالريال السعودي' : 'Saudi Bank Transfer'}</span>
            </div>

            <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800 flex items-center justify-center gap-2">
              <Video className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{isAr ? 'روابط Google Meet فريدة' : 'Unique Google Meet Links'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 6 SUBSCRIPTION PLANS MATRIX */}
      <PlansGrid />

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-emerald-950 mb-3">
              {isAr ? 'كيف تعمل منصة سَنَد؟' : 'How Sanad Works'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'خطوات واضحة تبدأ من إنشاء الحساب وحتى حضور الحصص.' : 'Clear steps from registration to attending classes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl emerald-gradient-bg text-amber-400 font-black text-xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">
                {isAr ? '1. تسجيل الطالب واختيار الخطة' : '1. Student Signup & Plan'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'أنشئ حسابك واختر الخطة التعليمية المناسبة بالريال السعودي مع معلمك الخاص.' 
                  : 'Register student account and pick subscription plan in SAR.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">
                {isAr ? '2. التحويل البنكي ورفع الإيصال' : '2. Bank Transfer & Receipt'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'حوّل الرسوم لحساب مصرف الراجحي وارفِع صورة الإيصال ليعتمدها معلمك.' 
                  : 'Transfer fee to Al Rajhi Bank IBAN and upload receipt for verification.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-100 font-black text-xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="font-extrabold text-lg text-emerald-950">
                {isAr ? '3. توليد الجدول التلقائي وحضور الحصص' : '3. Auto-Schedule & Classes'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'يتم إضافة جميع حصص الشهر تلقائياً بدون أي تعارض بروابط Google Meet مباشرة.' 
                  : 'Classes are auto-scheduled without conflicts with Google Meet links.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECONDARY TEACHER SIGNUP SECTION AT BOTTOM */}
      <section className="py-16 bg-emerald-950 text-white border-t border-emerald-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center mx-auto shadow-lg">
            <GraduationCap className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-3xl font-black">
            {isAr ? 'هل أنت معلم قرآن كريم مجاز بالسند المتصل؟' : 'Are You a Certified Quran Scholar?'}
          </h2>

          <p className="text-emerald-200/90 text-sm max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? 'قدم طلب انضمامك الآن. يتم مراجعة طلبك وإجازتك القرآنية من قبل إدارة المنصة قبل اعتماد حسابك.' 
              : 'Submit your application. Your credentials will be verified by platform admins.'}
          </p>

          <Link
            href="/register/teacher"
            className="inline-block px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-sm shadow-xl transition-all"
          >
            {isAr ? 'التقديم كمعلم مجاز الآن' : 'Apply as Certified Teacher'}
          </Link>
        </div>
      </section>
    </div>
  );
}
