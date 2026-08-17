'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Star,
  Zap,
  Check
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { language, teachers } = useApp();
  const isAr = language === 'ar';
  const topScholars = teachers.slice(0, 3);

  return (
    <div className="space-y-0 bg-slate-950 text-slate-100 overflow-x-hidden">
      
      {/* 1. LUXURY 2-COLUMN HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-emerald-900/40">
        
        {/* Background Gradients & Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* COLUMN 1: TEXT CONTENT & CTAS (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              <div className="inline-flex items-center gap-2 bg-emerald-900/90 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'منصة سَنَد الأولى المعتمدة بالسند المتصل' : 'Sanad Platform | Continuous Ijazah Chain'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                {isAr ? (
                  <>
                    اتلُ القرآن <span className="gold-gradient-text">بسند متصل</span> مع نخبة المقرئين المعتمدين
                  </>
                ) : (
                  <>
                    Master the Quran <span className="gold-gradient-text">With Sanad</span> Under Certified Scholars
                  </>
                )}
              </h1>

              <p className="text-emerald-100/90 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                {isAr
                  ? 'منصة معتمدة لمدارسة القرآن الكريم بالحفظ والتلاوة والمراجعة بجلسات افتراضية مباشرة عبر Google Meet بدون أي تعارض، ومعالجة فورية للتحويل البنكي بالريال السعودي.'
                  : 'Certified platform for Quran memorization and recitation in SAR with conflict-free Google Meet integration.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/register/student"
                  className="px-7 py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-sm shadow-xl hover:brightness-110 hover:scale-102 transition-all flex items-center gap-2"
                >
                  <User className="w-5 h-5 stroke-[2.5]" />
                  <span>{isAr ? 'ابدأ الان (حصة تمهيدية مجانية)' : 'Start Free Orientation'}</span>
                </Link>

                <Link
                  href="/teachers"
                  className="px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 shadow-md transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'تصفح دليل المقرئين' : 'Explore Scholars'}</span>
                </Link>
              </div>

              {/* Trust Metrics Grid */}
              <div className="pt-6 border-t border-emerald-800/40 grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-black text-xl text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.9 / 5</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'تقييم الطلاب المعلمين' : 'Student Rating'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-black text-xl text-emerald-300">
                    100%
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'إجازة بالسند المتصل' : 'Certified Ijazah'}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-black text-xl text-white">
                    SAR
                  </div>
                  <p className="text-slate-400 text-[11px] font-bold">{isAr ? 'تحويل بنكي بالريال' : 'Saudi Banking SAR'}</p>
                </div>
              </div>

            </div>

            {/* COLUMN 2: GENERATED 3D VISUAL FRAME & LIVE BADGE (5 Cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-700/50 shadow-2xl group hover:border-amber-400/60 transition-all duration-500 bg-slate-900">
                <div className="aspect-[16/10] relative w-full">
                  <Image 
                    src="/images/hero-preview.jpg" 
                    alt="Sanad Quran Learning Platform Preview"
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                </div>

                {/* Overlaid Floating Live Status Widget */}
                <div className="p-5 bg-slate-900/90 backdrop-blur-md space-y-3 text-right">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>{isAr ? 'حصة مباشرة الآن عبر Google Meet' : 'Live Google Meet Class'}</span>
                    </div>

                    <span className="text-[11px] font-extrabold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                      {isAr ? '+1 تمهيدية مجانية' : '+1 Free Session'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span>{isAr ? 'الشيخ د. توفيق الضبع (مجاز بالسند)' : 'Dr. Tawfiq Al-Dhabba'}</span>
                    <span className="text-amber-400 font-mono">30 {isAr ? 'دقيقة' : 'min'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES GRID */}
      <section className="py-16 bg-slate-900/90 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isAr ? 'لماذا يختار الطلاب منصة سَنَد؟' : 'Why Students Choose Sanad'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              {isAr ? 'نظام تعليمي متكامل يجمع بين أصالة السند والتقنية الحديثة' : 'Combining traditional Ijazah with modern technology'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg text-amber-400 flex items-center justify-center shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {isAr ? 'إجازة بالسند المتصل' : 'Continuous Ijazah'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {isAr ? 'شهادة إجازة معتمدة مسندة إلى النبي ﷺ عبر نخبة الشيوخ المجازين.' : 'Authentic unbroken chain certificate awarded upon completion.'}
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {isAr ? 'جدول بدون تعارض' : 'Conflict-Free Schedule'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {isAr ? 'توليد تلقائي للمواعيد بروابط Google Meet مباشرة بدون أي تضارب.' : 'Automated slot generation with direct Google Meet room links.'}
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center shadow-md border border-emerald-700">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {isAr ? 'سداد بالريال (SAR)' : 'Saudi SAR Payment'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {isAr ? 'دفع آمن بالتحويل البنكي لحساب الراجحي وتوثيق فوري للإيصال.' : 'Saudi bank transfer via Al Rajhi Bank with instant verification.'}
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-900 text-emerald-200 flex items-center justify-center shadow-md border border-teal-700">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {isAr ? 'تخصيص الخطة والسور' : 'Custom Quran Goals'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {isAr ? 'حدد هدفك بالحفظ أو المراجعة، واختر نطاق الآيات والسور بدقة.' : 'Choose your target Surah, Juz, or custom Ayah ranges.'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. IJAZAH CERTIFICATE SPOTLIGHT SECTION */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Certificate Graphic Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-slate-900 group">
                <div className="aspect-[4/3] relative w-full">
                  <Image 
                    src="/images/ijazah-preview.jpg" 
                    alt="Authentic Ijazah Certificate Sanad"
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-black border border-amber-500/30">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'الاعتماد والأصالة' : 'Verified Credentials'}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {isAr ? 'احصل على شهادة الإجازة بالسند المتصل إلى رسول الله ﷺ' : 'Earn Your Authentic Unbroken Chain Ijazah'}
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                {isAr 
                  ? 'بعد إتمام مقررك القرآني والاختبار النهائي مع شيخك المجاز، تحصل على شهادة إجازة موثقة تثبت اتصال سندك بالرواية المعتمدة.' 
                  : 'Upon completing your Quran target and passing the final exam, receive a certified document.'}
              </p>

              <div className="space-y-3 pt-2 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{isAr ? 'إجازة في حفص عن عاصم، ورش، والقراءات العشر' : 'Ijazah in Hafs, Warsh, and 10 Recitations'}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{isAr ? 'توثيق رسمي باسم الطالب والشيخ المسنِد' : 'Official documentation bearing scholar signatures'}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{isAr ? 'اختبارات تمهيدية وجلسات مراجعة قبل الاعتماد' : 'Orientation tests and review sessions before certification'}</span>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/register/student"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-lg hover:brightness-110 transition-all"
                >
                  <span>{isAr ? 'التسجيل في برنامج الإجازة' : 'Register for Ijazah Program'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. SUBSCRIPTION PLANS MATRIX */}
      <div className="bg-slate-900">
        <PlansGrid />
      </div>

      {/* 5. TOP CERTIFIED SCHOLARS SPOTLIGHT */}
      <section className="py-16 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/80 text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-700/80 mb-2">
                <Star className="w-3.5 h-3.5 fill-emerald-300" />
                <span>{isAr ? 'نخبة المقرئين' : 'Certified Scholars'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? 'معلمون مجازون بالسند المتصل' : 'Our Certified Scholars'}
              </h2>
            </div>

            <Link
              href="/teachers"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all self-start sm:self-auto flex items-center gap-1.5 border border-slate-700"
            >
              <span>{isAr ? 'عرض جميع المعلمين' : 'View All Scholars'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topScholars.map((teacher) => (
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

      {/* 6. TEACHER APPLICATION FOOTER BANNER */}
      <section className="py-16 bg-gradient-to-b from-emerald-950 to-slate-950 text-white border-t border-emerald-800">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center mx-auto shadow-lg">
            <GraduationCap className="w-8 h-8 stroke-[2.3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            {isAr ? 'هل أنت معلم قرآن كريم مجاز بالسند المتصل؟' : 'Are You a Certified Quran Scholar?'}
          </h2>

          <p className="text-emerald-200/80 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-medium">
            {isAr 
              ? 'انضم لمنصة سَنَد ودرّس الطلاب في جميع أنحاء العالم الإسلامي عبر نظام حصص منظم بدون تعارض.' 
              : 'Join Sanad platform to teach students worldwide via automated schedules.'}
          </p>

          <Link
            href="/register/teacher"
            className="inline-block px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-xl transition-all"
          >
            {isAr ? 'التقديم كمعلم مجاز الآن' : 'Apply as Certified Scholar'}
          </Link>
        </div>
      </section>

    </div>
  );
}

