import { 
  SubscriptionPlan, 
  Teacher, 
  StudentProfile, 
  TeacherProfile, 
  Lesson, 
  Review, 
  NotificationItem,
  BankInfo,
  LearningGoalTrack
} from '../types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    titleAr: 'الباقة التجريبية المجانية',
    titleEn: 'Free Starter Plan',
    subtitleAr: '4 حصص شهرياً مجاناً (حصة أسبوعياً) لتجربة التعلم مع المعلمين المجازين',
    subtitleEn: '4 classes monthly for Free (1 class/week) to experience learning with certified scholars',
    lessonsPerMonth: 4,
    totalHours: 2.0,
    hasFreeOrientationClass: true,
    lessonDurationMinutes: 30,
    priceMonthlySar: 0,
    featuresAr: [
      '4 حصص فردية مباشرة مجانية شهرياً',
      '+1 حصة ترحيبية وتأسيسية مجانية لتحديد المستوى',
      'جلسة أسبوعية لمدة 30 دقيقة',
      'تحديد السور المستهدفة وجدول المواعيد',
      'تفعيل فوري ومجاني بدون إيصال تحويل بنكي'
    ],
    featuresEn: [
      '4 1-on-1 private live sessions per month for Free',
      '+1 Free welcoming & orientation session for level assessment',
      '30-minute weekly session',
      'Target Surah selection & custom timetable',
      'Instant free activation without bank transfer'
    ]
  },
  {
    id: 'plan-standard',
    titleAr: 'باقة الحفظ والمدارسة الموصى بها',
    titleEn: 'Recommended Hifz & Study Plan',
    subtitleAr: '8 حصص شهرياً (حصتان أسبوعياً) لبناء حفظ متقن ومستمر',
    subtitleEn: '8 classes monthly (2 classes/week) for structured memorization & mastery',
    lessonsPerMonth: 8,
    totalHours: 4.0,
    hasFreeOrientationClass: true,
    lessonDurationMinutes: 30,
    priceMonthlySar: 260,
    popular: true,
    featuresAr: [
      '8 حصص فردية مباشرة مع معلم مجاز بالسند',
      '+1 حصة تمهيدية وتأسيسية مجانية',
      'حصتان أسبوعياً برابط Google Meet مباشر',
      'خطة تسميع مخصصة حسب فهرس المصحف',
      'إمكانية مرنة لتغيير مواعيد الحصص المجدولة'
    ],
    featuresEn: [
      '8 1-on-1 private sessions with certified scholar',
      '+1 Free orientation session included',
      '2 sessions per week via live Google Meet',
      'Customized Quran page-by-page Hifz roadmap',
      'Flexible rescheduling options for upcoming classes'
    ]
  },
  {
    id: 'plan-intensive',
    titleAr: 'الباقة المكثفة والإجازة بالسند',
    titleEn: 'Intensive & Ijazah Mastery Plan',
    subtitleAr: '12 حصة شهرياً (3 حصص أسبوعياً) لإنجاز الحفظ والإجازة بالسند المتصل',
    subtitleEn: '12 classes monthly (3 classes/week) for accelerated Hifz & Continuous Chain Ijazah',
    lessonsPerMonth: 12,
    totalHours: 6.0,
    hasFreeOrientationClass: true,
    lessonDurationMinutes: 30,
    priceMonthlySar: 360,
    featuresAr: [
      '12 حصة فردية مباشرة مع شيوخ الإجازة',
      '+1 حصة تمهيدية مجانية لتحديد مسار الإجازة',
      '3 حصص أسبوعياً لمراجعة وتثبيت الأجزاء',
      'متابعة مستمرة ومباشرة مع الشيخ المقرئ',
      'شهادة اعتماد إنجاز عند إتمام المقرر'
    ],
    featuresEn: [
      '12 1-on-1 private sessions with senior Ijazah scholars',
      '+1 Free orientation class for Ijazah track alignment',
      '3 sessions weekly for rapid progress & review',
      'Direct line of instruction with certified Sheikh',
      'Formal completion certificate upon goal fulfillment'
    ]
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tech-sulami',
    nameAr: 'الشيخ أ.د. إبراهيم السلمي',
    nameEn: 'Sheikh Prof. Ibrahim Al-Sulami',
    email: 'sulami@sanad.com',
    titleAr: 'أستاذ القراءات وعلوم القرآن بكلية الشريعة ومجاز بالقراءات العشر الصغرى والكبرى',
    titleEn: 'Professor of Quranic Sciences & Master of Ten Recitations',
    rating: 4.98,
    reviewsCount: 142,
    ijazahDetailsAr: 'إجازة بالسند المتصل إلى رسول الله ﷺ برواية حفص عن عاصم ورواية قالون وورش والدوري',
    ijazahDetailsEn: 'Continuous Ijazah chain connecting to Prophet Muhammad (PBUH) in Hafs, Qalun & Warsh',
    experienceYears: 18,
    languagesSpoken: ['العربية', 'English'],
    specializationsAr: ['الإجازة بالسند المتصل', 'تصحيح التلاوة وتجويد الحروف', 'إتقان المتون والتسميع'],
    specializationsEn: ['Continuous Chain Ijazah', 'Tajweed & Pronunciation', 'Advanced Hifz Revision'],
    bioAr: 'خادم للقرآن الكريم لأكثر من 18 عاماً، أشرف على تخريج أكثر من 80 حافظاً ومجازاً بالسند المتصل.',
    bioEn: 'Dedicated Quran scholar for over 18 years, having authorized over 80 students with chain certificates.',
    hourlyRateSar: 120,
    availableSlots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
    workingHoursStart: '12:00',
    workingHoursEnd: '18:00',
    workingDaysAr: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    bookedTimeSlots: [],
    gender: 'MALE',
    isFullyBooked: false,
    approvalStatus: 'APPROVED'
  }
];

