import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { randomUUID, createHash } from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INITIAL_PLANS } from '@/data/mockData';
import { isValidReceiptDataUrl } from '@/lib/business-rules';
import { generateSlotsForRanges, getTeacherAvailabilityRanges, lessonTimesOverlap, WEEKDAYS_AR } from '@/utils/availability';
import type { Teacher } from '@/types';
import { QURAN_SURAHS, partitionSurahsAcrossClasses, partitionJuzAcrossClasses } from '@/data/quranData';

class SubscriptionError extends Error { constructor(message: string, readonly status = 409) { super(message); } }
const day = (date: Date) => date.toISOString().slice(0, 10);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const pendingKeys = ['pendingPlanId', 'subscriptionChangeType', 'pendingExtraClassQuantity', 'paymentReceiptUrl', 'bankTransferRef', 'paymentDate'];

export async function POST(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  try {
    const body = await request.json();
    const action = body.action;
    if (!['SUBMIT_PAYMENT', 'APPROVE', 'REJECT', 'PAUSE', 'RESUME', 'CANCEL', 'NEXT_PLAN'].includes(action)) throw new SubscriptionError('Choose a valid subscription action.', 400);
    const review = action === 'APPROVE' || action === 'REJECT';
    if (review ? actor.role !== 'ADMIN' : actor.role !== 'STUDENT') throw new SubscriptionError('This action is not permitted for your account.', 403);
    const studentId = review ? body.studentId : actor.id;
    if (typeof studentId !== 'string') throw new SubscriptionError('Student is required.', 400);
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: studentId }, include: { studentProfile: true } });
      if (!user || user.role !== 'STUDENT' || user.isBlocked) throw new SubscriptionError('Active student account not found.', 404);
      const appData = object(user.appData);
      const profile = { ...object(appData.studentProfile), id: user.id, nameAr: user.nameAr, nameEn: user.nameEn, email: user.email };
      const p: Record<string, unknown> = profile;
      const previousRequest = Object.fromEntries(['paymentRequestId', 'pendingPlanId', 'subscriptionChangeType', 'pendingExtraClassQuantity', 'bankTransferRef', 'paymentDate'].filter(key => p[key] !== undefined).map(key => [key, p[key]]));
      if (typeof p.paymentReceiptUrl === 'string') previousRequest.receiptFingerprint = createHash('sha256').update(p.paymentReceiptUrl).digest('hex');
      const previousStatus = p.verificationStatus;
      // Normalized balances are authoritative, including for older clients.
      if (user.studentProfile) Object.assign(p, { activePlanId: user.studentProfile.activePlanId, remainingLessons: user.studentProfile.remainingLessons, totalLessonsCompleted: user.studentProfile.totalLessonsCompleted, totalHoursLearned: user.studentProfile.totalHoursLearned, assignedTeacherId: user.studentProfile.assignedTeacherId });
      const active = Boolean(p.activePlanId && (p.verificationStatus === 'VERIFIED' || p.verificationStatus === 'PAUSED') && typeof p.subscriptionRenewalDate === 'string' && p.subscriptionRenewalDate >= today());
      const hasPending = p.paymentRequestStatus === 'PENDING' || Boolean(p.pendingPlanId) || p.subscriptionChangeType === 'EXTRA_CLASS' || p.verificationStatus === 'PENDING_VERIFICATION';
      const clearPending = () => { for (const key of pendingKeys) delete p[key]; };
      let notification: Record<string, unknown> | null = null;
      const notify = (titleAr: string, titleEn: string, messageAr: string, messageEn: string) => { notification = { id: `notif-${randomUUID()}`, titleAr, titleEn, messageAr, messageEn, time: new Date().toISOString(), read: false, type: 'PLAN_SUBSCRIPTION' }; };
      const welcomeSession = await tx.lesson.findFirst({ where: { studentId, isOrientationSession: true, status: { in: ['SCHEDULED', 'COMPLETED'] } }, orderBy: { date: 'desc' } });
      const schedule = async (count: number, planId: string, retainExisting: boolean) => {
        const plan = INITIAL_PLANS.find(plan => plan.id === planId);
        if (!plan) throw new SubscriptionError('Choose a valid plan.', 400);
        const teacher = await tx.user.findUnique({ where: { id: String(p.assignedTeacherId || '') }, include: { teacherProfile: true } });
        if (!teacher || teacher.role !== 'TEACHER' || teacher.isBlocked || teacher.teacherApprovalStatus !== 'APPROVED') throw new SubscriptionError('Your teacher is unavailable. Choose an approved teacher before resuming.');
        const teacherData = object(object(teacher.appData).teacher);
        const availability = { ...teacherData, workingHoursStart: teacher.teacherProfile?.workingHoursStart || teacherData.workingHoursStart || '12:00', workingHoursEnd: teacher.teacherProfile?.workingHoursEnd || teacherData.workingHoursEnd || '18:00' } as unknown as Teacher;
        const goal = object(p.quranGoal);
        const selectedDays = Array.isArray(goal.agreedWeeklyDaysAr) ? goal.agreedWeeklyDaysAr as string[] : [];
        const dayTimes = object(goal.dayTimeSlots);
        const occupied = await tx.lesson.findMany({ where: { status: 'SCHEDULED', OR: [{ teacherId: teacher.id }, { studentId }] } });
        const availableOccupied = retainExisting ? occupied : occupied.filter(lesson => lesson.studentId !== studentId || lesson.isOrientationSession);
        const generated: Prisma.LessonCreateManyInput[] = [];
        const completed = retainExisting ? 0 : await tx.lesson.count({ where: { studentId, status: 'COMPLETED', isOrientationSession: false, ...(typeof p.subscriptionStartDate === 'string' ? { date: { gte: p.subscriptionStartDate } } : {}) } });
        const partition = (prefix: 'hifz' | 'tilawah') => {
          const mode = goal[`${prefix}FahrasType`];
          const numbers = goal[`${prefix}${mode === 'JUZ' ? 'Juz' : 'Surah'}Numbers`];
          if (!Array.isArray(numbers) || !numbers.length) return [];
          const safe = numbers.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= (mode === 'JUZ' ? 30 : 114));
          if (mode === 'JUZ') return partitionJuzAcrossClasses(safe, count + completed);
          const custom = object(goal.surahAyahCustomMap);
          return partitionSurahsAcrossClasses(safe.map(number => { const range = object(custom[number]); return { number, startAyah: Number(range.startAyah || 1), endAyah: Number(range.endAyah || QURAN_SURAHS.find(surah => surah.number === number)?.totalVerses || 1) }; }), count + completed);
        };
        const hifz = partition('hifz'); const tilawah = partition('tilawah');
        const scope = (index: number, english = false) => {
          const segments = [hifz[index + completed], tilawah[index + completed]].filter(Boolean);
          if (!segments.length) return String(english ? goal.targetSurahOrJuzEn || 'Curriculum agreed with your teacher' : goal.targetSurahOrJuzAr || 'مقرر متفق عليه مع المعلم');
          return segments.map(segment => english ? `Class ${segment.classNum}: pages ${segment.startPage}–${segment.endPage}, ayahs ${segment.startAyah}–${segment.endAyah}` : `مقرر ${segment.summaryAr} • ${segment.pageRangeText}`).join(' | ');
        };
        let offset = 1;
        const origin = new Date(`${today()}T00:00:00Z`);
        const renewal = typeof p.subscriptionRenewalDate === 'string' ? p.subscriptionRenewalDate : day(new Date(origin.getTime() + 30 * 86400000));
        while (generated.length < count && offset <= 180) {
          const date = new Date(origin.getTime() + offset++ * 86400000);
          const dateStr = day(date);
          if (dateStr > renewal) break;
          if (welcomeSession && dateStr <= welcomeSession.date) continue;
          const weekday = WEEKDAYS_AR[date.getUTCDay()];
          if (selectedDays.length && !selectedDays.includes(weekday)) continue;
          const starts = generateSlotsForRanges(getTeacherAvailabilityRanges(availability, weekday), plan.lessonDurationMinutes);
          const preferred = String(dayTimes[weekday] || goal.agreedTimeSlot || '12:00');
          const candidates = starts.includes(preferred) ? [preferred, ...starts.filter(slot => slot !== preferred)] : starts;
          const time = candidates.find(time => ![...availableOccupied, ...generated].some(lesson => lesson.date === dateStr && (lesson.teacherId === teacher.id || lesson.studentId === studentId) && lessonTimesOverlap(time, plan.lessonDurationMinutes, lesson.time, lesson.durationMinutes)));
          if (!time) continue;
          generated.push({ id: `les-sub-${randomUUID()}`, studentId, teacherId: teacher.id, teacherNameAr: teacher.nameAr, teacherNameEn: teacher.nameEn, studentNameAr: user.nameAr, studentNameEn: user.nameEn, date: dateStr, time, durationMinutes: plan.lessonDurationMinutes, status: 'SCHEDULED', googleMeetUrl: '', surahTargetAr: scope(generated.length), surahTargetEn: scope(generated.length, true) });
        }
        if (generated.length !== count) throw new SubscriptionError(`Only ${generated.length} of ${count} classes fit before renewal (${renewal}) using the saved weekly days and current teacher availability. No subscription changes were saved. Update the weekly days or teacher availability, then try approval again.`);
        if (!retainExisting) await tx.lesson.updateMany({ where: { studentId, status: 'SCHEDULED', isOrientationSession: false }, data: { status: 'CANCELLED' } });
        if (generated.length) await tx.lesson.createMany({ data: generated });
      };
      if (action === 'SUBMIT_PAYMENT') {
        if (hasPending && p.paymentRequestStatus !== 'REJECTED') throw new SubscriptionError('A payment is already waiting for review.');
        if (!isValidReceiptDataUrl(body.receiptFile) || typeof body.bankRef !== 'string' || !body.bankRef.trim() || body.bankRef.length > 120) throw new SubscriptionError('A valid receipt and bank reference are required.', 400);
        const extra = body.kind === 'EXTRA_CLASS';
        if (extra && (!active || p.verificationStatus !== 'VERIFIED')) throw new SubscriptionError('Extra classes require an active paid subscription.');
        if (!extra && !INITIAL_PLANS.some(plan => plan.id === body.planId)) throw new SubscriptionError('Choose a valid plan.', 400);
        if (extra && (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 20)) throw new SubscriptionError('Choose between 1 and 20 extra classes.', 400);
        if (body.teacherId && (!active || !p.assignedTeacherId)) {
          const teacher = await tx.user.findUnique({ where: { id: body.teacherId } });
          if (!teacher || teacher.isBlocked || teacher.role !== 'TEACHER' || teacher.teacherApprovalStatus !== 'APPROVED') throw new SubscriptionError('Choose an available approved teacher.', 400);
          p.assignedTeacherId = teacher.id;
        }
        clearPending();
        Object.assign(p, { paymentRequestStatus: 'PENDING', paymentRequestId: randomUUID(), subscriptionChangeType: extra ? 'EXTRA_CLASS' : active ? 'RENEWAL' : 'NEW', paymentReceiptUrl: body.receiptFile, bankTransferRef: body.bankRef.trim(), paymentDate: today(), rejectionReason: null, ...(extra ? { pendingExtraClassQuantity: body.quantity } : { pendingPlanId: body.planId }) });
        if (!active) p.verificationStatus = 'PENDING_VERIFICATION';
      } else if (review) {
        if (!hasPending) throw new SubscriptionError('This payment has already been reviewed. Refresh the queue.');
        if (action === 'REJECT') {
          p.rejectionReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : 'Please check the receipt and resubmit.';
          p.verificationStatus = active ? p.verificationStatus : 'UNVERIFIED';
          clearPending(); p.paymentRequestStatus = 'REJECTED';
          notify('تم رفض إيصال الدفع', 'Payment receipt rejected', String(p.rejectionReason), String(p.rejectionReason));
        } else {
          const wasPaused = p.verificationStatus === 'PAUSED';
          if (!isValidReceiptDataUrl(p.paymentReceiptUrl) || !p.bankTransferRef) throw new SubscriptionError('The payment receipt is missing or invalid. Ask the student to upload a supported image or PDF again.');
          if (p.subscriptionChangeType === 'EXTRA_CLASS') {
            if (!active) throw new SubscriptionError('The paid cycle expired. Submit a renewal instead.');
            const quantity = Number(p.pendingExtraClassQuantity);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new SubscriptionError('Invalid extra-class request.', 400);
            p.remainingLessons = Number(p.remainingLessons || 0) + quantity;
            p.extraClassCredits = Number(p.extraClassCredits || 0) + quantity;
            p.extraPurchasedClassesCount = Number(p.extraPurchasedClassesCount || 0) + quantity;
          } else {
            const plan = INITIAL_PLANS.find(plan => plan.id === p.pendingPlanId);
            if (!plan) throw new SubscriptionError('The requested plan is invalid.');
            // Renewal preserves all unconsumed paid credit and extends the cycle.
            const balance = active ? Number(p.remainingLessons || 0) : 0;
            p.activePlanId = plan.id; p.remainingLessons = balance + plan.lessonsPerMonth;
            if (!active) p.extraClassCredits = 0;
            const activationStart = welcomeSession && welcomeSession.date > today() ? welcomeSession.date : today();
            p.subscriptionStartDate = active ? p.subscriptionStartDate : activationStart;
            const start = active ? String(p.subscriptionRenewalDate) : activationStart;
            p.subscriptionRenewalDate = day(new Date(new Date(`${start}T00:00:00Z`).getTime() + 30 * 86400000));
            if (!wasPaused) await schedule(plan.lessonsPerMonth, plan.id, active);
          }
          p.verificationStatus = wasPaused ? 'PAUSED' : 'VERIFIED'; clearPending(); p.paymentRequestStatus = 'APPROVED';
          notify('تم اعتماد الدفع', 'Payment approved', 'تم تحديث الاشتراك وجدول الحصص.', 'Your paid subscription and class schedule were updated.');
        }
      } else if (action === 'PAUSE') {
        if (!active || p.verificationStatus !== 'VERIFIED') throw new SubscriptionError('Only an active paid subscription can be paused.');
        p.verificationStatus = 'PAUSED'; p.pausedAt = today(); p.pauseReason = String(body.reason || '').slice(0, 2000);
        await tx.lesson.updateMany({ where: { studentId, status: 'SCHEDULED', isOrientationSession: false }, data: { status: 'CANCELLED' } });
      } else if (action === 'RESUME') {
        if (p.verificationStatus !== 'PAUSED' || !p.activePlanId) throw new SubscriptionError('Only a paused subscription can be resumed.');
        const frozenDays = typeof p.pausedAt === 'string' ? Math.max(0, Math.floor((new Date(`${today()}T00:00:00Z`).getTime() - new Date(`${p.pausedAt}T00:00:00Z`).getTime()) / 86400000)) : 0;
        if (typeof p.subscriptionRenewalDate !== 'string') throw new SubscriptionError('This subscription has no renewal date. Contact support.');
        p.subscriptionRenewalDate = day(new Date(new Date(`${p.subscriptionRenewalDate}T00:00:00Z`).getTime() + frozenDays * 86400000));
        await schedule(Number(p.remainingLessons || 0), String(p.activePlanId), false);
        p.extraClassCredits = 0;
        p.verificationStatus = 'VERIFIED'; delete p.pausedAt; delete p.pauseReason;
      } else if (action === 'CANCEL') {
        if (!['VERIFIED', 'PAUSED'].includes(String(p.verificationStatus))) throw new SubscriptionError('Only an active or paused subscription can be cancelled.');
        p.verificationStatus = 'CANCELLED'; p.nextCyclePlanId = null;
        await tx.lesson.updateMany({ where: { studentId, status: 'SCHEDULED' }, data: { status: 'CANCELLED' } });
      } else {
        if (!active) throw new SubscriptionError('Choose a next-cycle plan after activating your subscription.');
        if (body.planId && !INITIAL_PLANS.some(plan => plan.id === body.planId)) throw new SubscriptionError('Choose a valid plan.', 400);
        p.nextCyclePlanId = body.planId || null;
      }
      const notifications = Array.isArray(appData.notifications) ? appData.notifications : [];
      const history = Array.isArray(appData.subscriptionHistory) ? appData.subscriptionHistory : [];
      const event = { id: randomUUID(), action, actorId: actor.id, actorRole: actor.role, at: new Date().toISOString(), previousStatus: previousStatus || 'UNVERIFIED', status: p.verificationStatus || 'UNVERIFIED', balance: Number(p.remainingLessons || 0), ...(review ? { request: previousRequest, reason: String(body.reason || '') } : {}) };
      await tx.user.update({ where: { id: studentId }, data: { appData: { ...appData, studentProfile: p, subscriptionHistory: [event, ...history].slice(0, 100), ...(notification ? { notifications: [notification, ...notifications].slice(0, 200) } : {}) } as Prisma.InputJsonValue } });
      const normalized = { activePlanId: typeof p.activePlanId === 'string' ? p.activePlanId : null, assignedTeacherId: typeof p.assignedTeacherId === 'string' ? p.assignedTeacherId : null, remainingLessons: Number(p.remainingLessons || 0), totalLessonsCompleted: Number(p.totalLessonsCompleted || 0), totalHoursLearned: Number(p.totalHoursLearned || 0) };
      await tx.studentProfile.upsert({ where: { userId: studentId }, create: { userId: studentId, ...normalized }, update: normalized });
      return { profile: p, lessons: await tx.lesson.findMany({ where: { studentId }, orderBy: [{ date: 'asc' }, { time: 'asc' }] }) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SubscriptionError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'The schedule changed during this operation. Refresh and try again.' }, { status: 409 });
    console.error('Subscription operation failed:', error);
    return NextResponse.json({ error: 'Unable to update your subscription. No changes were saved.' }, { status: 503 });
  }
}
