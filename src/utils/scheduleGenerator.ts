import { Lesson } from '../types';

export function generateConflictFreeSchedule(
  studentId: string,
  teacherId: string,
  teacherNameAr: string,
  teacherNameEn: string,
  studentNameAr: string,
  studentNameEn: string,
  selectedDaysAr: string[],
  selectedTimeSlot: string,
  totalLessons: number,
  lessonDurationMinutes: number
): Lesson[] {
  const dayIndexMap: Record<string, number> = {
    'الأحد': 0,
    'الإثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6
  };

  const targetDayIndices = selectedDaysAr.map(d => dayIndexMap[d]).filter(idx => idx !== undefined);
  const lessons: Lesson[] = [];

  let currentDate = new Date();
  let generatedCount = 0;
  let safetyCounter = 0;

  while (generatedCount < totalLessons && safetyCounter < 120) {
    safetyCounter++;
    currentDate.setDate(currentDate.getDate() + 1);

    const currentDayIdx = currentDate.getDay();
    if (targetDayIndices.includes(currentDayIdx)) {
      generatedCount++;
      const dateStr = currentDate.toISOString().split('T')[0];

      lessons.push({
        id: `les-sub-${Date.now()}-${generatedCount}`,
        studentId,
        teacherId,
        teacherNameAr,
        teacherNameEn,
        studentNameAr,
        studentNameEn,
        date: dateStr,
        time: `${selectedTimeSlot} م`,
        durationMinutes: lessonDurationMinutes,
        status: 'SCHEDULED',
        googleMeetUrl: '',
        isOrientationSession: false,
        surahTargetAr: `الحصة ${generatedCount}: تسميع ومراجعة الخطة المحددة`,
        surahTargetEn: `Class ${generatedCount}: Recitation & plan review`
      });
    }
  }

  return lessons;
}