export const INITIAL_STUDENT: StudentProfile = {
  id: 'std-8941',
  nameAr: 'عبد الرحمن بن خالد العتيبي',
  nameEn: 'Abdulrahman Al-Otaibi',
  email: 'abdulrahman@sanad.com',
  phone: '+966 50 123 4567',
  gender: 'MALE',
  verificationStatus: 'VERIFIED',
  activePlanId: 'plan-standard',
  nextCyclePlanId: null,
  subscriptionStartDate: '2026-08-01',
  subscriptionRenewalDate: '2026-09-01',
  remainingLessons: 8,
  extraClassCredits: 0,
  totalLessonsCompleted: 0,
  totalHoursLearned: 0.0,
  assignedTeacherId: 'tech-sulami',
  quranGoal: {
    track: 'COMBINED',
    targetSurahOrJuzAr: 'الحفظ: سورة البقرة | التلاوة: سورة يس',
    targetSurahOrJuzEn: 'Hifz: Surah Al-Baqarah | Tilawah: Surah Ya-Sin',
    orientationCompleted: true,
    agreedWeeklyDaysAr: ['الإثنين', 'الأربعاء'],
    agreedWeeklyDaysEn: ['Monday', 'Wednesday'],
    agreedTimeSlot: '12:00',
    dayTimeSlots: { 'الإثنين': '12:00', 'الأربعاء': '14:00' },
    hifzSurahNumbers: [2],
    tilawahSurahNumbers: [36],
    hifzFahrasType: 'SURAH',
    tilawahFahrasType: 'SURAH',
    isHybridTrack: true
  }
};

export const INITIAL_TEACHER_PROFILE: TeacherProfile = {
  ...INITIAL_TEACHERS[0],
  totalStudents: 18,
  totalHoursTaught: 340,
  ratingAvg: 4.98,
  ijazahChainAr: 'عن الشيخ عبد الفتاح القاضي عالي السند عن الشيخ المتولي عن الإمام الجزري بالسند المتصل إلى رسول الله ﷺ',
  ijazahChainEn: 'Chain via Sheikh Abd al-Fattah al-Qadi connecting directly to Prophet Muhammad (PBUH)'
};

export const INITIAL_LESSONS: Lesson[] = [];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    teacherId: 'tech-sulami',
    studentNameAr: 'سليمان بن عبد الله',
    studentNameEn: 'Sulaiman Al-Abdullah',
    rating: 5,
    date: '2026-08-01',
    commentAr: 'شيخ فاضل ومتمكن جداً في ضبط مخارج الحروف والأحكام، جزاه الله خير الجزاء.',
    commentEn: 'Outstanding scholar with precise articulation and profound knowledge.'
  },
  {
    id: 'rev-2',
    teacherId: 'tech-sulami',
    studentNameAr: 'عمر الفاروق',
    studentNameEn: 'Omar Al-Farooq',
    rating: 5,
    date: '2026-07-28',
    commentAr: 'منهجية رائعة في التثبيت والتسميع مع مرونة ممتازة في المواعيد.',
    commentEn: 'Great methodology for memorization review with excellent timetable flexibility.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    titleAr: 'تأكيد موعد الحصة التمهيدية والتأسيسية',
    titleEn: 'Complimentary Orientation Confirmed',
    messageAr: 'تم تحديد موعد الجلسة التمهيدية المجانية مع المعلم المعتمد.',
    messageEn: 'Your orientation class with assigned scholar is scheduled.',
    time: 'منذ ساعتين',
    read: false,
    type: 'LESSON_REMINDER'
  }
];

