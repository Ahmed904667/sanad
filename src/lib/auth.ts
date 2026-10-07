import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

function scrypt(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}
const SESSION_COOKIE = 'sanad_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const SCRYPT_KEY_LENGTH = 64;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, n, r, p, saltPart, hashPart] = encoded.split('$');
  if (algorithm !== 'scrypt' || n !== '16384' || r !== '8' || p !== '1' || !saltPart || !hashPart) return false;

  const salt = Buffer.from(saltPart, 'base64url');
  const expected = Buffer.from(hashPart, 'base64url');
  const actual = await scrypt(password, salt, expected.length, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signSession(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export async function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${payload}.${signSession(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  let expectedSignature: Buffer;
  try {
    expectedSignature = Buffer.from(signSession(payload), 'base64url');
  } catch {
    return null;
  }
  const suppliedSignature = Buffer.from(signature, 'base64url');
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; expiresAt?: number };
    if (!session.userId || !session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, nameAr: true, nameEn: true, role: true, isBlocked: true, teacherApprovalStatus: true },
    });
    if (!user || user.isBlocked) return null;
    return user;
  } catch {
    return null;
  }
}
