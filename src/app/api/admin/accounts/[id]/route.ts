import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  try {
    const { id } = await context.params;
    const body = await request.json();
    const data: { isBlocked?: boolean; teacherApprovalStatus?: string } = {};
    if (typeof body.isBlocked === 'boolean') data.isBlocked = body.isBlocked;
    if (body.teacherApprovalStatus === 'APPROVED' || body.teacherApprovalStatus === 'REJECTED' || body.teacherApprovalStatus === 'PENDING_ADMIN') {
      data.teacherApprovalStatus = body.teacherApprovalStatus;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No supported account changes provided.' }, { status: 400 });

    const user = await prisma.$transaction(async transaction => {
    const current = await transaction.user.findUnique({ where: { id }, select: { role: true, isBlocked: true, teacherApprovalStatus: true, appData: true } });
    if (!current) throw new Error('ACCOUNT_NOT_FOUND');
    if (data.teacherApprovalStatus && current.role !== 'TEACHER') throw new Error('ACCOUNT_ROLE_INVALID');
    if (data.isBlocked === true && current.role === 'ADMIN' && !current.isBlocked && await transaction.user.count({ where: { role: 'ADMIN', isBlocked: false } }) <= 1) throw new Error('LAST_ADMIN');
    let appData: Prisma.InputJsonValue | undefined;
    if (data.teacherApprovalStatus && current.teacherApprovalStatus !== data.teacherApprovalStatus) {
      const root = current.appData && typeof current.appData === 'object' && !Array.isArray(current.appData)
        ? current.appData as Record<string, Prisma.JsonValue>
        : {};
      const teacher = root.teacher && typeof root.teacher === 'object' && !Array.isArray(root.teacher)
        ? root.teacher as Record<string, Prisma.JsonValue>
        : {};
      const notifications = Array.isArray(root.notifications) ? root.notifications : [];
      const approved = data.teacherApprovalStatus === 'APPROVED';
      const notification = {
        id: `notif-${randomUUID()}`,
        titleAr: approved ? 'تم قبول وتفعيل حساب المعلم' : 'تم رفض طلب انضمام المعلم',
        titleEn: approved ? 'Teacher Account Approved' : 'Teacher Application Rejected',
        messageAr: approved ? 'تم اعتماد طلبك وأصبح ملفك متاحاً للطلاب.' : 'لم يتم قبول طلب الانضمام. تواصل مع إدارة المنصة للمزيد من التفاصيل.',
        messageEn: approved ? 'Your application was approved and your teacher profile is now available to students.' : 'Your application was not approved. Contact platform support for more information.',
        time: 'الآن',
        read: false,
        type: 'TEACHER_APPROVED',
      };
      appData = {
        ...root,
        teacher: { ...teacher, approvalStatus: data.teacherApprovalStatus },
        notifications: [notification, ...notifications].slice(0, 200),
      } as Prisma.InputJsonValue;
    }
    const rootForAudit = current.appData && typeof current.appData === 'object' && !Array.isArray(current.appData) ? current.appData as Record<string, Prisma.JsonValue> : {};
    const auditTrail = Array.isArray(rootForAudit.auditTrail) ? rootForAudit.auditTrail : [];
    const nextRoot = (appData || rootForAudit) as Record<string, Prisma.InputJsonValue>;
    appData = { ...nextRoot, auditTrail: [{ actorId: actor.id, at: new Date().toISOString(), action: 'ACCOUNT_UPDATED', changes: data, reason: typeof body.reason === 'string' ? body.reason.slice(0, 1000) : '' }, ...auditTrail].slice(0, 100) } as Prisma.InputJsonValue;
    if (current.role === 'TEACHER' && (data.isBlocked === true || data.teacherApprovalStatus && data.teacherApprovalStatus !== 'APPROVED')) await transaction.lesson.updateMany({ where: { teacherId: id, status: 'SCHEDULED' }, data: { needsRescheduling: true } });
    return transaction.user.update({
      where: { id },
      data: { ...data, ...(appData ? { appData } : {}) },
      select: { id: true, nameAr: true, nameEn: true, email: true, role: true, isBlocked: true, teacherApprovalStatus: true },
    });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_ADMIN') return NextResponse.json({ error: 'The last active administrator cannot be blocked.' }, { status: 409 });
    if (error instanceof Error && error.message === 'ACCOUNT_NOT_FOUND') return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    if (error instanceof Error && error.message === 'ACCOUNT_ROLE_INVALID') return NextResponse.json({ error: 'Only teacher accounts have an application status.' }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Account changed concurrently. Reload and try again.' }, { status: 409 });
    console.error('Admin account update failed:', error);
    return NextResponse.json({ error: 'Unable to update account.' }, { status: 503 });
  }
}
