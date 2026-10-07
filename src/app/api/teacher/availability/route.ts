import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSlotsForRanges, lessonFitsAvailability, timeRangesOverlap, timeToMinutes, WEEKDAYS_AR } from '@/utils/availability';
import type { AvailabilityRange } from '@/utils/availability';

const VALID_DAYS = new Set(WEEKDAYS_AR);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
type AvailabilityInput = Record<string, AvailabilityRange[]>;

function normalizeAvailability(input: unknown): { byDay: AvailabilityInput; error?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { byDay: {}, error: 'Availability by day is required.' };
  const record = input as Record<string, unknown>;
  const entries = Object.entries(record);
  if (entries.length === 0 || entries.length > 7) return { byDay: {}, error: 'Choose at least one working day.' };

  const byDay: AvailabilityInput = {};
  let totalSlots = 0;
  for (const [day, value] of entries) {
    if (!VALID_DAYS.has(day) || !Array.isArray(value) || value.length === 0 || value.length > 10) {
      return { byDay: {}, error: 'Each selected day needs between one and ten time ranges.' };
    }
    const ranges: AvailabilityRange[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') return { byDay: {}, error: 'Availability range is invalid.' };
      const range = item as Record<string, unknown>;
      if (typeof range.start !== 'string' || typeof range.end !== 'string' ||
        !TIME_PATTERN.test(range.start) || !TIME_PATTERN.test(range.end) ||
        Number(range.start.slice(-2)) % 5 !== 0 || Number(range.end.slice(-2)) % 5 !== 0 ||
        range.start >= range.end) {
        return { byDay: {}, error: 'Use valid five-minute time ranges.' };
      }
      ranges.push({ start: range.start, end: range.end });
    }
    ranges.sort((a, b) => a.start.localeCompare(b.start));
    if (ranges.some((range, index) => index > 0 && ranges[index - 1].end > range.start)) {
      return { byDay: {}, error: 'Time ranges on the same day cannot overlap.' };
    }
    totalSlots += generateSlotsForRanges(ranges, 5).length;
    byDay[day] = ranges;
  }
  if (totalSlots === 0 || totalSlots > 1000) return { byDay: {}, error: 'Availability must contain between one and 1,000 start times.' };
  return { byDay };
}

function lessonDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return year && month && day ? WEEKDAYS_AR[new Date(year, month - 1, day).getDay()] : '';
}

