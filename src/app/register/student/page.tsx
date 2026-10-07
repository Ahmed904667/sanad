'use client';

import React, { useState, useMemo, useEffect, useRef, useEffectEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { TeacherDatePicker } from '@/components/TeacherDatePicker';
import { TeacherReviewsModal } from '@/components/TeacherReviewsModal';
import { formatTime12h } from '@/utils/timeFormat';
import {  Teacher, Lesson, LearningGoalTrack, StudentQuranGoal, Review } from '@/types';
import { SUBSCRIPTION_GOALS } from '@/data/mockData';
import { receiptFileToDataUrl } from '@/lib/receiptFile';
import { formatAvailabilityRanges } from '@/utils/timeFormat';
import { getTeacherAvailableSlots, lessonTimesOverlap, WEEKDAYS_AR } from '@/utils/availability';
import {
  QURAN_SURAHS,
  QURAN_JUZ_LIST,
  getPageForSurahAyah,
  partitionSurahsAcrossClasses,
  partitionJuzAcrossClasses,
  getDayNameArFromDate
} from '@/data/quranData';
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Calendar,
  Clock,
  ChevronLeft,
  Star,
  Building2,
  Layers,
  Check,
  Search,
  Calculator,
  Sliders,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

export default function StudentRegisterPage() {
  const router = useRouter();
  const {
    language,
    plans,
    teachers,
    bankInfo,
    student,
    currentUser,
    reviews,
    registerStudentAccount
  } = useApp();
  const isAr = language === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // STEP 1: Account Information
  const [name, setName] = useState(currentUser?.role === 'STUDENT' ? (currentUser?.nameAr || student.nameAr || '') : '');
  const [email, setEmail] = useState(currentUser?.role === 'STUDENT' ? (currentUser?.email || student.email || '') : '');
  const [phone, setPhone] = useState(currentUser?.role === 'STUDENT' ? (student.phone || '') : '');
  const [birthDate, setBirthDate] = useState(currentUser?.role === 'STUDENT' ? (student.birthDate || '') : '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(currentUser?.role === 'STUDENT' ? (student.gender || 'MALE') : 'MALE');
  const [password, setPassword] = useState('');

  // STEP 2: Plan Selection & Receipt Upload
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-basic');
  const [bankRef, setBankRef] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // STEP 3: Goal & Plan Builder
  const [track, setTrack] = useState<LearningGoalTrack>('HIFZ_NEW');
  const [targetMode, setTargetMode] = useState<'SURAH' | 'JUZ'>('SURAH');
  const [selectedSurahNumbers, setSelectedSurahNumbers] = useState<number[]>([2]); // Array of Surah numbers, default [2] (Al-Baqarah)
  // Per-Surah customizable Ayah ranges: surahNumber -> { startAyah, endAyah }
  const [surahAyahCustomMap, setSurahAyahCustomMap] = useState<Record<number, { startAyah: number; endAyah: number }>>({
    2: { startAyah: 1, endAyah: 286 }
  });
  const [isAyahCustomizerOpen, setIsAyahCustomizerOpen] = useState<boolean>(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');
  const [selectedJuzNumbers, setSelectedJuzNumbers] = useState<number[]>([30]); // Array of Juz numbers, default [30] (Juz 'Amma)

  // STEP 4: Teacher Selection (Filtered by Gender & Admin Approval)
  const approvedTeachers = teachers.filter(t => t.approvalStatus === 'APPROVED');
  const filteredTeachers = approvedTeachers.filter(t => t.gender === gender);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(filteredTeachers[0]?.id || '');
  const [modalReviewsTeacher, setModalReviewsTeacher] = useState<Teacher | null>(null);

  // STEP 5: Per-Day Customizable Timetable
  const [selectedDays, setSelectedDays] = useState<string[]>(['الإثنين', 'الأربعاء']);
  const [dayTimeSlots, setDayTimeSlots] = useState<Record<string, string>>({
    'الأحد': '12:00',
    'الإثنين': '12:00',
    'الثلاثاء': '14:00',
    'الأربعاء': '14:00',
    'الخميس': '16:00',
    'الجمعة': '16:00',
    'السبت': '18:00'
  });

  // Context hydrates asynchronously; copy its persisted student data into this form once it arrives.
  useEffect(() => {
    if (currentUser?.role !== 'STUDENT') return;
    // This effect synchronizes the account session into the registration form after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (student.nameAr) setName(student.nameAr);
    if (student.email) setEmail(student.email);
    if (student.phone) setPhone(student.phone);
    if (student.birthDate) setBirthDate(student.birthDate);
    if (student.gender) setGender(student.gender);
    if (student.assignedTeacherId) setSelectedTeacherId(student.assignedTeacherId);
    if (student.quranGoal?.agreedWeeklyDaysAr) setSelectedDays(student.quranGoal.agreedWeeklyDaysAr);
    if (student.quranGoal?.dayTimeSlots) setDayTimeSlots(student.quranGoal.dayTimeSlots);
    if (student.verificationStatus === 'UNVERIFIED') setStep(2);
  }, [currentUser, student]);

  // STEP 7: Welcoming / Orientation Session
  const [dateBounds] = useState(() => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    const format = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'});
    return { todayStr: format.format(today), maxDateStr: format.format(maxDate) };
  });
  const { todayStr } = dateBounds;

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const isFreePlan = selectedPlan.priceMonthlySar === 0;
  const emptyTeacher: Teacher = { id: '', nameAr: '', nameEn: '', email: '', titleAr: '', titleEn: '', rating: 0, reviewsCount: 0, ijazahDetailsAr: '', ijazahDetailsEn: '', experienceYears: 0, languagesSpoken: [], specializationsAr: [], specializationsEn: [], bioAr: '', bioEn: '', hourlyRateSar: 0, availableSlots: [], availabilityByDay: {}, workingHoursStart: '12:00', workingHoursEnd: '18:00', bookedTimeSlots: [], gender, approvalStatus: 'PENDING_ADMIN' };
  const selectedTeacher = filteredTeachers.find(t => t.id === selectedTeacherId) || filteredTeachers[0] || emptyTeacher;
  const [occupied, setOccupied] = useState<{ date: string; time: string; durationMinutes: number }[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftLoaded = useRef(false);
  const orientationWasPicked = useRef(false);

  useEffect(() => {
    if (selectedTeacher.id && selectedTeacherId !== selectedTeacher.id) {
      // Reconcile the selection when approved profiles finish loading.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTeacherId(selectedTeacher.id);
    }
  }, [selectedTeacher.id, selectedTeacherId]);

  useEffect(() => {
    if (!selectedTeacher.id) return;
    const controller = new AbortController();
    // Availability is date-specific and contains no student information.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailabilityStatus('loading');
    const to = new Date(); to.setDate(to.getDate() + 65);
    fetch(`/api/teachers/availability?teacherId=${encodeURIComponent(selectedTeacher.id)}&from=${todayStr}&to=${to.toISOString().slice(0, 10)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('Availability unavailable'); return response.json(); })
      .then(data => { setOccupied(data.occupied || []); setAvailabilityStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setAvailabilityStatus('error'); });
    return () => controller.abort();
  }, [selectedTeacher.id, todayStr, availabilityRetry]);

  const [orientationDate, setOrientationDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [orientationTime, setOrientationTime] = useState('');

  // Pre-calculate the first recurring class from selected days and time slots
  const daysWeekMap: Record<string, number> = useMemo(() => ({
    'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
  }), []);

  const firstRegularClassInfo = useMemo(() => {
    const targetDayIndices = selectedDays.map(d => daysWeekMap[d]).filter(idx => idx !== undefined);
    if (targetDayIndices.length === 0) return null;

    const checkDate = new Date(`${orientationDate}T12:00:00`);
    checkDate.setDate(checkDate.getDate() + 1); // Regular classes start after orientation.

    for (let i = 0; i < 28; i++) {
      const dayIdx = checkDate.getDay();
      if (targetDayIndices.includes(dayIdx)) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayName = Object.keys(daysWeekMap).find(k => daysWeekMap[k] === dayIdx) || '';
        const timeSlot = dayTimeSlots[dayName]?.split(',')[0] || '12:00';
        return {
          dateStr,
          dayName,
          timeSlot,
          dateTime: new Date(`${dateStr}T${timeSlot}:00`)
        };
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return null;
  }, [selectedDays, dayTimeSlots, daysWeekMap, orientationDate]);

  const isOrientationBeforeFirstClass = Boolean(firstRegularClassInfo && orientationTime &&
    `${orientationDate}T${orientationTime}` < `${firstRegularClassInfo.dateStr}T${firstRegularClassInfo.timeSlot.split(',')[0]}`);

  const totalLessonsInPlan = selectedPlan.lessonsPerMonth || 4;

  const selectedSurahsList = selectedSurahNumbers
    .map(n => QURAN_SURAHS.find(s => s.number === n))
    .filter((s): s is (typeof QURAN_SURAHS)[0] => Boolean(s));

  const selectedJuzList = selectedJuzNumbers
    .map(n => QURAN_JUZ_LIST.find(j => j.number === n))
    .filter((j): j is (typeof QURAN_JUZ_LIST)[0] => Boolean(j));

  // Helper to get customized/safe range for any Surah
  const getSurahRange = (surahNum: number) => {
    const sObj = QURAN_SURAHS.find(s => s.number === surahNum);
    const maxA = sObj?.totalVerses || 1;
    const custom = surahAyahCustomMap[surahNum];
    const sA = custom ? Math.max(1, Math.min(maxA, custom.startAyah)) : 1;
    const eA = custom ? Math.max(sA, Math.min(maxA, custom.endAyah)) : maxA;
    return {
      startAyah: sA,
      endAyah: eA,
      totalVerses: Math.max(1, eA - sA + 1),
      isFullSurah: sA === 1 && eA === maxA
    };
  };

  const setSurahRange = (surahNum: number, startA: number, endA: number) => {
    const sObj = QURAN_SURAHS.find(s => s.number === surahNum);
    const maxA = sObj?.totalVerses || 1;
    const safeStart = Math.max(1, Math.min(maxA, startA));
    const safeEnd = Math.max(safeStart, Math.min(maxA, endA));
    setSurahAyahCustomMap(prev => ({
      ...prev,
      [surahNum]: { startAyah: safeStart, endAyah: safeEnd }
    }));
  };

  const resetAllSurahsToFull = () => {
    const nextMap: Record<number, { startAyah: number; endAyah: number }> = {};
    selectedSurahNumbers.forEach(num => {
      const sObj = QURAN_SURAHS.find(s => s.number === num);
      if (sObj) {
        nextMap[num] = { startAyah: 1, endAyah: sObj.totalVerses };
      }
    });
    setSurahAyahCustomMap(nextMap);
  };

  // Toggle single surah vs multi selection
  const toggleSurahSelection = (surahNum: number) => {
    if (selectedSurahNumbers.includes(surahNum)) {
      if (selectedSurahNumbers.length > 1) {
        setSelectedSurahNumbers(prev => prev.filter(n => n !== surahNum));
      }
    } else {
      const sObj = QURAN_SURAHS.find(s => s.number === surahNum);
      if (sObj) {
        setSurahAyahCustomMap(prev => ({
          ...prev,
          [surahNum]: prev[surahNum] || { startAyah: 1, endAyah: sObj.totalVerses }
        }));
      }
      setSelectedSurahNumbers(prev => [...prev, surahNum].sort((a, b) => a - b));
    }
  };

  const selectOnlySurah = (surahNum: number) => {
    const s = QURAN_SURAHS.find(item => item.number === surahNum) || QURAN_SURAHS[1];
    setSelectedSurahNumbers([surahNum]);
    setSurahAyahCustomMap({
      [surahNum]: { startAyah: 1, endAyah: s.totalVerses }
    });
  };

  const selectAllSurahsInJuz = (juzNum: number) => {
    const juzSurahs = QURAN_SURAHS.filter(s => { const juz = QURAN_JUZ_LIST.find(item => item.number === juzNum); return juz && s.startPage <= juz.endPage && s.endPage >= juz.startPage; });
    const juzSurahNums = juzSurahs.map(s => s.number);
    const allPresent = juzSurahNums.every(n => selectedSurahNumbers.includes(n));

    if (allPresent) {
      // Remove all surahs of this juz if more surahs remain
      const remaining = selectedSurahNumbers.filter(n => !juzSurahNums.includes(n));
      if (remaining.length > 0) {
        setSelectedSurahNumbers(remaining);
      }
    } else {
      // Add all surahs of this juz
      const combined = Array.from(new Set([...selectedSurahNumbers, ...juzSurahNums])).sort((a, b) => a - b);
      const nextMap = { ...surahAyahCustomMap };
      juzSurahs.forEach(s => {
        if (!nextMap[s.number]) {
          nextMap[s.number] = { startAyah: 1, endAyah: s.totalVerses };
        }
      });
      setSurahAyahCustomMap(nextMap);
      setSelectedSurahNumbers(combined);
    }
  };

  const toggleJuzSelection = (juzNum: number) => {
    if (selectedJuzNumbers.includes(juzNum)) {
      if (selectedJuzNumbers.length > 1) {
        setSelectedJuzNumbers(prev => prev.filter(n => n !== juzNum));
      }
    } else {
      setSelectedJuzNumbers(prev => [...prev, juzNum].sort((a, b) => a - b));
    }
  };

  const selectOnlyJuz = (juzNum: number) => {
    setSelectedJuzNumbers([juzNum]);
  };

  // Surahs grouped by Juz (1 to 30) for Fahras display
  const SURAHS_GROUPED_BY_JUZ = useMemo(() => {
    return QURAN_JUZ_LIST.map(j => {
      const surahs = QURAN_SURAHS.filter(s => s.startPage <= j.endPage && s.endPage >= j.startPage);
      return {
        juzNumber: j.number,
        juzMeta: j,
        surahs
      };
    });
  }, []);

  // Multi-Surahs Totals & Page Set
  const multiSurahsTotalVerses = selectedSurahsList.reduce((acc, s) => {
    return acc + getSurahRange(s.number).totalVerses;
  }, 0);

  const multiSurahsPagesList = (() => {
    const pageSet = new Set<number>();
    for (const surah of selectedSurahsList) {
      const range = getSurahRange(surah.number);
      const pS = getPageForSurahAyah(surah.number, range.startAyah);
      const pE = getPageForSurahAyah(surah.number, range.endAyah);
      for (let p = pS; p <= pE; p++) {
        pageSet.add(p);
      }
    }
    const list = Array.from(pageSet).sort((a, b) => a - b);
    return list.length > 0 ? list : [1];
  })();

  const multiSurahsStartPage = multiSurahsPagesList[0] || 1;
  const multiSurahsEndPage = multiSurahsPagesList[multiSurahsPagesList.length - 1] || 604;
  const multiSurahsTotalPages = multiSurahsPagesList.length;

  // Multi-Juz Totals
  const multiJuzStartPage = selectedJuzList.length > 0 ? Math.min(...selectedJuzList.map(j => j.startPage)) : 1;
  const multiJuzEndPage = selectedJuzList.length > 0 ? Math.max(...selectedJuzList.map(j => j.endPage)) : 604;
  const multiJuzTotalPages = selectedJuzList.reduce((acc, j) => acc + j.totalPages, 0);

  // Target Minimum Pages Requirement (At least 0.5 page per class)
  const currentSelectedPagesCount = targetMode === 'SURAH' ? multiSurahsTotalPages : multiJuzTotalPages;
  const minRequiredPages = 1;
  const isTargetValid = currentSelectedPagesCount >= minRequiredPages;

  const weekdayLabel = (day: string) => isAr ? day : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][WEEKDAYS_AR.indexOf(day)] || day;
  // Summary Text
  let selectedTargetSummaryText = '';
  if (targetMode === 'SURAH') {
    if (selectedSurahsList.length === 1) {
      const s = selectedSurahsList[0];
      const r = getSurahRange(s.number);
      const pS = getPageForSurahAyah(s.number, r.startAyah);
      const pE = getPageForSurahAyah(s.number, r.endAyah);
      selectedTargetSummaryText = `سورة ${s.nameAr} (الآيات ${r.startAyah}-${r.endAyah}) [صفحات ${pS}-${pE} • ${multiSurahsTotalPages} صفحة]`;
    } else {
      const parts = selectedSurahsList.map(s => {
        const r = getSurahRange(s.number);
        return r.isFullSurah ? `سورة ${s.nameAr}` : `سورة ${s.nameAr} (${r.startAyah}-${r.endAyah})`;
      });
      const displayedParts = parts.length <= 3 ? parts.join('، ') : `${parts.slice(0, 3).join('، ')} و${parts.length - 3} سور أخرى`;
      selectedTargetSummaryText = `${selectedSurahsList.length} سور (${displayedParts}) [${multiSurahsTotalPages} صفحة • صفحات ${multiSurahsStartPage}-${multiSurahsEndPage}]`;
    }
  } else {
    if (selectedJuzList.length === 1) {
      selectedTargetSummaryText = `${selectedJuzList[0].famousNameAr} [صفحات ${selectedJuzList[0].startPage}-${selectedJuzList[0].endPage} • ${selectedJuzList[0].totalPages} صفحة]`;
    } else {
      const juzNumbers = selectedJuzList.map(j => j.number).join('، ');
      selectedTargetSummaryText = `${selectedJuzList.length} أجزاء (أجزاء: ${juzNumbers}) [${multiJuzTotalPages} صفحة • صفحات ${multiJuzStartPage}-${multiJuzEndPage}]`;
    }
  }

  const selectedTargetSummaryEn = targetMode === 'SURAH'
    ? selectedSurahsList.map(surah => { const range = getSurahRange(surah.number); return `${surah.nameEn} (ayahs ${range.startAyah}–${range.endAyah})`; }).join(', ')
    : `Juz ${selectedJuzNumbers.join(', ')} (${multiJuzTotalPages} pages)`;
  const selectedTargetSummaryAr = selectedTargetSummaryText;
  if (!isAr) selectedTargetSummaryText = selectedTargetSummaryEn;

  // AUTO-CALCULATED PLAN BREAKDOWN ACROSS ALL PLAN CLASSES (SEQUENTIAL & PROGRESSIVE PARTITIONING)
  const autoCalculatedClasses = targetMode === 'SURAH'
    ? partitionSurahsAcrossClasses(
        selectedSurahsList.map(s => {
          const r = getSurahRange(s.number);
          return { number: s.number, startAyah: r.startAyah, endAyah: r.endAyah };
        }),
        totalLessonsInPlan
      )
    : partitionJuzAcrossClasses(
        selectedJuzList.map(j => j.number),
        totalLessonsInPlan
      );

  // Availability ranges determine possible starts; the server supplies occupied dates.
  const teacherAvailableSlots = Array.from(new Set(WEEKDAYS_AR.flatMap(day => getTeacherAvailableSlots(selectedTeacher, day, selectedPlan.lessonDurationMinutes)))).sort();
  const isSlotBookedOnDate = (dateStr: string, slot: string): boolean => {
    if (availabilityStatus !== 'ready' || !dateStr) return true;
    const day = getDayNameArFromDate(dateStr);
    if (!getTeacherAvailableSlots(selectedTeacher, day, selectedPlan.lessonDurationMinutes).includes(slot)) return true;
    return occupied.some(lesson => lesson.date === dateStr && lessonTimesOverlap(slot, selectedPlan.lessonDurationMinutes, lesson.time, lesson.durationMinutes));
  };
  const findEarliestOrientationSlot = () => {
    const start = new Date(`${todayStr}T00:00:00Z`);
    for (let offset = 1; offset <= 65; offset++) {
      const date = new Date(start.getTime() + offset * 86400000);
      const dateStr = date.toISOString().slice(0, 10);
      const day = WEEKDAYS_AR[date.getUTCDay()];
      const slots = getTeacherAvailableSlots(selectedTeacher, day, selectedPlan.lessonDurationMinutes);
      const time = slots.find(slot => !occupied.some(lesson =>
        lesson.date === dateStr &&
        lessonTimesOverlap(slot, selectedPlan.lessonDurationMinutes, lesson.time, lesson.durationMinutes)
      ));
      if (time) return { date: dateStr, time };
    }
    return null;
  };
  const isSlotBookedOnDay = (day: string, slot: string): boolean => {
    if (!getTeacherAvailableSlots(selectedTeacher, day, selectedPlan.lessonDurationMinutes).includes(slot)) return true;
    // Check this subscription's future dates, not every historical occurrence of a weekday.
    const date = new Date(`${orientationDate}T12:00:00`);
    for (let offset = 1; offset <= 28; offset++) {
      date.setDate(date.getDate() + 1);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if (getDayNameArFromDate(dateStr) === day && isSlotBookedOnDate(dateStr, slot)) return true;
    }
    return availabilityStatus !== 'ready';
  };

  // Choose only times this teacher actually offers on this weekday.
  const getSafeTimeSlot = (day: string, preferredTime?: string) => {
    const daySlots = getTeacherAvailableSlots(selectedTeacher, day, selectedPlan.lessonDurationMinutes);
    const validSlots = daySlots.filter(slot => !isSlotBookedOnDay(day, slot));
    if (preferredTime && validSlots.includes(preferredTime)) return preferredTime;
    if (validSlots.length) return validSlots[0];
    return availabilityStatus === 'ready' ? '' : daySlots[0] || '';
  };

  const monthlyCount = selectedPlan?.lessonsPerMonth || 8;
  const allowedWeeklySlots = Math.max(1, Math.round(monthlyCount / 4));

  // FIFO Queue tracking selected slot items: [{ day: string, time: string }]
  const [selectedSlotsQueue, setSelectedSlotsQueue] = useState<{ day: string; time: string }[]>(() => {
    const candidateDays = selectedTeacher.workingDaysAr?.length ? selectedTeacher.workingDaysAr : WEEKDAYS_AR;
    const firstOpenDay = candidateDays.find(day => getSafeTimeSlot(day));
    return firstOpenDay ? [{ day: firstOpenDay, time: getSafeTimeSlot(firstOpenDay) }] : [];
  });

  // Reconcile only when the availability inputs change, using the latest form state.
  const reconcileAvailability = useEffectEvent(() => {
    if (!selectedTeacher.id) return;
    const workingDays = (selectedTeacher.workingDaysAr && selectedTeacher.workingDaysAr.length > 0)
      ? selectedTeacher.workingDaysAr
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const orientationIsAvailable = Boolean(orientationTime && !isSlotBookedOnDate(orientationDate, orientationTime));
    if (availabilityStatus === 'ready' && (!orientationIsAvailable || !orientationWasPicked.current)) {
      const selectedDateDay = getDayNameArFromDate(orientationDate);
      const selectedDateFirstSlot = getTeacherAvailableSlots(selectedTeacher, selectedDateDay, selectedPlan.lessonDurationMinutes)
        .find(slot => !occupied.some(lesson => lesson.date === orientationDate && lessonTimesOverlap(slot, selectedPlan.lessonDurationMinutes, lesson.time, lesson.durationMinutes)));
      const firstAvailable = orientationWasPicked.current && selectedDateFirstSlot
        ? { date: orientationDate, time: selectedDateFirstSlot }
        : findEarliestOrientationSlot();
      if (firstAvailable) {
        setOrientationDate(firstAvailable.date);
        setOrientationTime(firstAvailable.time);
      }
    }

    // Reconcile reserved lesson slots with the newly selected teacher and plan.
    const prevQueue = selectedSlotsQueue;
    {
      // 1. Keep only items on teacher's working days, with valid non-booked slots
      let updatedQueue = prevQueue
        .filter(item => workingDays.includes(item.day))
        .map(item => ({ day: item.day, time: getSafeTimeSlot(item.day, item.time) }))
        .filter(item => item.time);

      // 2. Adjust queue length to match allowedWeeklySlots
      if (updatedQueue.length > allowedWeeklySlots) {
        updatedQueue = updatedQueue.slice(0, allowedWeeklySlots);
      } else if (updatedQueue.length < allowedWeeklySlots) {
        for (const day of workingDays) {
          if (updatedQueue.length >= allowedWeeklySlots) break;
          const daySlot = getSafeTimeSlot(day);
          const alreadyHasThisSlot = daySlot && updatedQueue.some(i => i.day === day && i.time === daySlot);
          if (daySlot && !alreadyHasThisSlot) {
            updatedQueue.push({ day, time: daySlot });
          }
        }
      }

      // Keep unavailable weekdays unselected so the UI cannot promise classes a teacher cannot host.
      // 3. Sync selectedDays array
      const WEEKDAYS_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const uniqueDays = Array.from(new Set(updatedQueue.map(i => i.day)));
      const sortedDays = WEEKDAYS_ORDER.filter(d => uniqueDays.includes(d));
      setSelectedDays(sortedDays);

      // 4. Sync dayTimeSlots map
      const newDayTimeMap: Record<string, string[]> = {};
      updatedQueue.forEach(item => {
        if (!newDayTimeMap[item.day]) newDayTimeMap[item.day] = [];
        newDayTimeMap[item.day].push(item.time);
      });
      const serializedMap: Record<string, string> = {};
      Object.keys(newDayTimeMap).forEach(d => {
        serializedMap[d] = newDayTimeMap[d].sort().join(',');
      });
      setDayTimeSlots(serializedMap);

      if (JSON.stringify(updatedQueue) !== JSON.stringify(selectedSlotsQueue)) setSelectedSlotsQueue(updatedQueue);
    }
  });
  const availabilityKey = JSON.stringify({id:selectedTeacher.id, ranges:selectedTeacher.availabilityByDay, starts:selectedTeacher.availableSlots, days:selectedTeacher.workingDaysAr, start:selectedTeacher.workingHoursStart,end:selectedTeacher.workingHoursEnd});
  const occupiedKey = JSON.stringify(occupied);
  useEffect(() => { let cancelled = false; queueMicrotask(() => { if (!cancelled) reconcileAvailability(); }); return () => { cancelled = true; }; }, [availabilityKey, occupiedKey, availabilityStatus, orientationDate, allowedWeeklySlots, selectedPlan.lessonDurationMinutes]);

  const getDaySlotsArray = (day: string): string[] => {
    return selectedSlotsQueue.filter(item => item.day === day).map(item => item.time);
  };

  const totalSelectedSlotsCount = selectedSlotsQueue.length;

  const handleToggleDayTime = (day: string, timeSlot: string, forceAddSecondSlot: boolean = false) => {
    if (isSlotBookedOnDay(day, timeSlot)) return;
    setSelectedSlotsQueue(prevQueue => {
      const daySlots = prevQueue.filter(item => item.day === day);
      const isAlreadySelected = prevQueue.some(item => item.day === day && item.time === timeSlot);

      let nextQueue = [...prevQueue];

      if (isAlreadySelected) {
        if (nextQueue.length > 1) {
          nextQueue = nextQueue.filter(item => !(item.day === day && item.time === timeSlot));
        }
      } else {
        if (daySlots.length === 1 && !forceAddSecondSlot) {
          const oldTime = daySlots[0].time;
          nextQueue = nextQueue.map(item => {
            if (item.day === day && item.time === oldTime) {
              return { day, time: timeSlot };
            }
            return item;
          });
        } else {
          if (nextQueue.length >= allowedWeeklySlots) {
            const otherDaySlotIndex = nextQueue.findIndex(item => item.day !== day);
            if (otherDaySlotIndex >= 0) {
              nextQueue.splice(otherDaySlotIndex, 1);
            } else {
              nextQueue.shift();
            }
          }
          nextQueue.push({ day, time: timeSlot });
        }
      }

      const WEEKDAYS_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const uniqueDays = Array.from(new Set(nextQueue.map(i => i.day)));
      const sortedDays = WEEKDAYS_ORDER.filter(d => uniqueDays.includes(d));
      setSelectedDays(sortedDays);

      const newDayTimeMap: Record<string, string[]> = {};
      nextQueue.forEach(item => {
        if (!newDayTimeMap[item.day]) newDayTimeMap[item.day] = [];
        newDayTimeMap[item.day].push(item.time);
      });
      const serializedMap: Record<string, string> = {};
      Object.keys(newDayTimeMap).forEach(d => {
        serializedMap[d] = newDayTimeMap[d].sort().join(',');
      });
      setDayTimeSlots(serializedMap);

      return nextQueue;
    });
  };

  const toggleDay = (day: string) => {
    const workingDays = (selectedTeacher.workingDaysAr && selectedTeacher.workingDaysAr.length > 0)
      ? selectedTeacher.workingDaysAr
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    if (!workingDays.includes(day)) return;

    setSelectedSlotsQueue(prevQueue => {
      const isDaySelected = prevQueue.some(item => item.day === day);
      const safeSlot = getSafeTimeSlot(day);

      let nextQueue = [...prevQueue];

      if (isDaySelected) {
        if (allowedWeeklySlots === 1) {
          return prevQueue;
        } else {
          const remainingAfterRemove = nextQueue.filter(item => item.day !== day);
          if (remainingAfterRemove.length > 0) {
            nextQueue = remainingAfterRemove;
          }
        }
      } else {
        if (allowedWeeklySlots === 1) {
          nextQueue = [{ day, time: safeSlot }];
        } else {
          if (nextQueue.length >= allowedWeeklySlots) {
            nextQueue.pop();
          }
          nextQueue.push({ day, time: safeSlot });
        }
      }

      const WEEKDAYS_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const uniqueDays = Array.from(new Set(nextQueue.map(i => i.day)));
      const sortedDays = WEEKDAYS_ORDER.filter(d => uniqueDays.includes(d));
      setSelectedDays(sortedDays);

      const newDayTimeMap: Record<string, string[]> = {};
      nextQueue.forEach(item => {
        if (!newDayTimeMap[item.day]) newDayTimeMap[item.day] = [];
        newDayTimeMap[item.day].push(item.time);
      });
      const serializedMap: Record<string, string> = {};
      Object.keys(newDayTimeMap).forEach(d => {
        serializedMap[d] = newDayTimeMap[d].sort().join(',');
      });
      setDayTimeSlots(serializedMap);

      return nextQueue;
    });
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const validateCurrentStep = (currentStep: number): boolean => {
    setStepError(null);

    // Validate Step 1: Account Information
    if (currentStep === 1) {
      if (!name.trim() || name.trim().length < 3) {
        setStepError(isAr ? 'يرجى كتابة الاسم الثلاثي بشكل صحيح (3 حروف على الأقل).' : 'Please enter a valid full name (at least 3 characters).');
        return false;
      }
      const emailClean = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailClean || !emailRegex.test(emailClean)) {
        setStepError(isAr ? 'يرجى كتابة بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
        return false;
      }
      if (!/^\+?[0-9\s()-]{8,24}$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) {
        setStepError(isAr ? 'يرجى كتابة رقم الجوال بشكل صحيح (8 أرقام على الأقل).' : 'Please enter a valid phone number (at least 8 digits).');
        return false;
      }
      if (!birthDate || birthDate > todayStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        setStepError(isAr ? 'يرجى تحديد تاريخ الميلاد بشكل صحيح.' : 'Please select your date of birth.');
        return false;
      }
      if (!currentUser?.id && (!password || password.length < 8)) {
        setStepError(isAr ? 'يرجى كتابة كلمة مرور تتكون من 8 خانات على الأقل.' : 'Please enter a password with at least 8 characters.');
        return false;
      }
    }

    // Validate Step 2: Subscription Plan & Receipt Upload
    if (currentStep === 2) {
      if (!selectedPlanId) {
        setStepError(isAr ? 'يرجى اختيار الباقة التعليمية المناسبة.' : 'Please select a subscription plan.');
        return false;
      }
      if (!isFreePlan) {
        if (!receiptFile && !student.paymentReceiptUrl) {
          setStepError(isAr ? 'يرجى إرفاق صورة أو ملف إيصال التحويل البنكي للمتابعة.' : 'Please upload your payment receipt file to proceed.');
          return false;
        }
      }
    }

    // Validate Step 3: Quran Track & Target Selection
    if (currentStep === 3) {
      if (!track) {
        setStepError(isAr ? 'يرجى اختيار المسار التعليمي.' : 'Please select a learning track.');
        return false;
      }
      if (targetMode === 'SURAH' && selectedSurahNumbers.length === 0) {
        setStepError(isAr ? 'يرجى تحديد سورة واحدة على الأقل من الفهرس.' : 'Please select at least one Surah.');
        return false;
      }
      if (targetMode === 'JUZ' && selectedJuzNumbers.length === 0) {
        setStepError(isAr ? 'يرجى تحديد جزء واحد على الأقل من الفهرس.' : 'Please select at least one Juz.');
        return false;
      }
      if (!isTargetValid) {
        setStepError(isAr ? `يرجى اختيار عدد صفحات لا يقل عن (${minRequiredPages}) صفحة للمتابعة.` : `Please select at least ${minRequiredPages} pages to continue.`);
        return false;
      }
    }

    // Step 3: Quran Track & Scope Selection
    if (currentStep === 3) {
      if (!track) {
        setStepError(isAr ? 'يرجى اختيار المسار التعليمي.' : 'Please select a learning track.');
        return false;
      }
      if (targetMode === 'SURAH' && selectedSurahNumbers.length === 0) {
        setStepError(isAr ? 'يرجى تحديد سورة واحدة على الأقل من الفهرس.' : 'Please select at least one Surah.');
        return false;
      }
      if (targetMode === 'JUZ' && selectedJuzNumbers.length === 0) {
        setStepError(isAr ? 'يرجى تحديد جزء واحد على الأقل من الفهرس.' : 'Please select at least one Juz.');
        return false;
      }
      if (!isTargetValid) {
        setStepError(isAr ? `يرجى اختيار عدد صفحات لا يقل عن (${minRequiredPages}) صفحة للمتابعة.` : `Please select at least ${minRequiredPages} pages to continue.`);
        return false;
      }
    }

    // Step 4: Quran Content Breakdown & Lesson Plan
    if (currentStep === 4) {
      if (!isTargetValid) {
        setStepError(isAr ? `المقرر يحتاج إلى استكمال الحد الأدنى (${currentSelectedPagesCount} من ${minRequiredPages} صفحات).` : `Minimum target not met.`);
        return false;
      }
    }

    // Step 5: Select Certified Scholar
    if (currentStep === 5) {
      if (!selectedTeacher.id) {
        setStepError(isAr ? 'يرجى اختيار المعلم المناسب لمتابعة التسميع.' : 'Please select a scholar.');
        return false;
      }
    }

    // Step 6: Classes Schedule & Timings
    if (currentStep === 6) {
      if (selectedDays.length === 0) {
        setStepError(isAr ? 'يرجى تحديد أيام التسميع الأسبوعية.' : 'Please select weekly class days.');
        return false;
      }
      if (selectedDays.length !== allowedWeeklySlots) {
        setStepError(isAr ? `الباقة المختارة تتطلب تحديد (${allowedWeeklySlots}) أيام في الأسبوع بالكامل.` : `Selected plan requires exactly (${allowedWeeklySlots}) days per week.`);
        return false;
      }
      for (const day of selectedDays) {
        const slot = dayTimeSlots[day];
        if (!slot) {
          setStepError(isAr ? `يرجى تحديد توقيت الحصة ليوم (${day}).` : `Please select a time slot for (${day}).`);
          return false;
        }
        if (isSlotBookedOnDay(day, slot)) {
          setStepError(isAr ? `التوقيت المختار يوم (${day}) الساعة (${slot}) محجوز، يرجى اختيار توقيت آخر.` : `Selected time slot on ${day} @ ${slot} is booked.`);
          return false;
        }
      }
    }

    // Step 7: Orientation Session & Confirmation
    if (currentStep === 7) {
      if (!orientationDate || orientationDate < todayStr) {
        setStepError(isAr ? 'يرجى اختيار تاريخ الجلسة التمهيدية بشكل صحيح.' : 'Please select a valid orientation date.');
        return false;
      }
      if (!isOrientationBeforeFirstClass) {
        setStepError(isAr ? 'يجب أن يكون موعد الجلسة التمهيدية قبل موعد أول حصة دراسية في خطتك.' : 'Orientation class must be scheduled before your first regular class.');
        return false;
      }
      if (isSlotBookedOnDate(orientationDate, orientationTime)) {
        setStepError(isAr ? `التوقيت المختار للجلسة التمهيدية بتاريخ (${orientationDate}) الساعة (${orientationTime}) محجوز، يرجى اختيار توقيت آخر.` : 'Selected orientation time slot is booked.');
        return false;
      }
    }

    return true;
  };

  // Helper to check if current step data is 100% valid and error-free before enabling Next button
  const isCurrentStepValid = (stepNum: number): boolean => {

    if (stepNum === 1) {
      if (!name.trim() || name.trim().length < 3) return false;
      const emailClean = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailClean || !emailRegex.test(emailClean)) return false;
      if (!/^\+?[0-9\s()-]{8,24}$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) return false;
      if (!birthDate || birthDate > todayStr) return false;
      if (!currentUser?.id && (!password || password.length < 8)) return false;
      return true;
    }

    if (stepNum === 2) {
      if (!selectedPlanId) return false;
      if (!isFreePlan) {
        if (!receiptFile && !student.paymentReceiptUrl) return false; // MANDATORY receipt check
      }
      return true;
    }

    if (stepNum === 3) {
      if (!track) return false;
      if (targetMode === 'SURAH' && selectedSurahNumbers.length === 0) return false;
      if (targetMode === 'JUZ' && selectedJuzNumbers.length === 0) return false;
      if (!isTargetValid) return false;
      return true;
    }

    if (stepNum === 4) {
      return isTargetValid;
    }

    if (stepNum === 5) {
      return !!selectedTeacher.id;
    }

    if (stepNum === 6) {
      if (selectedDays.length !== allowedWeeklySlots) return false;
      for (const day of selectedDays) {
        const slot = dayTimeSlots[day];
        if (!slot || isSlotBookedOnDay(day, slot)) return false;
      }
      return true;
    }

    if (stepNum === 7) {
      if (!orientationDate || orientationDate < todayStr) return false;
      if (!orientationTime) return false;
      if (!isOrientationBeforeFirstClass) return false;
      if (isSlotBookedOnDate(orientationDate, orientationTime)) return false;
      return true;
    }

    return true;
  };

  const goToNextStep = (nextStep: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    if (validateCurrentStep(step)) {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCurrentStep(1)) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const draft = JSON.parse(sessionStorage.getItem('sanad-enrollment-draft') || '{}');
      const params = new URLSearchParams(window.location.search);
      // Restore only learning preferences, never credentials or contact data.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof draft.planId === 'string') setSelectedPlanId(draft.planId);
      if (Array.isArray(draft.surahs)) setSelectedSurahNumbers(draft.surahs.filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 114));
      if (draft.ayahMap && typeof draft.ayahMap === 'object') setSurahAyahCustomMap(draft.ayahMap);
      if (typeof draft.teacherId === 'string') setSelectedTeacherId(draft.teacherId);
      if (['TALQEEN','TILAWAH_CORRECTION','HIFZ_NEW','IJAZAH_REVIEW','COMBINED'].includes(draft.track)) setTrack(draft.track);
      if (params.get('plan')) setSelectedPlanId(params.get('plan')!);
      if (params.get('teacher')) setSelectedTeacherId(params.get('teacher')!);
      if (params.get('gender') === 'FEMALE') setGender('FEMALE');
      const surah = Number(params.get('surah'));
      const metadata = QURAN_SURAHS.find(item => item.number === surah);
      if (metadata) { setSelectedSurahNumbers([surah]); setSurahAyahCustomMap({[surah]: {startAyah:1,endAyah:metadata.totalVerses}}); }
      const mappedTrack = { HIFZ: 'HIFZ_NEW', TIKRAAR: 'IJAZAH_REVIEW', TAJWEED: 'TILAWAH_CORRECTION' } as const;
      const incomingTrack = params.get('track') as keyof typeof mappedTrack;
      if (mappedTrack[incomingTrack]) setTrack(mappedTrack[incomingTrack]);
    } catch { sessionStorage.removeItem('sanad-enrollment-draft'); }
  }, []);
  useEffect(() => {
    if (!draftLoaded.current) return;
    sessionStorage.setItem('sanad-enrollment-draft', JSON.stringify({planId:selectedPlanId, teacherId:selectedTeacherId, track, surahs:selectedSurahNumbers, ayahMap:surahAyahCustomMap}));
  }, [selectedPlanId,selectedTeacherId,track,selectedSurahNumbers,surahAyahCustomMap]);

  // FINISH REGISTRATION & SEND TO ADMIN QUEUE
  const handleFinishRegistration = async () => {
    if (isSubmitting) return;
    for (const requiredStep of [1,2,3,5,6,7]) { if (!validateCurrentStep(requiredStep)) { setStep(requiredStep as 1|2|3|5|6|7); return; } }
    setIsSubmitting(true);

    const matchingGoal = SUBSCRIPTION_GOALS.find(g => g.id === track);


    const qGoal: StudentQuranGoal = {
      track,
      targetSurahOrJuzAr: `${matchingGoal?.titleAr || 'مسار القرآن'}: ${selectedTargetSummaryAr}`,
      targetSurahOrJuzEn: `${matchingGoal?.titleEn || 'Quran track'}: ${selectedTargetSummaryEn}`,
      orientationCompleted: false,
      orientationDate,
      orientationTime,
      agreedWeeklyDaysAr: selectedDays,
      agreedWeeklyDaysEn: selectedDays.map(day => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][WEEKDAYS_AR.indexOf(day)]),
      agreedTimeSlot: dayTimeSlots[selectedDays[0]] || '12:00',
      dayTimeSlots,
      assignedTeacherId: selectedTeacher.id,
      hifzSurahNumbers: targetMode === 'SURAH' ? selectedSurahNumbers : [],
      hifzJuzNumbers: targetMode === 'JUZ' ? selectedJuzNumbers : [],
      surahAyahCustomMap,
      tilawahSurahNumbers: [36],
      hifzFahrasType: targetMode,
      tilawahFahrasType: 'SURAH',
      isHybridTrack: track === 'COMBINED'
    };

    // 1. Generate lessons with per-day custom timings and exact auto-calculated curriculum targets
    const newLessons: Lesson[] = [];

    // 1a. Welcoming Session
    newLessons.push({
      id: 'les-orient-' + Date.now(),
      studentId: '',
      teacherId: selectedTeacher.id,
      teacherNameAr: selectedTeacher.nameAr,
      teacherNameEn: selectedTeacher.nameEn,
      studentNameAr: name,
      studentNameEn: name,
      date: orientationDate,
      time: orientationTime,
      durationMinutes: selectedPlan.lessonDurationMinutes,
      status: 'SCHEDULED',
      googleMeetUrl: '',
      isOrientationSession: true,
      surahTargetAr: `جلسة تمهيدية وترحيبية: تقييم المستوى وتحديد خطة (${selectedTargetSummaryText})`,
      surahTargetEn: `Welcoming & Assessment Class for ${selectedTargetSummaryText}`,
      notes: 'حصة ترحيبية تأسيسية لتحديد المستوى وخطة المقرر'
    });

    // 1b. Regular Scheduled Lessons (Generated immediately ONLY for Free Plans; Paid plans require Admin approval first)
    if (isFreePlan) {
      let generatedCount = 0;
      const orientDateTime = new Date(`${orientationDate}T${orientationTime || '12:00'}:00`);

      const checkDate = new Date(orientationDate);
      let dayOffset = 1;

      while (generatedCount < selectedPlan.lessonsPerMonth && dayOffset < 120) {
        const classDate = new Date(checkDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const dayOfWeek = classDate.getDay();

        const matchedDayName = Object.keys(daysWeekMap).find(key => daysWeekMap[key] === dayOfWeek);
        if (matchedDayName && selectedDays.includes(matchedDayName)) {
          const dateStr = classDate.toISOString().split('T')[0];
          const exactDayTime = dayTimeSlots[matchedDayName] || '12:00';
          const classDateTime = new Date(`${dateStr}T${exactDayTime}:00`);

          // Strictly after the orientation session
          if (classDateTime.getTime() > orientDateTime.getTime()) {
            const classTarget = autoCalculatedClasses[generatedCount] || autoCalculatedClasses[0];

            newLessons.push({
              id: `les-sub-${generatedCount + 1}-${Date.now()}`,
              studentId: '',
              teacherId: selectedTeacher.id,
              teacherNameAr: selectedTeacher.nameAr,
              teacherNameEn: selectedTeacher.nameEn,
              studentNameAr: name,
              studentNameEn: name,
              date: dateStr,
              time: exactDayTime,
              durationMinutes: selectedPlan.lessonDurationMinutes,
              status: 'SCHEDULED',
              googleMeetUrl: '',
              surahTargetAr: `مقرر ${classTarget.summaryAr} • ${classTarget.pageRangeText}`,
              notes: `حصة مدارسة (${matchedDayName} الساعة ${exactDayTime})`
            });
            generatedCount++;
          }
        }
        dayOffset++;
      }
    }

    // 2. Call registerStudentAccount with full onboarding data, initial lessons & receipt info
    try {
      await registerStudentAccount(name, email, gender, phone, password, {
        planId: selectedPlanId,
        teacherId: selectedTeacher.id,
        quranGoal: qGoal,
        receiptFile: receiptFile ? await receiptFileToDataUrl(receiptFile) : undefined,
        bankRef: bankRef.trim() || undefined,
        birthDate,
        initialLessons: newLessons
      });

      sessionStorage.removeItem('sanad-enrollment-draft');
      router.push('/student/dashboard');
    } catch (error) {
      setStepError(error instanceof Error ? error.message : (isAr ? 'تعذّر إكمال التسجيل.' : 'Unable to complete registration.'));
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-[90vh] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 space-y-8">

        {/* STEPPER HEADER */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-950 bg-amber-400 px-3 py-1 rounded-full shadow-xs">
                {isAr ? `الخطوة ${step} من 7` : `Step ${step} of 7`}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {step === 1 && (isAr ? 'بيانات الحساب الأساسية' : 'Account Profile')}
                {step === 2 && (isAr ? 'اختيار الخطة ورفع الإيصال' : 'Select Plan & Payment')}
                {step === 3 && (isAr ? 'اختيار المسار والهدف القرآني' : 'Quran Track & Goal')}
                {step === 4 && (isAr ? 'تحديد السور والمقرر وخطة الحصص' : 'Content Breakdown & Plan')}
                {step === 5 && (isAr ? 'اختر المعلم المجاز بالسند' : 'Select Certified Scholar')}
                {step === 6 && (isAr ? 'تحديد مواعيد الحصص مع المعلم' : 'Classes Schedule & Timings')}
                {step === 7 && (isAr ? 'تحديد موعد الجلسة الترحيبية وتأكيد التسجيل' : 'Welcoming Session & Confirmation')}
              </span>
            </div>

            <span className="text-xs text-emerald-800 font-extrabold">
              {Math.round((step / 7) * 100)}% {isAr ? 'مكتمل' : 'Completed'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="emerald-gradient-bg h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP ERROR ALERT BANNER */}
        <p className="text-xs text-slate-600">{isAr ? 'نحفظ اختيارات الدراسة لهذه الجلسة. لا تُحفظ كلمة المرور أو الإيصال. جميع مواعيد الحصص بتوقيت الرياض (UTC+3).' : 'Study choices are saved for this browser session. Passwords and receipts are not saved. All lesson times use Riyadh time (UTC+3).'}</p>
        {step >= 5 && !selectedTeacher.id && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">{isAr ? 'لا يوجد معلم متاح مطابق حالياً. جرّب لاحقاً أو تواصل مع الدعم.' : 'No matching teacher is currently available. Try later or contact support.'}</p>}
        {step >= 6 && availabilityStatus === 'loading' && <p role="status">{isAr ? 'جارٍ التحقق من المواعيد...' : 'Checking live availability...'}</p>}
        {step >= 6 && availabilityStatus === 'error' && <div role="alert">{isAr ? 'تعذر تحميل المواعيد.' : 'Could not load availability.'} <button type="button" onClick={() => setAvailabilityRetry(value => value + 1)} className="underline">{isAr ? 'أعد المحاولة' : 'Retry'}</button></div>}
        {stepError && (
          <div className="bg-red-50 border-2 border-red-300 text-red-950 p-4 rounded-2xl flex items-center gap-3 text-xs font-extrabold shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="leading-relaxed">{stepError}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT PROFILE */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1 pb-2">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg flex items-center justify-center text-amber-400 mx-auto shadow-md">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-emerald-950 pt-2">
                {isAr ? 'إنشاء حساب طالب جديد' : 'Create Student Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'أدخل بياناتك الأساسية للبدء في رحلتك القرآنية المباركة' : 'Enter your details to start your Quranic journey'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'الاسم الكامل الثلاثي:' : 'Full Name:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    aria-label={isAr ? 'الاسم الكامل' : 'Full name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'مثال: عبد الرحمن بن فهد العتيبي' : 'e.g. Abdulrahman Fahad'}
                    className="w-full pl-3 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    aria-label={isAr ? 'البريد الإلكتروني' : 'Email address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'رقم الجوال (مع مفتاح الدولة):' : 'Phone Number:'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    aria-label={isAr ? 'رقم الجوال' : 'Phone number'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'تاريخ الميلاد:' : 'Date of Birth:'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    max={todayStr}
                    min="1900-01-01"
                    required
                    aria-label={isAr ? 'تاريخ الميلاد' : 'Date of birth'}
                    value={birthDate}
                    onChange={(e) => { setBirthDate(e.target.value); setStepError(null); }}
                    className="w-full pl-3 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    aria-label={isAr ? 'كلمة المرور' : 'Password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStepError(null); }}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {isAr ? 'الجنس:' : 'Gender:'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    gender === 'MALE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{isAr ? 'ذكر' : 'Male (Male Scholars)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    gender === 'FEMALE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{isAr ? 'انثى' : 'Female (Female Scholars)'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 flex flex-col items-end gap-2">
              {!isCurrentStepValid(1) && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl w-full text-center">
                  {isAr
                    ? '💡 يرجى تعبئة كافة الحقول المطلوبة (الاسم، البريد الإلكتروني، رقم الجوال، تاريخ الميلاد، وكلمة المرور 8 خانات).'
                    : '💡 Please complete all required fields (Name, Email, Phone, Date of Birth, and Password min 8 chars).'}
                </p>
              )}
              <button
                type="submit"
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCurrentStepValid(1)
                    ? 'emerald-gradient-bg text-white hover:shadow-lg'
                    : 'bg-emerald-800/80 hover:bg-emerald-800 text-white shadow-sm'
                }`}
              >
                <span>{isAr ? 'التالي: اختيار الخطة وطريقة الدفع' : 'Next: Select Plan'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PLAN SELECTION & BANK RECEIPT */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-emerald-950">
                {isAr ? 'اختر خطة الاشتراك المناسبة' : 'Choose Your Subscription Plan'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'اختر الباقة الشهرية المناسبة؛ جميع الباقات تشمل جلسة ترحيبية مجانية' : 'Choose your monthly plan; every plan includes a free orientation'}
              </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const isFree = p.priceMonthlySar === 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    {isFree && (
                      <span className="absolute -top-2.5 right-3 bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        {isAr ? '0 ر.س مجاناً' : 'FREE'}
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {isAr ? `${Math.round(p.lessonsPerMonth / 4)} حصص/أسبوع` : `${Math.round(p.lessonsPerMonth / 4)} classes/week`}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />}
                      </div>

                      <h3 className="font-black text-sm text-slate-900">
                        {isAr ? p.titleAr : p.titleEn}
                      </h3>
                      <p className="text-slate-500 text-[11px] leading-tight">
                        {isAr ? p.subtitleAr : p.subtitleEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline gap-1">
                      <span className="text-xl font-black text-emerald-950">
                        {isFree ? (isAr ? 'مجاناً' : 'Free') : `${p.priceMonthlySar}`}
                      </span>
                      {!isFree && <span className="text-[10px] text-slate-500 font-bold">{isAr ? 'ر.س / شهرياً' : 'SAR/mo'}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* If Paid Plan -> Show Bank Transfer Details & Receipt Upload */}
            {!isFreePlan ? (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'تفاصيل التحويل البنكي (مصرف الراجحي):' : 'Bank Transfer Details:'}</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-bold">{isAr ? 'اسم البنك:' : 'Bank:'}</span>
                    <span className="font-extrabold text-slate-900">{isAr ? bankInfo.bankNameAr : bankInfo.bankNameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">{isAr ? 'اسم الحساب:' : 'Account Name:'}</span>
                    <span className="font-extrabold text-slate-900">{isAr ? bankInfo.accountNameAr : bankInfo.accountNameEn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{isAr ? 'الآيبان IBAN:' : 'IBAN:'}</span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">{bankInfo.iban}</span>
                  </div>
                </div>

                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'رقم التحويل (اختياري)' : 'Transfer reference (optional)'}
                  <input aria-label={isAr ? 'رقم التحويل' : 'Transfer reference'} value={bankRef} onChange={event => setBankRef(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
                </label>
                {/* Mandatory Receipt Upload Only */}
                <div className="pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isAr ? 'إرفاق إيصال التحويل (صورة/PDF):' : 'Upload Receipt Proof:'}</span>
                      <span className="text-red-600 font-extrabold text-[10px] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                        {isAr ? '* إجباري للمتابعة *' : '* Mandatory to continue *'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                        required
                        onChange={(e) => {
                          setStepError(null);
                          setReceiptFile(e.target.files?.[0] || null);
                        }}
                        className="w-full p-2.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-600 bg-white file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-900 cursor-pointer shadow-2xs"
                      />
                    </div>
                    {receiptFile && (
                      <p className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1.5 pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? `تم اختيار الملف: ${receiptFile.name}` : `File selected: ${receiptFile.name}`}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/60 p-4 rounded-3xl border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  {isAr
                    ? 'اخترت الخطة الأساسية المجانية (0 ر.س). لا يُشترط إرفاق إيصال تحويل بنكي، وسيتم تفعيل الحساب والجلسة الأولى مجاناً.'
                    : 'Free plan selected. No payment proof required.'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'السابق' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => goToNextStep(3)}
                className="px-6 py-3.5 rounded-2xl emerald-gradient-bg text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? 'التالي: اختيار المسار والهدف القرآني' : 'Next: Set Quran Goal'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GOAL / TRACK SELECTION */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-emerald-950">
                {isAr ? 'اختيار المسار والهدف القرآني' : 'Quran Track & Goal Selection'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'حدد نوع المسار والهدف التعليمي الأنسب لك (حفظ جديد، تثبيت ومراجعة، تلاوة وتصحيح، أو مسار الجمع)' : 'Select the track and learning goal that fits your Quran ambition'}
              </p>
            </div>

            {/* The 4 Goals Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SUBSCRIPTION_GOALS.map((g) => {
                const isSelected = track === g.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => setTrack(g.id)}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isAr ? g.badgeAr : g.badgeEn}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />}
                      </div>

                      <h3 className="font-black text-sm text-emerald-950">
                        {isAr ? g.titleAr : g.titleEn}
                      </h3>
                      <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                        {isAr ? g.targetAudienceAr : g.targetAudienceEn}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {isAr ? g.descriptionAr : g.descriptionEn}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStepError(null); setStep(2); }}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {isAr ? 'السابق' : 'Back'}
              </button>
              <button
                type="button"
                disabled={!isCurrentStepValid(3)}
                onClick={() => goToNextStep(4)}
                className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all ${
                  isCurrentStepValid(3)
                    ? 'emerald-gradient-bg text-white hover:shadow-lg cursor-pointer'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed pointer-events-none'
                }`}
              >
                <span>{isAr ? 'التالي: تحديد السور والمقرر الدراسي' : 'Next: Content Scope & Plan'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONTENT SELECTION (SURAHS & AJZAA) + PLAN BREAKDOWN */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-emerald-950">
                {isAr ? 'تحديد السور والمقرر وخطة الحصص' : 'Quran Content & Lesson Plan'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'حدد السور أو الأجزاء المقررة واطلع على التوزيع التلقائي الدقيق للحصص' : 'Select Suwar or Ajzaa to auto-calculate your lesson plan breakdown'}
              </p>
            </div>

            {/* MINIMUM TARGET REQUIREMENT STATUS */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isTargetValid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
            }`}>
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isTargetValid ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'
                }`}>
                  {isTargetValid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-black">
                    {isAr
                      ? (isTargetValid ? 'المقرر مستوفٍ للحد الأدنى المطلوب' : `المقرر يحتاج إلى استكمال الحد الأدنى (${currentSelectedPagesCount} من ${minRequiredPages} صفحات)`)
                      : (isTargetValid ? 'Target meets plan requirement' : `Minimum target not met (${currentSelectedPagesCount}/${minRequiredPages} pages)`)}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {isAr
                      ? `اختر هدفاً مناسباً لمستواك. يراجع المعلم الوتيرة بعد التقييم؛ لديك ${totalLessonsInPlan} حصص، مدة كل منها ${selectedPlan.lessonDurationMinutes} دقائق.`
                      : `Choose a manageable target. Your teacher can adjust the pace after assessing your level; ${totalLessonsInPlan} classes last ${selectedPlan.lessonDurationMinutes} minutes each.`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                  isTargetValid
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-amber-600 text-white border-amber-700'
                }`}>
                  {isAr
                    ? `${currentSelectedPagesCount} صفحة محددة (الحد الأدنى: ${minRequiredPages})`
                    : `${currentSelectedPagesCount} pages (Min: ${minRequiredPages})`}
                </span>
              </div>
            </div>

            {/* TARGET SELECTION MODE SWITCHER: SURAH & AYAHS vs JUZ */}
            <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetMode('SURAH')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  targetMode === 'SURAH'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isAr ? 'تحديد حسب السور والآيات' : 'By Surah & Ayahs'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('JUZ')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  targetMode === 'JUZ'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{isAr ? 'تحديد حسب الأجزاء' : 'By Juz'}</span>
              </button>
            </div>

            {/* IF SURAH MODE */}
            {targetMode === 'SURAH' && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                {/* Mode description & header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800">
                      {isAr ? 'اختر سورة أو عدة سور من القرآن الكريم:' : 'Select One or Multiple Surahs:'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'تصفح فهرس السور الموزع على الأجزاء الثلاثين، واختر ما يناسب خطتك الدراسية.'
                        : 'Browse the 30-Juz Surah Fahras and select the Surahs for your study plan.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-900 font-extrabold bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                      {selectedSurahsList.length === 1
                        ? `سورة ${selectedSurahsList[0]?.nameAr} (${multiSurahsTotalPages} صفحة)`
                        : `${selectedSurahsList.length} سور مختارة (${multiSurahsTotalPages} صفحة)`}
                    </span>
                  </div>
                </div>

                {/* Selected Surahs Chips Bar & Quick Sets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700">
                      {isAr ? 'السور المحددة حالياً:' : 'Selected Surahs:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => selectOnlySurah(2)}
                        className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {isAr ? 'البقرة فقط' : 'Al-Baqarah only'}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSurahNumbers(Array.from({ length: 22 }, (_, i) => 93 + i))}
                        className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {isAr ? 'قصار السور (93-114)' : 'Short Surahs (93-114)'}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => selectAllSurahsInJuz(30)}
                        className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {isAr ? 'سور جزء عمّ (30)' : 'Juz 30 Surahs'}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => selectAllSurahsInJuz(29)}
                        className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {isAr ? 'سور جزء تبارك (29)' : 'Juz 29 Surahs'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {selectedSurahsList.map((surah) => {
                      return (
                        <div
                          key={surah.number}
                          className="inline-flex items-center gap-1.5 bg-emerald-800 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs"
                        >
                          <span>{surah.number}. {surah.nameAr}</span>
                          {selectedSurahsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleSurahSelection(surah.number)}
                              className="w-4 h-4 rounded-full bg-emerald-900/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors mr-0.5"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AYAH CUSTOMIZATION OPTION */}
                {!isAyahCustomizerOpen ? (
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-xs text-emerald-950 font-bold">
                        {isAr
                          ? `يشمل المقرر جميع آيات السور المحددة كاملة (${multiSurahsTotalPages} صفحة • ${multiSurahsTotalVerses} آية)`
                          : `Includes full verses of selected surahs (${multiSurahsTotalPages} pages).`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAyahCustomizerOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-white border border-emerald-600/40 hover:bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isAr ? 'تخصيص نطاق الآيات للسور' : 'Customize Ayah Ranges'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-black text-emerald-950">
                          {isAr ? 'تخصيص نطاق الآيات للسور المختارة:' : 'Customize Ayah Ranges:'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={resetAllSurahsToFull}
                          className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          {isAr ? 'إعادة تعيين كاملة' : 'Reset Full'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAyahCustomizerOpen(false)}
                          className="text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-200 cursor-pointer"
                        >
                          {isAr ? 'إغلاق التخصيص' : 'Close'}
                        </button>
                      </div>
                    </div>

                    {/* List of Range Editors for each selected Surah */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                      {selectedSurahsList.map((surah) => {
                        const range = getSurahRange(surah.number);
                        const pStart = getPageForSurahAyah(surah.number, range.startAyah);
                        const pEnd = getPageForSurahAyah(surah.number, range.endAyah);
                        const pCount = Math.max(1, pEnd - pStart + 1);

                        return (
                          <div
                            key={surah.number}
                            className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black flex items-center justify-center">
                                  {surah.number}
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                  سورة {surah.nameAr}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ({surah.totalVerses} آية)
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSurahRange(surah.number, 1, surah.totalVerses)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                                    range.isFullSurah
                                      ? 'bg-emerald-800 text-white border-emerald-800'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isAr ? 'كاملة' : 'Full'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSurahRange(surah.number, 1, Math.max(1, Math.round(surah.totalVerses / 2)))}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                >
                                  {isAr ? 'النصف 1' : '1st Half'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSurahRange(surah.number, Math.min(surah.totalVerses, Math.round(surah.totalVerses / 2) + 1), surah.totalVerses)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                >
                                  {isAr ? 'النصف 2' : '2nd Half'}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                  {isAr ? 'من:' : 'From:'}
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={range.endAyah}
                                  value={range.startAyah}
                                  onChange={(e) => setSurahRange(surah.number, parseInt(e.target.value) || 1, range.endAyah)}
                                  className="w-full p-1 rounded-lg border border-slate-300 text-xs font-black text-center bg-slate-50"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                  {isAr ? 'إلى:' : 'To:'}
                                </span>
                                <input
                                  type="number"
                                  min={range.startAyah}
                                  max={surah.totalVerses}
                                  value={range.endAyah}
                                  onChange={(e) => setSurahRange(surah.number, range.startAyah, parseInt(e.target.value) || surah.totalVerses)}
                                  className="w-full p-1 rounded-lg border border-slate-300 text-xs font-black text-center bg-slate-50"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-1 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-1 rounded-lg text-center truncate">
                                {range.totalVerses} آية (ص {pStart}-{pEnd} • {pCount} ص)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CONTINUOUS 30-JUZ SURAH FAHRAS */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-700" />
                        <span>{isAr ? 'فهرس سور القرآن الكريم (مقسم بالأجزاء الثلاثين كاملاً):' : 'Quran Surahs Fahras (All 30 Ajzaa):'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isAr ? 'جميع السور معروضة بالتتابع حسب الأجزاء من 1 إلى 30، يمكنك البحث أو الانتقال السريع لأي جزء.' : 'All Surahs listed continuously across all 30 Ajzaa.'}
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={surahSearchQuery}
                        onChange={(e) => setSurahSearchQuery(e.target.value)}
                        placeholder={isAr ? 'ابحث عن سورة بالاسم أو الرقم...' : 'Search surahs...'}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Fast Juz Jump Bar (All 30 Ajzaa buttons displayed at once, no scrollbar) */}
                  <div className="bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700">
                        {isAr ? 'الانتقال السريع لأي جزء من الأجزاء الـ 30:' : 'Quick Jump to any of the 30 Ajzaa:'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {isAr ? 'معروضة بالكامل (1 - 30)' : 'All 30 displayed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1">
                      {QURAN_JUZ_LIST.map((j) => (
                        <button
                          key={j.number}
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`juz-fahras-sec-${j.number}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="py-1 px-1 rounded-lg text-[10px] font-black bg-white hover:bg-emerald-800 hover:text-white text-slate-800 border border-slate-200 transition-all cursor-pointer text-center shadow-2xs"
                          title={`الجزء ${j.number}: ${j.famousNameAr}`}
                        >
                          {j.number}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continuous Scrollable 30-Juz Index */}
                  <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1.5 border border-slate-200 rounded-2xl p-3 bg-slate-50/40">
                    {SURAHS_GROUPED_BY_JUZ.map((group) => {
                      const matchingSurahs = group.surahs.filter((s) =>
                        !surahSearchQuery ||
                        s.nameAr.includes(surahSearchQuery) ||
                        s.nameEn.toLowerCase().includes(surahSearchQuery.toLowerCase()) ||
                        s.number.toString() === surahSearchQuery
                      );

                      if (matchingSurahs.length === 0) return null;

                      const allJuzSurahsSelected = group.surahs.length > 0 && group.surahs.every((s) => selectedSurahNumbers.includes(s.number));

                      return (
                        <div
                          key={group.juzNumber}
                          id={`juz-fahras-sec-${group.juzNumber}`}
                          className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs"
                        >
                          {/* Juz Header Banner */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                                الجزء {group.juzNumber}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {group.juzMeta.famousNameAr}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                (صفحات {group.juzMeta.startPage} - {group.juzMeta.endPage} • {group.surahs.length} سورة)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => selectAllSurahsInJuz(group.juzNumber)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer self-start sm:self-auto ${
                                allJuzSurahsSelected
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {allJuzSurahsSelected
                                ? (isAr ? '✓ جميع سور الجزء محددة (إلغاء)' : '✓ Selected (Deselect)')
                                : (isAr ? `+ تحديد سور الجزء (${group.surahs.length})` : `+ Select all (${group.surahs.length})`)}
                            </button>
                          </div>

                          {/* Surahs Grid within this Juz */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                            {matchingSurahs.map((s) => {
                              const isChecked = selectedSurahNumbers.includes(s.number);
                              const range = getSurahRange(s.number);

                              return (
                                <button
                                  key={s.number}
                                  type="button"
                                  onClick={() => toggleSurahSelection(s.number)}
                                  className={`p-2 rounded-xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black ring-1 ring-emerald-500 shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="truncate">
                                      <span className="text-[10px] text-slate-400 ml-1">{s.number}.</span>
                                      <span className="text-xs font-black">{s.nameAr}</span>
                                    </div>
                                    {isChecked ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    ) : (
                                      <span className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                                    <span>
                                      {isChecked && !range.isFullSurah ? `${range.startAyah}-${range.endAyah} (${range.totalVerses}آ)` : `${s.totalVerses} آية`}
                                    </span>
                                    <span>ص {s.startPage}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* IF JUZ MODE */}
            {targetMode === 'JUZ' && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                {/* Mode description & header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800">
                      {isAr ? 'اختر جزءاً أو عدة أجزاء من القرآن الكريم:' : 'Select One or Multiple Juz:'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'جميع الأجزاء الـ 30 معروضة أمامك، يمكنك اختيار أي جزء أو مجموعة أجزاء لتوزيعها تلقائياً على الحصص.'
                        : 'All 30 Juz displayed directly. Select one or more Juz to distribute evenly across classes.'}
                    </p>
                  </div>
                  <span className="text-[11px] text-emerald-900 font-extrabold bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                    {selectedJuzList.length === 1
                      ? `${selectedJuzList[0]?.famousNameAr} (${selectedJuzList[0]?.totalPages} صفحة)`
                      : `${selectedJuzList.length} أجزاء مختارة (${multiJuzTotalPages} صفحة)`}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-700">
                    {isAr ? 'اختصارات سريعة:' : 'Quick Sets:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectOnlyJuz(30)}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    {isAr ? 'جزء عمّ (30)' : 'Juz 30'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJuzNumbers([29, 30])}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    {isAr ? 'عمّ وتبارك (29-30)' : 'Juz 29-30'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJuzNumbers([28, 29, 30])}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    {isAr ? 'الثلاثة الأخيرة (28-30)' : 'Last 3 Juz'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJuzNumbers([26, 27, 28, 29, 30])}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    {isAr ? 'الخمسة الأخيرة (26-30)' : 'Last 5 Juz'}
                  </button>
                </div>

                {/* 30 Juz Visual Selectable Grid (All 30 displayed at once, no scrollbar) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 p-1 border border-slate-200 rounded-2xl bg-slate-50/30">
                  {QURAN_JUZ_LIST.map((j) => {
                    const isChecked = selectedJuzNumbers.includes(j.number);
                    return (
                      <div
                        key={j.number}
                        onClick={() => toggleJuzSelection(j.number)}
                        className={`p-2.5 rounded-2xl border text-right cursor-pointer transition-all flex flex-col justify-between space-y-1 ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black ring-1 ring-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">
                            جزء {j.number}
                          </span>
                          {isChecked ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <span className="w-3 h-3 rounded-full border border-slate-300" />
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {j.famousNameAr}
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium">
                          ص {j.startPage} - {j.endPage} ({j.totalPages} ص)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AUTO-CALCULATED PLAN BREAKDOWN BY CLASSES (PAGE-BASED) */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-300">
                      {isAr ? 'التوزيع والحساب التلقائي لخطة الحصص (بالصفحات)' : 'Auto-Calculated Class Plan Breakdown (By Pages)'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isAr
                        ? `مقسم بالتساوي على (${totalLessonsInPlan}) حصص حسب باقتك (${selectedPlan.titleAr})`
                        : `Evenly divided across ${totalLessonsInPlan} classes based on ${selectedPlan.titleEn}`}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold bg-emerald-900/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50 self-start sm:self-auto">
                  {targetMode === 'SURAH'
                    ? `${(multiSurahsTotalPages / totalLessonsInPlan).toFixed(1)} صفحة / حصة`
                    : `${(multiJuzTotalPages / totalLessonsInPlan).toFixed(1)} صفحة / حصة`}
                </span>
              </div>

              {/* Class by Class Cards Grid (Fully displayed, no scrollbar needed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {autoCalculatedClasses.map((item) => (
                  <div
                    key={item.classNum}
                    className="bg-slate-800/90 border border-slate-700/70 p-3 rounded-2xl flex items-start gap-2.5 hover:border-amber-400/40 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-700/60 text-emerald-200 text-xs font-black flex items-center justify-center shrink-0">
                      {item.classNum}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md">
                          {item.pageRangeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-medium leading-relaxed break-words">
                        {item.summaryAr}
                      </p>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {item.pagesCountText} • {item.ayahCount} آية
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!isCurrentStepValid(4) && (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
                    {isAr
                      ? `💡 مقرر الحفظ يحتاج استكمال الحد الأدنى (${currentSelectedPagesCount} من ${minRequiredPages} صفحات).`
                      : `💡 Target does not meet minimum ${minRequiredPages} pages.`}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setStepError(null); setStep(3); }}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {isAr ? 'السابق' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToNextStep(5)}
                    className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                      isCurrentStepValid(4)
                        ? 'emerald-gradient-bg text-white hover:shadow-lg'
                        : 'bg-emerald-800/80 hover:bg-emerald-800 text-white shadow-sm'
                    }`}
                  >
                    <span>{isAr ? 'التالي: اختيار المعلم المجاز' : 'Next: Choose Scholar'}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SELECT CERTIFIED SCHOLAR */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-emerald-950">
                {isAr
                  ? `اختر المعلم المناسب (${gender === 'MALE' ? 'المقرئين الرجال' : 'المقرئات النساء'})`
                  : `Select Certified Scholar (${gender === 'MALE' ? 'Male Scholars' : 'Female Scholars'})`}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'تم تصفية المعلمين تلقائياً حسب جنس الطالب لتسهيل الاختيار وضمان الراحة والتفرغ'
                  : 'Filtered automatically by student gender preference'}
              </p>
            </div>

            {/* Scholars List */}
            <div className="space-y-3">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedTeacherId === teacher.id;
                const slots = teacher.availableSlots || ['12:00', '14:00', '16:00', '18:00'];
                const booked = teacher.bookedTimeSlots || [];

                return (
                  <div
                    key={teacher.id}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer space-y-3 relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="lg" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-slate-900">
                              {isAr ? teacher.nameAr : teacher.nameEn}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalReviewsTeacher(teacher);
                              }}
                              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                              title={isAr ? 'عرض تقييمات المعلم' : 'View Scholar Reviews'}
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span className="text-[10px] font-black">{teacher.rating.toFixed(1)}</span>
                              <span className="text-[9px] text-amber-800 font-bold">
                                ({reviews.filter((r: Review) => r.teacherId === teacher.id).length || teacher.reviewsCount} {isAr ? 'تقييمات' : 'reviews'})
                              </span>
                            </button>
                          </div>
                          <p className="text-slate-500 text-[11px] font-medium">{isAr ? teacher.titleAr : teacher.titleEn}</p>
                          <p className="text-emerald-800 font-serif text-[11px]">{isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}</p>
                        </div>
                      </div>

                      <span className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 ${
                        isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isSelected ? (isAr ? '✓ تم الاختيار' : 'Selected') : (isAr ? 'اختيار المعلم' : 'Select')}
                      </span>
                    </div>

                    {/* Teacher Available Working Hours & Slots */}
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between pb-1.5 text-slate-600 font-bold text-[11px]">
                        <span>{isAr ? 'الأوقات المتاحة: ' : 'Available times: '}{formatAvailabilityRanges(teacher.availabilityRanges, teacher.workingHoursStart, teacher.workingHoursEnd, isAr, teacher.availabilityByDay)}</span>
                        <span>{isAr ? 'الأوقات المتاحة للحجز:' : 'Available Slots:'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot) => {
                          const isBooked = booked.includes(slot);
                          return (
                            <span
                              key={slot}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isBooked
                                  ? 'bg-slate-100 text-slate-400 line-through'
                                  : 'bg-white border border-emerald-300 text-emerald-900'
                              }`}
                            >
                              {slot} {isBooked ? (isAr ? '(محجوز)' : '(Booked)') : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {!isCurrentStepValid(5) && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
                  {isAr ? '💡 يرجى اختيار معلم مجاز للمتابعة.' : '💡 Please select a scholar to proceed.'}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setStepError(null); setStep(4); }}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'السابق' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => goToNextStep(6)}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrentStepValid(5)
                      ? 'emerald-gradient-bg text-white hover:shadow-lg'
                      : 'bg-emerald-800/80 hover:bg-emerald-800 text-white shadow-sm'
                  }`}
                >
                  <span>{isAr ? 'التالي: تحديد مواعيد الحصص' : 'Next: Classes Schedule'}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CLASSES SCHEDULE & TIMINGS */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-emerald-950">
                {isAr ? `تحديد مواعيد الحصص مع المعلم (${selectedTeacher.nameAr})` : `Schedule Timings with (${selectedTeacher.nameEn})`}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? `اختر ${allowedWeeklySlots} أيام أسبوعياً، وحدد وقتاً لكل حصة (${selectedPlan.lessonsPerMonth} حصة شهرياً)` : `Choose ${allowedWeeklySlots} days each week and a time for each class (${selectedPlan.lessonsPerMonth} classes per month)`}
              </p>
              <div className="pt-1">
                <span className="inline-block text-xs font-bold text-emerald-950 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                  {isAr
                    ? `محدد (${totalSelectedSlotsCount} من أصل ${allowedWeeklySlots}) حصص أسبوعياً حسب الباقة المختارة`
                    : `Selected (${totalSelectedSlotsCount} of ${allowedWeeklySlots}) weekly slots`}
                </span>
              </div>
            </div>

            {/* TEACHER WORKING HOURS & DAYS NOTICE */}
            <div className="bg-emerald-50/90 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-950">
                  {isAr
                    ? `أوقات المعلم المتاحة (${selectedTeacher.nameAr}): ${formatAvailabilityRanges(selectedTeacher.availabilityRanges, selectedTeacher.workingHoursStart, selectedTeacher.workingHoursEnd, isAr, selectedTeacher.availabilityByDay)}`
                    : `Available times for ${selectedTeacher.nameEn}: ${formatAvailabilityRanges(selectedTeacher.availabilityRanges, selectedTeacher.workingHoursStart, selectedTeacher.workingHoursEnd, isAr, selectedTeacher.availabilityByDay)}`}
                </span>
              </div>
              {selectedTeacher.workingDaysAr && selectedTeacher.workingDaysAr.length > 0 && (
                <span className="bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full text-[11px] shrink-0">
                  {isAr ? `أيام دوام المعلم: ${selectedTeacher.workingDaysAr.join(' • ')}` : `Working Days: ${selectedTeacher.workingDaysAr.map(weekdayLabel).join(', ')}`}
                </span>
              )}
            </div>

            {/* Days Toggle */}
            <div className="space-y-2 text-xs font-bold">
              <label className="block text-slate-700">
                {isAr ? '1. اختر أيام الحصص في الأسبوع:' : '1. Select Days:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                  const isSelected = selectedDays.includes(day);
                  const isWorkingDay = !selectedTeacher.workingDaysAr || selectedTeacher.workingDaysAr.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!isWorkingDay}
                      onClick={() => isWorkingDay && toggleDay(day)}
                      className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                        !isWorkingDay
                          ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed select-none'
                          : isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs font-black scale-[1.02]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div>{weekdayLabel(day)}</div>
                      {!isWorkingDay && <div className="text-[9px] font-bold text-rose-700 pt-0.5">{isAr ? 'غير متاح' : 'Off'}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PER-DAY CUSTOM TIME PICKERS (30-MIN SLOTS WITH MULTI-SLOT PER DAY SUPPORT) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                {isAr ? `2. حدد وقت الحصة (${selectedPlan.lessonDurationMinutes} دقائق • موعد واحد لكل يوم):` : `2. Choose class times (${selectedPlan.lessonDurationMinutes} min • one time per selected day):`}
              </label>

              <div className="space-y-3">
                {selectedDays.map((day) => {
                  const selectedSlotsForDay = getDaySlotsArray(day);

                  return (
                    <div key={day} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950 flex-wrap gap-2">
                        <span className="flex items-center gap-2">
                          <span>{isAr ? `يوم ${day}:` : day}</span>
                          <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                            {selectedSlotsForDay.length > 1
                              ? (isAr ? `${selectedSlotsForDay.length} حصص في نفس اليوم` : `${selectedSlotsForDay.length} sessions on this day`)
                              : (isAr ? `حصة واحدة (${selectedPlan.lessonDurationMinutes} دقائق)` : `1 session (${selectedPlan.lessonDurationMinutes} min)`)}
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          {selectedSlotsForDay.length === 1 && allowedWeeklySlots > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const unusedSlot = teacherAvailableSlots.find(s => !selectedSlotsForDay.includes(s) && !isSlotBookedOnDay(day, s)) || '14:00';
                                handleToggleDayTime(day, unusedSlot, true);
                              }}
                              className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer"
                            >
                              {isAr ? '+ إضافة حصة ثانية في هذا اليوم' : '+ Add 2nd class on this day'}
                            </button>
                          )}
                          <span className="text-emerald-800 font-mono bg-emerald-100/90 px-2.5 py-0.5 rounded-md font-black">
                            {selectedSlotsForDay.map(s => formatTime12h(s, isAr)).join(' • ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                        {teacherAvailableSlots.map((slot) => {
                          const isBooked = isSlotBookedOnDay(day, slot);
                          const isSelectedSlot = selectedSlotsForDay.includes(slot);

                          if (isBooked) {
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={true}
                                onClick={(e) => e.preventDefault()}
                                className="py-2.5 px-2 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-400 text-xs font-bold text-center opacity-40 cursor-not-allowed line-through select-none"
                                title={isAr ? 'هذا الوقت محجوز مع المعلم' : 'Slot Booked'}
                              >
                                <div>{formatTime12h(slot, isAr)}</div>
                                <span className="text-[9px] block font-extrabold text-rose-700">{isAr ? 'محجوز' : 'Booked'}</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleToggleDayTime(day, slot)}
                              className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelectedSlot
                                  ? 'bg-amber-400 text-emerald-950 border-amber-500 font-black shadow-xs ring-2 ring-amber-300'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div>{formatTime12h(slot, isAr)}</div>
                              <span className={`text-[9px] block font-bold ${isSelectedSlot ? 'text-emerald-950' : 'text-emerald-700'}`}>
                                {isAr ? (isSelectedSlot ? '✓ متاح' : 'متاح') : (isSelectedSlot ? '✓ Selected' : 'Available')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {!isCurrentStepValid(6) && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
                  {isAr
                    ? `💡 يرجى تحديد ${allowedWeeklySlots} أيام أسبوعياً بالكامل واختيار أوقات غير محجوزة.`
                    : `💡 Please select exactly ${allowedWeeklySlots} weekly days.`}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setStepError(null); setStep(5); }}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'السابق' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => goToNextStep(7)}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrentStepValid(6)
                      ? 'emerald-gradient-bg text-white hover:shadow-lg'
                      : 'bg-emerald-800/80 hover:bg-emerald-800 text-white shadow-sm'
                  }`}
                >
                  <span>{isAr ? 'التالي: موعد الجلسة الترحيبية' : 'Next: Welcoming Class'}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: WELCOMING SESSION (STRICT CONSTRAINTS) & FINAL CONFIRM */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 mx-auto shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-emerald-950 pt-2">
                {isAr ? 'تحديد موعد الجلسة الترحيبية الأولى (+1 مجانية)' : 'Schedule Free Welcoming Session'}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr
                  ? 'جلسة للتعارف وتقييم المستوى. تبدأ الحصص النظامية بعد هذه الجلسة وتأكيد الدفع. المواعيد بتوقيت الرياض (UTC+3).'
                  : 'Meet your teacher and assess your level. Regular classes start after orientation and payment approval. Times are Riyadh time (UTC+3).'}
              </p>
            </div>

            {/* FIRST CLASS INDICATION CARD */}
            {firstRegularClassInfo && (
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span className="text-xs font-black text-emerald-950">
                      {isAr ? 'موعد أول حصة نظامية في خطتك الدراسية:' : 'Earliest regular class, subject to payment approval:'}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900 bg-white border border-emerald-300 px-3 py-1 rounded-xl shadow-2xs self-start sm:self-auto">
                    {isAr
                      ? `يوم ${firstRegularClassInfo.dayName} (${firstRegularClassInfo.dateStr}) الساعة ${firstRegularClassInfo.timeSlot}`
                      : `${weekdayLabel(firstRegularClassInfo.dayName)} (${firstRegularClassInfo.dateStr}) @ ${firstRegularClassInfo.timeSlot}`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="text-[11px] text-emerald-800 font-medium">
                    {isAr
                      ? 'شرط النظام: يجب أن تسبق الجلسة الترحيبية موعد هذه الحصة الأولى لتقييم المستوى وضبط الخطة.'
                      : 'Regular classes are scheduled after orientation when payment is approved.'}
                  </span>

                  {isOrientationBeforeFirstClass ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الموعد متوافق (يسبق الحصة الأولى)' : 'Valid (Precedes 1st Class)'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-100 px-2.5 py-0.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'غير متوافق: يجب اختيار موعد يسبق الحصة الأولى' : 'Must be before 1st class'}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Strict Date & Time Picker */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 text-xs font-semibold">
              <TeacherDatePicker
                selectedDate={orientationDate}
                onSelectDate={(date) => { orientationWasPicked.current = true; setOrientationDate(date); }}
                workingDaysAr={selectedTeacher.workingDaysAr}
                isAr={isAr}
              />

              <div className="space-y-1.5">
                <label className="block text-slate-800 font-bold">
                  {isAr ? 'وقت الجلسة الترحيبية:' : 'Orientation Time:'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {teacherAvailableSlots.map((timeStr) => {
                    const isAfterFirstClassSlot = Boolean(firstRegularClassInfo &&
                      `${orientationDate}T${timeStr}` >= `${firstRegularClassInfo.dateStr}T${firstRegularClassInfo.timeSlot.split(',')[0]}`);
                    const isBookedOnOrientationDate = isSlotBookedOnDate(orientationDate, timeStr);
                    const isDisabled = isAfterFirstClassSlot || isBookedOnOrientationDate;
                    const isSelected = orientationTime === timeStr;

                    return (
                      <button
                        key={timeStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => { orientationWasPicked.current = true; setOrientationTime(timeStr); }}
                        className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isDisabled
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                        }`}
                        title={
                          isAfterFirstClassSlot
                            ? (isAr ? 'لا يمكن الحجز في نفس موعد أو بعد أول حصة' : 'Cannot book at/after first class')
                            : isBookedOnOrientationDate
                            ? (isAr ? 'هذا الوقت محجوز مع المعلم في هذا التاريخ' : 'Booked on this date')
                            : undefined
                        }
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isOrientationBeforeFirstClass && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {isAr
                      ? `تنبيه: موعد الجلسة الترحيبية (${orientationDate} الساعة ${orientationTime}) يجب أن يسبق موعد أول حصة (${firstRegularClassInfo?.dayName} ${firstRegularClassInfo?.dateStr} الساعة ${firstRegularClassInfo?.timeSlot}).`
                      : `Warning: Welcoming session must take place strictly before your first scheduled regular class.`}
                  </span>
                </div>
              )}
            </div>

            {/* COMPREHENSIVE ONBOARDING SUMMARY CARD */}
            <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 text-xs space-y-2">
              <h4 className="font-extrabold text-emerald-950 border-b border-emerald-200 pb-2">
                {isAr ? 'ملخص الخطة التعليمية وجدول الحصص:' : 'Summary of Customized Plan:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div><span className="font-bold">{isAr ? 'الطالب:' : 'Student:'}</span> {name}</div>
                <div><span className="font-bold">{isAr ? 'الخطة:' : 'Plan:'}</span> {isAr ? selectedPlan.titleAr : selectedPlan.titleEn} ({isFreePlan ? (isAr ? 'مجانية' : 'Free') : `${selectedPlan.priceMonthlySar} ر.س`})</div>
                <div><span className="font-bold">{isAr ? 'المعلم:' : 'Scholar:'}</span> {isAr ? selectedTeacher.nameAr : selectedTeacher.nameEn}</div>
                <div><span className="font-bold">{isAr ? 'المسار والمقرر:' : 'Goal & Scope:'}</span> {selectedTargetSummaryText}</div>
                <div><span className="font-bold">{isAr ? 'الجلسة الترحيبية:' : 'Orientation:'}</span> {orientationDate} • {orientationTime}</div>
                <div>
                  <span className="font-bold">{isAr ? 'مواعيد الأيام المخصصة:' : 'Daily Timings:'}</span>
                  {' '}
                  {selectedDays.map(d => `${d} (${dayTimeSlots[d]})`).join(' • ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {!isCurrentStepValid(7) && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
                  {isAr
                    ? '💡 يرجى اختيار موعد متاح للجلسة التمهيدية يكون قبل موعد أول حصة نظامية.'
                    : '💡 Please select a valid orientation session time before your first class.'}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setStepError(null); setStep(6); }}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'السابق' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleFinishRegistration}
                  disabled={isSubmitting || availabilityStatus !== 'ready'}
                  aria-busy={isSubmitting}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrentStepValid(7)
                      ? 'gold-gradient-bg text-emerald-950 hover:brightness-110'
                      : 'bg-emerald-800/80 hover:bg-emerald-800 text-white shadow-sm'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isSubmitting ? (isAr ? 'جارٍ إرسال الطلب...' : 'Submitting...') : isFreePlan
                      ? (isAr ? 'تأكيد الحساب المجاني والدخول للوحة التحكم' : 'Activate Free Account & Launch')
                      : (isAr ? 'إرسال طلب الاشتراك للإدارة والدخول' : 'Submit to Admin & Launch')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 text-center text-xs border-t border-slate-100">
          <span className="text-slate-500">{isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}</span>
          <Link href="/login" className="font-bold text-emerald-800 underline">
            {isAr ? 'تسجيل الدخول' : 'Log in'}
          </Link>
        </div>

        {modalReviewsTeacher && (
          <TeacherReviewsModal
            teacher={modalReviewsTeacher}
            isOpen={!!modalReviewsTeacher}
            onClose={() => setModalReviewsTeacher(null)}
          />
        )}
      </div>
    </div>
  );
}
