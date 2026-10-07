import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma, Role } from '@prisma/client';
import { hashPassword, getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initialStudentProfile, normalizePhone, isValidBirthDate, canonicalAppData } from '@/lib/business-rules';

export async function POST(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  try {
    const body = await request.json();
    const account = body?.account;
    const name = typeof account?.name === 'string' ? account.name.trim() : '';
    const email = typeof account?.email === 'string' ? account.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = account?.role === 'ADMIN' ? Role.ADMIN : account?.role === 'TEACHER' ? Role.TEACHER : account?.role === 'STUDENT' ? Role.STUDENT : null;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role || password.length < 8) {
      return NextResponse.json({ error: 'Enter a valid name, email, role, and password of at least 8 characters.' }, { status: 400 });
    }

    const phone = normalizePhone(account.phone);
    if (phone === null || !isValidBirthDate(account.birthDate)) return NextResponse.json({ error: 'Enter a valid phone number and birth date.' }, { status: 400 });
    const id = randomUUID();
    const teacher = role === Role.TEACHER ? {
      id,
      nameAr: name,
      nameEn: name,
      email,
      phone: typeof account.phone === 'string' ? account.phone : '',
      birthDate: '',
      titleAr: account.gender === 'FEMALE' ? 'معلمة قرآن' : 'معلم قرآن',
      titleEn: 'Quran Teacher',
      rating: 0,
      reviewsCount: 0,
      ijazahDetailsAr: '',
      ijazahDetailsEn: '',
      experienceYears: 0,
      languagesSpoken: ['العربية'],
      specializationsAr: [],
      specializationsEn: [],
      bioAr: '',
      bioEn: '',
      hourlyRateSar: 0,
      availableSlots: [],
      workingHoursStart: '12:00',
      workingHoursEnd: '18:00',
      bookedTimeSlots: [],
      gender: account.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
      approvalStatus: 'PENDING_ADMIN',
    } : null;
    const student = role === Role.STUDENT ? initialStudentProfile({}, { id, name, email, phone, gender: account.gender === 'FEMALE' ? 'FEMALE' : 'MALE', birthDate: account.birthDate }, []) : null;
    const appData = student ? { studentProfile: student } as unknown as Prisma.InputJsonValue
      : teacher ? { teacher } as unknown as Prisma.InputJsonValue : Prisma.JsonNull;
    const user = await prisma.user.create({
      data: {
        id,
        nameAr: name,
        nameEn: name,
        email,
        phone,
        gender: account.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
        role,
        passwordHash: await hashPassword(password),
        isBlocked: false,
        teacherApprovalStatus: role === Role.TEACHER ? 'PENDING_ADMIN' : null,
        appData,
        ...(role === Role.STUDENT ? { studentProfile: { create: {} } } : {}),
        ...(teacher ? {
          teacherProfile: {
            create: {
              titleAr: teacher.titleAr,
              titleEn: teacher.titleEn,
              ijazahDetailsAr: '',
              ijazahDetailsEn: '',
              languagesSpoken: 'العربية',
              specializations: '',
              bioAr: '',
              bioEn: '',
              hourlyRate: 0,
              ratingAvg: 0,
            },
          },
        } : {}),
      },
      select: { id: true, nameAr: true, nameEn: true, email: true, phone: true, gender: true, role: true, isBlocked: true, teacherApprovalStatus: true, studentProfile: true, appData: true },
    });
    return NextResponse.json({ user: { ...user, teacherProfile: teacher }, teacher }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Admin account creation failed:', error);
    return NextResponse.json({ error: 'Unable to create the account.' }, { status: 503 });
  }
}

export async function GET() {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nameAr: true, nameEn: true, email: true, phone: true, gender: true, role: true, isBlocked: true, teacherApprovalStatus: true, studentProfile: true, appData: true },
    });
    return NextResponse.json({ users: users.map(user => ({ ...user, appData: canonicalAppData(user.appData, user.studentProfile) })) });
  } catch (error) {
    console.error('Admin account list failed:', error);
    return NextResponse.json({ error: 'Unable to load accounts.' }, { status: 503 });
  }
}
