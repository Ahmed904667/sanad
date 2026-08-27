'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck, 
  Video, 
  Clock, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Target, 
  Award, 
  CreditCard,
  Building2,
  HelpCircle,
  ArrowRight,
  Star
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
    answerAr: 'جميع الحصص في منصة سَنَد هي حصص فردية مباشرة 1:1 تجمع الطالب بمعلمه المجاز فقط عبر Google Meet لضمان أعلى درجات التركيز والتصحيح الدقيق للتلاوة والحفظ.',
    answerEn: 'All sessions on Sanad are 1-on-1 private live classes between the student and certified scholar via Google Meet to ensure maximum focus and acoustic accuracy.'
  },
  {
    questionAr: 'كيف يقوم النظام بتوليد خطة الحفظ والتلاوة؟',
    questionEn: 'How does the automated Quran Plan Builder work?',
    answerAr: 'بمجرد اختيار السور أو الأجزاء المستهدفة ونوع المسار (حفظ جديد، مراجعة، أو تصحيح تلاوة)، يقوم باني الخطة الذكي بحساب عدد الآيات والصفحات وتوزيعها بدقة على جميع حصص الشهر بالتساوي.',
    answerEn: 'Upon selecting your target Surahs or Juz, the smart plan engine calculates the exact pages and ayahs and distributes them evenly across your monthly scheduled classes.'
  },
  {
    questionAr: 'ما هي آلية دفع الاشتراكات الشهرية؟',
    questionEn: 'How do subscription payments work?',
    answerAr: 'الاشتراكات شهرية ثابتة بالريال السعودي. يتم سداد الرسوم عبر التحويل البنكي المباشر لحساب مصرف الراجحي المعتمد للمنصة، ثم رفع صورة الإيصال ليتم تفعيل حسابك وجدولك فوراً.',
    answerEn: 'Subscriptions are fixed 1-month plans in SAR. Transfer the fee to the official Al Rajhi Bank IBAN and upload your receipt for instant account and timetable activation.'
  },
  {
    questionAr: 'هل يمكنني إعادة جدولة موعد حصة أو شراء حصص إضافية؟',
    questionEn: 'Can I reschedule a class or purchase extra lessons?',
    answerAr: 'نعم، تتيح المنصة إعادة جدولة أي حصة قادمة إلى موعد آخر مناسب مع معلمك بنقرة واحدة، كما يمكنك شراء حصص إضافية فردية بسعر 20 ر.س للحصة في أي وقت للتسميع أو المراجعة.',
    answerEn: 'Yes! You can reschedule upcoming classes without conflicts, and purchase extra individual lessons for 20 SAR each at any time.'
  },
  {
    questionAr: 'من هم المعلمون في منصة سَنَد وكيف يتم اعتمادهم؟',
    questionEn: 'Who are the instructors and how are they vetted?',
    answerAr: 'تضم المنصة نخبة من المعلمين والمقرئين المعتمدين الحاصلين على إجازات بالسند المتصل إلى النبي ﷺ برواية حفص عن عاصم والقراءات العشر، وتتم مراجعة إجازاتهم وتدقيقها بدقة من إدارة المنصة.',
    answerEn: 'Our faculty consists of certified scholars holding authentic sanad chains back to Prophet Muhammad ﷺ, verified through rigorous admin assessment.'
  }
];

