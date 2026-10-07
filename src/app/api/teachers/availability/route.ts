import { NextResponse } from 'next/server';
import { INITIAL_TEACHERS } from '@/data/mockData';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateSlotsForRanges, getTeacherAvailabilityRanges, lessonTimesOverlap, WEEKDAYS_AR } from '@/utils/availability';
import type { Teacher } from '@/types';
import { prisma } from '@/lib/prisma';

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  const viewer = await getAuthenticatedUser();
  const url = new URL(request.url);
  const teacherId = url.searchParams.get('teacherId') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || from;
  if (!teacherId || !isCalendarDate(from) || !isCalendarDate(to) || from > to) {
    return NextResponse.json({ error: 'Choose a valid teacher and date range.' }, { status: 400 });
  }
  const dayCount = (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000;
  if (dayCount > 120) return NextResponse.json({ error: 'Date range cannot exceed 120 days.' }, { status: 400 });

  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true, isBlocked: true, teacherApprovalStatus: true, appData: true, teacherProfile: true },
    });
    const fixtureTeacher = process.env.NODE_ENV !== 'production' && INITIAL_TEACHERS.some(item =>
      item.id === teacherId && item.approvalStatus === 'APPROVED'
    );
    if (teacher && (teacher.role !== 'TEACHER' || teacher.teacherApprovalStatus !== 'APPROVED' || teacher.isBlocked)) {
      return NextResponse.json({ error: 'Teacher is not available for booking.' }, { status: 404 });
    }
    if (!teacher && !fixtureTeacher) return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });

    const excludeLessonId = url.searchParams.get('excludeLessonId');
    const excludeLesson = viewer && excludeLessonId ? await prisma.lesson.findFirst({ where: { id: excludeLessonId, teacherId, ...(viewer.role === 'ADMIN' ? {} : viewer.role === 'TEACHER' ? { teacherId: viewer.id } : { studentId: viewer.id }) }, select: { id: true } }) : null;
    const lessons = await prisma.lesson.findMany({
      where: { teacherId, status: 'SCHEDULED', date: { gte: from, lte: to }, ...(excludeLesson ? { id: { not: excludeLesson.id } } : {}) },
      select: { date: true, time: true, durationMinutes: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    const root = teacher?.appData && typeof teacher.appData === 'object' && !Array.isArray(teacher.appData) ? teacher.appData as Record<string, unknown> : {};
    const data = root.teacher && typeof root.teacher === 'object' ? root.teacher as unknown as Teacher : INITIAL_TEACHERS.find(item => item.id === teacherId);
    const normalizedTeacher = { ...data, workingHoursStart: teacher?.teacherProfile?.workingHoursStart || data?.workingHoursStart || '12:00', workingHoursEnd: teacher?.teacherProfile?.workingHoursEnd || data?.workingHoursEnd || '18:00' } as Teacher;
    const duration = Number(url.searchParams.get('durationMinutes') || 5);
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) return NextResponse.json({ error: 'Choose a valid duration.' }, { status: 400 });
    const day = WEEKDAYS_AR[new Date(`${from}T12:00:00Z`).getUTCDay()];
    const availableSlots = generateSlotsForRanges(getTeacherAvailabilityRanges(normalizedTeacher, day), duration)
      .filter(time => !lessons.some(item => item.date === from && lessonTimesOverlap(time, duration, item.time, item.durationMinutes)));
    return NextResponse.json({ occupied: lessons, availableSlots, timeZone: 'Asia/Riyadh' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Teacher availability lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load class availability.' }, { status: 503 });
  }
}
