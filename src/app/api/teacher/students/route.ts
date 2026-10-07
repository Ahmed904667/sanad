import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== Role.TEACHER && actor.role !== Role.ADMIN) return NextResponse.json({ error: 'Teacher access required.' }, { status: 403 });
  if (actor.role === Role.TEACHER && actor.teacherApprovalStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Your teacher account must be approved before accessing student records.' }, { status: 403 });
  }

  try {
    const lessonRows = await prisma.lesson.findMany({
      where: actor.role === Role.ADMIN ? {} : { teacherId: actor.id },
      distinct: ['studentId'],
      select: { studentId: true },
    });
    const students = await prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        ...(actor.role === Role.ADMIN ? {} : { OR: [
          { studentProfile: { is: { assignedTeacherId: actor.id } } },
          { id: { in: lessonRows.map(lesson => lesson.studentId) } },
        ] }),
      },
      orderBy: [{ nameAr: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        phone: true,
        gender: true,
        appData: true,
        studentProfile: {
          select: {
            activePlanId: true,
            remainingLessons: true,
            totalLessonsCompleted: true,
            totalHoursLearned: true,
            assignedTeacherId: true,
          },
        },
      },
    });

    const result = students.map(user => {
      const appData = user.appData && typeof user.appData === 'object' && !Array.isArray(user.appData)
        ? user.appData as Record<string, unknown>
        : {};
      const rawProfile = appData.studentProfile && typeof appData.studentProfile === 'object' && !Array.isArray(appData.studentProfile)
        ? appData.studentProfile as Record<string, unknown>
        : {};
      // The normalized StudentProfile row owns balances and teacher assignment;
      // appData carries the rest of the learning and subscription details.
      const profile: Record<string, unknown> = {
        ...rawProfile,
        id: user.id,
        nameAr: user.nameAr,
        nameEn: user.nameEn,
        email: user.email,
        phone: user.phone || '',
        gender: user.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
        activePlanId: user.studentProfile?.activePlanId ?? rawProfile.activePlanId ?? null,
        remainingLessons: user.studentProfile?.remainingLessons ?? 0,
        totalLessonsCompleted: user.studentProfile?.totalLessonsCompleted ?? 0,
        totalHoursLearned: user.studentProfile?.totalHoursLearned ?? 0,
        assignedTeacherId: user.studentProfile?.assignedTeacherId ?? null,
      };
      // Payment receipts and transfer references belong to admin review only.
      delete profile.paymentReceiptUrl;
      delete profile.bankTransferRef;
      delete profile.paymentDate;
      delete profile.rejectionReason;
      delete profile.pauseReason;
      return {
        id: user.id,
        name: user.nameAr,
        email: user.email,
        phone: user.phone || '',
        role: Role.STUDENT,
        gender: user.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
        studentProfile: profile,
      };
    });

    return NextResponse.json({ students: result });
  } catch (error) {
    console.error('Teacher roster lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load your students.' }, { status: 503 });
  }
}
