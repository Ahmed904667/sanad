import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { randomUUID, createHash } from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INITIAL_PLANS } from '@/data/mockData';
import { asRecord, isCalendarDate, isSafeMeetingUrl, lessonStartsAt, isValidQuranGoal } from '@/lib/business-rules';
import { lessonFitsAvailability, lessonTimeRange, timeRangesOverlap, timeToMinutes, WEEKDAYS_AR } from '@/utils/availability';
import { parseTeacherAvailability } from '@/lib/teacher-availability';

function scheduleVersion(lessons: unknown[]) {
  return createHash('sha256').update(JSON.stringify([...lessons].sort((a, b) => (a as { id: string }).id.localeCompare((b as { id: string }).id)))).digest('hex');
}

function authorizedLessonWhere(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'TEACHER') return { teacherId: user.id };
  return { studentId: user.id };
}

function dayForDate(value: string) {
  return isCalendarDate(value) ? WEEKDAYS_AR[new Date(`${value}T12:00:00Z`).getUTCDay()] : '';
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const lessons = await prisma.lesson.findMany({
      where: authorizedLessonWhere(user),
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return NextResponse.json(lessons, { headers: { 'X-Schedule-Version': scheduleVersion(lessons), 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error fetching lessons from DB:', error);
    return NextResponse.json({ error: 'Unable to load lessons.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  try {
    let studentId: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.studentId === 'string') studentId = body.studentId;
    } catch {
      // An empty body means the administrator requested a full lesson reset.
    }
    const result = await prisma.lesson.deleteMany({ where: studentId ? { studentId } : {} });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error deleting lessons:', error);
    return NextResponse.json({ error: 'Unable to delete lessons.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role === 'GUEST') return NextResponse.json({ error: 'Authenticated account required.' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'A JSON object is required.' }, { status: 400 });
    if (body.quranGoal !== undefined && !isValidQuranGoal(body.quranGoal)) return NextResponse.json({ error: 'Learning goal is invalid.' }, { status: 400 });
    if (body.quranGoal !== undefined && user.role !== 'STUDENT' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Only the student or administrator can change a learning goal.' }, { status: 403 });
    const lessons: unknown = body?.lessons;
    if (!Array.isArray(lessons)) {
      return NextResponse.json({ error: 'Lessons must be an array.' }, { status: 400 });
    }
    if (lessons.length > 500) return NextResponse.json({ error: 'Too many lessons in one request.' }, { status: 413 });

    const actorWhere = authorizedLessonWhere(user);
    const normalized: Array<{
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
      googleMeetUrl: string;
      isOrientationSession: boolean;
      needsRescheduling: boolean;
      notes: string | null;
      surahTargetAr: string | null;
      surahTargetEn: string | null;
    }> = [];

    for (const [index, entry] of lessons.entries()) {
      if (!entry || typeof entry !== 'object') return NextResponse.json({ error: `Invalid lesson at index ${index}.` }, { status: 400 });
      const lesson = entry as Record<string, unknown>;
      const studentId = typeof lesson.studentId === 'string' ? lesson.studentId : '';
      const teacherId = typeof lesson.teacherId === 'string' ? lesson.teacherId : '';
      const date = typeof lesson.date === 'string' ? lesson.date : '';
      const rawTime = typeof lesson.time === 'string' ? lesson.time : '';
      // Normalize older saved values such as "12:00 (12 PM)" before persistence.
      const timeMatch = rawTime.match(/^((?:[01]\d|2[0-3]):[0-5]\d)(?:$|\s)/);
      const time = timeMatch?.[1] || '';
      const surahTargetAr = typeof lesson.surahTargetAr === 'string' ? lesson.surahTargetAr.trim() : '';
      const surahTargetEn = typeof lesson.surahTargetEn === 'string' ? lesson.surahTargetEn.trim() : '';
      const durationMinutes = Number(lesson.durationMinutes);
      const status = lesson.status === 'COMPLETED' || lesson.status === 'CANCELLED' ? lesson.status : 'SCHEDULED';
      if (lesson.status !== undefined && !['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(String(lesson.status))) return NextResponse.json({ error: 'Invalid class status.' }, { status: 400 });

      if (!studentId || !teacherId || !isCalendarDate(date) || !time ||
          !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 240) {
        return NextResponse.json({ error: `Invalid lesson fields at index ${index}.` }, { status: 400 });
      }
      if (!isSafeMeetingUrl(typeof lesson.googleMeetUrl === 'string' ? lesson.googleMeetUrl : '')) return NextResponse.json({ error: 'Meeting links must be a valid HTTPS URL.' }, { status: 400 });
      if (surahTargetAr.length > 1000 || surahTargetEn.length > 1000 || typeof lesson.notes === 'string' && lesson.notes.length > 5000) {
        return NextResponse.json({ error: `Class scope is too long at index ${index}.` }, { status: 400 });
      }
      if (user.role === 'STUDENT' && studentId !== user.id) return NextResponse.json({ error: 'You can only manage your own lessons.' }, { status: 403 });
      if (user.role === 'TEACHER' && teacherId !== user.id) return NextResponse.json({ error: 'You can only manage your own lessons.' }, { status: 403 });

      normalized.push({
        id: typeof lesson.id === 'string' && lesson.id ? lesson.id : `les-${randomUUID()}`,
        studentId,
        teacherId,
        teacherNameAr: typeof lesson.teacherNameAr === 'string' ? lesson.teacherNameAr : '',
        teacherNameEn: typeof lesson.teacherNameEn === 'string' ? lesson.teacherNameEn : '',
        studentNameAr: typeof lesson.studentNameAr === 'string' ? lesson.studentNameAr : '',
        studentNameEn: typeof lesson.studentNameEn === 'string' ? lesson.studentNameEn : '',
        date,
        time,
        durationMinutes,
        status,
        googleMeetUrl: typeof lesson.googleMeetUrl === 'string' ? lesson.googleMeetUrl : '',
        isOrientationSession: lesson.isOrientationSession === true,
        needsRescheduling: lesson.needsRescheduling === true,
        notes: typeof lesson.notes === 'string' && lesson.notes ? lesson.notes : null,
        surahTargetAr: surahTargetAr || null,
        surahTargetEn: surahTargetEn || null,
      });
    }

    if (new Set(normalized.map(lesson => lesson.id)).size !== normalized.length) return NextResponse.json({ error: 'Duplicate lesson IDs are not allowed.' }, { status: 400 });
    const scheduledProposals = normalized.filter(lesson => lesson.status === 'SCHEDULED');
    for (let index = 0; index < scheduledProposals.length; index++) {
      const lesson = scheduledProposals[index];
      const leftStart = timeToMinutes(lesson.time);
      if (leftStart === null) return NextResponse.json({ error: 'Class time is invalid.' }, { status: 400 });
      for (const other of scheduledProposals.slice(index + 1)) {
        if ((other.teacherId !== lesson.teacherId && other.studentId !== lesson.studentId) || other.date !== lesson.date) continue;
        const rightStart = timeToMinutes(other.time);
        if (rightStart !== null && timeRangesOverlap(
          { start: leftStart, end: leftStart + lesson.durationMinutes },
          { start: rightStart, end: rightStart + other.durationMinutes }
        )) return NextResponse.json({ error: 'A teacher cannot have overlapping classes.' }, { status: 409 });
      }
    }

    const lessonIds = normalized.map(lesson => lesson.id);

    await prisma.$transaction(async transaction => {
      const currentSchedule = await transaction.lesson.findMany({ where: actorWhere });
      if (normalized.some(item => currentSchedule.some(existing => existing.id === item.id)) && body.baseVersion !== scheduleVersion(currentSchedule)) throw new Error('LESSON_STALE_VERSION');
      const entitlementChecks = new Set<string>();
      const completionDelta = new Map<string, { lessons: number; hours: number; billableLessons: number }>();
      const rescheduledStudentIds = new Set<string>();
      for (const lesson of normalized) {
        const existing = await transaction.lesson.findUnique({ where: { id: lesson.id } });
        if (existing) {
          const ownsExisting = user.role === 'ADMIN' || (user.role === 'STUDENT'
            ? existing.studentId === user.id
            : existing.teacherId === user.id);
          if (!ownsExisting) throw new Error('LESSON_ACCESS_DENIED');
          if (user.role === 'TEACHER' && existing.studentId !== lesson.studentId) throw new Error('LESSON_STUDENT_ACCESS_DENIED');
        }
        if (existing && user.role !== 'ADMIN' && (existing.studentId !== lesson.studentId || existing.teacherId !== lesson.teacherId || existing.isOrientationSession !== lesson.isOrientationSession)) throw new Error('LESSON_IDENTITY_IMMUTABLE');
        if (user.role === 'STUDENT' && lesson.googleMeetUrl !== (existing?.googleMeetUrl || '')) throw new Error('LESSON_MEETING_FORBIDDEN');
        if (existing?.status === 'COMPLETED') {
          if (lesson.status !== 'COMPLETED' || existing.date !== lesson.date || existing.time !== lesson.time || existing.durationMinutes !== lesson.durationMinutes || existing.isOrientationSession !== lesson.isOrientationSession || existing.teacherId !== lesson.teacherId) throw new Error('LESSON_HISTORY_IMMUTABLE');
          if (user.role !== 'ADMIN') continue;
        }
        if (existing?.status === 'CANCELLED' && lesson.status !== 'CANCELLED' && user.role !== 'ADMIN') throw new Error('LESSON_HISTORY_IMMUTABLE');
        if (!existing && lesson.status !== 'SCHEDULED') throw new Error('LESSON_NEW_STATUS_INVALID');
        if (user.role === 'STUDENT' && lesson.status === 'COMPLETED') throw new Error('LESSON_COMPLETION_FORBIDDEN');
        if ((user.role === 'TEACHER' || user.role === 'ADMIN') && lesson.status === 'COMPLETED' && existing?.status !== 'COMPLETED') {
          if (existing && (existing.date !== lesson.date || existing.time !== lesson.time || existing.durationMinutes !== lesson.durationMinutes)) throw new Error('LESSON_HISTORY_IMMUTABLE');
          if (!existing || existing.status !== 'SCHEDULED') throw new Error('LESSON_COMPLETION_FORBIDDEN');
          if (lessonStartsAt(existing.date, existing.time) + existing.durationMinutes * 60_000 > Date.now() && (user.role !== 'ADMIN' || typeof body.reason !== 'string' || body.reason.trim().length < 5)) throw new Error('LESSON_NOT_FINISHED');
          const current = completionDelta.get(lesson.studentId) || { lessons: 0, hours: 0, billableLessons: 0 };
          completionDelta.set(lesson.studentId, {
            lessons: current.lessons + 1,
            hours: current.hours + lesson.durationMinutes / 60,
            billableLessons: current.billableLessons + (lesson.isOrientationSession ? 0 : 1),
          });
        }

        const [student, teacher] = await Promise.all([
          transaction.user.findUnique({ where: { id: lesson.studentId }, select: { id: true, role: true, isBlocked: true, nameAr: true, nameEn: true, appData: true, studentProfile: true } }),
          transaction.user.findUnique({ where: { id: lesson.teacherId }, select: { id: true, role: true, isBlocked: true, nameAr: true, nameEn: true, teacherApprovalStatus: true, appData: true, teacherProfile: { select: { workingHoursStart: true, workingHoursEnd: true } } } }),
        ]);
        if (student && student.role !== 'STUDENT') throw new Error('LESSON_STUDENT_ACCESS_DENIED');
        if (!student || student.role !== 'STUDENT' || student.isBlocked && lesson.status !== 'CANCELLED') throw new Error('LESSON_STUDENT_ACCESS_DENIED');
        const requiresBookableTeacher = lesson.status === 'COMPLETED' || lesson.status === 'SCHEDULED' && (
          !existing || existing.status !== 'SCHEDULED' || existing.teacherId !== lesson.teacherId ||
          existing.date !== lesson.date || existing.time !== lesson.time || existing.durationMinutes !== lesson.durationMinutes
        );
        if (requiresBookableTeacher && (!teacher || teacher.role !== 'TEACHER' || teacher.teacherApprovalStatus !== 'APPROVED' || teacher.isBlocked)) throw new Error('LESSON_TEACHER_ACCESS_DENIED');
        lesson.teacherNameAr = teacher?.nameAr || existing?.teacherNameAr || '';
        lesson.teacherNameEn = teacher?.nameEn || existing?.teacherNameEn || '';
        lesson.studentNameAr = student.nameAr;
        lesson.studentNameEn = student.nameEn;
        const profile = asRecord(asRecord(student.appData).studentProfile);
        const row = student.studentProfile;
        const plan = INITIAL_PLANS.find(item => item.id === row?.activePlanId);
        const requiresEntitlement = !lesson.isOrientationSession && (lesson.status === 'SCHEDULED' && (!existing || existing.status !== 'SCHEDULED' || existing.date !== lesson.date || existing.time !== lesson.time || existing.durationMinutes !== lesson.durationMinutes) || lesson.status === 'COMPLETED' && existing?.status !== 'COMPLETED');
        if (requiresEntitlement) {
          if (profile.verificationStatus !== 'VERIFIED' || !plan || !row || row.remainingLessons <= 0 ||
            !isCalendarDate(profile.subscriptionRenewalDate) || lesson.date > profile.subscriptionRenewalDate ||
            isCalendarDate(profile.subscriptionStartDate) && lesson.date < profile.subscriptionStartDate || lesson.durationMinutes !== (existing && existing.status === 'SCHEDULED' ? existing.durationMinutes : plan.lessonDurationMinutes) || row.assignedTeacherId !== lesson.teacherId) throw new Error('LESSON_ENTITLEMENT_REQUIRED');
          if (lesson.status === 'SCHEDULED') entitlementChecks.add(lesson.studentId);
        }
        if (!existing && lesson.id.startsWith('les-ext-')) {
          const credits = Number(profile.extraClassCredits || 0);
          if (!Number.isInteger(credits) || credits <= 0 || lesson.isOrientationSession) throw new Error('LESSON_ENTITLEMENT_REQUIRED');
          await transaction.user.update({ where: { id: student.id }, data: {
            appData: { ...asRecord(student.appData), studentProfile: { ...profile, extraClassCredits: credits - 1 } } as Prisma.InputJsonValue,
          } });
        }
        const changedToScheduled = lesson.status === 'SCHEDULED' && (
          !existing || existing.status !== 'SCHEDULED' || existing.teacherId !== lesson.teacherId ||
          existing.date !== lesson.date || existing.time !== lesson.time || existing.durationMinutes !== lesson.durationMinutes
        );
        if (changedToScheduled) {
          rescheduledStudentIds.add(lesson.studentId);
          if (lessonStartsAt(lesson.date, lesson.time) < Date.now()) throw new Error('LESSON_PAST_BOOKING');
          if (lessonStartsAt(lesson.date, lesson.time) > Date.now() + 180 * 86_400_000) throw new Error('LESSON_BOOKING_HORIZON');
          if (lesson.isOrientationSession) {
            if (lesson.durationMinutes > 20 || row?.assignedTeacherId !== lesson.teacherId || await transaction.lesson.count({ where: { studentId: lesson.studentId, isOrientationSession: true, id: { not: lesson.id } } })) throw new Error('LESSON_ORIENTATION_LIMIT');
          }
          const appTeacherData = teacher?.appData && typeof teacher.appData === 'object' && !Array.isArray(teacher.appData)
            ? (teacher.appData as Record<string, unknown>).teacher
            : null;
          const teacherData = appTeacherData || (teacher?.teacherProfile ? {
            workingHoursStart: teacher.teacherProfile.workingHoursStart,
            workingHoursEnd: teacher.teacherProfile.workingHoursEnd,
          } : null);
          const day = dayForDate(lesson.date);
          if (!day || !lessonFitsAvailability(lesson.time, lesson.durationMinutes, parseTeacherAvailability(teacherData, day))) {
            throw new Error('LESSON_OUTSIDE_AVAILABILITY');
          }

          const existingSchedule = await transaction.lesson.findMany({
            where: { OR: [{ teacherId: lesson.teacherId }, { studentId: lesson.studentId }], date: lesson.date, status: 'SCHEDULED', id: { notIn: lessonIds } },
            select: { id: true, time: true, durationMinutes: true },
          });
          const proposedRange = lessonTimeRange(lesson.time, lesson.durationMinutes);
          if (!proposedRange || existingSchedule.some(item => {
            const itemStart = timeToMinutes(item.time);
            return itemStart !== null && timeRangesOverlap(proposedRange, { start: itemStart, end: itemStart + item.durationMinutes });
          })) throw new Error('LESSON_TIME_CONFLICT');
        }

        await transaction.lesson.upsert({
          where: { id: lesson.id },
          update: lesson,
          create: lesson,
        });
      }

      for (const studentId of rescheduledStudentIds) {
        const studentLessons = await transaction.lesson.findMany({
          where: { studentId, status: { in: ['SCHEDULED', 'COMPLETED'] } },
          select: { date: true, time: true, isOrientationSession: true },
        });
        const welcome = studentLessons.filter(lesson => lesson.isOrientationSession)
          .sort((a, b) => lessonStartsAt(a.date, a.time) - lessonStartsAt(b.date, b.time))[0];
        const firstRegular = studentLessons.filter(lesson => !lesson.isOrientationSession)
          .sort((a, b) => lessonStartsAt(a.date, a.time) - lessonStartsAt(b.date, b.time))[0];
        if (welcome && firstRegular && lessonStartsAt(welcome.date, welcome.time) >= lessonStartsAt(firstRegular.date, firstRegular.time)) {
          throw new Error('LESSON_ORIENTATION_ORDER');
        }
      }

      for (const studentId of entitlementChecks) {
        const row = await transaction.studentProfile.findUnique({ where: { userId: studentId } });
        const reservations = await transaction.lesson.count({ where: { studentId, status: 'SCHEDULED', isOrientationSession: false } });
        if (!row || reservations > row.remainingLessons) throw new Error('LESSON_RESERVATION_LIMIT');
      }

      for (const [studentId, delta] of completionDelta) {
        const student = await transaction.user.findUnique({ where: { id: studentId }, select: { role: true, appData: true } });
        if (!student || student.role !== 'STUDENT') throw new Error('LESSON_STUDENT_ACCESS_DENIED');
        const root = student.appData && typeof student.appData === 'object' && !Array.isArray(student.appData)
          ? student.appData as Record<string, Prisma.JsonValue>
          : {};
        const profile = root.studentProfile && typeof root.studentProfile === 'object' && !Array.isArray(root.studentProfile)
          ? root.studentProfile as Record<string, Prisma.JsonValue>
          : {};

        const profileRow = await transaction.studentProfile.findUnique({ where: { userId: studentId }, select: { remainingLessons: true, totalLessonsCompleted: true, totalHoursLearned: true } });
        const lessonsDone = profileRow?.totalLessonsCompleted || 0;
        const hoursDone = profileRow?.totalHoursLearned || 0;
        const remainingBefore = profileRow?.remainingLessons ?? (typeof profile.remainingLessons === 'number' ? profile.remainingLessons : 0);
        const remainingLessons = Math.max(0, remainingBefore - delta.billableLessons);
        await transaction.user.update({
          where: { id: studentId },
          data: { appData: { ...root,
            auditTrail: [{ actorId: user.id, at: new Date().toISOString(), action: 'LESSONS_COMPLETED',
              lessonIds: normalized.filter(item => item.studentId === studentId && item.status === 'COMPLETED').map(item => item.id),
              reason: typeof body.reason === 'string' ? body.reason.slice(0, 1000) : '',
            }, ...(Array.isArray(root.auditTrail) ? root.auditTrail : [])].slice(0, 100),
            studentProfile: {
            ...profile,
            totalLessonsCompleted: lessonsDone + delta.lessons,
            totalHoursLearned: hoursDone + delta.hours,
            remainingLessons,
            quranGoal: { ...asRecord(profile.quranGoal), ...(delta.lessons > delta.billableLessons ? { orientationCompleted: true } : {}) },
          } } },
        });
        await transaction.studentProfile.upsert({
          where: { userId: studentId },
          create: { userId: studentId, totalLessonsCompleted: delta.lessons, totalHoursLearned: delta.hours, remainingLessons },
          update: { totalLessonsCompleted: { increment: delta.lessons }, totalHoursLearned: { increment: delta.hours }, remainingLessons },
        });
      }

      if (body.quranGoal !== undefined) {
        const studentId = user.role === 'STUDENT' ? user.id : typeof body.studentId === 'string' ? body.studentId : '';
        const owner = studentId ? await transaction.user.findUnique({ where: { id: studentId }, select: { role: true, appData: true, studentProfile: true } }) : null;
        if (!owner || owner.role !== 'STUDENT' || normalized.some(item => item.studentId !== studentId)) throw new Error('LESSON_STUDENT_ACCESS_DENIED');
        const root = asRecord(owner.appData);
        const profile = asRecord(root.studentProfile);
        const quranGoal = { ...asRecord(body.quranGoal), orientationCompleted: asRecord(profile.quranGoal).orientationCompleted === true, assignedTeacherId: owner.studentProfile?.assignedTeacherId || null };
        await transaction.user.update({ where: { id: studentId }, data: { appData: { ...root, studentProfile: { ...profile, quranGoal } } as Prisma.InputJsonValue } });
      }

    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const updated = await prisma.lesson.findMany({
      where: actorWhere as Prisma.LessonWhereInput,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return NextResponse.json({ success: true, count: updated.length, lessons: updated, version: scheduleVersion(updated) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    const conflicts: Record<string, string> = {
      LESSON_STALE_VERSION: 'The schedule changed since you loaded it. Reload before saving.',
      LESSON_NOT_FINISHED: 'A class can only be completed after its scheduled end time.',
      LESSON_PAST_BOOKING: 'Choose a future date and time.',
      LESSON_BOOKING_HORIZON: 'Classes can be booked up to 180 days ahead.',
      LESSON_ENTITLEMENT_REQUIRED: 'An active paid subscription with the correct teacher, duration and remaining balance is required.',
      LESSON_RESERVATION_LIMIT: 'Your scheduled classes exceed your remaining paid balance.',
      LESSON_ORIENTATION_LIMIT: 'Only one orientation of up to 20 minutes is allowed per student.',
      LESSON_ORIENTATION_ORDER: 'The welcome class must be scheduled before the first regular class. Move the regular class later or choose an earlier welcome slot.',
      LESSON_HISTORY_IMMUTABLE: 'Completed and cancelled class history cannot be rewritten.',
    };
    if (error instanceof Error && conflicts[error.message]) return NextResponse.json({ error: conflicts[error.message] }, { status: 409 });
    if (error instanceof Error && error.message === 'LESSON_ACCESS_DENIED') {
      return NextResponse.json({ error: 'You cannot modify another account’s lesson.' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'LESSON_OUTSIDE_AVAILABILITY') {
      return NextResponse.json({ error: 'That class time is outside the teacher’s available hours.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'LESSON_TIME_CONFLICT') {
      return NextResponse.json({ error: 'That time overlaps another class. Choose a different start time.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'The schedule changed at the same time. Reload and try again.' }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith('LESSON_')) {
      return NextResponse.json({ error: 'This lesson change is not allowed.' }, { status: 403 });
    }
    console.error('Error saving lessons to DB:', error);
    return NextResponse.json({ error: 'Unable to save lessons.' }, { status: 503 });
  }
}
