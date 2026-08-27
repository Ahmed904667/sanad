'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PlansGrid } from '@/components/PlansGrid';
import { 
  User, 
  LogIn, 
  GraduationCap, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Video,
  Clock
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { language, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  useEffect(() => {
    if (isHydrated && currentUser) {
      if (currentUser.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (currentUser.role === 'TEACHER') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    }
  }, [isHydrated, currentUser, router]);

  if (isHydrated && currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-amber-400 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {isAr ? 'جاري الانتقال إلى لوحة التحكم...' : 'Redirecting to your dashboard...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      
      {/* 1. HERO SECTION - CLEAN, MINIMAL & MODERN */}
      <section className="relative bg-emerald-950 text-white pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left / Hero Headline & Actions */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-start">
              
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isAr ? 'مقرأة إلكترونية معتمدة بالسند المتصل' : 'Certified Quran Platform with Connected Sanad'}</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-white">
                  {isAr ? (
                    <>
                      اتلُ القرآن <span className="gold-gradient-text">بسندٍ متصل</span> مع نخبة المقرئين المجازين
                    </>
                  ) : (
                    <>
                      Learn the Quran <span className="gold-gradient-text">with Perfection</span> Under Certified Scholars
                    </>
                  )}
                </h1>

                <p className="text-emerald-100/90 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {isAr
                    ? 'حلقات فردية مباشرة وجلسات لتصحيح التلاوة والحفظ عبر Google Meet مع معلمين يحملون الإجازة بالسند المتصل إلى النبي ﷺ.'
                    : '1-on-1 direct virtual recitation & memorization sessions via Google Meet with scholars holding authentic connected sanad chains.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register/student"
                  className="px-8 py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-base shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
                >
                  <User className="w-5 h-5 stroke-[2.5]" />
                  <span>{isAr ? 'انضم إلى الحلقات الآن' : 'Join Halaqat Now'}</span>
                </Link>

                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800 text-white font-bold text-base border border-emerald-700/60 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                </Link>
              </div>

              {/* Minimal 3-Point Highlight */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs font-bold text-emerald-200/90">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'حصص فردية 1:1' : '1:1 Private Classes'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'معلمون مجازون بالسند' : 'Certified Scholars'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'مواعيد مرنة' : 'Flexible Timetable'}</span>
                </div>
              </div>

            </div>

            {/* Right / Hero Image - Pure, Clean Photography */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/80">
                <Image
                  src="/images/quran-open-rehal.jpg"
                  alt="المصحف الشريف على الحامل الخشبي"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HALAQAT & TRACKS SECTION - SIMPLE, CLEAN 3-CARD LAYOUT */}
      <section className="py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              {isAr ? 'مسارات الحلقات القرآنية' : 'Quran Study Tracks'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isAr 
                ? 'اختر المسار الأنسب لطموحك القرآني مع جدول حصص منتظم ومعلم خاص.' 
                : 'Choose the study track that matches your goals with regular classes and a dedicated scholar.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Track 1: Memorization */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/quran-student.jpg"
                  alt="حلقات الحفظ والتثبيت"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'حلقات الحفظ والتثبيت' : 'Memorization & Retention'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'حفظ جديد وتسميع مباشر مع مراجعة منظمة تضمن تثبيت السور والآيات في الصدر.' 
                      : 'Systematic memorization combined with structured revision under direct supervision.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Track 2: Tajweed & Recitation */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/quran-verses.jpg"
                  alt="حلقات التلاوة وتصحيح التجويد"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'حلقات التلاوة وتصحيح التجويد' : 'Recitation & Tajweed'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'ضبط مخارج الحروف وصفاتها والوقف والابتداء مع التوجيه الصوتي العملي الفوري.' 
                      : 'Mastering pronunciation and Tajweed rules with real-time feedback and correction.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Track 3: Ijazah & Sanad */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/quran-study-circle.jpg"
                  alt="مجالس الإجازة بالسند المتصل"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'مجالس الإجازة بالسند المتصل' : 'Connected Sanad & Ijazah'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'قراءة القرآن الكريم كاملاً غيباً أو نظراً للحصول على إجازة متصلة السند برسول الله ﷺ.' 
                      : 'Complete Quran recital to attain verified Ijazah linked back to the Prophet ﷺ.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SUBSCRIPTION PLANS MATRIX */}
      <PlansGrid />

      {/* 4. HOW IT WORKS - MINIMAL 3 STEPS */}
      <section className="py-24 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-emerald-950">
              {isAr ? 'كيف تبدأ دراستك في سَنَد؟' : 'How Sanad Works'}
            </h2>
            <p className="text-slate-600 text-sm">
              {isAr ? 'ثلاث خطوات واضحة تبدأ بها رحلتك القرآنية.' : 'Three clear steps from registration to attending your live classes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg text-amber-400 font-black text-lg flex items-center justify-center shadow-sm">
                1
              </div>
              <h3 className="font-bold text-lg text-emerald-950">
                {isAr ? '1. تسجيل الطالب واختيار الخطة' : '1. Signup & Pick Plan'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'أنشئ حسابك وحدد الباقة وعدد الحصص الشهرية مع المعلم المفضل لديك.' 
                  : 'Register your student profile and choose a monthly plan in SAR with your preferred instructor.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-lg flex items-center justify-center shadow-sm">
                2
              </div>
              <h3 className="font-bold text-lg text-emerald-950">
                {isAr ? '2. التحويل البنكي ورفع الإيصال' : '2. Bank Transfer & Receipt'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'حوّل الرسوم عبر الحساب البنكي المعتمد وارفِع صورة الإيصال ليتم تفعيله.' 
                  : 'Transfer the fee to the official IBAN and upload your receipt for verification.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-100 font-black text-lg flex items-center justify-center shadow-sm">
                3
              </div>
              <h3 className="font-bold text-lg text-emerald-950">
                {isAr ? '3. حضور الحصص المباشرة' : '3. Attend Live Classes'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'يتم توليد جدولك الشهري تلقائياً مع روابط Google Meet المباشرة لكل حصة.' 
                  : 'Your timetable is auto-scheduled without conflicts with direct Google Meet links.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. TEACHER REGISTRATION CALLOUT - MINIMAL & CLEAN */}
      <section className="py-20 bg-emerald-950 text-white border-t border-emerald-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-3xl font-black">
            {isAr ? 'هل أنت معلم قرآن كريم مجاز؟' : 'Are You a Certified Quran Scholar?'}
          </h2>

          <p className="text-emerald-200/90 text-sm max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? 'انضم إلى منصة سَنَد وقدم حلقاتك لطلاب من مختلف أنحاء العالم عبر بيئة تقنية متكاملة ومنظمة.' 
              : 'Join Sanad to conduct online recitation and memorization halaqat worldwide.'}
          </p>

          <Link
            href="/register/teacher"
            className="inline-block px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-sm shadow-lg transition-all"
          >
            {isAr ? 'التقديم كمعلم معتمد الآن' : 'Apply as Certified Teacher'}
          </Link>
        </div>
      </section>

    </div>
  );
}
