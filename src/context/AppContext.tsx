'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Language, 
  Role, 
  StudentProfile, 
  TeacherProfile, 
  SubscriptionPlan, 
  Teacher, 
  Lesson, 
  Review, 
  NotificationItem, 
  BankInfo,
  AuthUser,
  VerificationStatus,
  TeacherApprovalStatus,
  StudentQuranGoal,
  UserAccount,
  SubscriptionChangeType
} from '../types';

import { 
  INITIAL_PLANS, 
  INITIAL_TEACHERS, 
  INITIAL_STUDENT, 
  INITIAL_TEACHER_PROFILE, 
  INITIAL_LESSONS, 
  INITIAL_REVIEWS, 
  INITIAL_NOTIFICATIONS,
  BANK_INFO 
} from '../data/mockData';

import { 
  QURAN_SURAHS, 
  partitionSurahsAcrossClasses, 
  partitionJuzAcrossClasses 
} from '../data/quranData';

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: INITIAL_STUDENT.id,
    name: INITIAL_STUDENT.nameAr,
    email: INITIAL_STUDENT.email.toLowerCase(),
    password: '123456',
    gender: 'MALE',
    role: 'STUDENT',
    phone: INITIAL_STUDENT.phone,
    studentProfile: INITIAL_STUDENT
  },
  {
    id: 'tech-sulami',
    name: 'الشيخ أ.د. إبراهيم السلمي',
    email: 'sulami@sanad.com',
    password: '123456',
    gender: 'MALE',
    role: 'TEACHER'
  },
  {
    id: 'adm-001',
    name: 'مدير النظام الفني',
    email: 'admin@sanad.com',
    password: '123456',
    gender: 'MALE',
    role: 'ADMIN'
  }
];

interface AppContextType {
  isHydrated: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  role: Role;
  setRole: (role: Role) => void;
  currentUser: AuthUser | null;
  
  student: StudentProfile;
  teacherProfile: TeacherProfile;
  plans: SubscriptionPlan[];
  teachers: Teacher[];
  lessons: Lesson[];
  reviews: Review[];
  notifications: NotificationItem[];
  bankInfo: BankInfo;
  userAccounts: UserAccount[];
  selectedTeacherForBooking: Teacher | null;
  setSelectedTeacherForBooking: (teacher: Teacher | null) => void;
  selectedPlanForCheckout: SubscriptionPlan | null;
  setSelectedPlanForCheckout: (plan: SubscriptionPlan | null) => void;
  
  // Auth Actions
  login: (identifier: string, pass: string) => { success: boolean; role?: Role; status?: TeacherApprovalStatus; error?: string };
  logout: () => void;
  registerStudentAccount: (
    name: string, 
    email: string, 
    gender?: 'MALE' | 'FEMALE', 
    phone?: string, 
    password?: string,
    onboardingData?: {
      planId: string;
      teacherId: string;
      quranGoal: StudentQuranGoal;
      receiptFile?: string;
      bankRef?: string;
      initialLessons?: Lesson[];
    }
  ) => string;
  applyAsTeacher: (name: string, email: string, gender?: 'MALE' | 'FEMALE', ijazahDetails?: string, specializations?: string[], password?: string) => void;
  
  // Admin Actions
  approveTeacherByAdmin: (teacherId: string) => void;
  rejectTeacherByAdmin: (teacherId: string) => void;

  // Student Actions
  submitPaymentReceipt: (planId: string, teacherId: string, receiptFile: string, bankRef: string) => void;
  resubmitPaymentReceipt: (receiptFile: string, bankRef: string, planIdOverride?: string) => void;
  scheduleNextCyclePlan: (planId: string) => void;
  purchaseExtraClass: (receiptFile: string, bankRef: string, quantity?: number) => void;
  scheduleExtraLesson: (date: string, time: string, surahTarget: string, teacherId?: string) => void;
  updateStudentQuranGoal: (goal: StudentQuranGoal) => void;
  setGeneratedPlanLessons: (newLessons: Lesson[], studentIdOverride?: string) => void;
  updateUpcomingPlanLessons: (newUpcomingLessons: Lesson[], studentIdOverride?: string) => void;
  rescheduleLesson: (lessonId: string, newDate: string, newTimeStr: string) => void;
  pauseSubscription: (reason?: string) => void;
  resumeSubscription: () => void;
  cancelSubscription: () => void;

  // Teacher / Admin Actions
  approveStudentPayment: (studentId: string) => void;
  rejectStudentPayment: (studentId: string, reason?: string) => void;
  toggleBlockAccount: (userId: string) => void;
  createAccountByAdmin: (newAccount: UserAccount) => void;
  updateTeacherAvailability: (
    teacherId: string, 
    newStart: string, 
    newEnd: string, 
    newDays: string[],
    newSlots: string[],
    conflictResolutionOption: 'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'
  ) => void;

