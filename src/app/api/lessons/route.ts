import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_LESSONS } from '@/data/mockData';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');

    const whereClause: any = {};
    if (studentId) whereClause.studentId = studentId;
    if (teacherId) whereClause.teacherId = teacherId;

    let dbLessons = await prisma.lesson.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(dbLessons);
  } catch (error) {
    console.error('Error fetching lessons from DB:', error);
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  try {
    await prisma.lesson.deleteMany({});
    return NextResponse.json({ success: true, message: 'All lessons cleared' });
  } catch (error) {
    console.error('Error deleting lessons:', error);
    return NextResponse.json({ error: 'Failed to delete lessons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { lessons, studentId } = await req.json();

    if (!Array.isArray(lessons)) {
      return NextResponse.json({ error: 'Invalid lessons format' }, { status: 400 });
    }

    // Extract student IDs present in this batch
    const incomingStudentIds = new Set<string>();
    const incomingLessonIds = new Set<string>();

    for (const les of lessons) {
      const sId = les.studentId || studentId;
      if (sId) incomingStudentIds.add(sId);
      if (les.id) incomingLessonIds.add(les.id);
    }
    if (studentId) incomingStudentIds.add(studentId);

    // Delete obsolete SCHEDULED lessons for these students that are no longer in the updated plan (preserve COMPLETED lessons!)
    for (const sId of Array.from(incomingStudentIds)) {
      try {
        await prisma.lesson.deleteMany({
          where: {
            studentId: sId,
            status: 'SCHEDULED',
            id: { notIn: Array.from(incomingLessonIds) }
          }
        });
      } catch (e) {
        console.error(`Failed to clean up obsolete scheduled lessons for student ${sId}:`, e);
      }
    }

    // Upsert each lesson individually to prevent wiping other students' or teachers' data
    for (const les of lessons) {
      const lesId = les.id || `les-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const lesStudentId = les.studentId || studentId || 'std-8941';
      const lesTeacherId = les.teacherId || 'tech-sulami';
      const status = les.status === 'COMPLETED' ? 'COMPLETED' : les.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED';

      await prisma.lesson.upsert({
        where: { id: lesId },
        update: {
          studentId: lesStudentId,
          teacherId: lesTeacherId,
          date: les.date,
          time: les.time,
          durationMinutes: les.durationMinutes || 30,
          status,
          googleMeetUrl: les.googleMeetUrl !== undefined ? les.googleMeetUrl : '',
          notes: les.notes || null,
          surahTargetAr: les.surahTargetAr || null,
          surahTargetEn: les.surahTargetEn || null
        },
        create: {
          id: lesId,
          studentId: lesStudentId,
          teacherId: lesTeacherId,
          date: les.date,
          time: les.time,
          durationMinutes: les.durationMinutes || 30,
          status,
          googleMeetUrl: les.googleMeetUrl !== undefined ? les.googleMeetUrl : '',
          notes: les.notes || null,
          surahTargetAr: les.surahTargetAr || null,
          surahTargetEn: les.surahTargetEn || null
        }
      });
    }

    const updated = await prisma.lesson.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, count: updated.length, lessons: updated });
  } catch (error) {
    console.error('Error saving lessons to DB:', error);
    return NextResponse.json({ error: 'Failed to save lessons to database' }, { status: 500 });
  }
}
