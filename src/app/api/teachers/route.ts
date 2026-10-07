import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { INITIAL_TEACHERS } from '@/data/mockData';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateTimeSlots } from '@/utils/timeSlots';

function parseBookedSlots(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((slot): slot is string => typeof slot === 'string') : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const viewer = await getAuthenticatedUser();
    const rows = await prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: { id: true, nameAr: true, nameEn: true, email: true, phone: true, gender: true, isBlocked: true, teacherApprovalStatus: true, appData: true, teacherProfile: true },
    });
    const persisted = rows.flatMap(row => {
      if (viewer?.role !== 'ADMIN' && (row.isBlocked || row.teacherApprovalStatus !== 'APPROVED')) return [];
      const data = row.appData && typeof row.appData === 'object' && !Array.isArray(row.appData)
        ? row.appData as Record<string, unknown>
        : {};
      const teacher = data.teacher && typeof data.teacher === 'object' && !Array.isArray(data.teacher)
        ? data.teacher as Record<string, unknown>
        : null;
      const profile = row.teacherProfile;
      const workingHoursStart = profile?.workingHoursStart || (typeof teacher?.workingHoursStart === 'string' ? teacher.workingHoursStart : '12:00');
      const workingHoursEnd = profile?.workingHoursEnd || (typeof teacher?.workingHoursEnd === 'string' ? teacher.workingHoursEnd : '18:00');
      const availabilityRanges = Array.isArray(teacher?.availabilityRanges)
        ? teacher.availabilityRanges.filter((range): range is { start: string; end: string } =>
            Boolean(range && typeof range === 'object' && 'start' in range && 'end' in range &&
              typeof range.start === 'string' && typeof range.end === 'string')
          )
        : undefined;
      const storedSlots = Array.isArray(teacher?.availableSlots)
        ? teacher.availableSlots.filter((slot): slot is string => typeof slot === 'string')
        : [];
      const fullTeacher = {
        ...(teacher || {}),
        ...(profile ? {
          titleAr: profile.titleAr,
          titleEn: profile.titleEn,
          ijazahDetailsAr: profile.ijazahDetailsAr,
          ijazahDetailsEn: profile.ijazahDetailsEn,
          experienceYears: profile.experienceYears,
          languagesSpoken: profile.languagesSpoken.split(',').map(value => value.trim()).filter(Boolean),
          specializationsAr: profile.specializations.split(',').map(value => value.trim()).filter(Boolean),
          bioAr: profile.bioAr,
          bioEn: profile.bioEn,
          hourlyRateSar: profile.hourlyRate,
          rating: profile.totalReviews > 0 ? profile.ratingAvg : 0,
          reviewsCount: profile.totalReviews,
          workingHoursStart: profile.workingHoursStart,
          workingHoursEnd: profile.workingHoursEnd,
          bookedTimeSlots: parseBookedSlots(profile.bookedTimeSlots),
        } : {}),
        workingHoursStart,
        workingHoursEnd,
        ...(availabilityRanges ? { availabilityRanges } : {}),
        availableSlots: storedSlots.length ? storedSlots : availabilityRanges
          ? Array.from(new Set(availabilityRanges.flatMap(range => generateTimeSlots(range.start, range.end)))).sort()
          : generateTimeSlots(workingHoursStart, workingHoursEnd),
      };
      if (!profile && !teacher) return [];
      return [{
        ...fullTeacher,
        id: row.id,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        email: viewer?.role === 'ADMIN' ? row.email : '',
        phone: viewer?.role === 'ADMIN' ? (row.phone || '') : '',
        birthDate: viewer?.role === 'ADMIN' ? teacher?.birthDate : undefined,
        gender: row.gender || 'MALE',
        approvalStatus: row.teacherApprovalStatus || 'PENDING_ADMIN',
      }];
    });
    const persistedById = new Map(rows.map(teacher => [teacher.id, teacher]));
    const fixtureTeachers = process.env.NODE_ENV === 'production'
      ? []
      : INITIAL_TEACHERS.filter(teacher => !persistedById.has(teacher.id) && (viewer?.role === 'ADMIN' || teacher.approvalStatus === 'APPROVED'));
    const teachers = [...persisted, ...fixtureTeachers.map(teacher => viewer?.role === 'ADMIN' ? teacher : { ...teacher, email: '', phone: '', birthDate: undefined })];
    return NextResponse.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    console.error('Teacher listing failed:', error);
    return NextResponse.json({ error: 'Unable to load teachers.' }, { status: 503 });
  }
}
