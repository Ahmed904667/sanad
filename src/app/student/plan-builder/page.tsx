'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AvatarBadge } from '@/components/AvatarBadge';
import { TeacherReviewsModal } from '@/components/TeacherReviewsModal';
import { SubscriptionPlan, Teacher, Lesson, LearningGoalTrack, StudentQuranGoal, Review } from '@/types';
import { SUBSCRIPTION_GOALS } from '@/data/mockData';
import { 
  QURAN_SURAHS, 
  QURAN_JUZ_LIST, 
  getPageForSurahAyah, 
  getExactSurahsAndAyahsForPages,
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
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Video, 
  Star,
  Award,
  CreditCard,
  Building2,
  FileText,
  Upload,
  Layers,
  Target,
  Check,
  Baby,
  BookmarkCheck,
  Search,
  Calculator,
  Sliders,
  ListOrdered,
  BookMarked,
  AlertTriangle,
  GraduationCap,
  Save,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

export default function PlanBuilderPage() {
  const router = useRouter();
  const { 
    language, 
    student, 
    currentUser, 
    plans, 
    teachers, 
    lessons, 
    reviews,
    userAccounts,
    updateStudentQuranGoal, 
    updateUpcomingPlanLessons 
  } = useApp();
  const isAr = language === 'ar';

  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const currentStudentId = currentUser?.id || student.id;
  const studentLessons = lessons.filter(l => l.studentId === currentStudentId);
  const activePlan = plans.find(p => p.id === (student.activePlanId || student.pendingPlanId)) || plans[1];
  
  const baseLessons = activePlan.lessonsPerMonth || 4;
  const extraLessons = student.extraPurchasedClassesCount || student.extraClassCredits || 0;
  const totalLessonsInPlan = baseLessons + extraLessons;

  // Initial Goal Data from Student Profile (Pre-selected)
  const initialTrack: LearningGoalTrack = student.quranGoal?.track || 'HIFZ_NEW';
  const initialTargetMode: 'SURAH' | 'JUZ' = student.quranGoal?.hifzFahrasType || 'SURAH';
  const initialSurahNumbers: number[] = (student.quranGoal?.hifzSurahNumbers && student.quranGoal.hifzSurahNumbers.length > 0)
    ? student.quranGoal.hifzSurahNumbers
    : [2];
  const initialJuzNumbers: number[] = (student.quranGoal?.hifzSurahNumbers && student.quranGoal.hifzFahrasType === 'JUZ')
    ? student.quranGoal.hifzSurahNumbers
    : [30];

  // 1. TRACK STATE
  const [track, setTrack] = useState<LearningGoalTrack>(initialTrack);

  // 2. CONTENT SELECTION (SURAHS & AJZAA)
  const [targetMode, setTargetMode] = useState<'SURAH' | 'JUZ'>(initialTargetMode);
  const [selectedSurahNumbers, setSelectedSurahNumbers] = useState<number[]>(initialSurahNumbers);
  const [selectedJuzNumbers, setSelectedJuzNumbers] = useState<number[]>(initialJuzNumbers);

  // Per-Surah customizable Ayah ranges: surahNumber -> { startAyah, endAyah }
  const [surahAyahCustomMap, setSurahAyahCustomMap] = useState<Record<number, { startAyah: number; endAyah: number }>>(() => {
    if (student.quranGoal?.surahAyahCustomMap && Object.keys(student.quranGoal.surahAyahCustomMap).length > 0) {
      return { ...student.quranGoal.surahAyahCustomMap };
    }
    const map: Record<number, { startAyah: number; endAyah: number }> = {};
    initialSurahNumbers.forEach(num => {
      const sObj = QURAN_SURAHS.find(s => s.number === num);
      if (sObj) {
        map[num] = { startAyah: 1, endAyah: sObj.totalVerses };
      }
    });
    return map;
  });

  const [isAyahCustomizerOpen, setIsAyahCustomizerOpen] = useState<boolean>(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');

  // 3. TEACHER SELECTION
  const studentGender = student.gender || 'MALE';
  const filteredTeachers = teachers.filter(t => t.gender === studentGender);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    const saved = student.quranGoal?.assignedTeacherId || student.assignedTeacherId;
    if (saved && teachers.some(t => t.id === saved)) return saved;
    return filteredTeachers[0]?.id || teachers[0]?.id;
  });
  const [modalReviewsTeacher, setModalReviewsTeacher] = useState<Teacher | null>(null);
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  // 4. TIMETABLE & PER-DAY CUSTOM TIMES
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (student.quranGoal?.agreedWeeklyDaysAr && student.quranGoal.agreedWeeklyDaysAr.length > 0) {
      return student.quranGoal.agreedWeeklyDaysAr;
    }
    return totalLessonsInPlan === 4 ? ['الإثنين'] : totalLessonsInPlan === 8 ? ['الإثنين', 'الأربعاء'] : ['الأحد', 'الثلاثاء', 'الخميس'];
  });

  const [dayTimeSlots, setDayTimeSlots] = useState<Record<string, string>>(() => {
    if (student.quranGoal?.dayTimeSlots && Object.keys(student.quranGoal.dayTimeSlots).length > 0) {
      return student.quranGoal.dayTimeSlots;
    }
    return {
      'الأحد': '12:00',
      'الإثنين': '12:00',
      'الثلاثاء': '14:00',
      'الأربعاء': '14:00',
      'الخميس': '16:00',
      'الجمعة': '16:00',
      'السبت': '18:00'
    };
  });

  const daysWeekMap: Record<string, number> = useMemo(() => ({
    'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
  }), []);

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

  // Selection handlers
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
    const juzSurahs = QURAN_SURAHS.filter(s => s.juzNumber === juzNum);
    const juzSurahNums = juzSurahs.map(s => s.number);
    const allPresent = juzSurahNums.every(n => selectedSurahNumbers.includes(n));

    if (allPresent) {
      const remaining = selectedSurahNumbers.filter(n => !juzSurahNums.includes(n));
      if (remaining.length > 0) {
        setSelectedSurahNumbers(remaining);
      }
    } else {
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
      const surahs = QURAN_SURAHS.filter(s => s.juzNumber === j.number);
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

  const multiSurahsPagesList = useMemo(() => {
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
  }, [selectedSurahsList, surahAyahCustomMap]);

  const multiSurahsStartPage = multiSurahsPagesList[0] || 1;
  const multiSurahsEndPage = multiSurahsPagesList[multiSurahsPagesList.length - 1] || 604;
  const multiSurahsTotalPages = multiSurahsPagesList.length;

  // Multi-Juz Totals
  const multiJuzStartPage = selectedJuzList.length > 0 ? Math.min(...selectedJuzList.map(j => j.startPage)) : 1;
  const multiJuzEndPage = selectedJuzList.length > 0 ? Math.max(...selectedJuzList.map(j => j.endPage)) : 604;
  const multiJuzTotalPages = selectedJuzList.reduce((acc, j) => acc + j.totalPages, 0);

  // Target Minimum Pages Requirement
  const currentSelectedPagesCount = targetMode === 'SURAH' ? multiSurahsTotalPages : multiJuzTotalPages;
  const minRequiredPages = Math.max(1, Math.ceil(totalLessonsInPlan * 0.5));
  const isTargetValid = currentSelectedPagesCount >= minRequiredPages;

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

  const completedLessons = useMemo(() => {
    return studentLessons.filter(l => !l.isOrientationSession && l.status === 'COMPLETED');
  }, [studentLessons]);

  const completedCount = completedLessons.length;
  const remainingCount = Math.max(0, totalLessonsInPlan - completedCount);

  // Auto-calculated Class Partition Breakdown (Preserves and Locks Completed Classes)
  const autoCalculatedClasses = useMemo(() => {
    // 1. Map completed lessons to locked cards (stay fixed to original targets)
    const completedItems = completedLessons.map((compLesson, idx) => {
      const isExtra = idx + 1 > baseLessons;
      const cleanTarget = compLesson.surahTargetAr?.replace(/^مقرر\s*/, '') || (isAr ? 'مقرر الحصة المكتملة' : 'Completed Lesson');
      const targetParts = cleanTarget.split('•');
      const summaryText = targetParts[0]?.trim() || cleanTarget;
      const pageText = targetParts[1]?.trim() || (isAr ? `الحصة ${idx + 1}` : `Class ${idx + 1}`);

      return {
        classNum: idx + 1,
        title: isAr ? `الحصة ${idx + 1} من ${totalLessonsInPlan}` : `Class ${idx + 1} of ${totalLessonsInPlan}`,
        summaryAr: summaryText,
        pageRangeText: pageText,
        pagesCountText: isAr ? 'تم الإنجاز والحفظ بنجاح' : 'Completed',
        ayahCount: 15,
        isCompleted: true,
        isExtra
      };
    });

    // 2. Partition new target across ONLY remaining upcoming lessons
    if (remainingCount === 0) {
      return completedItems;
    }

    let remainingPartitions: any[] = [];
    if (targetMode === 'SURAH') {
      remainingPartitions = partitionSurahsAcrossClasses(
        selectedSurahsList.map(s => {
          const r = getSurahRange(s.number);
          return { number: s.number, startAyah: r.startAyah, endAyah: r.endAyah };
        }),
        remainingCount
      );
    } else {
      remainingPartitions = partitionJuzAcrossClasses(
        selectedJuzList.map(j => j.number),
        remainingCount
      );
    }

    const formattedRemaining = remainingPartitions.map((part, pIdx) => {
      const classNumber = completedCount + pIdx + 1;
      const isExtra = classNumber > baseLessons;
      return {
        ...part,
        classNum: classNumber,
        title: isAr ? `الحصة ${classNumber} من ${totalLessonsInPlan}` : `Class ${classNumber} of ${totalLessonsInPlan}`,
        isCompleted: false,
        isExtra
      };
    });

    return [...completedItems, ...formattedRemaining];
  }, [completedLessons, completedCount, remainingCount, targetMode, selectedSurahsList, surahAyahCustomMap, selectedJuzList, totalLessonsInPlan, baseLessons, isAr]);

  // Auto smooth scroll to schedule section if #schedule-section anchor is present
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#schedule-section' || window.location.href.includes('#schedule-section'))) {
      setTimeout(() => {
        const el = document.getElementById('schedule-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  }, []);

  // Timetable helpers
  const teacherAvailableSlots = useMemo(() => {
    if (selectedTeacher.availableSlots && selectedTeacher.availableSlots.length > 0) {
      return selectedTeacher.availableSlots;
    }
    const s = parseInt((selectedTeacher.workingHoursStart || '12:00').split(':')[0], 10);
    const e = parseInt((selectedTeacher.workingHoursEnd || '18:00').split(':')[0], 10);
    const slots: string[] = [];
    for (let h = s; h < e; h++) {
      const pad = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${pad}:00`);
      slots.push(`${pad}:30`);
    }
    return slots.length > 0 ? slots : ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
  }, [selectedTeacher]);

  // Helper to check if a slot is booked for a specific day of the week (including pending registrations)
  const isSlotBookedOnDay = useMemo(() => {
    return (day: string, slot: string): boolean => {
      // 1. Check teacher static profile locks
      if (selectedTeacher.bookedTimeSlots) {
        if (selectedTeacher.bookedTimeSlots.includes(slot) || selectedTeacher.bookedTimeSlots.includes(`${day}_${slot}`)) {
          return true;
        }
      }

      // 2. Check scheduled lessons in system
      const isBookedInLessons = lessons.some(l => {
        if (l.teacherId !== selectedTeacher.id || l.status !== 'SCHEDULED') return false;
        const lessonTime = l.time.includes('@') ? l.time.split('@')[1]?.trim() : l.time.trim();
        if (lessonTime !== slot) return false;
        const lessonDay = getDayNameArFromDate(l.date);
        return lessonDay === day;
      });
      if (isBookedInLessons) return true;

      // 3. Check pending student registrations for this teacher
      return userAccounts.some(acc => {
        if (acc.role !== 'STUDENT' || !acc.studentProfile || acc.studentProfile.id === currentStudentId) return false;
        const prof = acc.studentProfile;
        if (prof.assignedTeacherId !== selectedTeacher.id) return false;
        if (prof.verificationStatus !== 'PENDING_VERIFICATION' && !prof.pendingPlanId) return false;

        const dayMap = prof.quranGoal?.dayTimeSlots || {};
        if (dayMap[day] === slot) return true;
        if (prof.quranGoal?.agreedWeeklyDaysAr?.includes(day) && prof.quranGoal?.agreedTimeSlot === slot) return true;

        return false;
      });
    };
  }, [selectedTeacher, lessons, userAccounts, currentStudentId]);

  // Helper to find a safe non-booked time slot for a teacher on a given day
  const getSafeTimeSlot = (day: string, preferredTime?: string) => {
    const validSlots = teacherAvailableSlots.filter(s => !isSlotBookedOnDay(day, s));
    if (preferredTime && validSlots.includes(preferredTime)) {
      return preferredTime;
    }
    return validSlots[0] || teacherAvailableSlots[0] || '14:00';
  };

  const allowedWeeklySlots = useMemo(() => {
    const monthlyCount = activePlan?.lessonsPerMonth || 8;
    return Math.max(1, Math.round(monthlyCount / 4));
  }, [activePlan]);

  // FIFO Queue tracking selected slot items: [{ day: string, time: string }]
  const [selectedSlotsQueue, setSelectedSlotsQueue] = useState<{ day: string; time: string }[]>(() => {
    const validSlots = (selectedTeacher.availableSlots && selectedTeacher.availableSlots.length > 0)
      ? selectedTeacher.availableSlots
      : ['14:00', '16:00', '18:00'];
    const defaultTime = validSlots.find(s => !isSlotBookedOnDay('الإثنين', s)) || validSlots[0] || '14:00';
    return [{ day: selectedDays[0] || 'الإثنين', time: defaultTime }];
  });

  // Auto-sanitize selected days AND time slots when teacher or plan (allowedWeeklySlots) changes
  useEffect(() => {
    if (!selectedTeacher) return;
    const workingDays = (selectedTeacher.workingDaysAr && selectedTeacher.workingDaysAr.length > 0)
      ? selectedTeacher.workingDaysAr
      : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const validSlots = teacherAvailableSlots.filter(s => !isSlotBookedOnDay('الإثنين', s));
    const fallbackSlot = validSlots[0] || teacherAvailableSlots[0] || '14:00';

    setSelectedSlotsQueue(prevQueue => {
      // 1. Keep only items on teacher's working days, with valid non-booked slots
      let updatedQueue = prevQueue
        .filter(item => workingDays.includes(item.day))
        .map(item => ({
          day: item.day,
          time: getSafeTimeSlot(item.day, item.time)
        }));

      // 2. Adjust queue length to match allowedWeeklySlots
      if (updatedQueue.length > allowedWeeklySlots) {
        updatedQueue = updatedQueue.slice(0, allowedWeeklySlots);
      } else if (updatedQueue.length < allowedWeeklySlots) {
        for (const day of workingDays) {
          if (updatedQueue.length >= allowedWeeklySlots) break;
          const daySlot = getSafeTimeSlot(day);
          const alreadyHasThisSlot = updatedQueue.some(i => i.day === day && i.time === daySlot);
          if (!alreadyHasThisSlot) {
            updatedQueue.push({ day, time: daySlot });
          }
        }
      }

      if (updatedQueue.length === 0) {
        const firstWorkingDay = workingDays[0] || 'الإثنين';
        updatedQueue = [{ day: firstWorkingDay, time: fallbackSlot }];
      }

      // 3. Sync selectedDays array
      const WEEKDAYS_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const uniqueDays = Array.from(new Set(updatedQueue.map(i => i.day)));
      const sortedDays = WEEKDAYS_ORDER.filter(d => uniqueDays.includes(d));
      setSelectedDays(sortedDays.length > 0 ? sortedDays : [workingDays[0] || 'الإثنين']);

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

      return updatedQueue;
    });
  }, [selectedTeacherId, selectedTeacher, teacherAvailableSlots, isSlotBookedOnDay, allowedWeeklySlots]);

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

  // SAVE & REGENERATE UPCOMING LESSONS
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTargetValid) return;

    const matchingGoal = SUBSCRIPTION_GOALS.find(g => g.id === track);
    const goalTitle = isAr ? (matchingGoal?.titleAr || 'مسار القرآن') : (matchingGoal?.titleEn || 'Quran Track');

    const qGoal: StudentQuranGoal = {
      track,
      targetSurahOrJuzAr: `${goalTitle}: ${selectedTargetSummaryText}`,
      targetSurahOrJuzEn: `${goalTitle}: ${selectedTargetSummaryText}`,
      orientationCompleted: true,
      agreedWeeklyDaysAr: selectedDays,
      agreedWeeklyDaysEn: selectedDays,
      agreedTimeSlot: dayTimeSlots[selectedDays[0]] || '12:00',
      dayTimeSlots,
      assignedTeacherId: selectedTeacher.id,
      hifzSurahNumbers: targetMode === 'SURAH' ? selectedSurahNumbers : selectedJuzNumbers,
      surahAyahCustomMap,
      tilawahSurahNumbers: [36],
      hifzFahrasType: targetMode,
      tilawahFahrasType: 'SURAH',
      isHybridTrack: track === 'COMBINED'
    };

    updateStudentQuranGoal(qGoal);

    // Calculate already completed classes to preserve them completely
    const completedLessons = studentLessons.filter(l => l.status === 'COMPLETED');
    const completedCount = completedLessons.length;
    const remainingClassesToSchedule = Math.max(0, totalLessonsInPlan - completedCount);

    // Generate only remaining upcoming scheduled classes
    const newUpcomingLessons: Lesson[] = [];
    let generatedCount = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + 1);
    let dayOffset = 0;

    while (generatedCount < remainingClassesToSchedule && dayOffset < 120) {
      const classDate = new Date(checkDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = classDate.getDay();

      const matchedDayName = Object.keys(daysWeekMap).find(key => daysWeekMap[key] === dayOfWeek);
      if (matchedDayName && selectedDays.includes(matchedDayName)) {
        const dateStr = classDate.toISOString().split('T')[0];
        const exactDayTime = dayTimeSlots[matchedDayName] || '12:00';
        const targetIndex = completedCount + generatedCount;
        const classTarget = autoCalculatedClasses[targetIndex] || autoCalculatedClasses[autoCalculatedClasses.length - 1] || autoCalculatedClasses[0];

        newUpcomingLessons.push({
          id: `les-upd-${targetIndex + 1}-${Date.now()}`,
          studentId: currentStudentId,
          teacherId: selectedTeacher.id,
          teacherNameAr: selectedTeacher.nameAr,
          teacherNameEn: selectedTeacher.nameEn,
          studentNameAr: student.nameAr,
          studentNameEn: student.nameEn,
          date: dateStr,
          time: exactDayTime,
          durationMinutes: 30,
          status: 'SCHEDULED',
          googleMeetUrl: '',
          surahTargetAr: `مقرر ${classTarget.summaryAr} • ${classTarget.pageRangeText}`,
          notes: `حصة مدارسة (${matchedDayName} الساعة ${exactDayTime})`
        });
        generatedCount++;
      }
      dayOffset++;
    }

    updateUpcomingPlanLessons(newUpcomingLessons, currentStudentId);
    setIsSavedSuccessfully(true);

    setTimeout(() => {
      router.push('/student/dashboard');
    }, 1200);
  };

  // 5. WIZARD STEP NAVIGATION STATE
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-4xl mx-auto space-y-6 pb-44 md:pb-32">
        
        {/* HEADER HERO */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-700/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 shadow-md shrink-0">
              <BookOpen className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                  {isAr ? 'فهرس وتصميم الخطة' : 'Quran Plan Builder'}
                </span>
                <span className="text-emerald-200 text-xs font-bold">
                  {activePlan.titleAr} ({totalLessonsInPlan} {isAr ? 'حصص' : 'classes'})
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black mt-0.5">
                {isAr ? 'تخصيص الخطة القرآنية والمواعيد' : 'Customize Quran Plan & Schedule'}
              </h1>
            </div>
          </div>

          <Link
            href="/student/dashboard"
            className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 border border-white/20 shrink-0 self-end sm:self-auto"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
          </Link>
        </div>

        {/* 3-STEP WIZARD STEP NAVIGATION BAR */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-sm grid grid-cols-3 gap-2 text-center text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeStep === 1
                ? 'bg-emerald-950 text-amber-400 shadow-sm ring-1 ring-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
              activeStep === 1 ? 'bg-amber-400 text-emerald-950' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </span>
            <span>{isAr ? 'الهدف والسور' : '1. Goal & Surahs'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeStep === 2
                ? 'bg-emerald-950 text-amber-400 shadow-sm ring-1 ring-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
              activeStep === 2 ? 'bg-amber-400 text-emerald-950' : 'bg-slate-200 text-slate-700'
            }`}>
              2
            </span>
            <span>{isAr ? 'المعلم والمواعيد' : '2. Scholar & Schedule'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeStep === 3
                ? 'bg-emerald-950 text-amber-400 shadow-sm ring-1 ring-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
              activeStep === 3 ? 'bg-amber-400 text-emerald-950' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
            <span>{isAr ? 'توزيع الحصص' : '3. Class Breakdown'}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: GOAL & CONTENT SELECTION (SURAHS & AJZAA) */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            {/* GOAL / TRACK SELECTION */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-950">
                      {isAr ? 'اختيار المسار والهدف القرآني' : 'Quran Track & Goal Selection'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'حدد نوع المسار والهدف التعليمي الأنسب لك' : 'Select your Quran learning track'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {isAr ? 'مسار الخطة' : 'Track'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUBSCRIPTION_GOALS.map((g) => {
                  const isSelected = track === g.id;
                  const isInitialSaved = initialTrack === g.id;

                  return (
                    <div
                      key={g.id}
                      onClick={() => setTrack(g.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-400'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {isAr ? g.badgeAr : g.badgeEn}
                            </span>
                            {isInitialSaved && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                                {isAr ? 'الخيار الحالي' : 'Current'}
                              </span>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />}
                        </div>

                        <h3 className="font-black text-xs sm:text-sm text-emerald-950">
                          {isAr ? g.titleAr : g.titleEn}
                        </h3>
                        <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                          {isAr ? g.targetAudienceAr : g.targetAudienceEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CONTENT SELECTION (SURAHS & AJZAA) */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-950">
                      {isAr ? 'تحديد السور والمقرر' : 'Quran Content Selection'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'حدد السور أو الأجزاء المقررة لخطتك' : 'Select Suwar or Ajzaa'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {currentSelectedPagesCount} {isAr ? 'صفحة محددة' : 'pages'}
                </span>
              </div>

              {/* MINIMUM TARGET REQUIREMENT STATUS */}
              <div className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isTargetValid
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isTargetValid ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'
                  }`}>
                    {isTargetValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="text-xs font-extrabold">
                    {isAr 
                      ? (isTargetValid ? 'المقرر مستوفٍ للحد الأدنى المطلوب' : `المقرر يحتاج استكمال الحد الأدنى (${currentSelectedPagesCount} من ${minRequiredPages} صفحات)`)
                      : (isTargetValid ? 'Target meets plan requirement' : `Minimum target not met (${currentSelectedPagesCount}/${minRequiredPages} pages)`)}
                  </div>
                </div>

                <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border shrink-0 self-start sm:self-auto ${
                  isTargetValid 
                    ? 'bg-emerald-600 text-white border-emerald-700' 
                    : 'bg-amber-600 text-white border-amber-700'
                }`}>
                  {currentSelectedPagesCount} {isAr ? 'صفحة' : 'pages'} (Min: {minRequiredPages})
                </span>
              </div>

              {/* TARGET SELECTION MODE SWITCHER */}
              <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('SURAH')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    targetMode === 'SURAH'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحديد حسب السور والآيات' : 'By Surah & Ayahs'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('JUZ')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    targetMode === 'JUZ'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحديد حسب الأجزاء' : 'By Juz'}</span>
                </button>
              </div>

              {/* IF SURAH MODE */}
              {targetMode === 'SURAH' && (
                <div className="space-y-4">
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
                          {isAr ? 'قصار السور' : 'Short Surahs'}
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => selectAllSurahsInJuz(30)}
                          className="text-[10px] font-bold text-emerald-800 hover:underline cursor-pointer"
                        >
                          {isAr ? 'سور جزء عمّ' : 'Juz 30'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                      {selectedSurahsList.map((surah) => {
                        const range = getSurahRange(surah.number);
                        return (
                          <div
                            key={surah.number}
                            className="inline-flex items-center gap-1.5 bg-emerald-800 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs"
                          >
                            <span>{surah.number}. {surah.nameAr} {!range.isFullSurah && `(${range.startAyah}-${range.endAyah})`}</span>
                            {selectedSurahsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => toggleSurahSelection(surah.number)}
                                className="w-3.5 h-3.5 rounded-full bg-emerald-900/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AYAH RANGE CUSTOMIZER SECTION */}
                  {!isAyahCustomizerOpen ? (
                    <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs text-emerald-950 font-bold">
                          {isAr 
                            ? `تخصيص الآيات: يمكنك تحديد بداية ونهاية الآيات لكل سورة (${multiSurahsTotalPages} صفحة • ${multiSurahsTotalVerses} آية)`
                            : `Customize verses: set start and end ayah for each surah (${multiSurahsTotalPages} pages).`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAyahCustomizerOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-white border border-emerald-600/40 hover:bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isAr ? 'تخصيص نطاق الآيات للسور ⚡' : 'Customize Ayah Ranges ⚡'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-xs font-black text-emerald-950">
                            {isAr ? 'تخصيص نطاق الآيات (بداية ونهاية الآية لكل سورة):' : 'Customize Ayah Ranges (Start & End Ayah):'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={resetAllSurahsToFull}
                            className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            {isAr ? 'إعادة كاملة' : 'Reset Full'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAyahCustomizerOpen(false)}
                            className="text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-200 cursor-pointer"
                          >
                            {isAr ? 'تم الإغلاق ✓' : 'Done ✓'}
                          </button>
                        </div>
                      </div>

                      {/* List of Range Editors for each selected Surah */}
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
                        {selectedSurahsList.map((surah) => {
                          const range = getSurahRange(surah.number);
                          const pStart = getPageForSurahAyah(surah.number, range.startAyah);
                          const pEnd = getPageForSurahAyah(surah.number, range.endAyah);
                          const pCount = Math.max(1, pEnd - pStart + 1);

                          return (
                            <div
                              key={surah.number}
                              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black flex items-center justify-center">
                                    {surah.number}
                                  </span>
                                  <span className="text-xs font-black text-slate-900">
                                    سورة {surah.nameAr}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    (إجمالي الآيات: {surah.totalVerses})
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
                                    {isAr ? 'السورة كاملة' : 'Full Surah'}
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
                                    {isAr ? 'من آية:' : 'From Ayah:'}
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={range.endAyah}
                                    value={range.startAyah}
                                    onChange={(e) => setSurahRange(surah.number, parseInt(e.target.value) || 1, range.endAyah)}
                                    className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-black text-center bg-slate-50 focus:bg-white"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                    {isAr ? 'إلى آية:' : 'To Ayah:'}
                                  </span>
                                  <input
                                    type="number"
                                    min={range.startAyah}
                                    max={surah.totalVerses}
                                    value={range.endAyah}
                                    onChange={(e) => setSurahRange(surah.number, range.startAyah, parseInt(e.target.value) || surah.totalVerses)}
                                    className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-black text-center bg-slate-50 focus:bg-white"
                                  />
                                </div>
                                <div className="col-span-2 sm:col-span-1 bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-bold px-2 py-1 rounded-lg text-center truncate">
                                  {range.totalVerses} آية (ص {pStart}-{pEnd} • {pCount} ص)
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={surahSearchQuery}
                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                      placeholder={isAr ? 'ابحث عن سورة بالاسم أو الرقم...' : 'Search surahs...'}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>

                  {/* Horizontal Scrollable Juz Jump Strip */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">{isAr ? 'انتقال:' : 'Jump:'}</span>
                    {QURAN_JUZ_LIST.map((j) => (
                      <button
                        key={j.number}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`plan-juz-fahras-${j.number}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className="py-1 px-2.5 rounded-lg text-[10px] font-black bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700 border border-slate-200 transition-all shrink-0 cursor-pointer"
                      >
                        {j.number}
                      </button>
                    ))}
                  </div>

                  {/* Continuous Scrollable 30-Juz Index */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2.5 bg-slate-50/40">
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
                          id={`plan-juz-fahras-${group.juzNumber}`}
                          className="bg-white rounded-2xl border border-slate-200 p-2.5 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                                الجزء {group.juzNumber}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {group.juzMeta.famousNameAr}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => selectAllSurahsInJuz(group.juzNumber)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                allJuzSurahsSelected
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {allJuzSurahsSelected 
                                ? (isAr ? '✓ محدد' : '✓ Selected')
                                : (isAr ? `+ تحديد الكل (${group.surahs.length})` : `+ All (${group.surahs.length})`)}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                            {matchingSurahs.map((s) => {
                              const isChecked = selectedSurahNumbers.includes(s.number);

                              return (
                                <button
                                  key={s.number}
                                  type="button"
                                  onClick={() => toggleSurahSelection(s.number)}
                                  className={`p-2 rounded-xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black ring-1 ring-emerald-500 shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                                    <span>{s.totalVerses} آية</span>
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
              )}

              {/* IF JUZ MODE */}
              {targetMode === 'JUZ' && (
                <div className="space-y-4">
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
                  </div>

                  {/* 30 Juz Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/30">
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

              {/* Wizard Step 1 Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? 'المتابعة: اختيار المعلم والمواعيد ↗' : 'Next: Scholar & Schedule ↗'}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: TEACHER & TIMETABLE SELECTION */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            {/* TEACHER SELECTION */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-950">
                      {isAr ? 'اختر المعلم المجاز بالسند' : 'Select Certified Scholar'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'معلمون مجازون بالسند المتصل ومصنفون حسب التخصص' : 'Certified scholars list'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {selectedTeacher.nameAr}
                </span>
              </div>

              <div className="space-y-3">
                {filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacherId === teacher.id;
                  const slots = teacher.availableSlots || ['12:00', '14:00', '16:00', '18:00'];
                  const booked = teacher.bookedTimeSlots || [];

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-400'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AvatarBadge nameAr={teacher.nameAr} nameEn={teacher.nameEn} size="md" />
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-slate-900">
                                {isAr ? teacher.nameAr : teacher.nameEn}
                              </h3>
                              <span className="bg-amber-100 text-amber-950 font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{teacher.rating.toFixed(1)}</span>
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] font-medium">{isAr ? teacher.titleAr : teacher.titleEn}</p>
                          </div>
                        </div>

                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 ${
                          isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isSelected ? (isAr ? '✓ مختار' : 'Selected') : (isAr ? 'اختيار' : 'Select')}
                        </span>
                      </div>

                      {/* Teacher Available Working Hours & Slots */}
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between pb-1 text-slate-600 font-bold text-[11px]">
                          <span>{isAr ? `ساعات العمل: ${teacher.workingHoursStart || '12:00'} - ${teacher.workingHoursEnd || '18:00'}` : `Hours: ${teacher.workingHoursStart} - ${teacher.workingHoursEnd}`}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {slots.map((slot) => {
                            const isBooked = booked.includes(slot);
                            return (
                              <span
                                key={slot}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
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
            </section>

            {/* TIMETABLE & CUSTOM TIMES FOR EVERY DAY */}
            <section id="schedule-section" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-950">
                      {isAr ? 'تحديد أيام الحصص والأوقات الأسبوعية' : 'Weekly Timetable'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? `حدد أيام وساعات الدراسة مع المعلم (${activePlan.lessonsPerMonth} حصص شهرياً)` : 'Set class days & timings'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-950 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {totalSelectedSlotsCount} / {allowedWeeklySlots} {isAr ? 'حصص أسبوعياً' : 'weekly'}
                </span>
              </div>

              {/* Days Toggle */}
              <div className="space-y-2 text-xs font-bold">
                <label className="block text-slate-700">
                  {isAr ? '1. اختر أيام الحصص في الأسبوع:' : '1. Select Days:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                    const isSelected = selectedDays.includes(day);
                    const isWorkingDay = !selectedTeacher.workingDaysAr || selectedTeacher.workingDaysAr.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!isWorkingDay}
                        onClick={() => isWorkingDay && toggleDay(day)}
                        className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                          !isWorkingDay
                            ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed select-none'
                            : isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs font-black cursor-pointer'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div>{day}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PER-DAY CUSTOM TIME PICKERS */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? '2. اختر الوقت المفضل (مدة الحصة 30 دقيقة):' : '2. Assign 30-min Time Slots:'}
                </label>

                <div className="space-y-2.5">
                  {selectedDays.map((day) => {
                    const selectedSlotsForDay = getDaySlotsArray(day);

                    return (
                      <div key={day} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950 flex-wrap gap-1.5">
                          <span>{isAr ? `يوم ${day}:` : day}</span>
                          <span className="text-emerald-800 font-mono bg-emerald-100/90 px-2 py-0.5 rounded-md text-[11px] font-black">
                            {selectedSlotsForDay.join(' • ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {teacherAvailableSlots.map((slot) => {
                            const isBooked = isSlotBookedOnDay(day, slot);
                            const isSelectedSlot = selectedSlotsForDay.includes(slot);

                            if (isBooked) {
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={true}
                                  className="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-[11px] font-bold text-center opacity-40 cursor-not-allowed line-through select-none"
                                >
                                  <div>{slot}</div>
                                </button>
                              );
                            }

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => handleToggleDayTime(day, slot)}
                                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                                  isSelectedSlot
                                    ? 'bg-amber-400 text-emerald-950 border-amber-500 font-black shadow-xs ring-1 ring-amber-300'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <div>{slot}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wizard Step 2 Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  {isAr ? '← السابق' : '← Previous'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? 'المتابعة: معاينة التوزيع وتأكيد الخطة ↗' : 'Next: Class Breakdown & Save ↗'}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CLASS BREAKDOWN & SAVE PLAN */}
        {/* ========================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <section className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black text-xs">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-300">
                      {isAr ? 'التوزيع والتصميم التلقائي لخطة الحصص' : 'Calculated Class Plan Breakdown'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isAr 
                        ? `مقسم بالتساوي على (${totalLessonsInPlan}) حصص حسب باقتك (${activePlan.titleAr})` 
                        : `Divided across ${totalLessonsInPlan} classes`}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold bg-emerald-900/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50 self-start sm:self-auto">
                  {targetMode === 'SURAH' 
                    ? `${(multiSurahsTotalPages / totalLessonsInPlan).toFixed(1)} صفحة / حصة`
                    : `${(multiJuzTotalPages / totalLessonsInPlan).toFixed(1)} صفحة / حصة`}
                </span>
              </div>

              {/* Class by Class Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {autoCalculatedClasses.map((item) => {
                  const isCompleted = item.isCompleted;
                  const isExtra = item.isExtra;

                  return (
                    <div 
                      key={item.classNum}
                      className={`p-3 rounded-2xl flex items-start gap-2.5 transition-all ${
                        isCompleted
                          ? 'bg-emerald-950/40 border-2 border-emerald-500/80 shadow-xs'
                          : isExtra
                          ? 'bg-slate-800/90 border border-amber-400/60 shadow-xs'
                          : 'bg-slate-800/90 border border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white font-black'
                          : isExtra 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                          : 'bg-emerald-700/60 text-emerald-200'
                      }`}>
                        {isCompleted ? '✓' : item.classNum}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className={`text-xs font-bold ${
                            isCompleted ? 'text-emerald-300 font-black' : isExtra ? 'text-amber-300' : 'text-amber-200'
                          }`}>
                            {item.title}
                          </span>
                          
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-slate-400 bg-slate-900/80">
                            {item.pageRangeText}
                          </span>
                        </div>
                        
                        <p className="text-[11px] font-medium leading-relaxed break-words text-slate-200">
                          {item.summaryAr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 3 Save Action Box */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  {isAr ? '← التعديل: المعلم والمواعيد' : '← Edit Schedule'}
                </button>

                <button
                  type="button"
                  disabled={!isTargetValid || isSavedSuccessfully}
                  onClick={handleSavePlan}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all ${
                    !isTargetValid
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : isSavedSuccessfully
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'gold-gradient-bg text-emerald-950 hover:brightness-110 cursor-pointer'
                  }`}
                >
                  {isSavedSuccessfully ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{isAr ? 'تم حفظ الخطة بنجاح! جاري التحويل...' : 'Plan Saved! Redirecting...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isAr ? 'حفظ الخطة وتحديث جدول الحصص' : 'Save Plan & Update Schedule'}</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* FIXED FLOATING BOTTOM ACTION BAR */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 sm:p-3.5 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="text-white text-xs space-y-0.5 truncate min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md text-[10px] font-black shrink-0">
                  {isAr ? 'ملخص الخطة' : 'Summary'}
                </span>
                <span className="font-bold text-slate-200 text-[11px] truncate">
                  {selectedTargetSummaryText}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAr 
                  ? `المعلم: ${selectedTeacher.nameAr} • ${selectedDays.join('، ')} (${selectedDays.map(d => `${d} ${dayTimeSlots[d] || '12:00'}`).join(' • ')})`
                  : `Teacher: ${selectedTeacher.nameEn} • ${selectedDays.join(', ')}`}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/student/dashboard"
                className="px-5 py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-900 transition-colors shrink-0"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Link>

              <button
                type="button"
                disabled={!isTargetValid || isSavedSuccessfully}
                onClick={handleSavePlan}
                className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all ${
                  !isTargetValid
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : isSavedSuccessfully
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'gold-gradient-bg text-emerald-950 hover:brightness-110 cursor-pointer'
                }`}
              >
                {isSavedSuccessfully ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isAr ? 'تم حفظ الخطة بنجاح! جاري التحويل...' : 'Plan Saved! Redirecting...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isAr ? 'حفظ الخطة وتحديث جدول الحصص' : 'Save Plan & Update Schedule'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TEACHER REVIEWS MODAL */}
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
