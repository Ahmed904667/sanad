import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { asRecord, isValidQuranGoal } from '@/lib/business-rules';

/** Payment, balance and lifecycle mutations belong exclusively to /api/subscriptions. */
export async function PATCH(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  try {
    const body = await request.json();
    const studentId = actor.role === 'ADMIN' && typeof body.studentId === 'string' ? body.studentId : actor.id;
    if (actor.role !== 'STUDENT' && actor.role !== 'ADMIN') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    const patch = asRecord(body.profile);
    if (!Object.keys(patch).length || Object.keys(patch).some(key => !['quranGoal', 'assignedTeacherId'].includes(key))) {
      return NextResponse.json({ error: 'Only learning goals and teacher assignment can be changed here. Use the subscription workflow for payments or balances.' }, { status: 403 });
    }
    if (patch.quranGoal !== undefined && !isValidQuranGoal(patch.quranGoal)) {
      return NextResponse.json({ error: 'Learning goal is invalid or too large.' }, { status: 400 });
    }
    const updatedProfile = await prisma.$transaction(async tx => {
      const target = await tx.user.findUnique({ where: { id: studentId }, select: { role: true, appData: true } });
      if (!target || target.role !== 'STUDENT') throw new Error('STUDENT_NOT_FOUND');
      const root = asRecord(target.appData);
      const current = asRecord(root.studentProfile);
      const assignedTeacherId = patch.assignedTeacherId ?? current.assignedTeacherId;
      if (patch.assignedTeacherId !== undefined) {
        if (typeof assignedTeacherId !== 'string') throw new Error('TEACHER_INVALID');
        const teacher = await tx.user.findUnique({ where: { id: assignedTeacherId }, select: { role: true, teacherApprovalStatus: true, isBlocked: true } });
        if (!teacher || teacher.role !== 'TEACHER' || teacher.teacherApprovalStatus !== 'APPROVED' || teacher.isBlocked) throw new Error('TEACHER_INVALID');
        // Existing paid bookings must be migrated through the schedule workflow, not reassigned silently.
        if (current.assignedTeacherId !== assignedTeacherId && await tx.lesson.count({ where: { studentId, status: 'SCHEDULED', isOrientationSession: false } })) throw new Error('TEACHER_HAS_BOOKINGS');
      }
      const goal = patch.quranGoal ? { ...asRecord(patch.quranGoal), orientationCompleted: asRecord(current.quranGoal).orientationCompleted === true, assignedTeacherId } : current.quranGoal;
      const profile = { ...current, ...patch, ...(goal ? { quranGoal: goal } : {}) } as Prisma.InputJsonValue;
      await tx.user.update({ where: { id: studentId }, data: { appData: { ...root, studentProfile: profile } as Prisma.InputJsonValue } });
      if (typeof assignedTeacherId === 'string') await tx.studentProfile.updateMany({ where: { userId: studentId }, data: { assignedTeacherId } });
      return profile;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') return NextResponse.json({ error: 'Student account not found.' }, { status: 404 });
    if (error instanceof Error && error.message === 'TEACHER_INVALID') return NextResponse.json({ error: 'Choose an approved, available teacher.' }, { status: 400 });
    if (error instanceof Error && error.message === 'TEACHER_HAS_BOOKINGS') return NextResponse.json({ error: 'Reschedule existing classes before changing teachers.' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Your profile changed concurrently. Reload and try again.' }, { status: 409 });
    console.error('Student profile update failed:', error);
    return NextResponse.json({ error: 'Unable to save your learning goal.' }, { status: 503 });
  }
}
