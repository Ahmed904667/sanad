import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

function configuredAccounts() {
  const optional = process.argv.includes('--if-configured');
  const defaults = { ADMIN: 'Platform Administrator', TEACHER: 'Quran Teacher', STUDENT: 'Student' };
  const accounts = [];
  for (const role of [Role.ADMIN, Role.TEACHER, Role.STUDENT]) {
    const prefix = `INITIAL_${role}`;
    const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`${prefix}_PASSWORD`];
    const name = process.env[`${prefix}_NAME`]?.trim() || defaults[role];
    if (!email && !password && !process.env[`${prefix}_NAME`]) continue;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
      throw new Error(`Set a valid ${prefix}_EMAIL and a ${prefix}_PASSWORD of at least 12 characters.`);
    }
    if (accounts.some(account => account.email === email)) {
      throw new Error('Initial accounts must use different email addresses.');
    }
    accounts.push({ email, password, name, role });
  }
  if (!accounts.length && !optional) {
    throw new Error('Configure INITIAL_ADMIN, INITIAL_TEACHER, or INITIAL_STUDENT email and password variables.');
  }
  return accounts;
}

async function main() {
  const accounts = configuredAccounts();
  if (!accounts.length) {
    console.log('No initial account credentials configured; account seeding skipped.');
    return;
  }
  // Hash before the transaction so expensive password work does not hold database locks.
  const prepared = await Promise.all(accounts.map(async ({ password, ...account }) => ({
    ...account, passwordHash: await hashPassword(password),
  })));
  await prisma.$transaction(async tx => {
    for (const { email, name, role, passwordHash } of prepared) {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && existing.role !== role) {
        throw new Error(`The configured ${role} email already belongs to a different role.`);
      }
      await tx.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          nameAr: name,
          nameEn: name,
          passwordHash,
          role,
          ...(role === Role.STUDENT ? { studentProfile: { create: {} } } : {}),
          ...(role === Role.TEACHER ? {
            teacherApprovalStatus: 'APPROVED',
            teacherProfile: {
              create: {
                titleAr: 'معلم قرآن', titleEn: 'Quran Teacher',
                ijazahDetailsAr: '', ijazahDetailsEn: '',
                languagesSpoken: 'العربية', specializations: '',
                bioAr: '', bioEn: '', hourlyRate: 0, ratingAvg: 0,
              },
            },
          } : {}),
        },
      });
    }
  });
  console.log('Configured initial accounts are ready; existing accounts were preserved.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unable to seed initial accounts.');
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
