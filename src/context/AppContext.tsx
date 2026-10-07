'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  TeacherApprovalStatus,
  StudentQuranGoal,
  UserAccount,
} from '../types';

import {
  INITIAL_PLANS,
  INITIAL_TEACHERS,
  BANK_INFO
} from '../data/mockData';

import {
  QURAN_SURAHS,
  partitionSurahsAcrossClasses,
  partitionJuzAcrossClasses
} from '../data/quranData';
import type { ClassPlanSegment } from '../data/mushafPageData';

const EMPTY_STUDENT: StudentProfile = { id: '', nameAr: '', nameEn: '', email: '', phone: '', verificationStatus: 'UNVERIFIED', activePlanId: null, assignedTeacherId: null, remainingLessons: 0, totalLessonsCompleted: 0, totalHoursLearned: 0 };
const EMPTY_TEACHER: TeacherProfile = { id: '', nameAr: '', nameEn: '', email: '', phone: '', titleAr: '', titleEn: '', rating: 0, reviewsCount: 0, ijazahDetailsAr: '', ijazahDetailsEn: '', experienceYears: 0, languagesSpoken: [], specializationsAr: [], specializationsEn: [], bioAr: '', bioEn: '', hourlyRateSar: 0, availableSlots: [], workingHoursStart: '12:00', workingHoursEnd: '18:00', bookedTimeSlots: [], gender: 'MALE', approvalStatus: 'PENDING_ADMIN', totalStudents: 0, totalHoursTaught: 0, ratingAvg: 0, ijazahChainAr: '', ijazahChainEn: '' };

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
  login: (identifier: string, pass: string) => Promise<{ success: boolean; role?: Role; status?: TeacherApprovalStatus; error?: string }>;
  logout: () => Promise<void>;
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
      birthDate?: string;
      initialLessons?: Lesson[];
    }
  ) => Promise<string>;
  applyAsTeacher: (
    name: string,
    email: string,
    gender?: 'MALE' | 'FEMALE',
    ijazahDetails?: string,
    specializations?: string[],
    password?: string,
    phone?: string,
    birthDate?: string
  ) => Promise<void>;

  // Admin Actions
  approveTeacherByAdmin: (teacherId: string) => Promise<void>;
  rejectTeacherByAdmin: (teacherId: string) => Promise<void>;

  // Student Actions
  submitPaymentReceipt: (planId: string, teacherId: string, receiptFile: string, bankRef: string) => Promise<void>;
  resubmitPaymentReceipt: (receiptFile: string, bankRef: string, planIdOverride?: string) => Promise<void>;
  scheduleNextCyclePlan: (planId: string) => Promise<void>;
  purchaseExtraClass: (receiptFile: string, bankRef: string, quantity?: number) => Promise<void>;
  scheduleExtraLesson: (date: string, time: string, surahTarget: string, teacherId?: string) => Promise<void>;
  updateStudentQuranGoal: (goal: StudentQuranGoal) => Promise<void>;
  setGeneratedPlanLessons: (newLessons: Lesson[], studentIdOverride?: string) => Promise<boolean>;
  updateUpcomingPlanLessons: (newUpcomingLessons: Lesson[], studentIdOverride?: string, goal?: StudentQuranGoal) => Promise<boolean>;
  rescheduleLesson: (lessonId: string, newDate: string, newTimeStr: string) => Promise<boolean>;
  rescheduleLessons: (updates: { lessonId: string; date: string; time: string }[]) => Promise<boolean>;
  pauseSubscription: (reason?: string) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;

  // Teacher / Admin Actions
  approveStudentPayment: (studentId: string) => Promise<void>;
  rejectStudentPayment: (studentId: string, reason?: string) => Promise<void>;
  toggleBlockAccount: (userId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  createAccountByAdmin: (newAccount: UserAccount, password: string) => Promise<void>;
  updateTeacherAvailability: (
    teacherId: string,
    availabilityByDay: Record<string, { start: string; end: string }[]>,
    conflictResolutionOption: 'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'
  ) => Promise<{ success: boolean; error?: string; conflictCount?: number }>;

  // Lessons
  bookLesson: (teacherId: string, date: string, time: string) => Promise<boolean>;
  addReview: (teacherId: string, lessonId: string, rating: number, commentAr: string, commentEn?: string) => Promise<void>;
  updateMeetUrl: (lessonId: string, newUrl: string) => Promise<void>;
  completeLesson: (lessonId: string, notes?: string, scope?: string) => Promise<void>;
  cancelLesson: (lessonId: string) => Promise<void>;
  clearAllClassData: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  updateUserProfile: (name: string, email: string, phone: string, ijazahChain?: string, teacherDetails?: { title: string; experienceYears: number; languages: string; specializations: string; bio: string }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialLanguage?: Language }> = ({ children, initialLanguage = 'ar' }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [role, setRole] = useState<Role>('GUEST');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const scheduleVersion = useRef<string | null>(null);
  const savedSchedule = useRef<Lesson[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [student, setStudent] = useState<StudentProfile>({ ...EMPTY_STUDENT, id: "", nameAr: "", nameEn: "", email: "", activePlanId: null, assignedTeacherId: null, remainingLessons: 0, totalLessonsCompleted: 0, totalHoursLearned: 0, verificationStatus: "UNVERIFIED", quranGoal: undefined });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>({ ...EMPTY_TEACHER, id: "", nameAr: "", nameEn: "", email: "", phone: "", totalStudents: 0, totalHoursTaught: 0, rating: 0, ratingAvg: 0, reviewsCount: 0, experienceYears: 0, ijazahDetailsAr: "", ijazahDetailsEn: "", ijazahChainAr: "", ijazahChainEn: "", bioAr: "", bioEn: "" });
  const [plans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | null>(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  const clearPrivateState = () => {
    setLessons([]); setNotifications([]); setUserAccounts([]); scheduleVersion.current = null;
    setStudent({ ...EMPTY_STUDENT, id: '', nameAr: '', nameEn: '', email: '', activePlanId: null, assignedTeacherId: null, remainingLessons: 0, totalLessonsCompleted: 0, totalHoursLearned: 0, verificationStatus: 'UNVERIFIED', quranGoal: undefined });
    setTeacherProfile({ ...EMPTY_TEACHER, id: '', nameAr: '', nameEn: '', email: '', phone: '', totalStudents: 0, totalHoursTaught: 0, rating: 0, ratingAvg: 0, reviewsCount: 0, experienceYears: 0, bioAr: '', bioEn: '', ijazahChainAr: '', ijazahChainEn: '' });
    setSelectedTeacherForBooking(null); setSelectedPlanForCheckout(null);
    for (const key of ['ratel_user_accounts', 'ratel_student', 'ratel_lessons', 'ratel_notifications', 'ratel_teachers', 'ratel_reviews']) localStorage.removeItem(key);
  };

  const mapAccount = (user: Record<string, unknown>): UserAccount => {
    const data = user.appData && typeof user.appData === 'object' ? user.appData as Record<string, unknown> : {};
    return { id: String(user.id), name: String(user.nameAr || user.nameEn || user.email || ''), email: String(user.email || ''), gender: user.gender === 'FEMALE' ? 'FEMALE' : 'MALE', role: user.role as Role, phone: typeof user.phone === 'string' ? user.phone : undefined, isBlocked: Boolean(user.isBlocked), teacherApprovalStatus: user.teacherApprovalStatus as TeacherApprovalStatus, studentProfile: data.studentProfile as StudentProfile | undefined, teacherProfile: (data.teacherProfile || data.teacher) as TeacherProfile | undefined };
  };

  const loadRoleData = async (user: AuthUser & { appData?: unknown; phone?: string }) => {
    const data = user.appData && typeof user.appData === 'object' ? user.appData as Record<string, unknown> : {};
    if (user.role === 'STUDENT') setStudent({ ...EMPTY_STUDENT, activePlanId: null, assignedTeacherId: null, remainingLessons: 0, totalLessonsCompleted: 0, totalHoursLearned: 0, quranGoal: undefined, ...data.studentProfile as Partial<StudentProfile>, id: user.id, email: user.email, nameAr: user.nameAr, nameEn: user.nameEn, phone: user.phone || (data.studentProfile as StudentProfile | undefined)?.phone || '' });
    if (user.role === 'TEACHER') {
      const ownResponse = await fetch('/api/account/profile', { cache: 'no-store' });
      if (ownResponse.ok) { const ownResult = await ownResponse.json(); if (ownResult.teacher) { data.teacher = ownResult.teacher; data.teacherProfile = ownResult.teacher; } if (ownResult.user?.phone) user.phone = ownResult.user.phone; }
      const own = (data.teacherProfile || data.teacher || {}) as Partial<TeacherProfile>;
      setTeacherProfile({ ...EMPTY_TEACHER, titleAr: '', titleEn: '', bioAr: '', bioEn: '', ijazahDetailsAr: '', ijazahDetailsEn: '', experienceYears: 0, languagesSpoken: [], specializationsAr: [], specializationsEn: [], ...own, id: user.id, nameAr: user.nameAr, nameEn: user.nameEn, email: user.email, phone: user.phone || own.phone || '', totalStudents: own.totalStudents || 0, totalHoursTaught: own.totalHoursTaught || 0, ratingAvg: own.rating || 0, rating: own.rating || 0, reviewsCount: own.reviewsCount || 0, ijazahChainAr: own.ijazahDetailsAr || '', ijazahChainEn: own.ijazahDetailsEn || '', approvalStatus: user.teacherApprovalStatus || 'PENDING_ADMIN' });
    }
    const endpoints = ['/api/lessons', '/api/notifications', '/api/reviews', ...(user.role === 'ADMIN' ? ['/api/admin/accounts'] : [])];
    const responses = await Promise.all(endpoints.map(async endpoint => {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load account data. Please retry.');
      if (endpoint === '/api/lessons') scheduleVersion.current = response.headers.get('X-Schedule-Version');
      return response.json();
    }));
    setLessons(responses[0]); setNotifications(responses[1].notifications || []); setReviews(responses[2].reviews || []);
    if (user.role === 'ADMIN') setUserAccounts((responses[3].users || []).map(mapAccount));
    else setUserAccounts([mapAccount(user as unknown as Record<string, unknown>)]);
  };

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      clearPrivateState();
      try {
        const [teacherResponse, reviewResponse, sessionResponse] = await Promise.all(['/api/teachers', '/api/reviews', '/api/auth/session'].map(url => fetch(url, { cache: 'no-store' })));
        if (cancelled) return;
        if (teacherResponse.ok) setTeachers((await teacherResponse.json()).teachers || []);
        if (reviewResponse.ok) setReviews((await reviewResponse.json()).reviews || []);
        if (sessionResponse.ok) {
          const { user } = await sessionResponse.json();
          if (user) { await loadRoleData(user); if (!cancelled) { setCurrentUser(user); setRole(user.role); } }
        }
      } catch (error) { console.error('Account hydration failed:', error); clearPrivateState(); }
      if (!cancelled) setIsHydrated(true);
    }
    void hydrate();
    return () => { cancelled = true; };
  // Hydrate once; private state is never recovered from browser storage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // HELPER TO SAVE LESSONS DIRECTLY TO POSTGRESQL DOCKER DB
  const saveLessonsToDatabase = async (updatedLessons: Lesson[], targetStudentId?: string, goal?: StudentQuranGoal) => {
    if (!currentUser && !targetStudentId) return false;
    const ownedLessons = targetStudentId
      ? updatedLessons.filter(lesson => lesson.studentId === targetStudentId)
      : currentUser?.role === 'ADMIN'
      ? updatedLessons
      : currentUser?.role === 'TEACHER'
        ? updatedLessons.filter(lesson => lesson.teacherId === currentUser.id)
        : updatedLessons.filter(lesson => lesson.studentId === currentUser?.id);
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons: ownedLessons,
          baseVersion: scheduleVersion.current,
          quranGoal: goal,
          studentId: targetStudentId || (currentUser?.role === 'STUDENT' ? currentUser.id : undefined),
        })
      });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || `Lesson API returned ${response.status}`); }
      const saved = await response.json();
      scheduleVersion.current = saved.version || null;
      savedSchedule.current = saved.lessons;
      return true;
    } catch (err) {
      console.error('Failed to sync updated lessons to DB:', err);
      return false;
    }
  };

  const saveStudentProfileToDatabase = async (profile: StudentProfile, studentId = currentUser?.id) => {
    if (!studentId) return;
    const profilePayload = { quranGoal: profile.quranGoal, assignedTeacherId: profile.assignedTeacherId };
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, profile: profilePayload }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Unable to save your learning goal.');
      }
    } catch (error) {
      throw error;
    }
  };

  const toggleLanguage = () => {
    const nextLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLanguage);
    try {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `sanad_language=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch (error) {
      console.error('Language preference save failed:', error);
    }
  };

  const login = async (identifier: string, pass: string) => {
    if (!identifier.trim() || !pass) return { success: false, error: 'Email and password are required.' };
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password: pass }),
      });
      const result = await response.json();
      if (!response.ok || !result.user) return { success: false, error: result.error || 'Invalid email or password.' };

      const user = result.user as AuthUser & { appData?: unknown };
      clearPrivateState();
      await loadRoleData(user);
      const teacherResponse = await fetch('/api/teachers', { cache: 'no-store' });
      if (teacherResponse.ok) setTeachers((await teacherResponse.json()).teachers || []);
      setCurrentUser(user); setRole(user.role);
      return { success: true, role: user.role, status: user.teacherApprovalStatus };
    } catch {
      return { success: false, error: 'Unable to sign in right now.' };
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;
    const response = await fetch('/api/account/profile', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to refresh your account.');
    const result = await response.json();
    await loadRoleData(result.user);
    if (result.teacher) setTeacherProfile({ ...result.teacher, ratingAvg: result.teacher.rating, ijazahChainAr: result.teacher.ijazahDetailsAr, ijazahChainEn: result.teacher.ijazahDetailsEn });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      setRole('GUEST');
      clearPrivateState();
      setTeachers([]); setReviews([]);
      const publicReviews = await fetch('/api/reviews', { cache: 'no-store' });
      if (publicReviews.ok) setReviews((await publicReviews.json()).reviews || []);
      const response = await fetch('/api/teachers', { cache: 'no-store' });
      if (response.ok) setTeachers((await response.json()).teachers || []);
    }
  };

  const updateUserProfile = async (name: string, email: string, phone: string, ijazahChain?: string, teacherDetails?: { title: string; experienceYears: number; languages: string; specializations: string; bio: string }) => {
    if (!currentUser) throw new Error('Sign in to update your profile.');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, phone: phone.trim(), ijazahChain, ...teacherDetails }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Profile API returned ${response.status}`);

    const updatedUser: AuthUser = {
      ...currentUser,
      nameAr: cleanName,
      nameEn: cleanName,
      email: cleanEmail
    };
    setCurrentUser(updatedUser);

    if (currentUser.role === 'STUDENT') {
      setStudent(prev => ({
        ...prev,
        nameAr: cleanName,
        nameEn: cleanName,
        email: cleanEmail,
        phone: phone.trim()
      }));
    } else if (currentUser.role === 'TEACHER') {
      setTeacherProfile(prev => ({
        ...prev,
        nameAr: cleanName,
        nameEn: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        ijazahChainAr: ijazahChain || prev.ijazahChainAr,
        ijazahChainEn: ijazahChain || prev.ijazahChainEn,
        titleAr: teacherDetails?.title || prev.titleAr,
        titleEn: teacherDetails?.title || prev.titleEn,
        experienceYears: teacherDetails?.experienceYears ?? prev.experienceYears,
        languagesSpoken: teacherDetails?.languages.split(',').map(value => value.trim()).filter(Boolean) || prev.languagesSpoken,
        specializationsAr: teacherDetails?.specializations.split(',').map(value => value.trim()).filter(Boolean) || prev.specializationsAr,
        bioAr: teacherDetails?.bio ?? prev.bioAr,
        bioEn: teacherDetails?.bio ?? prev.bioEn,
      }));
      setTeachers(prev => prev.map(t => (t.id === currentUser.id || t.email.toLowerCase() === currentUser.email.toLowerCase()) ? {
        ...t,
        nameAr: cleanName,
        nameEn: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        ijazahDetailsAr: ijazahChain || t.ijazahDetailsAr,
        ijazahDetailsEn: ijazahChain || t.ijazahDetailsEn,
        titleAr: teacherDetails?.title || t.titleAr,
        titleEn: teacherDetails?.title || t.titleEn,
        experienceYears: teacherDetails?.experienceYears ?? t.experienceYears,
        languagesSpoken: teacherDetails?.languages.split(',').map(value => value.trim()).filter(Boolean) || t.languagesSpoken,
        specializationsAr: teacherDetails?.specializations.split(',').map(value => value.trim()).filter(Boolean) || t.specializationsAr,
        bioAr: teacherDetails?.bio ?? t.bioAr,
        bioEn: teacherDetails?.bio ?? t.bioEn,
      } : t));
    }

    setUserAccounts(prev => prev.map(acc => {
      if (acc.id === currentUser.id || acc.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...acc,
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim(),
          studentProfile: acc.studentProfile ? {
            ...acc.studentProfile,
            nameAr: cleanName,
            nameEn: cleanName,
            email: cleanEmail,
            phone: phone.trim()
          } : undefined
        };
      }
      return acc;
    }));
  };

  const registerStudentAccount = async (
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
      birthDate?: string;
      initialLessons?: Lesson[];
    }
  ): Promise<string> => {
    const approvedScholars = teachers.filter(t => t.approvalStatus === 'APPROVED');
    const assignedTeacher = approvedScholars.find(t => t.id === onboardingData?.teacherId) ||
      approvedScholars.find(t => t.gender === gender && !t.isFullyBooked) ||
      approvedScholars[0] ||
      teachers[0];
    if (!assignedTeacher) throw new Error('لا يوجد معلم معتمد متاح حالياً. يرجى المحاولة لاحقاً.');
    const emailClean = email.trim().toLowerCase();
    const phoneClean = phone ? phone.replace(/[\s\-\(\)\+]/g, '') : '';

    // Check duplicate email registration
    const existingEmailAcc = userAccounts.find(a => a.email.toLowerCase() === emailClean && a.id !== currentUser?.id);
    if (existingEmailAcc) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل في المنصة. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
    }

    // Check duplicate phone registration
    if (phoneClean) {
      const existingPhoneAcc = userAccounts.find(a => a.phone && a.phone.replace(/[\s\-\(\)\+]/g, '') === phoneClean && a.id !== currentUser?.id);
      if (existingPhoneAcc) {
        throw new Error('رقم الجوال هذا مسجل بالفعل في المنصة. يرجى استخدام رقم آخر أو تسجيل الدخول.');
      }
    }

    const selectedPlanId = onboardingData?.planId || 'plan-basic';
    const chosenPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const isFreePlan = chosenPlan.priceMonthlySar === 0;

    let newStudentId = 'std-' + Date.now();

    const newStudent: StudentProfile = {
      id: newStudentId,
      nameAr: name,
      nameEn: name,
      email: emailClean,
      phone: phone || '',
      birthDate: onboardingData?.birthDate,
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

    const registrationResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: emailClean,
        password,
        gender,
        phone,
        role: 'STUDENT',
        profileData: { studentProfile: newStudent },
        initialLessons: onboardingData?.initialLessons?.filter(lesson => lesson.isOrientationSession),
      }),
    });
    const registrationResult = await registrationResponse.json();
    if (!registrationResponse.ok || !registrationResult.user) {
      throw new Error(registrationResult.error || 'Unable to create your account.');
    }
    try {
      const notificationResponse = await fetch('/api/notifications', { cache: 'no-store' });
      if (notificationResponse.ok) {
        const notificationResult = await notificationResponse.json();
        if (Array.isArray(notificationResult.notifications)) setNotifications(notificationResult.notifications as NotificationItem[]);
      }
    } catch (error) {
      console.error('Notification refresh failed:', error);
    }
    newStudentId = registrationResult.user.id;
    newStudent.id = newStudentId;

    const newAcc: UserAccount = {
      id: newStudentId,
      name,
      email: emailClean,
      gender,
      role: 'STUDENT',
      phone,
      studentProfile: newStudent
    };

    setUserAccounts(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== emailClean);
      const updated = [...filtered, newAcc];
      return updated;
    });

    await loadRoleData(registrationResult.user);

    const userObj: AuthUser = {
      id: newStudentId,
      nameAr: name,
      nameEn: name,
      email: emailClean,
      role: 'STUDENT'
    };

    setCurrentUser(userObj);
    setRole('STUDENT');

    return newStudentId;
  };

  const applyAsTeacher = async (
    name: string,
    email: string,
    gender: 'MALE' | 'FEMALE' = 'MALE',
    ijazahDetails: string = '',
    specializations: string[] = [],
    password?: string,
    phone?: string,
    birthDate?: string
  ): Promise<void> => {
    const emailClean = email.trim().toLowerCase();
    const phoneClean = phone ? phone.replace(/[\s\-\(\)\+]/g, '') : '';

    // Check duplicate email registration
    const existingEmailAcc = userAccounts.find(a => a.email.toLowerCase() === emailClean && a.id !== currentUser?.id);
    if (existingEmailAcc) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل في المنصة. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
    }

    // Check duplicate phone registration
    if (phoneClean) {
      const existingPhoneAcc = userAccounts.find(a => a.phone && a.phone.replace(/[\s\-\(\)\+]/g, '') === phoneClean && a.id !== currentUser?.id);
      if (existingPhoneAcc) {
        throw new Error('رقم الجوال هذا مسجل بالفعل في المنصة. يرجى استخدام رقم آخر أو تسجيل الدخول.');
      }
    }
    const newTeacher: Teacher = {
      id: 'tech-' + Date.now(),
      nameAr: name,
      nameEn: name,
      email: emailClean,
      phone: phone || '',
      birthDate: birthDate || '',
      titleAr: gender === 'FEMALE' ? 'معلمة قرآن مجازة بالسند المتصل' : 'معلم قرآن مجاز بالسند المتصل',
      titleEn: 'Certified Quran Scholar',
      rating: 0,
      reviewsCount: 0,
      ijazahDetailsAr: ijazahDetails || 'إجازة بالسند المتصل',
      ijazahDetailsEn: ijazahDetails || 'Continuous Chain Ijazah',
      experienceYears: 0,
      languagesSpoken: [],
      specializationsAr: specializations.length > 0 ? specializations : ['الإجازة بالسند المتصل'],
      specializationsEn: ['Continuous Chain Ijazah'],
      bioAr: 'معلم قرآن كريم يسعى لنشر التلاوة والحفظ المتقن.',
      bioEn: 'Quran instructor dedicated to authentic recitation.',
      hourlyRateSar: 90,
      availableSlots: [],
      availabilityRanges: [{ start: '12:00', end: '18:00' }],
      workingHoursStart: '12:00',
      workingHoursEnd: '18:00',
      bookedTimeSlots: [],
      gender,
      isFullyBooked: false,
      approvalStatus: 'PENDING_ADMIN'
    };

    const registrationResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: emailClean,
        password,
        gender,
        phone,
        birthDate,
        ijazahDetails,
        specializations,
        role: 'TEACHER',
        profileData: { teacher: newTeacher },
      }),
    });
    const registrationResult = await registrationResponse.json();
    if (!registrationResponse.ok || !registrationResult.user) {
      throw new Error(registrationResult.error || 'Unable to submit your application.');
    }
    try {
      const notificationResponse = await fetch('/api/notifications', { cache: 'no-store' });
      if (notificationResponse.ok) {
        const notificationResult = await notificationResponse.json();
        if (Array.isArray(notificationResult.notifications)) setNotifications(notificationResult.notifications as NotificationItem[]);
      }
    } catch (error) {
      console.error('Notification refresh failed:', error);
    }
    newTeacher.id = registrationResult.user.id;

    setTeachers(prev => [newTeacher, ...prev]);

    const newAcc: UserAccount = {
      id: newTeacher.id,
      name,
      email: emailClean,
      gender,
      role: 'TEACHER',
      phone
    };

    setUserAccounts(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== emailClean);
      const updated = [...filtered, newAcc];
      return updated;
    });

    const userObj = registrationResult.user as AuthUser;

    await loadRoleData(registrationResult.user);
    setCurrentUser(userObj);
    setRole('TEACHER');
  };

  const updateAdminAccount = async (userId: string, patch: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/accounts/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to update account.');
    if (currentUser) await loadRoleData(currentUser);
    const teachersResponse = await fetch('/api/teachers', { cache: 'no-store' });
    if (teachersResponse.ok) setTeachers((await teachersResponse.json()).teachers || []);
  };
  const approveTeacherByAdmin = (teacherId: string) => updateAdminAccount(teacherId, { teacherApprovalStatus: 'APPROVED' });
  const rejectTeacherByAdmin = (teacherId: string) => updateAdminAccount(teacherId, { teacherApprovalStatus: 'REJECTED' });

  const submitPaymentReceipt = (planId: string, teacherId: string, receiptFile: string, bankRef: string) => subscriptionAction('SUBMIT_PAYMENT', { planId, teacherId, receiptFile, bankRef });
  const resubmitPaymentReceipt = (receiptFile: string, bankRef: string, planIdOverride?: string) => subscriptionAction('SUBMIT_PAYMENT', { planId: planIdOverride || student.pendingPlanId || student.activePlanId, receiptFile, bankRef });
  const scheduleNextCyclePlan = (planId: string) => subscriptionAction('NEXT_PLAN', { planId });
  const purchaseExtraClass = (receiptFile: string, bankRef: string, quantity = 1) => subscriptionAction('SUBMIT_PAYMENT', { kind: 'EXTRA_CLASS', receiptFile, bankRef, quantity });

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

    let partitions: ClassPlanSegment[] = [];
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

  const scheduleExtraLesson = async (date: string, time: string, surahTarget?: string, teacherId?: string) => {
    const activeStudentId = currentUser?.id || student.id;
    const targetTeacher = teachers.find(t => t.id === (teacherId || student.assignedTeacherId)) || teachers[0];

    if (!targetTeacher) throw new Error('Choose an available teacher.');
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
      durationMinutes: plans.find(plan => plan.id === student.activePlanId)?.lessonDurationMinutes || plans[0].lessonDurationMinutes,
      status: 'SCHEDULED',
      googleMeetUrl: '',
      surahTargetAr: surahTarget || defaultTarget,
      surahTargetEn: surahTarget || student.quranGoal?.targetSurahOrJuzEn || 'Hifz Revision & Recitation',
      notes: 'حصة إضافية مدمجة ضمن الخطة التعليمية والهدف القرآني'
    };

    const updated = repartitionStudentLessons(student, lessons, newExtraLesson);
    if (!await saveLessonsToDatabase(updated)) throw new Error('Unable to book the extra class. Please refresh availability.');
    setLessons(savedSchedule.current);
    await refreshData();
  };

  const addReview = async (teacherId: string, lessonId: string, rating: number, commentAr: string, commentEn?: string) => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, lessonId, rating, commentAr, commentEn: commentEn || commentAr }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to submit review.');
    const [reviewResponse, teacherResponse] = await Promise.all([fetch('/api/reviews', { cache: 'no-store' }), fetch('/api/teachers', { cache: 'no-store' })]);
    if (reviewResponse.ok) setReviews((await reviewResponse.json()).reviews || []);
    if (teacherResponse.ok) setTeachers((await teacherResponse.json()).teachers || []);
  };

  const updateStudentQuranGoal = async (goal: StudentQuranGoal) => {
    const updated: StudentProfile = {
      ...student,
      assignedTeacherId: goal.assignedTeacherId || student.assignedTeacherId,
      quranGoal: goal
    };
    await saveStudentProfileToDatabase(updated);
    setStudent(updated);
  };

  const setGeneratedPlanLessons = async (newLessons: Lesson[], studentIdOverride?: string): Promise<boolean> => {
    const activeStudentId = studentIdOverride || currentUser?.id || student.id;
    const formattedNewLessons = newLessons.map(l => ({ ...l, studentId: activeStudentId }));
    const currentLessons = lessons;
    const otherStudentsLessons = currentLessons.filter(l => l.studentId !== activeStudentId);
    const currentStudentCompletedLessons = currentLessons.filter(l => l.studentId === activeStudentId && (l.status === 'COMPLETED' || l.isOrientationSession));
    const nextIds = new Set(formattedNewLessons.map(lesson => lesson.id));
    const cancelled = currentLessons.filter(lesson => lesson.studentId === activeStudentId && lesson.status === 'SCHEDULED' && !lesson.isOrientationSession && !nextIds.has(lesson.id)).map(lesson => ({ ...lesson, status: 'CANCELLED' as const }));
    const updatedList = [...currentStudentCompletedLessons, ...cancelled, ...formattedNewLessons, ...otherStudentsLessons];
    if (!await saveLessonsToDatabase(updatedList, activeStudentId)) return false;
    setLessons(savedSchedule.current);
    return true;
  };

  const updateUpcomingPlanLessons = async (newUpcomingLessons: Lesson[], studentIdOverride?: string, goal?: StudentQuranGoal): Promise<boolean> => {
    const activeStudentId = studentIdOverride || currentUser?.id || student.id;
    const formattedNewUpcoming = newUpcomingLessons.map(l => ({ ...l, studentId: activeStudentId }));
    const otherStudentsLessons = lessons.filter(l => l.studentId !== activeStudentId);
    const currentStudentCompleted = lessons.filter(l => l.studentId === activeStudentId && (l.status === 'COMPLETED' || l.isOrientationSession));
    const nextIds = new Set(formattedNewUpcoming.map(lesson => lesson.id));
    const cancelled = lessons.filter(lesson => lesson.studentId === activeStudentId && lesson.status === 'SCHEDULED' && !lesson.isOrientationSession && !nextIds.has(lesson.id)).map(lesson => ({ ...lesson, status: 'CANCELLED' as const }));
    const updatedList = [...currentStudentCompleted, ...cancelled, ...formattedNewUpcoming, ...otherStudentsLessons];
    if (!await saveLessonsToDatabase(updatedList, activeStudentId, goal)) return false;
    setLessons(savedSchedule.current);
    if (goal && activeStudentId === currentUser?.id) setStudent(prev => ({ ...prev, quranGoal: goal }));
    setStudent(prev => ({ ...prev, extraClassCredits: 0, extraPurchasedClassesCount: 0 }));
    return true;
  };

  const rescheduleLessons = async (updates: { lessonId: string; date: string; time: string }[]): Promise<boolean> => {
    if (!updates.length) return false;
    const updateMap = new Map(updates.map(update => [update.lessonId, update]));
    const targetLessons = lessons.filter(lesson => updateMap.has(lesson.id) && lesson.status !== 'COMPLETED');
    if (targetLessons.length !== updateMap.size) return false;
    const updatedList = lessons.map(lesson => {
      const update = updateMap.get(lesson.id);
      return update ? { ...lesson, date: update.date, time: update.time, status: 'SCHEDULED' as const, needsRescheduling: false } : lesson;
    });
    if (!await saveLessonsToDatabase(updatedList, targetLessons[0].studentId)) return false;
    setLessons(savedSchedule.current);
    setStudent(prev => ({ ...prev, extraClassCredits: Math.max(0, (prev.extraClassCredits || 0) - targetLessons.length) }));
    return true;
  };

  const rescheduleLesson = async (lessonId: string, newDate: string, newTimeStr: string): Promise<boolean> =>
    rescheduleLessons([{ lessonId, date: newDate, time: newTimeStr }]);

  const subscriptionAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const response = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to update subscription.');
    const refresh = await fetch('/api/lessons', { cache: 'no-store' });
    if (refresh.ok) { scheduleVersion.current = refresh.headers.get('X-Schedule-Version'); savedSchedule.current = await refresh.json(); }
    else scheduleVersion.current = null;
    const profile = result.profile as StudentProfile;
    if (profile.id === currentUser?.id) setStudent(profile);
    setUserAccounts(prev => prev.map(account => account.id === profile.id ? { ...account, studentProfile: profile } : account));
    if (refresh.ok) setLessons(savedSchedule.current);
    else setLessons(prev => [...prev.filter(lesson => lesson.studentId !== profile.id), ...result.lessons]);
  };
  const approveStudentPayment = (studentId: string) => subscriptionAction('APPROVE', { studentId });
  const rejectStudentPayment = (studentId: string, reason?: string) => subscriptionAction('REJECT', { studentId, reason });
  const pauseSubscription = (reason?: string) => subscriptionAction('PAUSE', { reason });
  const resumeSubscription = () => subscriptionAction('RESUME');
  const cancelSubscription = () => subscriptionAction('CANCEL');

  const bookLesson = async (teacherId: string, date: string, time: string): Promise<boolean> => {
    const selectedTeacher = teachers.find(t => t.id === teacherId);
    if (!selectedTeacher) return false;

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
      durationMinutes: plans.find(plan => plan.id === student.activePlanId)?.lessonDurationMinutes || plans[0].lessonDurationMinutes,
      status: 'SCHEDULED',
      googleMeetUrl: '',
      surahTargetAr: 'الحفظ: سورة جديدة متفق عليها | التلاوة: الحزب المعتمد'
    };

    const updatedLessons = [newLesson, ...lessons];
    if (!await saveLessonsToDatabase(updatedLessons)) return false;
    setLessons(savedSchedule.current);


    return true;
  };

  const updateMeetUrl = async (lessonId: string, newUrl: string) => {
    const updated = lessons.map(lesson => lesson.id === lessonId ? { ...lesson, googleMeetUrl: newUrl } : lesson);
    if (!await saveLessonsToDatabase(updated)) throw new Error('Unable to save the meeting link.');
    setLessons(savedSchedule.current);
  };

  const completeLesson = async (lessonId: string, notes?: string, scope?: string) => {
    const targetLesson = lessons.find(lesson => lesson.id === lessonId);
    if (!targetLesson) throw new Error('Class not found. Refresh and try again.');
    const updated = lessons.map(lesson => lesson.id === lessonId ? {
      ...lesson,
      status: 'COMPLETED' as const,
      notes,
      ...(scope?.trim() ? { surahTargetAr: scope.trim(), surahTargetEn: scope.trim() } : {}),
    } : lesson);
    if (!await saveLessonsToDatabase(updated)) throw new Error('Unable to save class completion. Please try again.');
    setLessons(savedSchedule.current);

    await refreshData();
  };

  const cancelLesson = async (lessonId: string) => {
    const updated = lessons.map(lesson => lesson.id === lessonId ? { ...lesson, status: 'CANCELLED' as const } : lesson);
    if (!await saveLessonsToDatabase(updated)) throw new Error('Unable to cancel class.');
    setLessons(savedSchedule.current);
  };
  const clearAllClassData = async () => {
    const response = await fetch('/api/lessons', { method: 'DELETE' });
    if (!response.ok) throw new Error('Unable to clear class data.');
    setLessons([]);
  };

  const toggleBlockAccount = (userId: string) => updateAdminAccount(userId, { isBlocked: !userAccounts.find(account => account.id === userId)?.isBlocked });

  const updateTeacherAvailability = async (
    teacherId: string,
    availabilityByDay: Record<string, { start: string; end: string }[]>,
    conflictResolutionOption: 'KEEP_EXISTING' | 'CANCEL_AND_REFUND_CREDIT' | 'NOTIFY_STUDENTS'
  ): Promise<{ success: boolean; error?: string; conflictCount?: number }> => {
    try {
      const response = await fetch('/api/teacher/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, availabilityByDay, resolution: conflictResolutionOption }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, error: result.error || 'Could not save availability.' };

      const updatedTeacher = result.teacher as Teacher;
      const conflictIds = new Set<string>(result.conflictLessonIds || []);
      const refunds = (result.refundedCreditsByStudent || {}) as Record<string, number>;
      setTeachers(prev => {
        const updated = prev.map(t => t.id === teacherId ? { ...t, ...updatedTeacher } : t);
        return updated;
      });
      setLessons(prev => prev.map(lesson => {
        if (!conflictIds.has(lesson.id)) return lesson;
        return conflictResolutionOption === 'CANCEL_AND_REFUND_CREDIT'
          ? { ...lesson, status: 'CANCELLED', needsRescheduling: false }
          : { ...lesson, needsRescheduling: true };
      }));
      if (Object.keys(refunds).length) {
        setUserAccounts(prev => prev.map(account => {
          const count = refunds[account.id] || refunds[account.studentProfile?.id || ''] || 0;
          if (!count || !account.studentProfile) return account;
          const profile = { ...account.studentProfile, extraClassCredits: (account.studentProfile.extraClassCredits || 0) + count };
          if (student.id === account.id || student.id === profile.id) setStudent(profile);
          return { ...account, studentProfile: profile };
        }));
      }
      await refreshData();
      return { success: true, conflictCount: result.conflictCount || 0 };
    } catch (error) {
      console.error('Teacher availability sync failed:', error);
      return { success: false, error: 'Unable to save availability. Check your connection and try again.' };
    }
  };

  const createAccountByAdmin = async (newAccount: UserAccount, password: string) => {
    const response = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: newAccount, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to create account.');
    const savedAccount = mapAccount(result.user);
    setUserAccounts(prev => [savedAccount, ...prev.filter(account => account.id !== savedAccount.id)]);
    if (savedAccount.role === 'TEACHER' && savedAccount.teacherProfile) {
      setTeachers(prev => [savedAccount.teacherProfile!, ...prev.filter(teacher => teacher.id !== savedAccount.teacherProfile!.id)]);
    }
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    void fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications: updated }) }).then(response => { if (response.ok) setNotifications(updated); });
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
      rescheduleLessons,
      pauseSubscription,
      resumeSubscription,
      cancelSubscription,
      approveStudentPayment,
      rejectStudentPayment,
      toggleBlockAccount,
      refreshData,
      createAccountByAdmin,
      updateTeacherAvailability,
      bookLesson,
      addReview,
      updateMeetUrl,
      completeLesson,
      cancelLesson,
      clearAllClassData,
      markNotificationRead,
      updateUserProfile
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
