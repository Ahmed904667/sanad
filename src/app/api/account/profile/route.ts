import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizePhone, canonicalAppData } from '@/lib/business-rules';

/** Private profile: pending teachers can load their own identity without public discovery. */
export async function GET() {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { id: actor.id }, select: {
      id: true, nameAr: true, nameEn: true, email: true, phone: true, gender: true,
      role: true, teacherApprovalStatus: true, appData: true, teacherProfile: true, studentProfile: true,
    } });
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    const root = user.appData && typeof user.appData === 'object' && !Array.isArray(user.appData) ? user.appData as Record<string, unknown> : {};
    const stored = root.teacher && typeof root.teacher === 'object' && !Array.isArray(root.teacher) ? root.teacher as Record<string, unknown> : {};
    const profile = user.teacherProfile;
    const completed = actor.role === 'TEACHER' ? await prisma.lesson.findMany({ where: { teacherId: actor.id, status: 'COMPLETED' }, select: { studentId: true, durationMinutes: true } }) : [];
    const teacher = actor.role === 'TEACHER' ? {
      ...stored, id: user.id, nameAr: user.nameAr, nameEn: user.nameEn, email: user.email,
      phone: user.phone || '', gender: user.gender || 'MALE', approvalStatus: user.teacherApprovalStatus,
      ...(profile ? { titleAr: profile.titleAr, titleEn: profile.titleEn, ijazahDetailsAr: profile.ijazahDetailsAr,
        ijazahDetailsEn: profile.ijazahDetailsEn, experienceYears: profile.experienceYears,
        languagesSpoken: profile.languagesSpoken.split(',').filter(Boolean), specializationsAr: profile.specializations.split(',').filter(Boolean),
        bioAr: profile.bioAr, bioEn: profile.bioEn, hourlyRateSar: profile.hourlyRate, rating: profile.totalReviews > 0 ? profile.ratingAvg : 0,
        reviewsCount: profile.totalReviews, workingHoursStart: profile.workingHoursStart, workingHoursEnd: profile.workingHoursEnd,
        ijazahChainAr: profile.ijazahDetailsAr, ijazahChainEn: profile.ijazahDetailsEn, ratingAvg: profile.totalReviews > 0 ? profile.ratingAvg : 0,
      } : {}),
      totalStudents: new Set(completed.map(item => item.studentId)).size,
      totalHoursTaught: completed.reduce((sum, item) => sum + item.durationMinutes / 60, 0),
    } : null;
    return NextResponse.json({ user: { ...user, appData: canonicalAppData(user.appData, user.studentProfile) }, teacher }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Private profile lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load your profile.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = normalizePhone(body.phone);
    if (phone === null) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const experienceYears = Number(body.experienceYears);
    const languages = typeof body.languages === 'string' ? body.languages.split(',').map((value: string) => value.trim()).filter(Boolean) : [];
    const specializations = typeof body.specializations === 'string' ? body.specializations.split(',').map((value: string) => value.trim()).filter(Boolean) : [];
    const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid name and email address.' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: actor.id } }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 });
    if (actor.role === 'TEACHER' && body.experienceYears !== undefined && (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60)) {
      return NextResponse.json({ error: 'Experience must be a whole number from 0 to 60.' }, { status: 400 });
    }
    if ([title, bio, body.ijazahChain].some(value => typeof value === 'string' && value.length > 2000) || languages.length > 12 || specializations.length > 20) {
      return NextResponse.json({ error: 'Teacher profile details are too long.' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async transaction => {
    const user = await transaction.user.findUnique({ where: { id: actor.id }, select: { appData: true } });
    if (!user) throw new Error('ACCOUNT_NOT_FOUND');
    const appData = user.appData && typeof user.appData === 'object' && !Array.isArray(user.appData)
      ? user.appData as Record<string, Prisma.JsonValue>
      : {};
    const key = actor.role === 'STUDENT' ? 'studentProfile' : actor.role === 'TEACHER' ? 'teacherProfile' : null;
    const previousProfile = key && appData[key] && typeof appData[key] === 'object' && !Array.isArray(appData[key])
      ? appData[key] as Record<string, Prisma.JsonValue>
      : {};
    let updatedAppData: Prisma.InputJsonValue | typeof Prisma.JsonNull = user.appData
      ? user.appData as unknown as Prisma.InputJsonValue
      : Prisma.JsonNull;
    if (key) {
      const updatedProfile = {
        ...previousProfile,
        nameAr: name,
        nameEn: name,
        email,
        phone,
        ...(actor.role === 'TEACHER' ? {
          ...(typeof body.ijazahChain === 'string' ? { ijazahChainAr: body.ijazahChain, ijazahChainEn: body.ijazahChain } : {}),
          ...(body.experienceYears !== undefined ? { experienceYears } : {}),
          ...(typeof body.languages === 'string' ? { languagesSpoken: languages } : {}),
          ...(typeof body.specializations === 'string' ? { specializationsAr: specializations } : {}),
          ...(typeof body.bio === 'string' ? { bioAr: bio, bioEn: bio } : {}),
          ...(title ? { titleAr: title, titleEn: title } : {}),
        } : {}),
      };
      const storedTeacher = appData.teacher && typeof appData.teacher === 'object' && !Array.isArray(appData.teacher)
        ? appData.teacher as Record<string, Prisma.JsonValue>
        : {};
      const teacherData = actor.role === 'TEACHER' ? { teacher: {
        ...storedTeacher,
        nameAr: name,
        nameEn: name,
        email,
        phone,
        ...(typeof body.ijazahChain === 'string' ? { ijazahDetailsAr: body.ijazahChain, ijazahDetailsEn: body.ijazahChain } : {}),
        ...(body.experienceYears !== undefined ? { experienceYears } : {}),
        ...(typeof body.languages === 'string' ? { languagesSpoken: languages } : {}),
        ...(typeof body.specializations === 'string' ? { specializationsAr: specializations } : {}),
        ...(typeof body.bio === 'string' ? { bioAr: bio, bioEn: bio } : {}),
        ...(title ? { titleAr: title, titleEn: title } : {}),
      } } : {};
      updatedAppData = { ...appData, [key]: updatedProfile, ...teacherData } as Prisma.InputJsonValue;
    }

      const result = await transaction.user.update({
        where: { id: actor.id },
        data: { nameAr: name, nameEn: name, email, phone, appData: updatedAppData },
        select: { id: true, nameAr: true, nameEn: true, email: true, role: true, teacherApprovalStatus: true, appData: true },
      });
      if (actor.role === 'TEACHER') {
        await transaction.teacherProfile.updateMany({ where: { userId: actor.id }, data: {
          ...(title ? { titleAr: title, titleEn: title } : {}),
          ...(typeof body.ijazahChain === 'string' ? { ijazahDetailsAr: body.ijazahChain, ijazahDetailsEn: body.ijazahChain } : {}),
          ...(body.experienceYears !== undefined ? { experienceYears } : {}),
          ...(typeof body.languages === 'string' ? { languagesSpoken: languages.join(',') } : {}),
          ...(typeof body.specializations === 'string' ? { specializations: specializations.join(',') } : {}),
          ...(typeof body.bio === 'string' ? { bioAr: bio, bioEn: bio } : {}),
        } });
      }
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACCOUNT_NOT_FOUND') return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Your account changed concurrently. Reload and try again.' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 });
    }
    console.error('Profile update failed:', error);
    return NextResponse.json({ error: 'Unable to update your profile.' }, { status: 503 });
  }
}
