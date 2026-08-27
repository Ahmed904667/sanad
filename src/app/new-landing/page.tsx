'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { PlansGrid } from '@/components/PlansGrid';
import { QURAN_SURAHS, QURAN_JUZ_LIST } from '@/data/quranData';
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
  FileCheck,
  Search,
  Users,
  Play,
  Volume2,
  Bookmark,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon
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
    questionEn: 'Are sessions on Sanad 1-on-1 private or group classes?',
    answerAr: 'جميع الحصص في منصة سَنَد هي حصص فردية مباشرة (1:1) تجمع الطالب بالمعلم المجاز عبر Google Meet لضمان أعلى درجات التركيز والتصحيح الصوتي الدقيق.',
    answerEn: 'All sessions on Sanad are 1-on-1 private live classes between the student and certified scholar via Google Meet for maximum focus and acoustic accuracy.'
  },
  {
    questionAr: 'كيف يعمل باني الخطة القرآنية التلقائي؟',
    questionEn: 'How does the automated Quran Plan Builder work?',
    answerAr: 'يقوم باني الخطة الذكي بحساب عدد الآيات والصفحات بناءً على السور أو الأجزاء المستهدفة ونوع المسار، وتوزيعها بالتساوي على حصص الشهر المجدولة لمنع التراكم وتيسير الحفظ.',
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
  const { language, toggleLanguage, plans, teachers } = useApp();
  const isAr = language === 'ar';

  // INTERACTIVE CURRICULUM SIMULATOR STATE
  const [simulatorTrack, setSimulatorTrack] = useState<'HIFZ' | 'TIKRAAR' | 'TAJWEED'>('HIFZ');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(2); // Al-Baqarah default
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(3); // 3 classes/week

  const selectedSurah = useMemo(() => {
    return QURAN_SURAHS.find(s => s.number === selectedSurahNumber) || QURAN_SURAHS[1];
  }, [selectedSurahNumber]);

  const simulatedLessonsPerMonth = weeklyFrequency * 4;
  const simulatedAyahsPerLesson = Math.max(1, Math.ceil(selectedSurah.totalVerses / simulatedLessonsPerMonth));
  const simulatedPagesCount = Math.max(1, selectedSurah.endPage - selectedSurah.startPage + 1);
  const simulatedPagesPerLesson = (simulatedPagesCount / simulatedLessonsPerMonth).toFixed(1);

  // FAQ STATE
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // FACULTY TAB STATE
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 'tech-sulami');
  const activeTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-emerald-900 selection:text-white font-sans antialiased">
      
      {/* ACADEMIC TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Portal Identity */}
          <Link href="/new-landing" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Sanad Logo"
              width={46}
              height={46}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="hidden sm:block">
              <span className="text-lg font-black text-emerald-950 block leading-tight">سَنَد</span>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Sanad Platform</span>
            </div>
          </Link>

          {/* Blackboard-Style Section Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-slate-700">
            <a href="#simulator" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'باني الخطة التفاعلي' : 'Plan Simulator'}
            </a>
            <a href="#tracks" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'المسارات القرآنية' : 'Study Tracks'}
            </a>
            <a href="#classroom" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'بيئة الحصة 1:1' : '1:1 Classroom'}
            </a>
            <a href="#faculty" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'هيئة المقرئين' : 'Faculty Scholars'}
            </a>
            <a href="#plans" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'الرسوم والاشتراكات' : 'Pricing'}
            </a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors">
              {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
            </a>
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-800" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-950 hover:bg-slate-50 text-xs font-extrabold transition-all"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>

            <Link
              href="/register/student"
              className="px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              {isAr ? 'التسجيل في المقرأة' : 'Enroll Now'}
            </Link>
          </div>

        </div>
      </header>

      {/* 1. HERO SECTION - MATCHING SAMPLE COMPOSITION WITH CIRCLE HALO & CONCENTRIC LINES */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left: Academic Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold">
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
                  ? 'منصة تعليمية متطورة توفر حصصاً فردية مباشرة 1:1 عبر Google Meet، مع باني خطط ذكي لحساب وتوزيع الآيات بالسورة أو الجزء وجدول تلقائي يمنع التعارض.'
                  : 'An advanced learning management platform offering 1-on-1 private virtual classrooms via Google Meet, automated curriculum pacing, and conflict-free scheduling.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/register/student"
                  className="px-8 py-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'التسجيل في المقرأة' : 'Enroll as Student'}</span>
                </Link>

                <a
                  href="#simulator"
                  className="px-7 py-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-emerald-800" />
                  <span>{isAr ? 'جرّب باني الخطة الذكي' : 'Try Plan Simulator'}</span>
                </a>
              </div>

              {/* Minimal Metric Tickers */}
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
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'جدولة بدون تعارض' : 'Conflict-Free Scheduling'}</div>
                </div>
              </div>

            </div>

            {/* Hero Right: Exact Graphic Composition */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-[360px] sm:max-w-[440px] aspect-[535/585]">
                <Image
                  src="/images/hero-quran-man.png"
                  alt="قارئ القرآن الكريم - منصة سَنَد"
                  fill
                  sizes="(max-width: 768px) 360px, 440px"
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE CURRICULUM & PLAN CALCULATOR (BLACKBOARD CORE INNOVATION) */}
      <section id="simulator" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'المحاكي التفاعلي' : 'Interactive Plan Simulator'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'جرّب باني الخطة القرآنية واحسب جدولك فوراً' : 'Simulate Your Monthly Quran Plan'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr 
                ? 'اختر السورة وعدد الحصص الأسبوعية وشاهد كيف يقوم النظام باحتساب الآيات والصفحات وتوزيعها على حصصك تلقائياً.' 
                : 'Select your target Surah and class frequency to see instant daily breakdowns and completion milestones.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
            
            {/* Simulator Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1: Learning Track */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isAr ? '1. نوع المسار الدراسي:' : '1. Select Study Track:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulatorTrack('HIFZ')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      simulatorTrack === 'HIFZ'
                        ? 'bg-emerald-950 text-white border-emerald-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAr ? 'حفظ جديد' : 'New Hifz'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorTrack('TIKRAAR')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      simulatorTrack === 'TIKRAAR'
                        ? 'bg-emerald-950 text-white border-emerald-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAr ? 'مراجعة وتثبيت' : 'Revision'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorTrack('TAJWEED')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      simulatorTrack === 'TAJWEED'
                        ? 'bg-emerald-950 text-white border-emerald-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAr ? 'تصحيح تلاوة' : 'Tajweed'}
                  </button>
                </div>
              </div>

              {/* Step 2: Target Surah Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isAr ? '2. السورة المستهدفة:' : '2. Target Surah:'}
                </label>
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => setSelectedSurahNumber(parseInt(e.target.value, 10))}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-800"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.nameAr} ({s.totalVerses} آية • صفحة {s.startPage}-{s.endPage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Weekly Classes Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    {isAr ? '3. عدد الحصص الأسبوعية:' : '3. Weekly Lessons:'}
                  </label>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {weeklyFrequency} {isAr ? 'حصص / أسبوعياً' : 'classes / wk'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={weeklyFrequency}
                  onChange={(e) => setWeeklyFrequency(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-800 cursor-pointer h-2 bg-slate-200 rounded-lg mt-2"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>1 حصة</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6 حصص</span>
                </div>
              </div>

            </div>

            {/* Calculated Plan Output Display */}
            <div className="p-6 rounded-2xl bg-emerald-950 text-white border border-emerald-900 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-300/80 block">{isAr ? 'إجمالي حصص الشهر:' : 'Monthly Classes:'}</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{simulatedLessonsPerMonth}</span>
                <span className="text-[10px] text-emerald-300/70 block">{isAr ? 'حصة فردية 1:1' : '1:1 Lessons'}</span>
              </div>

              <div className="space-y-1 border-r border-emerald-900/60 pr-2">
                <span className="text-xs font-bold text-emerald-300/80 block">{isAr ? 'معدل الآيات بالحصة:' : 'Ayahs / Lesson:'}</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{simulatedAyahsPerLesson}</span>
                <span className="text-[10px] text-emerald-300/70 block">{isAr ? 'آية موزعة تلقائياً' : 'Paced evenly'}</span>
              </div>

              <div className="space-y-1 border-r border-emerald-900/60 pr-2">
                <span className="text-xs font-bold text-emerald-300/80 block">{isAr ? 'الصفحات بالحصة:' : 'Pages / Lesson:'}</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{simulatedPagesPerLesson}</span>
                <span className="text-[10px] text-emerald-300/70 block">{isAr ? `من إجمالي ${simulatedPagesCount} صفحة` : `of ${simulatedPagesCount} pages`}</span>
              </div>

              <div className="space-y-1 border-r border-emerald-900/60 pr-2">
                <span className="text-xs font-bold text-emerald-300/80 block">{isAr ? 'المقرر الشهري:' : 'Surah Milestone:'}</span>
                <span className="text-base sm:text-lg font-black text-emerald-200 truncate block">{selectedSurah.nameAr}</span>
                <span className="text-[10px] text-emerald-300/70 block">{isAr ? 'إنجاز متقن ومثبت' : 'Verified retention'}</span>
              </div>
            </div>

            {/* Direct Link to Start this plan */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-600 font-semibold">
                {isAr 
                  ? `خطة مخصصة لـ ${selectedSurah.nameAr} موزعة على ${simulatedLessonsPerMonth} حصة شهرياً مع رابط Google Meet مباشر لكل جلسة.`
                  : `Custom plan for ${selectedSurah.nameEn} distributed across ${simulatedLessonsPerMonth} classes monthly.`}
              </span>

              <Link
                href="/register/student"
                className="px-6 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm transition-all shrink-0 flex items-center gap-2"
              >
                <span>{isAr ? 'اعتماد هذه الخطة وحجز الحصص' : 'Enroll with this Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 3. VIRTUAL CLASSROOM 1:1 INTERACTIVE PREVIEW */}
      <section id="classroom" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'البيئة الافتراضية' : 'Classroom Experience'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'تجربة الحصة الفردية المباشرة 1:1' : 'Interactive 1-on-1 Virtual Classroom'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'جلسات مجهزة بروابط Google Meet مباشرة ومصحف رقمي تفاعلي وتدوين مستمر لملاحظات التجويد.' : 'Direct Google Meet video sessions with digital Mushaf display and real-time scholar feedback.'}
            </p>
          </div>

          {/* Classroom UI Mockup */}
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white shadow-2xl space-y-6">
            
            {/* Top Class Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-extrabold text-slate-300 font-mono">LIVE • Google Meet</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                  {isAr ? 'حصة تسميع وإتقان: سورة البقرة' : 'Class Session: Surah Al-Baqarah'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> 45:00 دقيقة</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> جلسة مشفرة</span>
              </div>
            </div>

            {/* Classroom Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Video Stream Simulation */}
              <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="aspect-video bg-slate-950 rounded-xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <GraduationCap className="w-10 h-10 text-emerald-400 mx-auto" />
                      <span className="text-xs font-bold text-slate-300 block">{isAr ? 'الشيخ أ.د. إبراهيم السلمي' : 'Prof. Dr. Ibrahim Al-Sulami'}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{isAr ? 'معلم مجاز بالسند المتصل' : 'Certified Scholar'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-amber-400 block">{isAr ? 'ملاحظات المعلم الفورية:' : 'Scholar Live Notes:'}</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isAr ? 'مخارج الحروف متقنة. يُرجى الانتباه لمقدار مد الصلة الكبرى في الآية 255.' : 'Makharij on point. Notice duration of Madd in verse 255.'}
                  </p>
                </div>
              </div>

              {/* Digital Mushaf Viewer Simulation */}
              <div className="lg:col-span-7 bg-[#FAF8F5] text-slate-900 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-extrabold text-slate-700">
                    <span>{isAr ? 'المصحف الشريف (رواية حفص عن عاصم)' : 'Holy Quran (Hafs Recitation)'}</span>
                    <span className="font-mono text-emerald-900">{isAr ? 'صفحة 42 • الحزب 4' : 'Page 42 • Hizb 4'}</span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 font-serif text-base sm:text-lg leading-loose text-center text-slate-900 space-y-2">
                    <p className="font-bold">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                    <p className="leading-[2.4]">
                      اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-2 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تم تسميع الآيات المقررة بنجاح' : 'Assigned verses recited'}</span>
                  </span>
                  <span className="font-mono text-slate-500">Google Meet Audio Active</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. CERTIFIED SCHOLARS FACULTY DIRECTORY */}
      <section id="faculty" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'هيئة المقرئين' : 'Certified Scholars'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'نخبة المقرئين والمعلمين المجازين بالسند' : 'Learn from Vetted Quran Scholars'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'معلمون مجازون متصلو السند خضعوا لتدقيق دقيق لضمان أعلى درجات الضبط والإتقان.' : 'Scholars verified with authentic sanad transmission chains for accurate Quran education.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teachers.slice(0, 3).map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-400 font-extrabold flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-950">{isAr ? teacher.nameAr : teacher.nameEn}</h3>
                      <span className="text-[11px] text-slate-500 font-bold block">{isAr ? 'معلم مجاز بالسند المتصل' : 'Certified Scholar'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
                    <span className="font-extrabold text-emerald-950 block">{isAr ? 'تفاصيل الإجازة والسند:' : 'Sanad Chain:'}</span>
                    <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                      {isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{isAr ? 'ساعات العمل اليومية:' : 'Available Hours:'}</span>
                    <span className="font-mono text-emerald-900">{teacher.workingHoursStart || '12:00'} - {teacher.workingHoursEnd || '18:00'}</span>
                  </div>

                  <Link
                    href="/register/student"
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-950 hover:text-white text-slate-800 text-xs font-extrabold text-center block transition-all"
                  >
                    {isAr ? 'اختيار هذا المعلم والتسجيل' : 'Select This Scholar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. PLANS & PRICING MATRIX */}
      <section id="plans" className="py-20 bg-white border-b border-slate-200">
        <PlansGrid />
      </section>

      {/* 6. WORKFLOW - 4 STEPS */}
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
                {isAr ? 'حوّل الرسوم عبر الحساب المعتمد لمصرف الراجحي وارفِع صورة الإيصال للاعتماد الفوري.' : 'Transfer to official Al Rajhi IBAN and upload receipt.'}
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

      {/* 7. FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'إجابات على أهم الاستفسارات حول المقرأة' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-xs"
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
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                      {isAr ? faq.answerAr : faq.answerEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 8. FACULTY ONBOARDING CALLOUT */}
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
