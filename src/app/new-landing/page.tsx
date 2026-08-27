'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { PlansGrid } from '@/components/PlansGrid';
import { 
  User, 
  LogIn, 
  GraduationCap, 
  ShieldCheck, 
  Video, 
  Clock, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Award, 
  CreditCard,
  Building2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Sliders,
  FileCheck
} from 'lucide-react';

interface FaqItem {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

const FAQS: FaqItem[] = [
  {
    questionAr: 'هل الحصص في منصة سَنَد فردية أم جماعية؟',
    questionEn: 'Are the sessions at Sanad 1-on-1 private or group classes?',
    answerAr: 'جميع الحصص في منصة سَنَد هي حصص فردية مباشرة (1:1) تجمع الطالب بالمعلم المجاز عبر Google Meet لضمان أعلى درجات التركيز والتصحيح الصوتي الدقيق.',
    answerEn: 'All sessions on Sanad are 1-on-1 private live classes between the student and certified scholar via Google Meet for maximum focus and acoustic accuracy.'
  },
  {
    questionAr: 'كيف يقوم النظام بتوليد خطة الحفظ والتلاوة؟',
    questionEn: 'How does the automated Quran Plan Builder work?',
    answerAr: 'يقوم باني الخطة الذكي باحتساب عدد الآيات والصفحات بناءً على السور أو الأجزاء المستهدفة ونوع المسار المختار، وتوزيعها بالتساوي على حصص الشهر المجدولة.',
    answerEn: 'The plan engine calculates the exact pages and ayahs based on your selected Surahs or Juz, distributing them evenly across your scheduled monthly lessons.'
  },
  {
    questionAr: 'ما هي آلية دفع الاشتراكات الشهرية؟',
    questionEn: 'How do subscription payments work?',
    answerAr: 'الاشتراكات شهرية ثابتة بالريال السعودي. يتم سداد الرسوم عبر التحويل البنكي المباشر لحساب مصرف الراجحي المعتمد للمنصة، ثم رفع صورة الإيصال ليتم اعتماد الحساب وتفعيل الجدول.',
    answerEn: 'Subscriptions are fixed 1-month plans in SAR. Transfer the fee to the official Al Rajhi Bank IBAN and upload your receipt for instant account and timetable activation.'
  },
  {
    questionAr: 'هل يمكن إعادة جدولة موعد حصة أو شراء حصص إضافية؟',
    questionEn: 'Can I reschedule a class or purchase extra lessons?',
    answerAr: 'نعم، تتيح المنصة إعادة جدولة أي حصة قادمة إلى موعد آخر متاح مع المعلم بنقرة واحدة، كما يمكن شراء حصص إضافية فردية بسعر 20 ر.س للحصة في أي وقت.',
    answerEn: 'Yes. You can reschedule upcoming classes without conflicts, and purchase extra individual lessons for 20 SAR each at any time.'
  },
  {
    questionAr: 'من هم المعلمون في المنصة وكيف يتم اعتمادهم؟',
    questionEn: 'Who are the instructors and how are they vetted?',
    answerAr: 'تضم المنصة معلمين ومقرئين معتمدين يحملون إجازات موثقة بالسند المتصل إلى النبي ﷺ برواية حفص عن عاصم والقراءات العشر، وتتم مراجعة إجازاتهم واعتمادها بدقة من إدارة المنصة.',
    answerEn: 'Our faculty consists of certified scholars holding authentic sanad chains back to Prophet Muhammad ﷺ, verified through admin credentials assessment.'
  }
];

export default function NewLandingPage() {
  const { language, toggleLanguage } = useApp();
  const isAr = language === 'ar';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-emerald-900 selection:text-white font-sans antialiased">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Sanad Logo"
              width={48}
              height={48}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="hidden sm:block">
              <span className="text-lg font-black text-emerald-950 block leading-tight">سَنَد</span>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Sanad Platform</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-700">
            <a href="#features" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'المميزات التعليمية' : 'Capabilities'}
            </a>
            <a href="#tracks" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'المسارات القرآنية' : 'Study Tracks'}
            </a>
            <a href="#plans" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'الخطط والأسعار' : 'Plans & Pricing'}
            </a>
            <a href="#workflow" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'خطوات الدراسة' : 'Workflow'}
            </a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
            </a>
          </div>

          {/* Actions & Language */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-800" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-950 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>

            <Link
              href="/register/student"
              className="px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              {isAr ? 'ابدأ الآن' : 'Get Started'}
            </Link>
          </div>

        </div>
      </nav>

      {/* 1. HERO SECTION - BLACKBOARD / EDTECH COMPOSITION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Text Details */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-300/80 text-slate-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>{isAr ? 'منصة سَنَد للتعليم القرآني بالسند المتصل' : 'Sanad Quran Learning Platform'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-tight leading-[1.2]">
                {isAr ? (
                  <>
                    تعلّم القرآن الكريم وتلاوته <br className="hidden sm:block" />
                    مع <span className="text-emerald-800 underline decoration-amber-500/80 decoration-4 underline-offset-8">نخبة المقرئين المجازين</span>
                  </>
                ) : (
                  <>
                    Master Quran Recitation & Memorization with <span className="text-emerald-800">Certified Scholars</span>
                  </>
                )}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                {isAr
                  ? 'منصة تعليمية متطورة توفر حصصاً فردية مباشرة 1:1 عبر Google Meet، مع باني خطط ذكي لحساب الآيات وتوزيعها بدقة على حصص الشهر وجدول تلقائي يمنع التعارض.'
                  : 'An advanced learning management platform offering 1-on-1 private virtual classrooms via Google Meet, automated curriculum pacing, and conflict-free scheduling.'}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/register/student"
                  className="px-7 py-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'التسجيل في الحلقات' : 'Enroll as Student'}</span>
                </Link>

                <Link
                  href="/login"
                  className="px-7 py-3.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-800" />
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                </Link>
              </div>

              {/* Clean Metric Counters Bar */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center lg:text-start">
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-slate-950">100%</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'حصص فردية مباشرة 1:1' : '1:1 Private Sessions'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-900">سند متصل</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'إجازة معتمدة إلى النبي ﷺ' : 'Connected Sanad Chains'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-slate-950">مرونة تامة</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'جدولة بدون أي تعارض' : 'Conflict-Free Scheduling'}</div>
                </div>
              </div>

            </div>

            {/* Hero Right Composition - Similar to Sample with Clean Circle Backdrop */}
            <div className="lg:col-span-5 flex justify-center items-center relative">
              <div className="relative w-[320px] sm:w-[380px] lg:w-[420px] aspect-[4/5] flex items-center justify-center">
                
                {/* SVG Concentric Contour Lines (Subtle Background) */}
                <svg className="absolute inset-0 w-full h-full text-emerald-100/70 pointer-events-none" viewBox="0 0 400 500" fill="none" stroke="currentColor">
                  <ellipse cx="200" cy="250" rx="190" ry="240" strokeWidth="1.5" strokeDasharray="4 6" />
                  <ellipse cx="200" cy="250" rx="160" ry="200" strokeWidth="1.5" />
                  <ellipse cx="200" cy="250" rx="130" ry="160" strokeWidth="1" strokeDasharray="3 3" />
                </svg>

                {/* Primary Organic Circle Backdrop (Matching Sample Design) */}
                <div className="absolute w-[280px] sm:w-[330px] lg:w-[360px] h-[280px] sm:h-[330px] lg:h-[360px] rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl" />

                {/* Inner Ambient Glow */}
                <div className="absolute w-[250px] sm:w-[300px] h-[250px] sm:h-[300px] rounded-full bg-emerald-500/30 blur-2xl" />

                {/* Cutout Man Reading Quran Image (Overlapping the Circle Cleanly) */}
                <div className="relative z-10 w-[270px] sm:w-[320px] lg:w-[350px] h-[400px] sm:h-[460px] lg:h-[500px]">
                  <Image
                    src="/images/quran-reader.jpg"
                    alt="قارئ القرآن الكريم"
                    fill
                    className="object-contain object-bottom drop-shadow-2xl"
                    priority
                  />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE CAPABILITIES (BENTO / BLACKBOARD GRID) */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'البنية التقنية والتعليمية' : 'Platform Infrastructure'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'مميزات المنصة الأكاديمية' : 'Academic Features of Sanad'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'حلول تقنية متكاملة صُممت خصيصاً لخدمة طلاب القرآن الكريم والمعلمين.' : 'Integrated software capabilities designed specifically for Quran learners and scholars.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAr ? 'باني الخطة القرآنية' : 'Smart Plan Builder'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'احتساب تلقائي لعدد الصفحات والآيات وتوزيعها بالسورة أو الجزء على جميع حصص الشهر بالتساوي.' 
                    : 'Automated calculation of pages and ayahs distributed evenly across all monthly classes.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 font-bold">
                <Video className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAr ? 'حصص فردية 1:1' : '1:1 Google Meet'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'غرف افتراضية مباشرة خاصة تجمع الطالب بمعلمه مع تصحيح صوتي فوري وتدوين ملاحظات الأداء.' 
                    : 'Direct private classrooms for focused one-on-one acoustic tajweed training and feedback.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAr ? 'جدولة ذكية وإعادة المواعيد' : 'Conflict-Free Schedule'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'توليد آلي للجدول الزمني بدون تضارب في المواعيد، مع إمكانية إعادة جدولة أي حصة بنقرة واحدة.' 
                    : 'Automated timetable generator with one-click rescheduling for unforeseen schedule changes.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAr ? 'إجازة بالسند المتصل' : 'Connected Sanad Chains'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'إشراف كبار المقرئين المجازين برواية حفص عن عاصم والقراءات العشر لمنح الإجازات المعتمدة.' 
                    : 'Instruction by certified scholars verified with connected transmission chains to Prophet Muhammad ﷺ.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. LEARNING TRACKS */}
      <section id="tracks" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'المسارات الدراسية' : 'Study Tracks'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'اختر مسارك القرآني المناسب' : 'Select Your Quran Track'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'مسارات محددة المنهج تناسب جميع المستويات من المبتدئين وحتى طالبي الإجازة.' : 'Structured curricula designed for beginners through advanced certification seekers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Track 1: Memorization */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-[#FAFAFA] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{isAr ? 'المسار الأول' : 'Track 1'}</div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isAr ? 'مسار الحفظ والتثبيت' : 'Memorization & Retention'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'حفظ مقاطع جديدة مع التسميع المباشر للمعلم والمراجعة المنظمة لتثبيت السور في الصدر.' 
                    : 'Systematic memorization of new surahs combined with structured revision under direct supervision.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'تسميع يومي مباشر 1:1' : 'Daily 1:1 recitation'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'متابعة دقيقة لمقرر الآيات والصفحات' : 'Precise page & ayah tracking'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'مراجعة صغرى وكبرى دورية' : 'Regular retention reviews'}</span>
                </div>
              </div>
            </div>

            {/* Track 2: Tajweed & Recitation */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-[#FAFAFA] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">{isAr ? 'المسار الثاني' : 'Track 2'}</div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isAr ? 'مسار تصحيح التلاوة والتجويد' : 'Recitation & Tajweed'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'ضبط مخارج الحروف وصفاتها وأحكام التلاوة والوقف والابتداء مع التدريب الصوتي المستمر.' 
                    : 'Mastering pronunciation, Makharij, and applied Tajweed rules with real-time acoustic correction.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'تصحيح صوتي فوري لكل آية' : 'Live acoustic verse correction'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'تطبيق أحكام التجويد العملية' : 'Practical Tajweed application'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'مناسب لجميع المستويات والأعمار' : 'Suitable for all ages & levels'}</span>
                </div>
              </div>
            </div>

            {/* Track 3: Ijazah & Sanad */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-[#FAFAFA] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider">{isAr ? 'المسار الثالث' : 'Track 3'}</div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isAr ? 'مسار الإجازة بالسند المتصل' : 'Connected Sanad & Ijazah'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'قراءة القرآن الكريم كاملاً غيباً أو نظراً للحصول على إجازة رسمية موثقة بسند متصل إلى النبي ﷺ.' 
                    : 'Full Quran recital under vetted scholars to attain verified Ijazah linked to the Prophet ﷺ.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'رواية حفص عن عاصم أو القراءات العشر' : 'Hafs or 10 Qira’at chains'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'شهادة إجازة معتمدة موثقة' : 'Official authenticated certificate'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isAr ? 'إشراف كبار المقرئين المسندين' : 'Mentored by senior scholars'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. WORKFLOW STEPS */}
      <section id="workflow" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'دورة العمل' : 'How It Works'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'مراحل التسجيل والدراسة في سَنَد' : '4 Simple Steps to Get Started'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">01</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'اختيار الخطة والمعلم' : 'Choose Plan & Teacher'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'حدد الخطة الشهرية المناسبة وعدد الحصص الأسبوعية مع المعلم المفضل لديك.' : 'Pick your monthly plan in SAR with your preferred instructor.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">02</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'تحديد الهدف القرآني' : 'Set Quran Goal'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'اختر مسارك القرآني وسور الحفظ ليقوم النظام تلقائياً بتوليد وتوزيع جدول الآيات.' : 'Select surahs to auto-generate your monthly lesson plan.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">03</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'التحويل البنكي' : 'Bank Transfer'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'حوّل الرسوم عبر الحساب المعتمد لمصرف الراجحي وارفِع صورة الإيصال للاعتماد الفوري.' : 'Transfer to the official Al Rajhi IBAN and upload receipt.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">04</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'حضور الحصص المباشرة' : 'Attend Live Classes'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'استلم جدولك بدون أي تعارض، وانضم لحصصك الفردية عبر رابط Google Meet مباشرة.' : 'Join your private Google Meet classes via your calendar.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PLANS & PRICING MATRIX */}
      <section id="plans" className="py-20 bg-white border-b border-slate-200">
        <PlansGrid />
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'إجابات على أهم الاستفسارات' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-start flex items-center justify-between gap-4 font-extrabold text-slate-900 hover:text-emerald-900 transition-colors cursor-pointer text-sm"
                  >
                    <span>{isAr ? faq.questionAr : faq.questionEn}</span>
                    <div className="text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {isAr ? faq.answerAr : faq.answerEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. TEACHER ONBOARDING CALLOUT */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto border border-slate-700 font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">
              {isAr ? 'هل أنت معلم قرآن كريم مجاز بالسند؟' : 'Are You a Certified Quran Scholar?'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              {isAr 
                ? 'انضم إلى منصة سَنَد وقدم حلقاتك القرآنية لطلاب من مختلف أنحاء العالم عبر بيئة تقنية متكاملة ومنظمة.' 
                : 'Join Sanad to conduct online recitation and memorization halaqat worldwide.'}
            </p>
          </div>

          <Link
            href="/register/teacher"
            className="inline-block px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all"
          >
            {isAr ? 'التقديم كمعلم معتمد' : 'Apply as Certified Teacher'}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 bg-slate-950 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sanad" width={28} height={28} className="h-6 w-auto" />
            <span className="font-bold text-slate-200">{isAr ? 'منصة سَنَد لتعليم القرآن الكريم' : 'Sanad Quran Platform'}</span>
          </div>
          <div>
            {isAr ? 'جميع الحقوق محفوظة © 2026 منصة سَنَد' : 'All rights reserved © 2026 Sanad Platform'}
          </div>
        </div>
      </footer>

    </div>
  );
}
