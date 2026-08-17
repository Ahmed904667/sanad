import { NextResponse } from 'next/server';
import { INITIAL_TEACHERS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: INITIAL_TEACHERS.length,
    teachers: INITIAL_TEACHERS
  });
}
