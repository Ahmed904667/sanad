import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { appData: true } });
  const data = user?.appData && typeof user.appData === 'object' && !Array.isArray(user.appData)
    ? user.appData as Record<string, Prisma.JsonValue>
    : {};
  return NextResponse.json({ notifications: Array.isArray(data.notifications) ? data.notifications : [] });
}

export async function PATCH(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  try {
    const body = await request.json();
    if (!Array.isArray(body.notifications) || body.notifications.length > 200) {
      return NextResponse.json({ error: 'Notifications must be an array with at most 200 entries.' }, { status: 400 });
    }
    const notifications = body.notifications.filter((item: unknown) => {
      if (!item || typeof item !== 'object') return false;
      const notification = item as Record<string, unknown>;
      return typeof notification.id === 'string' && notification.id.length <= 100 &&
        typeof notification.titleAr === 'string' && notification.titleAr.length <= 200 &&
        typeof notification.titleEn === 'string' && notification.titleEn.length <= 200 &&
        typeof notification.messageAr === 'string' && notification.messageAr.length <= 2000 &&
        typeof notification.messageEn === 'string' && notification.messageEn.length <= 2000 &&
        typeof notification.read === 'boolean' && typeof notification.type === 'string';
    });
    if (notifications.length !== body.notifications.length) {
      return NextResponse.json({ error: 'One or more notifications are invalid.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { appData: true } });
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    const data = user.appData && typeof user.appData === 'object' && !Array.isArray(user.appData)
      ? user.appData as Record<string, Prisma.JsonValue>
      : {};
    const persisted = Array.isArray(data.notifications) ? data.notifications : [];
    const incomingIds = new Set(notifications.map((item: { id: string }) => item.id));
    const merged = [...notifications, ...persisted.filter(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      return !incomingIds.has(String((item as Record<string, unknown>).id || ''));
    })].slice(0, 200);
    await prisma.user.update({ where: { id: actor.id }, data: { appData: { ...data, notifications: merged } as Prisma.InputJsonValue } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification sync failed:', error);
    return NextResponse.json({ error: 'Unable to save notifications.' }, { status: 503 });
  }
}
