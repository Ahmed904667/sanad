import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canonicalAppData } from '@/lib/business-rules';

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) return NextResponse.json({ user: null }, { status: 200 });

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, nameAr: true, nameEn: true, role: true, teacherApprovalStatus: true, phone: true, gender: true, studentProfile: true, appData: true },
    });
    if (!user) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({ user: { ...user, appData: canonicalAppData(user.appData, user.studentProfile) } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Session lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load session.' }, { status: 500 });
  }
}
