import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canonicalAppData } from '@/lib/business-rules';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';
import { INITIAL_STUDENT, INITIAL_TEACHERS, INITIAL_TEACHER_PROFILE } from '@/data/mockData';

const DEMO_ACCOUNTS = [
  {
    id: INITIAL_STUDENT.id,
    email: INITIAL_STUDENT.email,
    name: INITIAL_STUDENT.nameAr,
    role: Role.STUDENT,
    gender: 'MALE',
    appData: { studentProfile: INITIAL_STUDENT } as unknown as Prisma.InputJsonValue,
  },
  {
    id: 'tech-sulami',
    email: INITIAL_TEACHERS[0].email,
    name: INITIAL_TEACHERS[0].nameAr,
    role: Role.TEACHER,
    gender: 'MALE',
    teacherApprovalStatus: 'APPROVED',
    appData: { teacher: INITIAL_TEACHERS[0], teacherProfile: INITIAL_TEACHER_PROFILE } as unknown as Prisma.InputJsonValue,
  },
  {
    id: 'adm-001',
    email: 'admin@sanad.com',
    name: 'مدير النظام الفني',
    role: Role.ADMIN,
    gender: 'MALE',
    appData: {} as Prisma.InputJsonValue,
  },
];

async function ensureDevelopmentDemoAccount(email: string) {
  if (process.env.NODE_ENV === 'production') return;
  for (const teacher of INITIAL_TEACHERS) {
    const existingTeacher = await prisma.user.findUnique({ where: { email: teacher.email }, include: { teacherProfile: true } });
    if (existingTeacher) {
      if (existingTeacher.role === Role.TEACHER && !existingTeacher.teacherProfile) {
        await prisma.teacherProfile.create({
          data: {
            userId: existingTeacher.id,
            titleAr: teacher.titleAr,
            titleEn: teacher.titleEn,
            ijazahDetailsAr: teacher.ijazahDetailsAr,
            ijazahDetailsEn: teacher.ijazahDetailsEn,
            experienceYears: teacher.experienceYears,
            languagesSpoken: teacher.languagesSpoken.join(','),
            specializations: teacher.specializationsAr.join(','),
            bioAr: teacher.bioAr,
            bioEn: teacher.bioEn,
            hourlyRate: teacher.hourlyRateSar,
            ratingAvg: teacher.rating,
            totalReviews: teacher.reviewsCount,
            workingHoursStart: teacher.workingHoursStart,
            workingHoursEnd: teacher.workingHoursEnd,
            bookedTimeSlots: JSON.stringify(teacher.bookedTimeSlots),
          },
        });
      }
      continue;
    }
    const teacherPasswordHash = await hashPassword('123456');
    try {
      await prisma.user.create({
        data: {
          id: teacher.id,
          email: teacher.email.toLowerCase(),
          nameAr: teacher.nameAr,
          nameEn: teacher.nameEn,
          phone: teacher.phone,
          gender: teacher.gender,
          passwordHash: teacherPasswordHash,
          role: Role.TEACHER,
          teacherApprovalStatus: teacher.approvalStatus,
          appData: { teacher } as unknown as Prisma.InputJsonValue,
          teacherProfile: {
            create: {
              titleAr: teacher.titleAr,
              titleEn: teacher.titleEn,
              ijazahDetailsAr: teacher.ijazahDetailsAr,
              ijazahDetailsEn: teacher.ijazahDetailsEn,
              experienceYears: teacher.experienceYears,
              languagesSpoken: teacher.languagesSpoken.join(','),
              specializations: teacher.specializationsAr.join(','),
              bioAr: teacher.bioAr,
              bioEn: teacher.bioEn,
              hourlyRate: teacher.hourlyRateSar,
              ratingAvg: teacher.rating,
              totalReviews: teacher.reviewsCount,
              workingHoursStart: teacher.workingHoursStart,
              workingHoursEnd: teacher.workingHoursEnd,
              bookedTimeSlots: JSON.stringify(teacher.bookedTimeSlots),
            },
          },
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    }
  }

  const demo = DEMO_ACCOUNTS.find(account => account.email.toLowerCase() === email);
  if (!demo) return;

  const existing = await prisma.user.findUnique({ where: { email: demo.email }, include: { studentProfile: true } });
  if (existing) {
    if (!existing.passwordHash) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash: await hashPassword('123456') } });
    }
    if (existing.role === Role.STUDENT && !existing.studentProfile) {
      await prisma.studentProfile.create({ data: { userId: existing.id } });
    }
    return;
  }

  await prisma.user.create({
    data: {
      id: demo.id,
      email: demo.email,
      nameAr: demo.name,
      nameEn: demo.name,
      passwordHash: await hashPassword('123456'),
      role: demo.role,
      gender: demo.gender,
      teacherApprovalStatus: 'teacherApprovalStatus' in demo ? demo.teacherApprovalStatus : null,
      appData: demo.appData,
      ...(demo.role === Role.STUDENT ? { studentProfile: { create: {} } } : {}),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const email = identifier.toLowerCase();
    await ensureDevelopmentDemoAccount(email);
    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: identifier }] },
      include: { studentProfile: true },
    });

    if (!user || user.isBlocked || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        nameAr: user.nameAr,
        nameEn: user.nameEn,
        email: user.email,
        role: user.role,
        teacherApprovalStatus: user.teacherApprovalStatus,
        phone: user.phone, gender: user.gender,
        appData: canonicalAppData(user.appData, user.studentProfile),
      },
    });
  } catch (error) {
    console.error('Authentication failed:', error);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
}
