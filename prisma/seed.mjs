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

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Platform Administrator';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
    throw new Error('Set a valid INITIAL_ADMIN_EMAIL and an INITIAL_ADMIN_PASSWORD of at least 12 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.ADMIN) throw new Error('The configured email already belongs to a non-admin account.');
    console.log('An administrator account with that email already exists; no changes were made.');
    return;
  }

  await prisma.user.create({
    data: {
      email,
      nameAr: name,
      nameEn: name,
      passwordHash: await hashPassword(password),
      role: Role.ADMIN,
    },
  });
  console.log('Initial administrator account created.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unable to seed administrator account.');
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
