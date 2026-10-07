/** Local-only regression suite. Creates UUID-named QA accounts and removes only those records. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');
if (process.env.SANAD_LOCAL_REGRESSION !== '1') throw new Error('Set SANAD_LOCAL_REGRESSION=1 to run disposable local database tests.');
if (!['localhost', '127.0.0.1', '::1'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Regression tests require a local database.');
const db = new PrismaClient();
const base = process.env.SANAD_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This suite only runs against a local development app.');
const prefix = `qa.fixrules.${randomUUID()}`;
const password = 'QaRules2026!';
const accounts = [];
let teacherId;
const future = offset => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
async function call(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${path}: non-JSON HTTP ${response.status}`); }
  return { status: response.status, json, version: response.headers.get('X-Schedule-Version'), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
function expect(result, status, label) { assert.equal(result.status, status, `${label}: ${result.status} (${result.json.error || ''})`); console.log(`PASS ${label}`); }
async function register(role, suffix, overrides = {}) {
  const result = await call('/api/auth/register', { method: 'POST', body: { role, name: `QA Rules ${suffix}`, email: `${prefix}.${suffix}@example.com`, password, gender: 'MALE', phone: '+966500000007', ...(role === 'TEACHER' ? { ijazahDetails: 'Synthetic QA qualification; not a real teaching certificate.' } : {}), ...overrides } });
  if (result.status === 201) accounts.push(result.json.user.id);
  return result;
}
function lesson(studentId, id, overrides = {}) { return { id, studentId, teacherId, date: future(3), time: '16:00', durationMinutes: 5, status: 'SCHEDULED', googleMeetUrl: '', ...overrides }; }

try {
  const admin = await call('/api/auth/login', { method: 'POST', body: { identifier: 'admin@sanad.com', password: '123456' } });
  expect(admin, 200, 'admin legitimate login');
  const teacher = await register('TEACHER', 'teacher', { birthDate: '2000-01-01' });
  expect(teacher, 201, 'valid teacher application'); teacherId = teacher.json.user.id;
  const privatePending = await call('/api/account/profile', { cookie: teacher.cookie });
  expect(privatePending, 200, 'pending teacher private profile');
  assert.equal(privatePending.json.teacher.id, teacherId); assert.equal(privatePending.json.teacher.phone, '+966500000007');
  expect(await call('/api/admin/accounts/' + teacherId, { method: 'PATCH', cookie: admin.cookie, body: { teacherApprovalStatus: 'APPROVED' } }), 200, 'approve synthetic teacher');
  expect(await call('/api/account/profile', { method: 'PATCH', cookie: teacher.cookie, body: { name: 'QA Rules Teacher', email: `${prefix}.teacher@example.com`, phone: '+966500000007', languages: '', specializations: '', experienceYears: 0 } }), 200, 'clear teacher arrays');
  const cleared = await call('/api/account/profile', { cookie: teacher.cookie }); assert.deepEqual(cleared.json.teacher.languagesSpoken, []); assert.deepEqual(cleared.json.teacher.specializationsAr, []);
  expect(await register('TEACHER', 'badphone', { phone: 'not-a-phone' }), 400, 'invalid phone rejected');
  expect(await register('TEACHER', 'baddob', { birthDate: '90101-09-20' }), 400, 'invalid and future DOB rejected');

  const forged = await register('STUDENT', 'forged', { profileData: { role: 'ADMIN', teacherProfile: { id: 'tech-sulami' }, studentProfile: { assignedTeacherId: teacherId, verificationStatus: 'VERIFIED', activePlanId: 'plan-intensive', remainingLessons: 999, totalLessonsCompleted: 99, totalHoursLearned: 999, subscriptionRenewalDate: '2099-01-01', extraClassCredits: 999 } } });
  expect(forged, 201, 'malicious signup is safely normalized');
  const profile = forged.json.user.appData.studentProfile;
  assert.equal(profile.verificationStatus, 'UNVERIFIED'); assert.equal(profile.remainingLessons, 0); assert.equal(profile.activePlanId, null); assert.equal(profile.totalLessonsCompleted, 0); assert.ok(!forged.json.user.appData.teacherProfile);
  const persisted = await call('/api/auth/session', { cookie: forged.cookie }); assert.equal(persisted.json.user.appData.studentProfile.remainingLessons, 0);
  const studentId = forged.json.user.id;
  expect(await call('/api/student/profile', { method: 'PATCH', cookie: forged.cookie, body: { profile: { verificationStatus: 'VERIFIED', remainingLessons: 100 } } }), 403, 'profile alias cannot grant entitlement');
  expect(await call('/api/student/profile', { method: 'PATCH', cookie: forged.cookie, body: { profile: { verificationStatus: 'VERIFIED', activePlanId: 'plan-intensive' } } }), 403, 'alternate profile alias cannot grant active plan');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-unpaid`)] } }), 409, 'unpaid regular booking rejected');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-invalid-date`, { date: '2026-02-31' })] } }), 400, 'impossible lesson date rejected');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-javascript`, { googleMeetUrl: 'javascript:alert(1)' })] } }), 400, 'executable meeting link rejected');
  const orientationId = `${prefix}-orientation`;
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, orientationId, { isOrientationSession: true })] } }), 200, 'one legitimate unpaid orientation accepted');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-orientation-two`, { isOrientationSession: true, time: '17:00' })] } }), 409, 'orientation exemption cannot be reused');
  const studentSchedule = await call('/api/lessons', { cookie: forged.cookie });
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { baseVersion: studentSchedule.version, lessons: [{ ...studentSchedule.json[0], googleMeetUrl: 'https://example.com' }] } }), 403, 'student cannot replace meeting link');
  const teacherSchedule = await call('/api/lessons', { cookie: teacher.cookie });
  expect(await call('/api/lessons', { method: 'POST', cookie: teacher.cookie, body: { baseVersion: teacherSchedule.version, lessons: [{ ...teacherSchedule.json[0], status: 'COMPLETED' }] } }), 409, 'future teacher completion rejected');
  expect(await call('/api/lessons', { method: 'POST', cookie: teacher.cookie, body: { baseVersion: teacherSchedule.version, lessons: [{ ...teacherSchedule.json[0], status: 'COMPLETED', date: '2020-01-01' }] } }), 409, 'backdated completion bypass rejected');
  expect(await call('/api/lessons', { method: 'POST', cookie: teacher.cookie, body: { baseVersion: teacherSchedule.version, lessons: [{ ...teacherSchedule.json[0], googleMeetUrl: 'https://meet.google.com/abc-defg-hij' }] } }), 200, 'teacher HTTPS meeting link control');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { baseVersion: studentSchedule.version, lessons: [{ ...studentSchedule.json[0], status: 'CANCELLED' }] } }), 409, 'stale second client cannot overwrite teacher change');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [] } }), 200, 'empty merge accepted without destructive replacement');
  assert.equal((await call('/api/lessons', { cookie: forged.cookie })).json.length, 1);
  const guestAvailability = await call(`/api/teachers/availability?teacherId=${teacherId}&from=${future(3)}&durationMinutes=5`);
  expect(guestAvailability, 200, 'guest privacy-safe availability'); assert.ok(guestAvailability.json.occupied.every(item => !('studentId' in item) && !('studentNameAr' in item))); assert.ok(!guestAvailability.json.availableSlots.includes('16:00'));
  const selfAvailability = await call(`/api/teachers/availability?teacherId=${teacherId}&from=${future(3)}&excludeLessonId=${orientationId}`, { cookie: forged.cookie }); assert.ok(selfAvailability.json.availableSlots.includes('16:00'));
  const adminSchedule = await call('/api/lessons', { cookie: admin.cookie }); const orientation = adminSchedule.json.find(item => item.id === orientationId);
  expect(await call('/api/lessons', { method: 'POST', cookie: admin.cookie, body: { baseVersion: adminSchedule.version, reason: 'Synthetic QA administrative completion override', lessons: [{ ...orientation, status: 'COMPLETED' }] } }), 200, 'authorized administrative completion control');
  const completedSchedule = await call('/api/lessons', { cookie: forged.cookie });
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { baseVersion: completedSchedule.version, lessons: [{ ...completedSchedule.json[0], status: 'CANCELLED' }] } }), 409, 'completed student history immutable');
  expect(await call('/api/reviews', { method: 'POST', cookie: forged.cookie, body: { teacherId, lessonId: orientationId, rating: 4, commentAr: 'Synthetic QA review' } }), 201, 'legitimate completed-class review');
  assert.equal((await call('/api/reviews', { cookie: forged.cookie })).json.reviews.find(item => item.lessonId === orientationId).isMine, true);
  assert.equal((await call('/api/reviews')).json.reviews.find(item => item.lessonId === orientationId).isMine, false);
  expect(await call('/api/teacher/students', { cookie: admin.cookie }), 200, 'administrator can open student records');
  const cancelControl = await register('STUDENT', 'cancel-blocked', { profileData: { studentProfile: { assignedTeacherId: teacherId } }, initialLessons: [lesson('', `${prefix}-cancel-blocked`, { isOrientationSession: true, time: '14:00' })] });
  expect(cancelControl, 201, 'prepare existing blocked-teacher cancellation control');
  expect(await call('/api/admin/accounts/' + teacherId, { method: 'PATCH', cookie: admin.cookie, body: { isBlocked: true } }), 200, 'block synthetic teacher');
  const blockedSchedule = await call('/api/lessons', { cookie: cancelControl.cookie });
  expect(await call('/api/lessons', { method: 'POST', cookie: cancelControl.cookie, body: { baseVersion: blockedSchedule.version, lessons: [{ ...blockedSchedule.json[0], status: 'CANCELLED' }] } }), 200, 'existing blocked-teacher class can be cancelled');
  assert.ok(!(await call('/api/teachers')).json.teachers.some(item => item.id === teacherId));
  expect(await call(`/api/teachers/availability?teacherId=${teacherId}&from=${future(3)}`), 404, 'blocked teacher unavailable to guest');
  expect(await register('STUDENT', 'blocked-assignment', { profileData: { studentProfile: { assignedTeacherId: teacherId } } }), 400, 'blocked teacher signup assignment rejected');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-blocked-booking`)] } }), 403, 'blocked teacher booking rejected');
  expect(await call('/api/admin/accounts/' + teacherId, { method: 'PATCH', cookie: admin.cookie, body: { isBlocked: false } }), 200, 'restore synthetic teacher');

  // Atomic signup rolls back the user when orientation collides with an existing reservation.
  const atomic = await register('STUDENT', 'atomic', { profileData: { studentProfile: { assignedTeacherId: teacherId } }, initialLessons: [lesson('', `${prefix}-atomic-orientation`, { isOrientationSession: true, time: '15:00' })] });
  expect(atomic, 201, 'atomic signup orientation legitimate control');
  expect(await register('STUDENT', 'atomic-conflict', { profileData: { studentProfile: { assignedTeacherId: teacherId } }, initialLessons: [lesson('', `${prefix}-atomic-conflict`, { isOrientationSession: true, time: '15:00' })] }), 409, 'atomic signup collision rejected');
  assert.equal(await db.user.count({ where: { email: `${prefix}.atomic-conflict@example.com` } }), 0);

  // A server-approved paid cycle remains bookable, and cannot exceed its reserved balance.
  const goal = { track: 'HIFZ_NEW', targetSurahOrJuzAr: 'الحفظ', targetSurahOrJuzEn: 'Memorization', orientationCompleted: false, agreedWeeklyDaysAr: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'], agreedWeeklyDaysEn: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'], agreedTimeSlot: '12:00', dayTimeSlots: { 'الأحد': '12:00', 'الإثنين': '12:00', 'الثلاثاء': '12:00', 'الأربعاء': '12:00' }, hifzSurahNumbers: [2] };
  expect(await call('/api/student/profile', { method: 'PATCH', cookie: forged.cookie, body: { profile: { quranGoal: goal } } }), 200, 'student learning goal control');
  const paymentBody = { action: 'SUBMIT_PAYMENT', planId: 'plan-basic', receiptFile: 'data:image/png;base64,AA==', bankRef: 'SYNTHETIC-QA' };
  const [identityChange, paymentChange] = await Promise.all([
    call('/api/account/profile', { method: 'PATCH', cookie: forged.cookie, body: { name: 'QA Rules Updated Student', email: `${prefix}.forged@example.com`, phone: '+966500000008' } }),
    call('/api/subscriptions', { method: 'POST', cookie: forged.cookie, body: paymentBody }),
  ]);
  assert.ok([200, 409].includes(identityChange.status)); assert.ok([200, 409].includes(paymentChange.status));
  if (paymentChange.status === 409) expect(await call('/api/subscriptions', { method: 'POST', cookie: forged.cookie, body: paymentBody }), 200, 'retry conflicted payment submission');
  if (identityChange.status === 409) expect(await call('/api/account/profile', { method: 'PATCH', cookie: forged.cookie, body: { name: 'QA Rules Updated Student', email: `${prefix}.forged@example.com`, phone: '+966500000008' } }), 200, 'retry conflicted identity update');
  const concurrentProfile = (await call('/api/auth/session', { cookie: forged.cookie })).json.user.appData.studentProfile;
  assert.equal(concurrentProfile.paymentRequestStatus, 'PENDING'); assert.equal(concurrentProfile.bankTransferRef, 'SYNTHETIC-QA');
  console.log('PASS concurrent identity update cannot restore stale payment JSON');
  expect(await call('/api/subscriptions', { method: 'POST', cookie: admin.cookie, body: { action: 'APPROVE', studentId } }), 200, 'paid entitlement granted only by admin workflow');
  const paidSchedule = await call('/api/lessons', { cookie: forged.cookie }); assert.equal(paidSchedule.json.filter(item => item.status === 'SCHEDULED' && !item.isOrientationSession).length, 16);
  const regular = paidSchedule.json.find(item => item.status === 'SCHEDULED' && !item.isOrientationSession);
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { baseVersion: paidSchedule.version, lessons: [{ ...regular, time: '12:05' }], quranGoal: goal } }), 200, 'paid class reschedule and goal atomic control');
  // A trusted historical fixture proves legitimate teacher completion without weakening future-booking rules.
  // Only this run's paid QA class/profile are adjusted; existing accounts are never modified.
  const historicalDate = future(-2);
  await db.lesson.update({ where: { id: regular.id }, data: { date: historicalDate } });
  const historicalOwner = await db.user.findUnique({ where: { id: studentId } });
  await db.user.update({ where: { id: studentId }, data: { appData: { ...historicalOwner.appData, studentProfile: { ...historicalOwner.appData.studentProfile, subscriptionStartDate: future(-10) } } } });
  const historyForTeacher = await call('/api/lessons', { cookie: teacher.cookie });
  const historicalClass = historyForTeacher.json.find(item => item.id === regular.id);
  expect(await call('/api/lessons', { method: 'POST', cookie: teacher.cookie, body: { baseVersion: historyForTeacher.version, lessons: [{ ...historicalClass, status: 'COMPLETED', notes: 'Synthetic historical QA completion' }] } }), 200, 'teacher can complete ended paid class with atomic balance deduction');
  const completedPaidProfile = (await call('/api/auth/session', { cookie: forged.cookie })).json.user.appData.studentProfile;
  assert.equal(completedPaidProfile.remainingLessons, 15); assert.equal(completedPaidProfile.totalLessonsCompleted, 2);
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-overbalance`, { time: '17:00' })] } }), 409, 'booking count cannot exceed paid balance');
  expect(await call('/api/lessons', { method: 'POST', cookie: forged.cookie, body: { lessons: [lesson(studentId, `${prefix}-past`, { date: '2020-01-01', isOrientationSession: true })] } }), 409, 'past booking rejected');
  console.log('All server route regression assertions passed.');
} finally {
  // Match only UUID-prefixed records created in this run. Never touch demo or existing users.
  const own = await db.user.findMany({ where: { email: { startsWith: prefix + '.' } }, select: { id: true } });
  const ids = own.map(item => item.id);
  await db.$transaction([
    db.review.deleteMany({ where: { OR: [{ studentId: { in: ids } }, { teacherId: { in: ids } }] } }),
    db.lesson.deleteMany({ where: { OR: [{ studentId: { in: ids } }, { teacherId: { in: ids } }] } }),
    db.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  await db.$disconnect();
  console.log('Disposable QA records removed.');
}
