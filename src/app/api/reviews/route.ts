import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INITIAL_TEACHERS } from '@/data/mockData';

export async function GET() {
  try {
    const viewer = await getAuthenticatedUser();
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
    return NextResponse.json({ reviews: reviews.map(review => ({
      id: review.id,
      isMine: Boolean(viewer && review.studentId === viewer.id),
      teacherId: review.teacherId,
      lessonId: review.lessonId,
      studentNameAr: review.studentNameAr,
      studentNameEn: review.studentNameEn,
      rating: review.rating,
      commentAr: review.commentAr,
      commentEn: review.commentEn,
      date: review.createdAt.toISOString().slice(0, 10),
    })) });
  } catch (error) {
    console.error('Review list failed:', error);
    return NextResponse.json({ error: 'Unable to load reviews.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== Role.STUDENT) return NextResponse.json({ error: 'Only students can submit reviews.' }, { status: 403 });

  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === 'string' ? body.teacherId : '';
    const lessonId = typeof body.lessonId === 'string' ? body.lessonId : '';
    const rating = Number(body.rating);
    const commentAr = typeof body.commentAr === 'string' ? body.commentAr.trim() : '';
    const commentEn = typeof body.commentEn === 'string' ? body.commentEn.trim() : commentAr;
    if (!teacherId || !lessonId || !Number.isInteger(rating) || rating < 1 || rating > 5 || commentAr.length < 2 || commentAr.length > 2000 || commentEn.length > 2000) {
      return NextResponse.json({ error: 'Review details are invalid.' }, { status: 400 });
    }

    const completedLesson = await prisma.lesson.findFirst({ where: { id: lessonId, studentId: actor.id, teacherId, status: 'COMPLETED' }, select: { id: true } });
    if (!completedLesson) return NextResponse.json({ error: 'You can review a teacher after completing a lesson with them.' }, { status: 403 });
    const teacherUser = await prisma.user.findUnique({ where: { id: teacherId }, select: { appData: true } });
    if (!teacherUser && !(process.env.NODE_ENV !== 'production' && INITIAL_TEACHERS.some(teacher => teacher.id === teacherId))) {
      return NextResponse.json({ error: 'Teacher account not found.' }, { status: 404 });
    }
    const student = await prisma.user.findUnique({ where: { id: actor.id }, select: { nameAr: true, nameEn: true } });
    if (!student) return NextResponse.json({ error: 'Student account not found.' }, { status: 404 });

    const review = await prisma.$transaction(async transaction => {
      const existing = await transaction.review.findFirst({ where: { studentId: actor.id, lessonId } });
      const saved = existing ? await transaction.review.update({
        where: { id: existing.id }, data: { teacherId, studentNameAr: student.nameAr, studentNameEn: student.nameEn, rating, commentAr, commentEn },
      }) : await transaction.review.create({
        data: { studentId: actor.id, lessonId, teacherId, studentNameAr: student.nameAr, studentNameEn: student.nameEn, rating, commentAr, commentEn },
      });
      const ratings = await transaction.review.findMany({ where: { teacherId }, select: { rating: true } });
      const ratingAvg = ratings.reduce((sum, row) => sum + row.rating, 0) / Math.max(1, ratings.length);
      const currentTeacher = await transaction.user.findUnique({ where: { id: teacherId }, select: { appData: true } });
      if (currentTeacher) {
        const data = currentTeacher.appData && typeof currentTeacher.appData === 'object' && !Array.isArray(currentTeacher.appData) ? currentTeacher.appData as Record<string, Prisma.JsonValue> : {};
        const teacher = data.teacher && typeof data.teacher === 'object' && !Array.isArray(data.teacher) ? data.teacher as Record<string, Prisma.JsonValue> : {};
        await transaction.user.update({ where: { id: teacherId }, data: { appData: { ...data, teacher: { ...teacher, rating: ratingAvg, reviewsCount: ratings.length } } } });
        await transaction.teacherProfile.updateMany({ where: { userId: teacherId }, data: { ratingAvg, totalReviews: ratings.length } });
      }
      return saved;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ review: { ...review, studentId: actor.id, date: review.createdAt.toISOString().slice(0, 10) } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Another review changed at the same time. Please try again.' }, { status: 409 });
    console.error('Review submission failed:', error);
    return NextResponse.json({ error: 'Unable to submit review.' }, { status: 503 });
  }
}