export default function Home() {
  const router = useRouter();
  const { language, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="space-y-0 text-slate-900">
      
      {/* 1. HERO SECTION - MODERN & CLEAN WITH PROPER VALUE PROPOSITION */}
      <section className="relative bg-emerald-950 text-white pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-start">
              
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isAr ? 'مقرأة إلكترونية معتمدة بالسند المتصل' : 'Certified Quran Platform with Connected Sanad'}</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-white">
                  {isAr ? (
                    <>
                      تعلّم القرآن الكريم <span className="gold-gradient-text">بسندٍ متصل</span> في حصص فردية مباشرة
                    </>
                  ) : (
                    <>
                      Learn the Holy Quran <span className="gold-gradient-text">with Connected Sanad</span> in 1:1 Live Classes
                    </>
                  )}
                </h1>

                <p className="text-emerald-100/90 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {isAr
                    ? 'منصة تعليمية متكاملة تتيح لك بناء خطتك القرآنية المخصصة بالسورة أو الجزء، وحضور حصص فردية تفاعلية 1:1 عبر Google Meet مع نخبة من المعلمين المجازين.'
                    : 'A comprehensive Quran learning platform offering customized surah-by-surah goal plans and 1-on-1 virtual classrooms with certified scholars.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/register/student"
                  className="px-8 py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-base shadow-lg hover:brightness-105 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  <User className="w-5 h-5 stroke-[2.5]" />
                  <span>{isAr ? 'ابدأ رحلتك القرآنية الآن' : 'Start Your Quran Journey'}</span>
                </Link>

                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800 text-white font-bold text-base border border-emerald-700/60 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs font-bold text-emerald-200/90 border-t border-emerald-900/80">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'حصص فردية 1:1 عبر Meet' : '1:1 Google Meet Classes'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'معلمون مجازون بالسند المتصل' : 'Authentic Sanad Scholars'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'جدول زمني ذكي ومرن' : 'Smart Conflict-Free Schedule'}</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visual */}
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

      {/* 2. WHAT MAKES SANAD SPECIAL - ACTUAL APP FEATURES BENTO GRID */}
      <section className="py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'لماذا تختار منصة سَنَد؟' : 'Core Platform Capabilities'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              {isAr ? 'كل ما تحتاجه لإتقان كتاب الله في بيئة تعليمية ذكية' : 'Everything You Need for Quran Excellence'}
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              {isAr 
                ? 'تجمع منصة سَنَد بين أصالة التعليم القرآني بالسند المتصل وأحدث التقنيات الرقمية لتيسير الحفظ والتلاوة.' 
                : 'Sanad unites traditional connected sanad scholarship with modern automated scheduling and plan tracking.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1: Plan Builder */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg text-amber-400 font-bold flex items-center justify-center shadow-sm">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950">
                  {isAr ? 'باني الخطة القرآنية الذكي' : 'Smart Plan Builder'}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {isAr 
                    ? 'حدد هدفك القرآني بالسورة أو الجزء، ويقوم النظام تلقائياً بحساب عدد الآيات وتوزيع مقررك على حصص الشهر بالتساوي.' 
                    : 'Select your target surahs or juz, and our engine automatically calculates and divides daily pages across your classes.'}
                </p>
              </div>
            </div>

            {/* Feature 2: 1:1 Live Classes */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 font-bold flex items-center justify-center shadow-sm">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950">
                  {isAr ? 'حصص فردية مباشرة 1:1' : '1-on-1 Live Google Meet'}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {isAr 
                    ? 'تواصل مباشر مع معلمك الخاص في غرفة افتراضية خاصة عبر Google Meet تضمن الخصوصية والتصحيح الصوتي الدقيق.' 
                    : 'Direct 1-on-1 virtual sessions with dedicated Google Meet links ensuring personal attention and acoustic tajweed correction.'}
                </p>
              </div>
            </div>

            {/* Feature 3: Smart Calendar */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-200 font-bold flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950">
                  {isAr ? 'جدولة ذكية ومنع التعارض' : 'Conflict-Free Scheduling'}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {isAr 
                    ? 'نظام يضمن عدم تعارض المواعيد مع إمكانية إعادة جدولة أي حصة قادمة بنقرة واحدة عند حدوث أي طارئ.' 
                    : 'Smart timetable prevention of overlapping slots with one-click rescheduling whenever your schedule changes.'}
                </p>
              </div>
            </div>

            {/* Feature 4: Verified Sanad Scholars */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-emerald-950 font-bold flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950">
                  {isAr ? 'إجازة بالسند المتصل' : 'Connected Sanad & Ijazah'}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {isAr 
                    ? 'نخبة من المقرئين المجازين بسند متصل إلى النبي ﷺ برواية حفص عن عاصم والقراءات العشر لتوثيق ختمتك.' 
                    : 'Vetted scholars holding authentic sanad chains to Prophet Muhammad ﷺ in Hafs or 10 Qira’at.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. STUDY TRACKS WITH AUTHENTIC REAL PHOTOGRAPHY */}
      <section className="py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              {isAr ? 'مسارات الحلقات القرآنية في سَنَد' : 'Quran Study Tracks'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isAr 
                ? 'اختر المسار الأنسب لمستواك وهدفك القرآني، وتابع تقدمك خطوة بخطوة مع معلمك المعتمد.' 
                : 'Choose the study track tailored for your current level and target milestone.'}
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
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'مسار الحفظ والتثبيت' : 'Memorization & Retention'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'مخصص لحفظ سور جديدة مع التسميع المباشر للمعلم والمراجعة المنظمة لتثبيت المحفوظ ورسوخه.' 
                      : 'Structured memorization of new surahs with live recital and systematic revision for deep retention.'}
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
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'مسار التلاوة وتصحيح التجويد' : 'Recitation & Tajweed'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'ضبط مخارج الحروف وصفاتها والوقف والابتداء مع التدريب الصوتي العملي المستمر والتصحيح المباشر.' 
                      : 'Mastering pronunciation, articulation points (Makharij), and Tajweed rules with real-time feedback.'}
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
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-emerald-950">
                    {isAr ? 'مسار الختمة والإجازة بالسند' : 'Connected Sanad & Ijazah'}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isAr 
                      ? 'قراءة القرآن الكريم كاملاً غيباً أو نظراً للحصول على إجازة رسمية موثقة متصلة السند إلى النبي ﷺ.' 
                      : 'Complete Quran recital under certified scholars to attain verified Ijazah linked to the Prophet ﷺ.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS - 4 CLEAR STEPS */}
      <section className="py-24 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-emerald-950">
              {isAr ? 'كيف تبدأ دراستك في سَنَد؟' : 'How Sanad Works'}
            </h2>
            <p className="text-slate-600 text-sm">
              {isAr ? 'أربع خطوات واضحة وميسرة للانضمام إلى حلقات القرآن الكريم.' : 'Four simple steps from registration to attending your live classes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg text-amber-400 font-black text-lg flex items-center justify-center shadow-sm">
                1
              </div>
              <h3 className="font-bold text-base text-emerald-950">
                {isAr ? '1. تسجيل الطالب واختيار الخطة' : '1. Signup & Plan'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'أنشئ حسابك وحدد الخطة المناسبة وعدد الحصص الأسبوعية مع المعلم الذي تفضله.' 
                  : 'Register student account and select your monthly plan in SAR with your preferred instructor.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-lg flex items-center justify-center shadow-sm">
                2
              </div>
              <h3 className="font-bold text-base text-emerald-950">
                {isAr ? '2. تحديد الهدف القرآني' : '2. Set Quran Goal'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'اختر مسارك القرآني وسور الحفظ ليقوم النظام تلقائياً بتوزيع المقاطع على حصصك.' 
                  : 'Choose your learning track and surahs to auto-generate your monthly lesson breakdown.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-100 font-black text-lg flex items-center justify-center shadow-sm">
                3
              </div>
              <h3 className="font-bold text-base text-emerald-950">
                {isAr ? '3. التحويل البنكي ورفع الإيصال' : '3. Bank Transfer'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'حوّل الرسوم عبر الحساب المعتمد لمصرف الراجحي وارفِع صورة الإيصال للاعتماد الفوري.' 
                  : 'Transfer the fee to the official Al Rajhi IBAN and upload receipt for instant approval.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-emerald-950 font-black text-lg flex items-center justify-center shadow-sm">
                4
              </div>
              <h3 className="font-bold text-base text-emerald-950">
                {isAr ? '4. حضور الحصص المباشرة' : '4. Attend Classes'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isAr 
                  ? 'استلم جدولك التلقائي بدون تعارض، وانضم لحصصك الفردية عبر رابط Google Meet مباشرة.' 
                  : 'Receive your conflict-free timetable and join 1:1 live classes via Google Meet.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. SUBSCRIPTION PLANS MATRIX */}
      <PlansGrid />

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-24 bg-[#FAF8F5] border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-extrabold">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
            </div>

            <h2 className="text-3xl font-black text-emerald-950">
              {isAr ? 'إجابات على أهم الاستفسارات حول المنصة' : 'Everything You Need to Know'}
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 sm:p-6 text-start flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-extrabold text-emerald-950">
                      {isAr ? faq.questionAr : faq.questionEn}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {isAr ? faq.answerAr : faq.answerEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. TEACHER REGISTRATION CALLOUT */}
      <section className="py-20 bg-emerald-950 text-white border-t border-emerald-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-3xl font-black">
            {isAr ? 'هل أنت معلم قرآن كريم مجاز بالسند؟' : 'Are You a Certified Quran Scholar?'}
          </h2>

          <p className="text-emerald-200/90 text-sm max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? 'انضم إلى منصة سَنَد وقدم حلقاتك القرآنية لطلاب من مختلف أنحاء العالم عبر بيئة تقنية متكاملة وميسرة.' 
              : 'Join Sanad to conduct online recitation and memorization halaqat worldwide.'}
          </p>

          <Link
            href="/register/teacher"
            className="inline-block px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-sm shadow-lg transition-all hover:scale-105"
          >
            {isAr ? 'التقديم كمعلم معتمد الآن' : 'Apply as Certified Teacher'}
          </Link>
        </div>
      </section>

    </div>
  );
}