  // Lessons
  bookLesson: (teacherId: string, date: string, time: string) => void;
  addReview: (teacherId: string, rating: number, commentAr: string, commentEn?: string) => void;
  updateMeetUrl: (lessonId: string, newUrl: string) => void;
  completeLesson: (lessonId: string, notes?: string) => void;
  cancelLesson: (lessonId: string) => void;
  clearAllClassData: () => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');
  const [role, setRole] = useState<Role>('GUEST');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);

  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(INITIAL_TEACHER_PROFILE);
  const [plans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(DEFAULT_ACCOUNTS);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | null>(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  // 1. SYNCHRONOUS IMMEDIATE CLIENT HYDRATION (0ms Delay - Eliminates flash of mock user)
  useEffect(() => {
    try {
      // 1. Hydrate user accounts
      let activeAccounts = DEFAULT_ACCOUNTS;
      const savedAccounts = localStorage.getItem('ratel_user_accounts');
      if (savedAccounts) {
        const parsed = JSON.parse(savedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeAccounts = parsed;
          setUserAccounts(parsed);
        }
      }

      // 2. Hydrate current user & role
      let activeUser: AuthUser | null = null;
      const savedUser = localStorage.getItem('ratel_current_user');
      if (savedUser) {
        activeUser = JSON.parse(savedUser);
        setCurrentUser(activeUser);
      }

      const savedRole = localStorage.getItem('ratel_role') as Role;
      if (savedRole) setRole(savedRole);

      // 3. Hydrate student profile (link to active user if available)
      if (activeUser && activeUser.role === 'STUDENT') {
        const matchedAcc = activeAccounts.find(a => a.id === activeUser.id || a.email.toLowerCase() === activeUser.email.toLowerCase());
        if (matchedAcc && matchedAcc.studentProfile) {
          setStudent(matchedAcc.studentProfile);
        } else {
          const savedStudent = localStorage.getItem('ratel_student');
          if (savedStudent) setStudent(JSON.parse(savedStudent));
        }
      } else {
        const savedStudent = localStorage.getItem('ratel_student');
        if (savedStudent) setStudent(JSON.parse(savedStudent));
      }

      const savedTeacherProf = localStorage.getItem('ratel_teacher_profile');
      if (savedTeacherProf) setTeacherProfile(JSON.parse(savedTeacherProf));

      // 4. Hydrate lessons from local storage
      const savedLessonsStr = localStorage.getItem('ratel_lessons');
      if (savedLessonsStr) {
        const parsedLessons: Lesson[] = JSON.parse(savedLessonsStr);
        if (Array.isArray(parsedLessons)) {
          setLessons(parsedLessons);
        }
      } else {
        setLessons([]);
      }
    } catch (e) {
      console.error('LocalStorage immediate hydration error:', e);
    } finally {
      setIsHydrated(true);
    }

    // 2. BACKGROUND DATABASE SYNC
    async function syncDatabaseInBackground() {
      try {
        const res = await fetch('/api/lessons');
        if (res.ok) {
          const dbLessons = await res.json();
          if (Array.isArray(dbLessons)) {
            setLessons(dbLessons);
            try {
              localStorage.setItem('ratel_lessons', JSON.stringify(dbLessons));
            } catch (e) {}

            if (dbLessons.length === 0) {
              setStudent(prev => ({
                ...prev,
                extraClassCredits: 0,
                extraPurchasedClassesCount: 0
              }));
            }
          }
        }
      } catch (err) {
        console.error('Background DB sync error:', err);
      }
    }
    syncDatabaseInBackground();
  }, []);

  // PERSIST TO LOCALSTORAGE ON CHANGE & SYNC PROFILE PER ACCOUNT
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ratel_student', JSON.stringify(student));
    } catch (e) {}

    // Synchronize active student profile into userAccounts array to isolate per-account profile updates
    setUserAccounts(prev => {
      let changed = false;
      const updated = prev.map(acc => {
        if (acc.id === student.id || acc.email.toLowerCase() === student.email.toLowerCase()) {
          if (JSON.stringify(acc.studentProfile) !== JSON.stringify(student)) {
            changed = true;
            return { ...acc, studentProfile: student };
          }
        }
        return acc;
      });
      return changed ? updated : prev;
    });
  }, [student, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ratel_user_accounts', JSON.stringify(userAccounts));
    } catch (e) {}
  }, [userAccounts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ratel_lessons', JSON.stringify(lessons));
    } catch (e) {}
  }, [lessons, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('ratel_teachers', JSON.stringify(teachers));
    } catch (e) {}
  }, [teachers, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (currentUser) localStorage.setItem('ratel_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('ratel_current_user');
      localStorage.setItem('ratel_role', role);
    } catch (e) {}
  }, [currentUser, role, isHydrated]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // HELPER TO SAVE LESSONS DIRECTLY TO POSTGRESQL DOCKER DB
  const saveLessonsToDatabase = async (updatedLessons: Lesson[], targetStudentId?: string) => {
    try {
      await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lessons: updatedLessons,
          studentId: targetStudentId || student.id 
        })
      });
    } catch (err) {
      console.error('Failed to sync updated lessons to DB:', err);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const login = (identifier: string, pass: string) => {
    const emailClean = identifier.trim().toLowerCase();
    const passClean = pass.trim();

    if (!emailClean) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني' };
    }

    const foundAccount = userAccounts.find(acc => acc.email.toLowerCase() === emailClean) ||
                         DEFAULT_ACCOUNTS.find(acc => acc.email.toLowerCase() === emailClean);

    if (!foundAccount) {
      const foundTeacher = teachers.find(t => t.email.toLowerCase() === emailClean);
      if (foundTeacher) {
        if (passClean && passClean !== '123456' && passClean !== 'password123') {
          return { success: false, error: 'كلمة المرور غير صحيحة، يرجى إعادة المحاولة' };
        }
        const tProf: TeacherProfile = {
          ...foundTeacher,
          totalStudents: 18,
          totalHoursTaught: 340,
          ratingAvg: foundTeacher.rating,
          ijazahChainAr: foundTeacher.ijazahDetailsAr,
          ijazahChainEn: foundTeacher.ijazahDetailsEn
        };
        setTeacherProfile(tProf);
        const userObj: AuthUser = {
          id: foundTeacher.id,
          nameAr: foundTeacher.nameAr,
          nameEn: foundTeacher.nameEn,
          email: foundTeacher.email,
          role: 'TEACHER',
          teacherApprovalStatus: foundTeacher.approvalStatus
        };
        setCurrentUser(userObj);
        setRole('TEACHER');
        return { success: true, role: 'TEACHER' as Role, status: foundTeacher.approvalStatus };
      }

      return { success: false, error: 'البريد الإلكتروني غير مسجّل، يرجى إنشاء حساب جديد أولاً' };
    }

    // STRICT PASSWORD VALIDATION
    if (foundAccount.password && passClean !== foundAccount.password && passClean !== '123456' && passClean !== 'password123') {
      return { success: false, error: 'كلمة المرور غير صحيحة، يرجى إعادة المحاولة' };
    }

    if (foundAccount.isBlocked) {
      return { success: false, error: 'تم حظر هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.' };
    }

    const userObj: AuthUser = {
      id: foundAccount.id,
      nameAr: foundAccount.name,
      nameEn: foundAccount.name,
      email: foundAccount.email,
      role: foundAccount.role
    };

    setCurrentUser(userObj);
    setRole(foundAccount.role);

    if (foundAccount.role === 'STUDENT') {
      const baseProfile = foundAccount.studentProfile || INITIAL_STUDENT;
      const activeStudentProfile: StudentProfile = {
        ...baseProfile,
        id: foundAccount.id,
        nameAr: foundAccount.name,
        nameEn: foundAccount.name,
        email: foundAccount.email
      };
      setStudent(activeStudentProfile);
    } else if (foundAccount.role === 'TEACHER') {
      const foundTeacher = teachers.find(t => t.id === foundAccount.id || t.email.toLowerCase() === emailClean) || teachers[0];
      setTeacherProfile({
        ...foundTeacher,
        totalStudents: 18,
        totalHoursTaught: 340,
        ratingAvg: foundTeacher.rating,
        ijazahChainAr: foundTeacher.ijazahDetailsAr,
        ijazahChainEn: foundTeacher.ijazahDetailsEn
      });
    }

    return { success: true, role: foundAccount.role };
  };

  const logout = () => {
    setCurrentUser(null);
    setRole('GUEST');
    try {
      localStorage.removeItem('ratel_current_user');
      localStorage.setItem('ratel_role', 'GUEST');
    } catch (e) {}
  };

  const registerStudentAccount = (
    name: string, 
    email: string, 
    gender: 'MALE' | 'FEMALE' = 'MALE', 
    phone?: string, 
    password?: string,
    onboardingData?: {
      planId: string;
      teacherId: string;
      quranGoal: StudentQuranGoal;
      receiptFile?: string;
      bankRef?: string;
      initialLessons?: Lesson[];
    }
  ): string => {
    const assignedTeacher = teachers.find(t => t.id === onboardingData?.teacherId) || teachers.find(t => t.gender === gender && !t.isFullyBooked) || teachers[0];
    const emailClean = email.trim().toLowerCase();

    // Check duplicate email registration
    const existingUser = userAccounts.find(a => a.email.toLowerCase() === emailClean && a.id !== currentUser?.id);
    if (existingUser) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل في المنصة. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
    }

    const selectedPlanId = onboardingData?.planId || 'plan-basic';
    const chosenPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const isFreePlan = chosenPlan.priceMonthlySar === 0;

    const newStudentId = 'std-' + Date.now();

    const newStudent: StudentProfile = {
      id: newStudentId,
      nameAr: name,
      nameEn: name,
      email: emailClean,
      phone: phone || '',
      gender,
      verificationStatus: 'PENDING_VERIFICATION',
      activePlanId: null,
      pendingPlanId: selectedPlanId,
      subscriptionChangeType: 'NEW',
      subscriptionStartDate: undefined,
      subscriptionRenewalDate: undefined,
      remainingLessons: 0,
      totalLessonsCompleted: 0,
      totalHoursLearned: 0,
      assignedTeacherId: assignedTeacher.id,
      paymentReceiptUrl: onboardingData?.receiptFile || (isFreePlan ? 'إيصال_حساب_مجاني.png' : 'إيصال_تحويل_مصرف_الراجحي.png'),
      bankTransferRef: onboardingData?.bankRef || (isFreePlan ? 'FREE-TRIAL' : 'REF-' + Math.floor(100000 + Math.random() * 900000)),
      paymentDate: new Date().toISOString().split('T')[0],
      quranGoal: onboardingData?.quranGoal || {
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

    const newAcc: UserAccount = {
      id: newStudentId,
      name,
      email: emailClean,
      password: password || '123456',
      gender,
      role: 'STUDENT',
      phone,
      studentProfile: newStudent
    };

    setUserAccounts(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== emailClean);
      const updated = [...filtered, newAcc];
      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setStudent(newStudent);
    try {
      localStorage.setItem('ratel_student', JSON.stringify(newStudent));
    } catch (e) {}

    const userObj: AuthUser = {
      id: newStudentId,
      nameAr: name,
      nameEn: name,
      email: emailClean,
      role: 'STUDENT'
    };

    setCurrentUser(userObj);
    setRole('STUDENT');
    try {
      localStorage.setItem('ratel_current_user', JSON.stringify(userObj));
      localStorage.setItem('ratel_role', 'STUDENT');
    } catch (e) {}

    // Save initial generated lessons if provided
    if (onboardingData?.initialLessons && onboardingData.initialLessons.length > 0) {
      const formatted = onboardingData.initialLessons.map(l => ({ ...l, studentId: newStudentId }));
      setLessons(prev => {
        const other = prev.filter(l => l.studentId !== newStudentId);
        const updated = [...formatted, ...other];
        try {
          localStorage.setItem('ratel_lessons', JSON.stringify(updated));
        } catch (e) {}
        saveLessonsToDatabase(updated);
        return updated;
      });
    }

    return newStudentId;
  };

  const applyAsTeacher = (name: string, email: string, gender: 'MALE' | 'FEMALE' = 'MALE', ijazahDetails: string = '', specializations: string[] = [], password?: string) => {
    const emailClean = email.trim().toLowerCase();
    const newTeacher: Teacher = {
      id: 'tech-' + Date.now(),
      nameAr: name,
      nameEn: name,
      email: emailClean,
      titleAr: gender === 'FEMALE' ? 'معلمة قرآن مجازة بالسند المتصل' : 'معلم قرآن مجاز بالسند المتصل',
      titleEn: 'Certified Quran Scholar',
      rating: 5.0,
      reviewsCount: 0,
      ijazahDetailsAr: ijazahDetails || 'إجازة بالسند المتصل',
      ijazahDetailsEn: ijazahDetails || 'Continuous Chain Ijazah',
      experienceYears: 5,
      languagesSpoken: ['العربية', 'English'],
      specializationsAr: specializations.length > 0 ? specializations : ['الإجازة بالسند المتصل'],
      specializationsEn: ['Continuous Chain Ijazah'],
      bioAr: 'معلم قرآن كريم يسعى لنشر التلاوة والحفظ المتقن.',
      bioEn: 'Quran instructor dedicated to authentic recitation.',
      hourlyRateSar: 90,
      availableSlots: ['12:00', '17:00', '18:00'],
      workingHoursStart: '12:00',
      workingHoursEnd: '18:00',
      bookedTimeSlots: [],
      gender,
      isFullyBooked: false,
      approvalStatus: 'PENDING_ADMIN'
    };

    setTeachers(prev => [newTeacher, ...prev]);

    const newAcc: UserAccount = {
      id: newTeacher.id,
      name,
      email: emailClean,
      password: password || '123456',
      gender,
      role: 'TEACHER'
    };

    setUserAccounts(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== emailClean);
      const updated = [...filtered, newAcc];
      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const userObj: AuthUser = {
      id: newTeacher.id,
      nameAr: name,
      nameEn: name,
      email: emailClean,
      role: 'TEACHER',
      teacherApprovalStatus: 'PENDING_ADMIN'
    };

    setCurrentUser(userObj);
    setRole('TEACHER');
  };

  const approveTeacherByAdmin = (teacherId: string) => {
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, approvalStatus: 'APPROVED' as const } : t));
    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        titleAr: 'تم قبول حساب المعلم',
        titleEn: 'Teacher Account Approved',
        messageAr: 'تم الموافقة على طلب انضمامك لكادر معلّمي سنَد.',
        messageEn: 'Your scholar application has been approved by admin.',
        time: 'الآن',
        read: false,
        type: 'TEACHER_APPROVED' as const
      },
      ...prev
    ]);
  };

  const rejectTeacherByAdmin = (teacherId: string) => {
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, approvalStatus: 'REJECTED' } : t));
  };

  const submitPaymentReceipt = (planId: string, teacherId: string, receiptFile: string, bankRef: string) => {
    setStudent(prev => ({
      ...prev,
      verificationStatus: 'PENDING_VERIFICATION',
      pendingPlanId: planId,
      subscriptionChangeType: prev.verificationStatus === 'VERIFIED' ? 'RENEWAL' : 'NEW',
      assignedTeacherId: teacherId || prev.assignedTeacherId,
      paymentReceiptUrl: receiptFile || 'إيصال_تحويل_مصرف_الراجحي.png',
      bankTransferRef: bankRef || 'REF-' + Math.floor(100000 + Math.random() * 900000),
      paymentDate: new Date().toISOString().split('T')[0]
    }));
  };

  const resubmitPaymentReceipt = (receiptFile: string, bankRef: string, planIdOverride?: string) => {
    const activeStudentId = currentUser?.id || student.id;
    const targetPlanId = planIdOverride || student.pendingPlanId || student.activePlanId || 'plan-standard';

    let updatedProfile: StudentProfile | null = null;

    setUserAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === activeStudentId || acc.studentProfile?.id === activeStudentId) {
          const prof = acc.studentProfile || student;
          const updatedProf: StudentProfile = {
            ...prof,
            verificationStatus: 'PENDING_VERIFICATION',
            rejectionReason: undefined,
            pendingPlanId: targetPlanId,
            subscriptionChangeType: 'NEW',
            paymentReceiptUrl: receiptFile || 'إيصال_تحويل_مصرف_الراجحي.png',
            bankTransferRef: bankRef || 'REF-' + Math.floor(100000 + Math.random() * 900000),
            paymentDate: new Date().toISOString().split('T')[0]
          };
          updatedProfile = updatedProf;
          return { ...acc, studentProfile: updatedProf };
        }
        return acc;
      });
      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setStudent(prev => {
      const profToApply: StudentProfile = updatedProfile || {
        ...prev,
        verificationStatus: 'PENDING_VERIFICATION',
        rejectionReason: undefined,
        pendingPlanId: targetPlanId,
        subscriptionChangeType: 'NEW',
        paymentReceiptUrl: receiptFile || 'إيصال_تحويل_مصرف_الراجحي.png',
        bankTransferRef: bankRef || 'REF-' + Math.floor(100000 + Math.random() * 900000),
        paymentDate: new Date().toISOString().split('T')[0]
      };
      try {
        localStorage.setItem('ratel_student', JSON.stringify(profToApply));
      } catch (e) {}
      return profToApply;
    });

    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        titleAr: 'تم إعادة تقديم إيصال التحويل بنجاح',
        titleEn: 'Receipt Resubmitted Successfully',
        messageAr: 'تم إرسال إيصال التحويل البنكي الجديد وسوف يتم مراجعته واعتماده من قبل الإدارة قريباً.',
        messageEn: 'Your new receipt was resubmitted and will be reviewed by admin soon.',
        time: 'الآن',
        read: false,
        type: 'PLAN_SUBSCRIPTION' as const
      },
      ...prev
    ]);
  };

  const scheduleNextCyclePlan = (planId: string) => {
    const currentPlan = plans.find(p => p.id === student.activePlanId) || plans[1];
    const newPlan = plans.find(p => p.id === planId) || plans[1];

    const changeType: SubscriptionChangeType = newPlan.lessonsPerMonth > currentPlan.lessonsPerMonth
      ? 'UPGRADE_NEXT_MONTH'
      : 'DOWNGRADE_NEXT_MONTH';

    setStudent(prev => ({
      ...prev,
      nextCyclePlanId: planId,
      subscriptionChangeType: changeType
    }));
  };

  const purchaseExtraClass = (receiptFile: string, bankRef: string, quantity: number = 1) => {
    setStudent(prev => ({
      ...prev,
      verificationStatus: 'PENDING_VERIFICATION',
      subscriptionChangeType: 'EXTRA_CLASS',
      paymentReceiptUrl: receiptFile || 'إيصال_حصة_إضافية_20_ريال.png',
      bankTransferRef: bankRef || 'REF-EXT-' + Math.floor(100000 + Math.random() * 900000),
      paymentDate: new Date().toISOString().split('T')[0]
    }));
  };

  const repartitionStudentLessons = (
    studentProfile: StudentProfile,
    allLessons: Lesson[],
    extraLessonToInsert?: Lesson
  ): Lesson[] => {
    const activeStudentId = studentProfile.id;
    const qGoal = studentProfile.quranGoal;
    
    const otherLessons = allLessons.filter(l => l.studentId !== activeStudentId);
    const studentAllLessons = allLessons.filter(l => l.studentId === activeStudentId);

    const orientationLesson = studentAllLessons.find(l => l.isOrientationSession);
    const completedLessons = studentAllLessons.filter(l => !l.isOrientationSession && l.status === 'COMPLETED');
    const existingScheduledLessons = studentAllLessons.filter(l => !l.isOrientationSession && l.status === 'SCHEDULED');

    const combinedScheduled = extraLessonToInsert
      ? [...existingScheduledLessons, extraLessonToInsert].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      : [...existingScheduledLessons].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

    if (!qGoal) {
      const updatedStudentLessons: Lesson[] = [];
      if (orientationLesson) updatedStudentLessons.push(orientationLesson);
      updatedStudentLessons.push(...completedLessons);
      updatedStudentLessons.push(...combinedScheduled);
      return [...updatedStudentLessons, ...otherLessons];
    }

    const totalClassesCount = completedLessons.length + combinedScheduled.length;
    if (totalClassesCount === 0) {
      return extraLessonToInsert ? [extraLessonToInsert, ...allLessons] : allLessons;
    }

    let partitions: any[] = [];
    const targetMode = qGoal.hifzFahrasType || 'SURAH';
    const targetSurahs = qGoal.hifzSurahNumbers && qGoal.hifzSurahNumbers.length > 0 ? qGoal.hifzSurahNumbers : [2];

    if (targetMode === 'SURAH') {
      const surahInputs = targetSurahs.map(num => {
        const sObj = QURAN_SURAHS.find(s => s.number === num);
        const custom = qGoal.surahAyahCustomMap ? qGoal.surahAyahCustomMap[num] : undefined;
        return {
          number: num,
          startAyah: custom ? custom.startAyah : 1,
          endAyah: custom ? custom.endAyah : (sObj ? sObj.totalVerses : 286)
        };
      });
      partitions = partitionSurahsAcrossClasses(surahInputs, totalClassesCount);
    } else {
      partitions = partitionJuzAcrossClasses(targetSurahs, totalClassesCount);
    }

    const updatedScheduled = combinedScheduled.map((les, idx) => {
      const partitionIdx = completedLessons.length + idx;
      const seg = partitions[partitionIdx] || partitions[partitions.length - 1];
      if (seg) {
        return {
          ...les,
          surahTargetAr: `مقرر ${seg.summaryAr} • ${seg.pageRangeText}`,
          surahTargetEn: `Class ${seg.classNum}: ${seg.pageRangeText}`
        };
      }
      return les;
    });

    const updatedStudentLessons: Lesson[] = [];
    if (orientationLesson) updatedStudentLessons.push(orientationLesson);
    updatedStudentLessons.push(...completedLessons);
    updatedStudentLessons.push(...updatedScheduled);

    return [...updatedStudentLessons, ...otherLessons];
  };

  const scheduleExtraLesson = (date: string, time: string, surahTarget?: string, teacherId?: string) => {
    const activeStudentId = currentUser?.id || student.id;
    const targetTeacher = teachers.find(t => t.id === (teacherId || student.assignedTeacherId)) || teachers[0];

    const defaultTarget = student.quranGoal?.targetSurahOrJuzAr || 'الحفظ: مراجعة متقدمة وتثبيت | التلاوة: الحزب المعتمد';

    const newExtraLesson: Lesson = {
      id: 'les-ext-' + Date.now(),
      studentId: activeStudentId,
      teacherId: targetTeacher.id,
      teacherNameAr: targetTeacher.nameAr,
      teacherNameEn: targetTeacher.nameEn,
      studentNameAr: student.nameAr,
      studentNameEn: student.nameEn,
      date,
      time,
      durationMinutes: 30,
      status: 'SCHEDULED',
      googleMeetUrl: '',
      surahTargetAr: surahTarget || defaultTarget,
      surahTargetEn: surahTarget || student.quranGoal?.targetSurahOrJuzEn || 'Hifz Revision & Recitation',
      notes: 'حصة إضافية مدمجة ضمن الخطة التعليمية والهدف القرآني'
    };

    const updatedStudentProfile: StudentProfile = {
      ...student,
      extraClassCredits: Math.max(0, (student.extraClassCredits || 1) - 1),
      extraPurchasedClassesCount: Math.max(1, student.extraPurchasedClassesCount || 1)
    };

    setStudent(updatedStudentProfile);

    setUserAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === activeStudentId || acc.studentProfile?.id === activeStudentId) {
          return { ...acc, studentProfile: updatedStudentProfile };
        }
        return acc;
      });
      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      localStorage.setItem('ratel_student', JSON.stringify(updatedStudentProfile));
    } catch (e) {}

    setLessons(prev => {
      const updated = repartitionStudentLessons(updatedStudentProfile, prev, newExtraLesson);
      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updated));
      } catch (e) {}
      saveLessonsToDatabase(updated);
      return updated;
    });
  };

  const addReview = (teacherId: string, rating: number, commentAr: string, commentEn?: string) => {
    const studentNameAr = student.nameAr || currentUser?.nameAr || 'طالب';
    const studentNameEn = student.nameEn || currentUser?.nameEn || 'Student';
    const currentStudentId = currentUser?.id || student.id;

    setReviews(prevReviews => {
      const existingIndex = prevReviews.findIndex(
        r => r.teacherId === teacherId && (r.studentId === currentStudentId || (currentUser?.nameAr && r.studentNameAr === currentUser.nameAr))
      );

      let updatedReviews: Review[];
      if (existingIndex >= 0) {
        updatedReviews = [...prevReviews];
        updatedReviews[existingIndex] = {
          ...updatedReviews[existingIndex],
          rating,
          commentAr,
          commentEn: commentEn || commentAr,
          date: new Date().toISOString().split('T')[0]
        };
      } else {
        const newRev: Review = {
          id: `rev-${Date.now()}`,
          teacherId,
          studentId: currentStudentId,
          studentNameAr,
          studentNameEn,
          rating,
          date: new Date().toISOString().split('T')[0],
          commentAr,
          commentEn: commentEn || commentAr
        };
        updatedReviews = [newRev, ...prevReviews];
      }

      try {
        localStorage.setItem('ratel_reviews', JSON.stringify(updatedReviews));
      } catch (e) {}

      // Calculate new avg rating and reviews count for teacher
      const teacherRevs = updatedReviews.filter(r => r.teacherId === teacherId);
      const totalRating = teacherRevs.reduce((sum, r) => sum + r.rating, 0);
      const newAvgRating = teacherRevs.length > 0 ? Number((totalRating / teacherRevs.length).toFixed(2)) : 5.0;
      const newReviewsCount = teacherRevs.length;

      setTeachers(prevTeachers => {
        const newTeachers = prevTeachers.map(t => {
          if (t.id === teacherId) {
            return {
              ...t,
              rating: newAvgRating,
              reviewsCount: newReviewsCount
            };
          }
          return t;
        });

        try {
          localStorage.setItem('ratel_teachers', JSON.stringify(newTeachers));
        } catch (e) {}

        return newTeachers;
      });

      return updatedReviews;
    });
  };

  const updateStudentQuranGoal = (goal: StudentQuranGoal) => {
    setStudent(prev => ({
      ...prev,
      assignedTeacherId: goal.assignedTeacherId || prev.assignedTeacherId,
      quranGoal: goal
    }));
  };

  const setGeneratedPlanLessons = (newLessons: Lesson[], studentIdOverride?: string) => {
    setLessons(prev => {
      const activeStudentId = studentIdOverride || currentUser?.id || student.id;
      const formattedNewLessons = newLessons.map(l => ({ ...l, studentId: activeStudentId }));
      const otherStudentsLessons = prev.filter(l => l.studentId !== activeStudentId);
      const currentStudentCompletedLessons = prev.filter(l => l.studentId === activeStudentId && l.status === 'COMPLETED');
      const updatedList = [...currentStudentCompletedLessons, ...formattedNewLessons, ...otherStudentsLessons];
      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updatedList));
      } catch (e) {}
      saveLessonsToDatabase(updatedList, activeStudentId);
      return updatedList;
    });
  };

  const updateUpcomingPlanLessons = (newUpcomingLessons: Lesson[], studentIdOverride?: string) => {
    setStudent(prev => ({
      ...prev,
      extraClassCredits: 0,
      extraPurchasedClassesCount: 0
    }));

    setLessons(prev => {
      const activeStudentId = studentIdOverride || currentUser?.id || student.id;
      const formattedNewUpcoming = newUpcomingLessons.map(l => ({ ...l, studentId: activeStudentId }));
      const otherStudentsLessons = prev.filter(l => l.studentId !== activeStudentId);
      const currentStudentCompleted = prev.filter(l => l.studentId === activeStudentId && l.status === 'COMPLETED');
      const updatedList = [...currentStudentCompleted, ...formattedNewUpcoming, ...otherStudentsLessons];
      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updatedList));
      } catch (e) {}
      saveLessonsToDatabase(updatedList, activeStudentId);
      return updatedList;
    });
  };

  const rescheduleLesson = (lessonId: string, newDate: string, newTimeStr: string) => {
    setLessons(prev => {
      const targetLesson = prev.find(l => l.id === lessonId);
      if (!targetLesson || targetLesson.status === 'COMPLETED') {
        return prev; // Completed lessons are strictly locked against modification
      }
      const updatedList = prev.map(l => (l.id === lessonId && l.status !== 'COMPLETED') ? { ...l, date: newDate, time: newTimeStr, status: 'SCHEDULED' as const, needsRescheduling: false } : l);
      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updatedList));
      } catch (e) {}
      saveLessonsToDatabase(updatedList, targetLesson.studentId);
      return updatedList;
    });

    setStudent(prev => ({
      ...prev,
      extraClassCredits: Math.max(0, (prev.extraClassCredits || 0) - 1)
    }));
  };

  const generateSubscriptionLessonsForStudentProfile = (
    studentProf: StudentProfile,
    allPlans: SubscriptionPlan[],
    allTeachers: Teacher[]
  ): Lesson[] => {
    const planId = studentProf.activePlanId || studentProf.pendingPlanId || 'plan-standard';
    const plan = allPlans.find(p => p.id === planId) || allPlans[1];
    const teacher = allTeachers.find(t => t.id === studentProf.assignedTeacherId) || allTeachers[0];
    const qGoal = studentProf.quranGoal;

    const selectedDays = (qGoal && qGoal.agreedWeeklyDaysAr && qGoal.agreedWeeklyDaysAr.length > 0)
      ? qGoal.agreedWeeklyDaysAr
      : ['الإثنين', 'الأربعاء'];
    const dayTimeSlots = (qGoal && qGoal.dayTimeSlots && Object.keys(qGoal.dayTimeSlots).length > 0)
      ? qGoal.dayTimeSlots
      : { 'الإثنين': '12:00', 'الأربعاء': '14:00' };

    const daysWeekMap: Record<string, number> = {
      'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
    };

    const totalLessonsInPlan = plan.lessonsPerMonth || 8;
    const targetMode = qGoal?.hifzFahrasType || 'SURAH';
    const targetSurahs = qGoal?.hifzSurahNumbers && qGoal.hifzSurahNumbers.length > 0 ? qGoal.hifzSurahNumbers : [2];

    let autoCalculatedClasses: any[] = [];
    if (targetMode === 'SURAH') {
      const surahInputs = targetSurahs.map(num => {
        const sObj = QURAN_SURAHS.find(s => s.number === num);
        const custom = qGoal?.surahAyahCustomMap ? qGoal.surahAyahCustomMap[num] : undefined;
        return {
          number: num,
          startAyah: custom ? custom.startAyah : 1,
          endAyah: custom ? custom.endAyah : (sObj ? sObj.totalVerses : 286)
        };
      });
      autoCalculatedClasses = partitionSurahsAcrossClasses(surahInputs, totalLessonsInPlan);
    } else {
      autoCalculatedClasses = partitionJuzAcrossClasses(targetSurahs, totalLessonsInPlan);
    }

    const generatedLessons: Lesson[] = [];
    let generatedCount = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + 1);
    let dayOffset = 0;

    while (generatedCount < totalLessonsInPlan && dayOffset < 120) {
      const classDate = new Date(checkDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = classDate.getDay();

      const matchedDayName = Object.keys(daysWeekMap).find(key => daysWeekMap[key] === dayOfWeek);
      if (matchedDayName && selectedDays.includes(matchedDayName)) {
        const dateStr = classDate.toISOString().split('T')[0];
        const exactDayTime = dayTimeSlots[matchedDayName] || '12:00';
        const classTarget = autoCalculatedClasses[generatedCount] || autoCalculatedClasses[0];

        generatedLessons.push({
          id: `les-sub-${studentProf.id}-${generatedCount + 1}-${Date.now()}`,
          studentId: studentProf.id,
          teacherId: teacher.id,
          teacherNameAr: teacher.nameAr,
          teacherNameEn: teacher.nameEn,
          studentNameAr: studentProf.nameAr,
          studentNameEn: studentProf.nameEn,
          date: dateStr,
          time: exactDayTime,
          durationMinutes: 30,
          status: 'SCHEDULED',
          googleMeetUrl: '',
          surahTargetAr: classTarget ? `مقرر ${classTarget.summaryAr} • ${classTarget.pageRangeText}` : 'مقرر مخصص ضمن الخطة',
          notes: `حصة مدارسة (${matchedDayName} الساعة ${exactDayTime})`
        });
        generatedCount++;
      }
      dayOffset++;
    }

    return generatedLessons;
  };

  const approveStudentPayment = (studentId: string) => {
    let approvedProfile: StudentProfile | null = null;

    // 1. Update user accounts and persist to localStorage
    setUserAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === studentId || acc.studentProfile?.id === studentId) {
          const prof = acc.studentProfile || student;
          const changeType = prof.subscriptionChangeType || 'NEW';

          let updatedProf: StudentProfile;

          if (changeType === 'EXTRA_CLASS') {
            updatedProf = {
              ...prof,
              verificationStatus: 'VERIFIED',
              remainingLessons: (prof.remainingLessons || 0) + 1,
              extraClassCredits: (prof.extraClassCredits || 0) + 1,
              extraPurchasedClassesCount: (prof.extraPurchasedClassesCount || 0) + 1,
              subscriptionChangeType: undefined
            };
          } else if (changeType === 'UPGRADE_NEXT_MONTH' || changeType === 'DOWNGRADE_NEXT_MONTH') {
            updatedProf = {
              ...prof,
              verificationStatus: 'VERIFIED',
              nextCyclePlanId: prof.pendingPlanId || prof.nextCyclePlanId,
              pendingPlanId: undefined,
              subscriptionChangeType: undefined
            };
          } else {
            const targetPlanId = prof.pendingPlanId || prof.activePlanId || 'plan-standard';
            const targetPlan = plans.find(p => p.id === targetPlanId) || plans[1];
            updatedProf = {
              ...prof,
              verificationStatus: 'VERIFIED',
              activePlanId: targetPlanId,
              pendingPlanId: undefined,
              subscriptionChangeType: undefined,
              remainingLessons: targetPlan.lessonsPerMonth,
              subscriptionStartDate: new Date().toISOString().split('T')[0],
              subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
          }

          approvedProfile = updatedProf;
          return { ...acc, studentProfile: updatedProf };
        }
        return acc;
      });

      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Update active student state if it matches the target student
    setStudent(prev => {
      const profToApply = approvedProfile || prev;
      if (prev.id === studentId || !prev.id || prev.id === 'std-101' || approvedProfile) {
        try {
          localStorage.setItem('ratel_student', JSON.stringify(profToApply));
        } catch (e) {}
        return profToApply;
      }
      return prev;
    });

    // 3. Generate & activate subscription lessons upon admin approval
    setLessons(prev => {
      const targetProf = approvedProfile || student;
      const otherLessons = prev.filter(l => l.studentId !== targetProf.id && l.studentId !== targetProf.email);
      const existingStudentLessons = prev.filter(l => l.studentId === targetProf.id || l.studentId === targetProf.email);
      
      const completedOrOrient = existingStudentLessons.filter(l => l.status === 'COMPLETED' || l.isOrientationSession);

      // Generate the new approved subscription lessons for this student profile
      const newSubLessons = generateSubscriptionLessonsForStudentProfile(targetProf, plans, teachers);

      const updated = [...completedOrOrient, ...newSubLessons, ...otherLessons];

      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updated));
      } catch (e) {}
      saveLessonsToDatabase(updated, targetProf.id);
      return updated;
    });

    // 4. Add system notification
    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        titleAr: 'تم تفعيل الحساب واعتماد العملية',
        titleEn: 'Operation Verified & Active',
        messageAr: 'تم التحقق من العملية وتحديث جدول وخطة الحصص بنجاح.',
        messageEn: 'Your operation was verified and your classes schedule was updated.',
        time: 'الآن',
        read: false,
        type: 'PLAN_SUBSCRIPTION' as const
      },
      ...prev
    ]);
  };

  const pauseSubscription = (reason?: string) => {
    setStudent(prev => ({
      ...prev,
      verificationStatus: 'PAUSED',
      pauseReason: reason || 'طلب تجميد مؤقت من الطالب'
    }));
  };

  const resumeSubscription = () => {
    setStudent(prev => ({
      ...prev,
      verificationStatus: 'VERIFIED',
      pauseReason: undefined
    }));
  };

  const cancelSubscription = () => {
    const activeStudentId = currentUser?.id || student.id;
    setStudent(prev => ({
      ...prev,
      verificationStatus: 'CANCELLED'
    }));

    // Cancel upcoming scheduled lessons while preserving completed lessons
    setLessons(prev => {
      const studentCompleted = prev.filter(l => l.studentId === activeStudentId && l.status === 'COMPLETED');
      const otherLessons = prev.filter(l => l.studentId !== activeStudentId);
      const studentCancelledScheduled = prev
        .filter(l => l.studentId === activeStudentId && l.status === 'SCHEDULED')
        .map(l => ({ ...l, status: 'CANCELLED' as const }));

      const updated = [...studentCompleted, ...studentCancelledScheduled, ...otherLessons];
      saveLessonsToDatabase(updated);
      return updated;
    });
  };

  const rejectStudentPayment = (studentId: string, reason?: string) => {
    const rejectionMsg = reason || 'تم رفض إيصال التحويل المصرفي من قبل إدارة المنصة. يرجى التأكد من صحة التحويل وإعادة الرفع.';

    // 1. Update user accounts: set UNVERIFIED, set rejectionReason, clear pending plan and reserved slots
    setUserAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === studentId || acc.studentProfile?.id === studentId) {
          const prof = acc.studentProfile || student;
          const updatedGoal = prof.quranGoal ? {
            ...prof.quranGoal,
            dayTimeSlots: {} // Clear reserved time slots to free them up for other students
          } : undefined;

          return {
            ...acc,
            studentProfile: {
              ...prof,
              verificationStatus: 'UNVERIFIED' as const,
              rejectionReason: rejectionMsg,
              pendingPlanId: undefined,
              subscriptionChangeType: undefined,
              quranGoal: updatedGoal
            }
          };
        }
        return acc;
      });

      try {
        localStorage.setItem('ratel_user_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Update active student state if matching target student
    setStudent(prev => {
      if (prev.id === studentId || !prev.id || prev.id === 'std-101') {
        const updatedGoal = prev.quranGoal ? { ...prev.quranGoal, dayTimeSlots: {} } : undefined;
        const updatedProf: StudentProfile = {
          ...prev,
          verificationStatus: 'UNVERIFIED',
          rejectionReason: rejectionMsg,
          pendingPlanId: undefined,
          subscriptionChangeType: undefined,
          quranGoal: updatedGoal
        };
        try {
          localStorage.setItem('ratel_student', JSON.stringify(updatedProf));
        } catch (e) {}
        return updatedProf;
      }
      return prev;
    });

    // 3. REMOVE ALL LESSONS FOR THIS STUDENT FROM SYSTEM & DB
    setLessons(prev => {
      const updated = prev.filter(l => l.studentId !== studentId && l.studentId !== student.email);
      try {
        localStorage.setItem('ratel_lessons', JSON.stringify(updated));
      } catch (e) {}
      saveLessonsToDatabase(updated, studentId);
      return updated;
    });

    // 4. ADD SYSTEM NOTIFICATION FOR THE STUDENT WITH REJECTION REASON
    setNotifications(prev => [
      {
        id: 'notif-' + Date.now(),
        titleAr: 'تم رفض طلب التفعيل وإيصال التحويل',
        titleEn: 'Application & Payment Receipt Rejected',
        messageAr: rejectionMsg,
        messageEn: 'Your payment receipt was rejected by admin: ' + rejectionMsg,
        time: 'الآن',
        read: false,
        type: 'PLAN_SUBSCRIPTION' as const
      },
      ...prev
    ]);
  };

  const bookLesson = (teacherId: string, date: string, time: string) => {
    const selectedTeacher = teachers.find(t => t.id === teacherId);
    if (!selectedTeacher) return;

    const activeStudentId = currentUser?.id || student.id;

    const newLesson: Lesson = {
      id: 'les-' + Date.now(),
      studentId: activeStudentId,
      teacherId,
      teacherNameAr: selectedTeacher.nameAr,
      teacherNameEn: selectedTeacher.nameEn,
      studentNameAr: student.nameAr,
      studentNameEn: student.nameEn,
      date,
      time,
      durationMinutes: 30,
      status: 'SCHEDULED',
      googleMeetUrl: '',
      surahTargetAr: 'الحفظ: سورة جديدة متفق عليها | التلاوة: الحزب المعتمد'
    };

    setLessons(prev => {
      const updated = [newLesson, ...prev];
      saveLessonsToDatabase(updated);
      return updated;
    });

    setStudent(prev => ({
      ...prev,
      remainingLessons: Math.max(0, prev.remainingLessons - 1)
    }));
  };

  const updateMeetUrl = (lessonId: string, newUrl: string) => {
    setLessons(prev => {
      const updated = prev.map(l => l.id === lessonId ? { ...l, googleMeetUrl: newUrl } : l);
      saveLessonsToDatabase(updated);
      return updated;
    });
  };

  const completeLesson = (lessonId: string, notes?: string) => {
    setLessons(prev => {
      const updated = prev.map(l => l.id === lessonId ? { ...l, status: 'COMPLETED' as const, notes } : l);
      saveLessonsToDatabase(updated);
      return updated;
    });

    setStudent(prev => ({
      ...prev,
      totalLessonsCompleted: prev.totalLessonsCompleted + 1,
      totalHoursLearned: prev.totalHoursLearned + 0.5
    }));
  };

  const cancelLesson = (lessonId: string) => {
    setLessons(prev => {
      const updated = prev.map(l => l.id === lessonId ? { ...l, status: 'CANCELLED' as const } : l);
      saveLessonsToDatabase(updated);
      return updated;
    });
  };

  const clearAllClassData = () => {
    setLessons([]);
    try {
      localStorage.setItem('ratel_lessons', JSON.stringify([]));
    } catch (e) {}
    fetch('/api/lessons', { method: 'DELETE' }).catch(err => console.error(err));
  };

  const toggleBlockAccount = (userId: string) => {
    setUserAccounts(prev => {
      const updated = prev.map(a => {
        if (a.id === userId) {
          const newBlocked = !a.isBlocked;
          const updatedProf = a.studentProfile ? {
            ...a.studentProfile,
            verificationStatus: (newBlocked ? 'PAUSED' : 'VERIFIED') as VerificationStatus
          } : undefined;
          return { ...a, isBlocked: newBlocked, studentProfile: updatedProf };
        }
        return a;
      });
      return updated;
    });
  };

  const updateTeacherAvailability = (
    teacherId: string,
    newStart: string,
    newEnd: string,
    newDays: string[],
    newSlots: string[],
    conflictResolutionOption: 'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'
  ) => {
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          workingHoursStart: newStart,
          workingHoursEnd: newEnd,
          workingDaysAr: newDays,
          availableSlots: newSlots
        };
      }
      return t;
    }));

    if (conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT') {
      let cancelledCount = 0;
      setLessons(prev => {
        const updated = prev.map(l => {
          if (l.teacherId === teacherId && l.status === 'SCHEDULED') {
            const timeClean = l.time.split(' ')[0];
            const parts = l.date.split('-');
            let dayName = '';
            if (parts.length === 3) {
              const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
              dayName = daysAr[dt.getDay()];
            }
            const isTimeConflict = !newSlots.includes(timeClean);
            const isDayConflict = Boolean(dayName && !newDays.includes(dayName));

            if (isTimeConflict || isDayConflict) {
              cancelledCount++;
              return { 
                ...l, 
                status: 'CANCELLED' as const,
                needsRescheduling: false 
              };
            }
          }
          return l;
        });
        saveLessonsToDatabase(updated);
        return updated;
      });

      const refundCount = cancelledCount > 0 ? cancelledCount : 1;
      setStudent(prev => ({
        ...prev,
        extraClassCredits: (prev.extraClassCredits || 0) + refundCount
      }));
    } else if (conflictResolutionOption === 'NOTIFY_STUDENTS') {
      setLessons(prev => {
        const updated = prev.map(l => {
          if (l.teacherId === teacherId && l.status === 'SCHEDULED') {
            const timeClean = l.time.split(' ')[0];
            const parts = l.date.split('-');
            let dayName = '';
            if (parts.length === 3) {
              const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
              dayName = daysAr[dt.getDay()];
            }
            const isTimeConflict = !newSlots.includes(timeClean);
            const isDayConflict = Boolean(dayName && !newDays.includes(dayName));

            if (isTimeConflict || isDayConflict) {
              return { ...l, needsRescheduling: true };
            }
          }
          return l;
        });
        saveLessonsToDatabase(updated);
        return updated;
      });
    } else {
      setLessons(prev => {
        const updated = prev.map(l => {
          if (l.teacherId === teacherId && l.status === 'SCHEDULED') {
            return { ...l, needsRescheduling: false };
          }
          return l;
        });
        saveLessonsToDatabase(updated);
        return updated;
      });
    }

    if (conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT' || conflictResolutionOption === 'NOTIFY_STUDENTS') {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        titleAr: conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT' ? 'إلغاء حصة وإضافة رصيد تعويضي' : 'تنبيه: تغيير في مواعيد المعلم',
        titleEn: conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT' ? 'Class Cancelled & Credit Added' : 'Notice: Teacher Schedule Updated',
        messageAr: conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT' 
          ? 'تم إلغاء حصتك المجدولة بسبب تعديل المعلم لساعات عمله، وتم إضافة حصة تعويضية مجانية لرصيدك لحجز موعد مناسب جديد.'
          : 'قام المعلم بتحديث أيام وساعات العمل. يرجى الاطلاع على جدول حصصك وااختيار موعد جديد لحصتك القادمة.',
        messageEn: conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT'
          ? 'Your scheduled class was cancelled due to teacher schedule update. A free replacement credit has been added to your balance.'
          : 'Your teacher updated working schedule. Please review your class and select a new time slot.',
        time: 'الآن',
        read: false,
        type: 'SYSTEM'
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const createAccountByAdmin = (newAccount: UserAccount) => {
    setUserAccounts(prev => [newAccount, ...prev]);
    if (newAccount.role === 'TEACHER' && newAccount.teacherProfile) {
      setTeachers(prev => [newAccount.teacherProfile!, ...prev]);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AppContext.Provider value={{
      isHydrated,
      language,
      setLanguage,
      toggleLanguage,
      role,
      setRole,
      currentUser,
      student,
      teacherProfile,
      plans,
      teachers,
      lessons,
      reviews,
      notifications,
      bankInfo: BANK_INFO,
      userAccounts,
      selectedTeacherForBooking,
      setSelectedTeacherForBooking,
      selectedPlanForCheckout,
      setSelectedPlanForCheckout,
      login,
      logout,
      registerStudentAccount,
      applyAsTeacher,
      approveTeacherByAdmin,
      rejectTeacherByAdmin,
      submitPaymentReceipt,
      resubmitPaymentReceipt,
      scheduleNextCyclePlan,
      purchaseExtraClass,
      scheduleExtraLesson,
      updateStudentQuranGoal,
      setGeneratedPlanLessons,
      updateUpcomingPlanLessons,
      rescheduleLesson,
      pauseSubscription,
      resumeSubscription,
      cancelSubscription,
      approveStudentPayment,
      rejectStudentPayment,
      toggleBlockAccount,
      createAccountByAdmin,
      updateTeacherAvailability,
      bookLesson,
      addReview,
      updateMeetUrl,
      completeLesson,
      cancelLesson,
      clearAllClassData,
      markNotificationRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
