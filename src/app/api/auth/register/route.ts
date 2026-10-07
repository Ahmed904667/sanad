import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword } from '@/lib/auth';
import { parseTeacherAvailability } from '@/lib/teacher-availability';
import { lessonFitsAvailability, lessonTimesOverlap, WEEKDAYS_AR } from '@/utils/availability';
import { INITIAL_PLANS } from '@/data/mockData';
import { asRecord, initialStudentProfile, isValidBirthDate, normalizePhone, isCalendarDate, lessonStartsAt, isValidQuranGoal } from '@/lib/business-rules';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 8_000_000) return NextResponse.json({ error: 'Registration data is too large.' }, { status: 413 });
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Registration must be a JSON object.' }, { status: 400 });
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role === 'TEACHER' ? Role.TEACHER : body.role === 'STUDENT' ? Role.STUDENT : null;
    const gender = body.gender === 'FEMALE' ? 'FEMALE' : body.gender === 'MALE' ? 'MALE' : null;
    const phone = normalizePhone(body.phone);
    const birthDate = typeof body.birthDate === 'string' ? body.birthDate : asRecord(asRecord(body.profileData).studentProfile).birthDate;
    if (phone === null || !isValidBirthDate(birthDate)) {
      return NextResponse.json({ error: 'Enter a valid phone number and a birth date that is not in the future.' }, { status: 400 });
    }
    const ijazahDetails = typeof body.ijazahDetails === 'string' ? body.ijazahDetails.trim() : '';

    if (!name || !email || !password || !role || !gender) {
      return NextResponse.json({ error: 'Name, email, password, role, and gender are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (name.length > 120 || email.length > 254 || password.length > 1024 || ijazahDetails.length > 2000) return NextResponse.json({ error: 'Account details are too long.' }, { status: 400 });
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (role === Role.TEACHER && !ijazahDetails) {
      return NextResponse.json({ error: 'Ijazah details are required for teacher applications.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const teacherApprovalStatus = role === Role.TEACHER ? 'PENDING_ADMIN' : null;
    const teacher = role === Role.TEACHER ? {
      id: `tech-${randomUUID()}`,
      nameAr: name,
      nameEn: name,
      email,
      phone: phone || '',
      birthDate: typeof birthDate === 'string' ? birthDate : '',
      titleAr: gender === 'FEMALE' ? 'معلمة قرآن مجازة' : 'معلم قرآن مجاز',
      titleEn: 'Quran Teacher',
      rating: 0,
      reviewsCount: 0,
      ijazahDetailsAr: ijazahDetails,
      ijazahDetailsEn: ijazahDetails,
      experienceYears: 0,
      languagesSpoken: ['العربية'],
      specializationsAr: Array.isArray(body.specializations) ? body.specializations.filter((item: unknown) => typeof item === 'string') : [],
      specializationsEn: [],
      bioAr: '',
      bioEn: '',
      hourlyRateSar: 0,
      availableSlots: [],
      workingHoursStart: '12:00',
      workingHoursEnd: '18:00',
      bookedTimeSlots: [],
      gender,
      approvalStatus: 'PENDING_ADMIN' as const,
    } : null;

    const rawGoal = asRecord(asRecord(body.profileData).studentProfile).quranGoal;
    if (rawGoal !== undefined && !isValidQuranGoal(rawGoal)) return NextResponse.json({ error: 'Learning goal is invalid.' }, { status: 400 });
    const userId = teacher?.id || randomUUID();
    const student = role === Role.STUDENT ? initialStudentProfile(asRecord(body.profileData).studentProfile, {
      id: userId, name, email, phone, gender, birthDate: typeof birthDate === 'string' ? birthDate : '',
    }, INITIAL_PLANS.map(plan => plan.id)) : null;
    if (student?.assignedTeacherId) {
      const chosenTeacher = await prisma.user.findUnique({ where: { id: student.assignedTeacherId }, select: { role: true, teacherApprovalStatus: true, isBlocked: true } });
      if (!chosenTeacher || chosenTeacher.role !== Role.TEACHER || chosenTeacher.teacherApprovalStatus !== 'APPROVED' || chosenTeacher.isBlocked) {
        return NextResponse.json({ error: 'Choose an approved, available teacher before registering.' }, { status: 400 });
      }
    }
    const profileData = (student ? { studentProfile: student } : { teacher }) as unknown as Prisma.InputJsonValue;

    const initialLessons = body.initialLessons;
    if (initialLessons !== undefined && (!Array.isArray(initialLessons) || initialLessons.length > 1 || initialLessons.some(item => !item || typeof item !== 'object' || item.isOrientationSession !== true))) {
      return NextResponse.json({ error: 'Only one initial orientation class can be booked before payment approval.' }, { status: 400 });
    }
    const user = await prisma.$transaction(async tx => {
      const created = await tx.user.create({
      data: {
        id: userId,
        email,
        nameAr: name,
        nameEn: name,
        passwordHash,
        phone,
        gender,
        role,
        teacherApprovalStatus,
        appData: profileData,
        ...(student ? { studentProfile: { create: { assignedTeacherId: student.assignedTeacherId } } } : {}),
        ...(teacher ? {
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
              ratingAvg: 0,
            },
          },
        } : {}),
      },
    });

      if (student?.assignedTeacherId && Array.isArray(initialLessons) && initialLessons.length) {
        const input = asRecord(initialLessons[0]);
        const date = typeof input.date === 'string' ? input.date : '';
        const time = typeof input.time === 'string' ? input.time : '';
        const duration = Number(input.durationMinutes);
        if (input.teacherId !== student.assignedTeacherId || !isCalendarDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isInteger(duration) || duration < 5 || duration > 20 || lessonStartsAt(date, time) <= Date.now() || lessonStartsAt(date, time) > Date.now() + 180 * 86_400_000) throw new Error('ORIENTATION_INVALID');
        const chosenTeacher = await tx.user.findUnique({ where: { id: student.assignedTeacherId }, select: { id: true, role: true, nameAr: true, nameEn: true, isBlocked: true, teacherApprovalStatus: true, appData: true, teacherProfile: true } });
        if (!chosenTeacher || chosenTeacher.role !== 'TEACHER' || chosenTeacher.isBlocked || chosenTeacher.teacherApprovalStatus !== 'APPROVED') throw new Error('ORIENTATION_INVALID');
        const storedTeacher = asRecord(chosenTeacher.appData).teacher || chosenTeacher.teacherProfile;
        const day = WEEKDAYS_AR[new Date(`${date}T12:00:00Z`).getUTCDay()];
        if (!lessonFitsAvailability(time, duration, parseTeacherAvailability(storedTeacher, day))) throw new Error('ORIENTATION_UNAVAILABLE');
        const bookings = await tx.lesson.findMany({ where: { teacherId: chosenTeacher.id, date, status: 'SCHEDULED' }, select: { time: true, durationMinutes: true } });
        if (bookings.some(item => lessonTimesOverlap(time, duration, item.time, item.durationMinutes))) throw new Error('ORIENTATION_UNAVAILABLE');
        await tx.lesson.create({ data: {
          id: typeof input.id === 'string' && input.id.length < 200 ? input.id : `les-orient-${randomUUID()}`,
          studentId: created.id, teacherId: chosenTeacher.id,
          teacherNameAr: chosenTeacher.nameAr, teacherNameEn: chosenTeacher.nameEn,
          studentNameAr: name, studentNameEn: name, date, time, durationMinutes: duration,
          status: 'SCHEDULED', isOrientationSession: true, googleMeetUrl: '',
          surahTargetAr: typeof input.surahTargetAr === 'string' ? input.surahTargetAr.slice(0, 1000) : null,
          surahTargetEn: typeof input.surahTargetEn === 'string' ? input.surahTargetEn.slice(0, 1000) : null,
        } });
      }
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        nameAr: user.nameAr,
        nameEn: user.nameEn,
        email: user.email,
        role: user.role,
        teacherApprovalStatus: user.teacherApprovalStatus,
        appData: user.appData,
      },
      teacher,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('ORIENTATION_')) return NextResponse.json({ error: 'The orientation time is invalid or no longer available. Choose another time; your account has not been created.' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Availability changed during signup. Retry your selected time.' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Unable to create your account right now.' }, { status: 500 });
  }
}
