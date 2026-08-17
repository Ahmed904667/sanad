export type Language = 'ar' | 'en';
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'GUEST';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'PAUSED' | 'CANCELLED';
export type TeacherApprovalStatus = 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';
export type SubscriptionChangeType = 'NEW' | 'UPGRADE_NEXT_MONTH' | 'DOWNGRADE_NEXT_MONTH' | 'RENEWAL' | 'EXTRA_CLASS';

export type LearningGoalTrack = 'TALQEEN' | 'TILAWAH_CORRECTION' | 'HIFZ_NEW' | 'IJAZAH_REVIEW' | 'COMBINED';

export interface StudentQuranGoal {
  track: LearningGoalTrack;
  targetSurahOrJuzAr: string;
  targetSurahOrJuzEn: string;
  orientationCompleted: boolean;
  agreedWeeklyDaysAr: string[];
  agreedWeeklyDaysEn: string[];
  agreedTimeSlot?: string; // Selected primary time slot (e.g. "12:00")
  dayTimeSlots?: Record<string, string>; // Exact per-day time slots map e.g. { 'الإثنين': '12:00', 'الثلاثاء': '17:00' }
  assignedTeacherId?: string;
  hifzSurahNumbers?: number[];
  hifzJuzNumbers?: number[];
  surahAyahCustomMap?: Record<number, { startAyah: number; endAyah: number }>;
  tilawahSurahNumbers?: number[];
  tilawahJuzNumbers?: number[];
  hifzFahrasType?: 'SURAH' | 'JUZ';
  tilawahFahrasType?: 'SURAH' | 'JUZ';
  isHybridTrack?: boolean;
  isPlanLocked?: boolean;  // Once generated, plan classes are locked one-time
}

export interface AuthUser {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  role: Role;
  teacherApprovalStatus?: TeacherApprovalStatus;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  role: Role;
  phone?: string;
  isBlocked?: boolean;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
}

export interface BankInfo {
  bankNameAr: string;
  bankNameEn: string;
  accountNameAr: string;
  accountNameEn: string;
  iban: string;
  accountNumber: string;
  swiftCode: string;
}

export interface SubscriptionPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  priceMonthlySar: number;
  lessonsPerMonth: number;
  totalHours?: number;
  hasFreeOrientationClass: boolean; // Includes +1 Free Orientation Session
  lessonDurationMinutes: number;
  popular?: boolean;
  featuresAr: string[];
  featuresEn: string[];
}

export interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  titleAr: string;
  titleEn: string;
  rating: number;
  reviewsCount: number;
  ijazahDetailsAr: string;
  ijazahDetailsEn: string;
  experienceYears: number;
  languagesSpoken: string[];
  specializationsAr: string[];
  specializationsEn: string[];
  bioAr: string;
  bioEn: string;
  hourlyRateSar: number;
  availableSlots: string[];
  workingHoursStart: string; // e.g. "12:00"
  workingHoursEnd: string;   // e.g. "18:00"
  workingDaysAr?: string[];  // e.g. ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  bookedTimeSlots: string[]; // e.g. ["13:00", "14:00", "15:00"]
  gender: 'MALE' | 'FEMALE';
  isFullyBooked?: boolean;
  approvalStatus: TeacherApprovalStatus;
}

export interface ExtraClassRequest {
  id: string;
  studentId: string;
  priceSar: number;
  receiptUrl: string;
  bankTransferRef: string;
  requestDate: string;
  status: 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';
}

export interface StudentProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
  verificationStatus: VerificationStatus;
  activePlanId: string | null;
  nextCyclePlanId?: string | null;
  pendingPlanId?: string | null;
  subscriptionChangeType?: SubscriptionChangeType;
  subscriptionStartDate?: string;
  subscriptionRenewalDate?: string;
  remainingLessons: number;
  extraClassCredits?: number;
  extraPurchasedClassesCount?: number;
  totalLessonsCompleted: number;
  totalHoursLearned: number;
  assignedTeacherId: string | null;
  paymentReceiptUrl?: string;
  bankTransferRef?: string;
  paymentDate?: string;
  pauseReason?: string;
  rejectionReason?: string;
  quranGoal?: StudentQuranGoal;
}

export interface TeacherProfile extends Teacher {
  totalStudents: number;
  totalHoursTaught: number;
  ratingAvg: number;
  ijazahChainAr: string;
  ijazahChainEn: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn: string;
  studentNameAr: string;
  studentNameEn: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  needsRescheduling?: boolean;
  googleMeetUrl: string;
  isOrientationSession?: boolean; // Is initial consultation class
  surahTargetAr?: string;
  surahTargetEn?: string;
  notes?: string;
}

export interface Review {
  id: string;
  teacherId: string;
  studentId?: string;
  studentNameAr: string;
  studentNameEn: string;
  rating: number;
  date: string;
  commentAr: string;
  commentEn: string;
}

export interface NotificationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  time: string;
  read: boolean;
  type: 'LESSON_REMINDER' | 'PLAN_SUBSCRIPTION' | 'TEACHER_APPROVED' | 'SYSTEM';
}
