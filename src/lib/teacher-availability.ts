import type { AvailabilityRange } from '@/utils/availability';

export function parseTeacherAvailability(value: unknown, day: string): AvailabilityRange[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const teacher = value as Record<string, unknown>;
  const byDay = teacher.availabilityByDay;
  if (byDay && typeof byDay === 'object' && !Array.isArray(byDay)) {
    const ranges = (byDay as Record<string, unknown>)[day];
    return Array.isArray(ranges) ? ranges.filter((range): range is AvailabilityRange =>
      Boolean(range && typeof range === 'object' && 'start' in range && 'end' in range &&
        typeof range.start === 'string' && typeof range.end === 'string')
    ) : [];
  }
  const workingDays = Array.isArray(teacher.workingDaysAr) ? teacher.workingDaysAr : [];
  if (workingDays.length && !workingDays.includes(day)) return [];
  const ranges = teacher.availabilityRanges;
  if (Array.isArray(ranges) && ranges.length) return ranges.filter((range): range is AvailabilityRange =>
    Boolean(range && typeof range === 'object' && 'start' in range && 'end' in range &&
      typeof range.start === 'string' && typeof range.end === 'string')
  );
  const start = typeof teacher.workingHoursStart === 'string' ? teacher.workingHoursStart : '12:00';
  const end = typeof teacher.workingHoursEnd === 'string' ? teacher.workingHoursEnd : '18:00';
  return [{ start, end }];
}
