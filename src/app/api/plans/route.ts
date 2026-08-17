import { NextResponse } from 'next/server';
import { INITIAL_PLANS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: INITIAL_PLANS.length,
    plans: INITIAL_PLANS
  });
}
