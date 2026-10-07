import type { Teacher } from '@/types';
import { generateTimeSlots } from '@/utils/timeSlots';

export type AvailabilityRange = { start: string; end: string };

export const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function timeToMinutes(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function getTeacherAvailabilityRanges(teacher: Teacher, day: string): AvailabilityRange[] {
  if (teacher.availabilityByDay) return teacher.availabilityByDay[day] || [];
  if (teacher.availabilityRanges?.length) {
    if (teacher.workingDaysAr?.length && !teacher.workingDaysAr.includes(day)) return [];
    return teacher.availabilityRanges;
  }
  if (teacher.workingDaysAr?.length && !teacher.workingDaysAr.includes(day)) return [];
  return [{ start: teacher.workingHoursStart || '12:00', end: teacher.workingHoursEnd || '18:00' }];
}

export function generateSlotsForRanges(ranges: AvailabilityRange[], durationMinutes = 5, stepMinutes = 5): string[] {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || stepMinutes < 1) return [];
  return Array.from(new Set(ranges.flatMap(range => {
    const start = timeToMinutes(range.start);
    const end = timeToMinutes(range.end);
    if (start === null || end === null || start >= end || end - start < durationMinutes) return [];
    const latestStart = end - durationMinutes;
    const exclusiveEnd = latestStart + 1;
    return generateTimeSlots(range.start, `${String(Math.floor(exclusiveEnd / 60)).padStart(2, '0')}:${String(exclusiveEnd % 60).padStart(2, '0')}`, stepMinutes);
  }))).sort();
}

export function getTeacherAvailableSlots(teacher: Teacher, day: string, durationMinutes = 5): string[] {
  // Working ranges are authoritative. Legacy sample starts do not represent occupied five-minute units.
  return generateSlotsForRanges(getTeacherAvailabilityRanges(teacher, day), durationMinutes);
}

export function lessonTimeRange(time: string, durationMinutes: number) {
  const start = timeToMinutes(time);
  return start === null ? null : { start, end: start + durationMinutes };
}

export function timeRangesOverlap(left: { start: number; end: number }, right: { start: number; end: number }) {
  return left.start < right.end && right.start < left.end;
}

export function lessonTimesOverlap(leftTime: string, leftDuration: number, rightTime: string, rightDuration: number) {
  const left = lessonTimeRange(leftTime, leftDuration);
  const right = lessonTimeRange(rightTime, rightDuration);
  return Boolean(left && right && timeRangesOverlap(left, right));
}

export function lessonFitsAvailability(time: string, durationMinutes: number, ranges: AvailabilityRange[]) {
  const lesson = lessonTimeRange(time, durationMinutes);
  if (!lesson) return false;
  return ranges.some(range => {
    const start = timeToMinutes(range.start);
    const end = timeToMinutes(range.end);
    return start !== null && end !== null && lesson.start >= start && lesson.end <= end;
  });
}