export const BANK_INFO: BankInfo = {
  bankNameAr: 'مصرف الراجحي - المملكة العربية السعودية',
  bankNameEn: 'Al Rajhi Bank - Kingdom of Saudi Arabia',
  accountNameAr: 'شركة سنَد لتقنية التعليم والقرآن الكريم',
  accountNameEn: 'Sanad Quran Education Technology Company',
  iban: 'SA84 8000 0458 6080 1012 3456',
  accountNumber: '458608010123456',
  swiftCode: 'RJHI SA RI'
};

export interface SubscriptionGoalOption {
  id: LearningGoalTrack;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  badgeEn: string;
  targetAudienceAr: string;
  targetAudienceEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
}

export const SUBSCRIPTION_GOALS: SubscriptionGoalOption[] = [
  {
    id: 'TALQEEN',
    titleAr: 'مسار التلقين والترديد المباشر',
    titleEn: 'Talqeen & Guided Repetition',
    badgeAr: 'للصغار والكبار',
    badgeEn: 'Kids & Beginners',
    targetAudienceAr: 'للطلاب الصغار دون سن السادسة والكبار الذين يحتاجون إلى التلقين والمحاكاة الشفهية المباشرة مع المعلم.',
    targetAudienceEn: 'For young children under 6 and adults needing step-by-step oral repetition with the scholar.',
    descriptionAr: 'ترديد مباشر آية بآية مع المعلم لغرس النطق السليم وسهولة الحفظ بدون الحاجة للقراءة المسبقة من المصحف.',
    descriptionEn: 'Live oral repetition verse-by-verse for accurate pronunciation without prior reading ability.',
    iconName: 'Baby'
  },
  {
    id: 'TILAWAH_CORRECTION',
    titleAr: 'مسار تصحيح التلاوة وإتقان التجويد',
    titleEn: 'Recitation Correction & Tajweed',
    badgeAr: 'إتقان القراءة',
    badgeEn: 'Tajweed Mastery',
    targetAudienceAr: 'للطلاب الذين يريدون قراءة القرآن الكريم قراءة صحيحة وإتقان مخارج الحروف وصفاتها وتطبيق أحكام التجويد عملياً.',
    targetAudienceEn: 'For students looking to read fluently with correct Tajweed rules and articulation points.',
    descriptionAr: 'تصحيح مباشر وتدريب عملي على أحكام النون والميم والمدود ومخارج الحروف مع كل صفحة تقرؤها.',
    descriptionEn: 'Real-time practical correction on Tajweed rules and phonetics during live reading.',
    iconName: 'BookOpen'
  },
  {
    id: 'HIFZ_NEW',
    titleAr: 'مسار الحفظ الجديد والتثبيت',
    titleEn: 'Quran Memorization & Hifz',
    badgeAr: 'حفظ وتثبيت',
    badgeEn: 'Hifz & Revision',
    targetAudienceAr: 'للطلاب الراغبين في حفظ القرآن الكريم أو أجزاء منه بانتظام مع خطة تسميع ومراجعة وتثبيت أسبوعية.',
    targetAudienceEn: 'For students aiming to memorize the Quran with systematic weekly recitation and retention milestones.',
    descriptionAr: 'جدول تسميع أسبوعي مع مراجعة الحفظ القديم وربط الآيات بإشراف المعلم المجاز لضمان ثبات الحفظ.',
    descriptionEn: 'Structured weekly memorization tracking combined with continuous retention review.',
    iconName: 'BookmarkCheck'
  },
  {
    id: 'IJAZAH_REVIEW',
    titleAr: 'مسار الإجازة بالسند المتصل',
    titleEn: 'Sanad Continuous Chain Ijazah',
    badgeAr: 'إجازة مسندة',
    badgeEn: 'Sanad Certification',
    targetAudienceAr: 'للطلاب الحفّاظ المتقنين الراغبين في ختم القرآن الكريم لنيل إجازة مسندة برواية حفص أو القراءات المتواترة إلى النبي ﷺ.',
    targetAudienceEn: 'For proficient memorizers seeking full Quran recitation to earn an authentic Sanad connected to Prophet Muhammad ﷺ.',
    descriptionAr: 'عرض دقيق متصل مع شيوخ الإجازة المعتمدين وتوثيق الختمة لمنح شهادة الإسناد المتصل.',
    descriptionEn: 'Rigorous complete Quran recitation with accredited senior scholars to receive formal Ijazah.',
    iconName: 'Award'
  }
];

export const getQuranTrackTitle = (trackKey?: LearningGoalTrack, isAr: boolean = true): string => {
  const goal = SUBSCRIPTION_GOALS.find(g => g.id === trackKey);
  if (goal) {
    return isAr ? goal.titleAr : goal.titleEn;
  }
  if (trackKey === 'COMBINED') {
    return isAr ? 'مسار التلاوة والحفظ المدمج' : 'Combined Recitation & Hifz';
  }
  return isAr ? 'مسار الحفظ الجديد والتثبيت' : 'Quran Memorization & Hifz';
};

