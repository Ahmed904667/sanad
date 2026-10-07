'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatAvailabilityRanges } from '@/utils/timeFormat';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { PlansGrid } from '@/components/PlansGrid';
import { QURAN_SURAHS } from '@/data/quranData';
import {
  User,
  GraduationCap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sliders
} from 'lucide-react';

interface FaqItem {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

const FAQS: FaqItem[] = [
  {
    questionAr: 'هل الحصص فردية؟',
    questionEn: 'Are lessons one to one?',
    answerAr: 'نعم، تلتقي في كل حصة بمعلّمك مباشرة عبر Google Meet.',
    answerEn: 'Yes. Each lesson is a live, one-to-one session with your teacher on Google Meet.'
  },
  {
    questionAr: 'كيف أخطّط للحفظ أو المراجعة؟',
    questionEn: 'How do I plan memorization or revision?',
    answerAr: 'اختر السورة وعدد حصصك الأسبوعية في أداة التخطيط للاطّلاع على تقسيم مقترح. يمكنك تعديل خطتك بما يناسبك.',
    answerEn: 'Choose a surah and how often you want lessons in the planning tool to see a suggested breakdown. Adjust it to suit your pace.'
  },
  {
    questionAr: 'كيف أشترك في الحصص؟',
    questionEn: 'How do I sign up for lessons?',
    answerAr: 'اختر الباقة المناسبة لك من صفحة الأسعار، ثم اتبع خطوات التسجيل والدفع الظاهرة في حسابك.',
    answerEn: 'Choose a plan on the pricing page, then follow the registration and payment steps in your account.'
  },
  {
    questionAr: 'هل يمكنني تغيير موعد الحصة؟',
    questionEn: 'Can I change a lesson time?',
    answerAr: 'تواصل مع معلّمك لترتيب موعد آخر يناسبكما. تظهر مواعيد حصصك في جدولك.',
    answerEn: 'Contact your teacher to arrange another time that works for both of you. Your lessons appear in your schedule.'
  },
  {
    questionAr: 'كيف أختار معلّماً؟',
    questionEn: 'How do I choose a teacher?',
    answerAr: 'تصفّح ملفات المعلّمين وإجازاتهم، ثم اختر المعلّم الذي يناسب هدفك ومواعيدك.',
    answerEn: 'Browse teacher profiles and qualifications, then choose someone who fits your goals and schedule.'
  }
];

export default function NewLandingPage() {
  const router = useRouter();
  const { language, teachers, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isHydrated || !currentUser) return;

    const dashboardByRole = {
      ADMIN: '/admin/dashboard',
      TEACHER: '/teacher/dashboard',
      STUDENT: '/student/dashboard',
      GUEST: '/student/dashboard',
    } as const;

    router.replace(dashboardByRole[currentUser.role]);
  }, [currentUser, isHydrated, router]);

  // INTERACTIVE CURRICULUM SIMULATOR STATE
  const [simulatorTrack, setSimulatorTrack] = useState<'HIFZ' | 'TIKRAAR' | 'TAJWEED'>('HIFZ');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(2); // Al-Baqarah default
  const weeklyFrequency = 4; // Matches current monthly plans

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

  const enrollmentHref = `/register/student?surah=${selectedSurahNumber}&track=${simulatorTrack}`;
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
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-emerald-900 selection:text-white font-sans antialiased">

      <PublicNavbar />

      {/* Introduction */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-white border-b border-slate-200 pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Hero Left: Academic Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start">

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>{isAr ? 'تعلّم القرآن مع معلّمين مجازين' : 'Learn the Quran with qualified teachers'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-tight leading-[1.2]">
                {isAr ? (
                  <>
                    تعلّم القرآن الكريم وتلاوته <br className="hidden sm:block" />
                    مع <span className="text-emerald-800 underline decoration-amber-500/80 decoration-4 underline-offset-8">معلّمين مجازين</span>
                  </>
                ) : (
                  <>
                    Learn to recite and memorize the Quran with <span className="text-emerald-800">qualified teachers</span>
                  </>
                )}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                {isAr
                  ? 'تعلّم في حصص فردية مباشرة مع معلّمين مجازين. اختر هدفك في الحفظ أو المراجعة، وسنساعدك على تنظيم حصصك ومتابعة تقدّمك.'
                  : 'Study one to one with qualified Quran teachers. Choose a memorization or revision goal, plan your lessons, and track your progress.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/register/student"
                  className="px-8 py-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'إنشاء حساب طالب' : 'Create a student account'}</span>
                </Link>

                <a
                  href="#simulator"
                  className="px-7 py-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-emerald-800" />
                  <span>{isAr ? 'خطّط لحصصك' : 'Plan your lessons'}</span>
                </a>
              </div>

              {/* Minimal Metric Tickers */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center lg:text-start">
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-black text-slate-950">{isAr ? 'حصص فردية' : 'Private lessons'}</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'لقاء مباشر مع معلّمك' : 'Live lessons with your teacher'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-black text-emerald-900">{isAr ? 'معلّمون مجازون' : 'Qualified teachers'}</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'خبرة وإجازة في تعليم القرآن' : 'Experienced in Quran teaching'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-black text-slate-950">{isAr ? 'حسب وقتك' : 'Your schedule'}</div>
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'مواعيد تناسبك' : 'Choose a time that suits you'}</div>
                </div>
              </div>
            </div>

            {/* Hero portrait */}
            <div className="lg:col-span-5 flex justify-center items-center py-4 lg:py-0">
              <div className="relative isolate flex w-full max-w-[340px] sm:max-w-[420px] aspect-square items-end justify-center overflow-hidden">
                <div className="sanad-portrait-glow absolute inset-[14%] rounded-full" aria-hidden="true" />
                <div className="absolute inset-[17%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#d1fae5_0%,#6ee7b7_42%,#047857_100%)] shadow-[0_18px_50px_rgba(6,95,70,0.18)]">
                  <Image
                    src="/images/hero-quran-teacher-no-scarf.png"
                    alt={isAr ? 'معلّم يقرأ القرآن الكريم' : 'A teacher reading the Quran'}
                    fill
                    sizes="(max-width: 768px) 230px, 290px"
                    className="object-contain object-center"
                    priority
                  />
                </div>
                <div className="sanad-orbit absolute inset-[10%] rounded-full border border-emerald-700/20" aria-hidden="true" />
                <div className="sanad-orbit-reverse absolute inset-[4%] rounded-full border border-dashed border-amber-500/40" aria-hidden="true" />
                <div className="absolute inset-[1%] rounded-full border border-slate-200/80" aria-hidden="true" />
                <span className="absolute right-[14%] top-[24%] z-20 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.65)]" aria-hidden="true" />
                <span className="absolute bottom-[22%] left-[12%] z-20 h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" aria-hidden="true" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Lesson planner */}
      <section id="simulator" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-3xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'خطّط لتعلّمك' : 'Plan your learning'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'وزّع هدفك على حصص الشهر' : 'Build a monthly lesson plan'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr
                ? 'اختر مسارك وسورتك وعدد الحصص الأسبوعية للاطّلاع على توزيع مقترح للآيات والصفحات.'
                : 'Choose a study track, surah, and weekly lesson schedule to see a suggested breakdown of verses and pages.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Step 1: Learning Track */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isAr ? 'نوع الدراسة' : 'Study focus'}
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
                    {isAr ? 'حفظ' : 'Memorization'}
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
                    {isAr ? 'مراجعة' : 'Revision'}
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
                    {isAr ? 'تجويد' : 'Tajweed'}
                  </button>
                </div>
              </div>

              {/* Step 2: Target Surah Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isAr ? 'السورة' : 'Surah'}
                </label>
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => setSelectedSurahNumber(parseInt(e.target.value, 10))}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-extrabold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-800"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {isAr ? s.nameAr : s.nameEn} ({s.totalVerses} {isAr ? 'آية • صفحة' : 'ayahs • pages'} {s.startPage}-{s.endPage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Weekly Classes Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    {isAr ? 'الحصص في الأسبوع' : 'Lessons per week'}
                  </label>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {weeklyFrequency} {isAr ? 'حصص أسبوعياً' : 'per week'}
                  </span>
                </div>
                <p className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">{isAr ? 'الباقات الحالية تشمل ٤ حصص أسبوعياً. يضبط المعلم الوتيرة بعد تقييم مستواك.' : 'Current plans include four lessons per week. Your teacher adjusts the pace after assessing your level.'}</p>
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
                <span className="text-[10px] text-emerald-300/70 block">{isAr ? 'السورة المختارة' : 'Selected surah'}</span>
              </div>
            </div>

            {/* Direct Link to Start this plan */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-600 font-semibold">
                {isAr
                  ? `خطة مخصصة لـ ${selectedSurah.nameAr} موزعة على ${simulatedLessonsPerMonth} حصة شهرياً ويضيف المعلم رابط Google Meet قبل موعد الحصة.`
                  : `Custom plan for ${selectedSurah.nameEn} distributed across ${simulatedLessonsPerMonth} classes monthly.`}
              </span>

              <Link
                href={enrollmentHref}
                className="px-6 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm transition-all shrink-0 flex items-center gap-2"
              >
                <span>{isAr ? 'اعتماد هذه الخطة وحجز الحصص' : 'Enroll with this Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Sample lesson */}
      <section id="classroom" className="scroll-mt-20 py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-2xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'حصص مباشرة' : 'Live lessons'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'تعلّم مباشرة مع معلّمك' : 'Learn one to one with your teacher'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'تلتقي بمعلّمك عبر Google Meet، وتتابعان القراءة والملاحظات خلال الحصة.' : 'Meet your teacher on Google Meet and follow along with the Quran and lesson notes.'}
            </p>
          </div>

          {/* Classroom UI Mockup */}
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white shadow-2xl space-y-6">

            {/* Top Class Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-extrabold text-slate-300">{isAr ? 'نموذج توضيحي • Google Meet' : 'Illustrative preview • Google Meet'}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                  {isAr ? 'حصة تسميع وإتقان: سورة البقرة' : 'Class Session: Surah Al-Baqarah'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> 45:00 {isAr ? 'دقيقة' : 'minutes'}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {isAr ? 'نموذج توضيحي' : 'Illustrative session'}</span>
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
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'معلّم مجاز' : 'Qualified Quran teacher'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-amber-400 block">{isAr ? 'ملاحظات المعلّم:' : 'Teacher’s notes:'}</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isAr ? 'أحسنت في إخراج الحروف. انتبه إلى مقدار مدّ الصلة في الآية 255.' : 'Good articulation. Watch the length of the madd in verse 255.'}
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

      {/* Teachers */}
      <section id="faculty" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-2xl space-y-2 text-center sm:text-start">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
                  {isAr ? 'المعلّمون' : 'Our teachers'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'تعرّف على معلّمينا' : 'Meet your Quran teachers'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isAr ? 'تعرّف على خبرات معلّمينا وإجازاتهم قبل اختيار المعلّم المناسب لك.' : 'Review each teacher’s background and qualifications before choosing who to study with.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teachers.filter(teacher => teacher.approvalStatus === 'APPROVED').slice(0, 3).map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-400 font-extrabold flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-950">{isAr ? teacher.nameAr : teacher.nameEn}</h3>
                      <span className="text-[11px] text-slate-500 font-bold block">{isAr ? 'معلّم مجاز' : 'Qualified Quran teacher'}</span>
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
                    <span className="font-mono text-emerald-900">{formatAvailabilityRanges(teacher.availabilityRanges, teacher.workingHoursStart, teacher.workingHoursEnd, isAr, teacher.availabilityByDay)}</span>
                  </div>

                  <Link
                    href={`/register/student?teacher=${encodeURIComponent(teacher.id)}&gender=${teacher.gender}`}
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

      <div className="text-center py-6"><Link href="/teachers" className="font-bold text-emerald-800 underline">{isAr ? 'تصفح جميع المعلمين' : 'Browse all teacher profiles'}</Link></div>
      {/* Plans and pricing */}
      <section id="plans" className="scroll-mt-20 py-20 bg-white border-b border-slate-200">
        <PlansGrid onSelectPlan={plan => router.push(`/register/student?plan=${encodeURIComponent(plan.id)}&surah=${selectedSurahNumber}&track=${simulatorTrack}`)} />
      </section>

      {/* Getting started */}
      <section id="workflow" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'الخطوات التالية' : 'Getting started'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'ابدأ التعلّم في أربع خطوات' : 'Start learning in four steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">01</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'اختر الباقة والمعلّم' : 'Choose a plan and teacher'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'اختر الباقة وعدد الحصص، ثم اختر المعلّم الذي يناسبك.' : 'Choose a monthly plan, lesson frequency, and teacher.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">02</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'حدّد هدفك' : 'Set your goal'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'اختر ما تريد حفظه أو مراجعته، ونساعدك على تقسيمه إلى حصص.' : 'Choose what you want to memorize or revise and plan it across your lessons.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">03</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'أكمل الدفع' : 'Complete payment'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'اتبع تعليمات الدفع في حسابك وأرسل الإيصال لتأكيد اشتراكك.' : 'Follow the payment instructions in your account and submit your receipt.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-400 font-mono">04</div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'ابدأ حصصك' : 'Start your lessons'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? 'تابع جدولك وانضم إلى معلّمك عبر Google Meet في موعد الحصة.' : 'Check your schedule and join your teacher on Google Meet.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Frequently asked questions */}
      <section id="faq" className="scroll-mt-20 py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 block">
              {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {isAr ? 'هل لديك سؤال؟' : 'Questions?'}
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

      {/* Teacher applications */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto border border-slate-700 font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">
              {isAr ? 'هل أنت معلّم قرآن؟' : 'Are you a Quran teacher?'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'نرحّب بالمعلّمين المجازين الراغبين في تدريس القرآن عن بُعد. قدّم طلبك للتعرّف على خطوات الانضمام.'
                : 'We welcome qualified teachers who want to teach the Quran online. Apply to learn more about joining Sanad.'}
            </p>
          </div>

          <Link
            href="/register/teacher"
            className="inline-block px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all"
          >
            {isAr ? 'قدّم طلب انضمام' : 'Apply to teach'}
          </Link>
        </div>
      </section>

      <PublicFooter />

    </div>
  );
}