export async function PATCH(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === 'string' ? body.teacherId : actor.id;
    if (actor.role !== 'ADMIN' && (actor.role !== 'TEACHER' || teacherId !== actor.id)) {
      return NextResponse.json({ error: 'You can only change your own availability.' }, { status: 403 });
    }

    let availabilityInput = body.availabilityByDay;
    // Migrate existing clients that still submit one set of ranges for selected days.
    if (!availabilityInput && Array.isArray(body.days) && Array.isArray(body.ranges)) {
      availabilityInput = Object.fromEntries(body.days.map((day: string) => [day, body.ranges]));
    }
    const normalized = normalizeAvailability(availabilityInput);
    if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 400 });
    const availabilityByDay = normalized.byDay;
    const days = Object.keys(availabilityByDay);
    const allRanges = Object.values(availabilityByDay).flat();
    const start = allRanges.map(range => range.start).sort()[0];
    const sortedEnds = allRanges.map(range => range.end).sort();
    const end = sortedEnds[sortedEnds.length - 1];
    const availableSlots = Array.from(new Set(allRanges.flatMap(range => generateSlotsForRanges([range], 5)))).sort();
    const availabilityRanges = Array.from(new Map(allRanges.map(range => [`${range.start}-${range.end}`, range])).values());
    const resolution = body.resolution === 'CANCEL_AND_REFUND_CREDIT' || body.resolution === 'NOTIFY_STUDENTS'
      ? body.resolution
      : 'KEEP_EXISTING';

    const user = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true, appData: true } });
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Teacher account not found.' }, { status: 404 });
    const root = user.appData && typeof user.appData === 'object' && !Array.isArray(user.appData)
      ? user.appData as Record<string, Prisma.JsonValue>
      : {};
    const currentTeacher = root.teacher && typeof root.teacher === 'object' && !Array.isArray(root.teacher)
      ? root.teacher as Record<string, Prisma.JsonValue>
      : {};
    const teacher = {
      ...currentTeacher,
      workingHoursStart: start,
      workingHoursEnd: end,
      availabilityByDay,
      availabilityRanges,
      workingDaysAr: days,
      availableSlots,
    };

    const result = await prisma.$transaction(async transaction => {
      await transaction.user.update({ where: { id: teacherId }, data: { appData: { ...root, teacher } as Prisma.InputJsonValue } });
      await transaction.teacherProfile.updateMany({ where: { userId: teacherId }, data: { workingHoursStart: start, workingHoursEnd: end } });

      const scheduled = await transaction.lesson.findMany({ where: { teacherId, status: 'SCHEDULED' } });
      const conflicts = new Map<string, typeof scheduled[number]>();
      for (const lesson of scheduled) {
        const day = lessonDay(lesson.date);
        const ranges = availabilityByDay[day] || [];
        if (!day || !lessonFitsAvailability(lesson.time, lesson.durationMinutes || 5, ranges)) conflicts.set(lesson.id, lesson);
      }
      const byDate = new Map<string, typeof scheduled>();
      for (const lesson of scheduled) byDate.set(lesson.date, [...(byDate.get(lesson.date) || []), lesson]);
      for (const sameDate of byDate.values()) {
        const sorted = sameDate.map(lesson => ({ lesson, start: timeToMinutes(lesson.time) }))
          .filter((item): item is { lesson: typeof scheduled[number]; start: number } => item.start !== null)
          .sort((a, b) => a.start - b.start);
        for (let i = 0; i < sorted.length; i++) {
          const left = { start: sorted[i].start, end: sorted[i].start + sorted[i].lesson.durationMinutes };
          for (let j = i + 1; j < sorted.length && sorted[j].start < left.end; j++) {
            const right = { start: sorted[j].start, end: sorted[j].start + sorted[j].lesson.durationMinutes };
            if (timeRangesOverlap(left, right)) {
              conflicts.set(sorted[i].lesson.id, sorted[i].lesson);
              conflicts.set(sorted[j].lesson.id, sorted[j].lesson);
            }
          }
        }
      }

      const refundedCreditsByStudent: Record<string, number> = {};
      const notificationCounts = new Map<string, number>();
      for (const lesson of conflicts.values()) {
        notificationCounts.set(lesson.studentId, (notificationCounts.get(lesson.studentId) || 0) + 1);
        if (resolution === 'CANCEL_AND_REFUND_CREDIT') {
          await transaction.lesson.update({ where: { id: lesson.id }, data: { status: 'CANCELLED', needsRescheduling: false } });
          refundedCreditsByStudent[lesson.studentId] = (refundedCreditsByStudent[lesson.studentId] || 0) + 1;
        } else if (resolution === 'NOTIFY_STUDENTS') {
          await transaction.lesson.update({ where: { id: lesson.id }, data: { needsRescheduling: true } });
        }
      }
      if (resolution !== 'KEEP_EXISTING') {
        for (const [studentId, count] of notificationCounts) {
          const student = await transaction.user.findUnique({ where: { id: studentId }, select: { role: true, appData: true } });
          if (!student || student.role !== 'STUDENT') continue;
          const data = student.appData && typeof student.appData === 'object' && !Array.isArray(student.appData)
            ? student.appData as Record<string, Prisma.JsonValue>
            : {};
          const profile = data.studentProfile && typeof data.studentProfile === 'object' && !Array.isArray(data.studentProfile)
            ? data.studentProfile as Record<string, Prisma.JsonValue>
            : {};
          const extraClassCredits = typeof profile.extraClassCredits === 'number' ? profile.extraClassCredits : 0;
          const notifications = Array.isArray(data.notifications) ? data.notifications : [];
          const cancelled = resolution === 'CANCEL_AND_REFUND_CREDIT';
          const notification = {
            id: `notif-${randomUUID()}`,
            titleAr: cancelled ? 'تغيير موعد حصة وإضافة رصيد تعويضي' : 'تحديث في مواعيد المعلم',
            titleEn: cancelled ? 'Lesson Changed and Credit Added' : 'Teacher Schedule Updated',
            messageAr: cancelled ? `تم إلغاء ${count} حصة متعارضة وإضافة رصيد تعويضي إلى حسابك.` : 'يرجى مراجعة الحصص القادمة والتنسيق مع المعلم لتأكيد المواعيد.',
            messageEn: cancelled ? `${count} conflicting lesson(s) were cancelled and replacement credits were added.` : 'Please review your upcoming lessons and confirm updated times with your teacher.',
            time: 'الآن',
            read: false,
            type: 'LESSON_REMINDER',
          };
          await transaction.user.update({
            where: { id: studentId },
            data: { appData: {
              ...data,
              ...(cancelled ? { studentProfile: { ...profile, extraClassCredits: extraClassCredits + count } } : {}),
              notifications: [notification, ...notifications].slice(0, 200),
            } as Prisma.InputJsonValue },
          });
        }
      }
      return { conflictLessonIds: [...conflicts.keys()], refundedCreditsByStudent };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({
      teacher,
      ...result,
      conflictCount: result.conflictLessonIds.length,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'The schedule changed at the same time. Reload and try again.' }, { status: 409 });
    }
    console.error('Teacher availability update failed:', error);
    return NextResponse.json({ error: 'Unable to save teacher availability.' }, { status: 503 });
  }
}
