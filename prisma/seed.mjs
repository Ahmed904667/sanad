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

function initialAccounts() {
  return [
    { email: 'admin@sanad.com', name: 'Platform Administrator', role: Role.ADMIN },
    { email: 'teacher@sanad.com', name: 'Quran Teacher', role: Role.TEACHER },
    { email: 'student@sanad.com', name: 'Student', role: Role.STUDENT },
  ].map(account => ({ ...account, password: randomBytes(24).toString('base64url') }));
}

async function main() {
  const accounts = initialAccounts();
  // Hash before the transaction so expensive password work does not hold database locks.
  const prepared = await Promise.all(accounts.map(async ({ password, ...account }) => ({
    ...account, password, passwordHash: await hashPassword(password),
  })));
  const created = await prisma.$transaction(async tx => {
    const credentials = [];
    for (const { email, name, role, password, passwordHash } of prepared) {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && existing.role !== role) {
        throw new Error(`The initial ${role} email already belongs to a different role.`);
      }
      const user = await tx.user.upsert({
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
      // Check the returned row too: another build may have created it concurrently.
      if (user.role !== role) throw new Error(`The initial ${role} email already belongs to a different role.`);
      if (user.passwordHash === passwordHash) credentials.push({ role, email, password });
    }
    return credentials;
  });
  if (created.length) {
    console.log('Initial login credentials — save these from your private build logs. Passwords are shown only on account creation.');
    for (const account of created) console.log(JSON.stringify(account));
  }
  console.log('Initial accounts are ready; existing accounts and passwords were preserved.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unable to seed initial accounts.');
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
