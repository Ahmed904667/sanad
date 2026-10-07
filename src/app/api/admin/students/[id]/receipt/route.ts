import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };
const RECEIPT_DATA_URL = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export async function GET(_request: Request, context: RouteContext) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (actor.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  try {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true, appData: true } });
    if (!user || user.role !== 'STUDENT' || !user.appData || typeof user.appData !== 'object' || Array.isArray(user.appData)) {
      return NextResponse.json({ error: 'Student or receipt not found.' }, { status: 404 });
    }
    const profile = (user.appData as Record<string, unknown>).studentProfile;
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return NextResponse.json({ error: 'Student or receipt not found.' }, { status: 404 });
    }
    const receipt = (profile as Record<string, unknown>).paymentReceiptUrl;
    const match = typeof receipt === 'string' ? RECEIPT_DATA_URL.exec(receipt) : null;
    if (!match) return NextResponse.json({ error: 'This receipt must be uploaded again.' }, { status: 404 });

    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length === 0 || bytes.length > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ error: 'Receipt file is invalid or too large.' }, { status: 404 });
    }
    const extension = match[1] === 'application/pdf' ? 'pdf' : match[1].split('/')[1].replace('jpeg', 'jpg');
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': match[1],
        'Content-Length': String(bytes.length),
        'Content-Disposition': `inline; filename="receipt.${extension}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Admin receipt retrieval failed:', error);
    return NextResponse.json({ error: 'Unable to open receipt.' }, { status: 503 });
  }
}
