import test from 'node:test';
import assert from 'node:assert/strict';
import { initialStudentProfile, canonicalAppData, isCalendarDate, isSafeMeetingUrl, isValidBirthDate, normalizePhone, platformToday, lessonStartsAt, isValidQuranGoal, isValidReceiptDataUrl } from '../src/lib/business-rules.ts';

const identity = { id: 'server-id', name: 'QA Student', email: 'qa@example.com', gender: 'MALE', phone: '+966500000001' };

test('signup never grants client supplied entitlement, counters, or privileged JSON aliases', () => {
  const profile = initialStudentProfile({ verificationStatus: 'VERIFIED', activePlanId: 'plan-intensive', remainingLessons: 999,
    totalLessonsCompleted: 99, totalHoursLearned: 999, subscriptionRenewalDate: '2099-01-01', extraClassCredits: 999,
    teacherProfile: { role: 'ADMIN' }, id: 'forged', quranGoal: { orientationCompleted: true } }, identity, ['plan-basic']);
  assert.equal(profile.id, 'server-id');
  assert.equal(profile.verificationStatus, 'UNVERIFIED');
  assert.equal(profile.activePlanId, null);
  assert.equal(profile.remainingLessons, 0);
  assert.equal(profile.extraClassCredits, 0);
  assert.equal(profile.totalLessonsCompleted, 0);
  assert.equal(profile.totalHoursLearned, 0);
  assert.equal(profile.quranGoal?.orientationCompleted, false);
  assert.ok(!('subscriptionRenewalDate' in profile));
  assert.ok(!('teacherProfile' in profile));
});

test('legitimate onboarding retains selected teacher and payment request without activation', () => {
  const profile = initialStudentProfile({ assignedTeacherId: 'teacher-1', pendingPlanId: 'plan-basic', paymentReceiptUrl: 'data:image/png;base64,AA==', bankTransferRef: 'REF-123' }, identity, ['plan-basic']);
  assert.equal(profile.verificationStatus, 'PENDING_VERIFICATION');
  assert.equal(profile.pendingPlanId, 'plan-basic');
  assert.equal(profile.assignedTeacherId, 'teacher-1');
  assert.equal(profile.activePlanId, null);
  assert.equal(profile.remainingLessons, 0);
});

test('invalid plan or missing proof does not generate a payment queue entry', () => {
  assert.equal(initialStudentProfile({ pendingPlanId: 'unknown', paymentReceiptUrl: 'data:image/png;base64,A', bankTransferRef: '123' }, identity, ['plan-basic']).verificationStatus, 'UNVERIFIED');
  assert.equal(initialStudentProfile({ pendingPlanId: 'plan-basic' }, identity, ['plan-basic']).verificationStatus, 'UNVERIFIED');
});

test('normalized balance wins over old forged profile JSON on reads', () => {
  const data = canonicalAppData({ studentProfile: { remainingLessons: 999, activePlanId: 'plan-intensive', verificationStatus: 'VERIFIED' } }, { remainingLessons: 0, activePlanId: null, assignedTeacherId: 'teacher-1', totalLessonsCompleted: 0, totalHoursLearned: 0 });
  assert.equal(data.studentProfile.remainingLessons, 0);
  assert.equal(data.studentProfile.verificationStatus, 'UNVERIFIED');
});

test('date validation checks real leap-year/calendar dates', () => {
  assert.equal(isCalendarDate('2026-02-31'), false);
  assert.equal(isCalendarDate('2026-02-29'), false);
  assert.equal(isCalendarDate('2024-02-29'), true);
  assert.equal(isCalendarDate('90101-09-20'), false);
  assert.equal(isCalendarDate('2026-13-01'), false);
});

test('Riyadh dates and lesson time are independent of machine timezone', () => {
  assert.equal(platformToday(new Date('2026-10-05T22:00:00Z')), '2026-10-06');
  assert.equal(lessonStartsAt('2026-10-06', '01:00'), Date.parse('2026-10-05T22:00:00Z'));
});

test('DOB and phone accept legitimate values but reject observed invalid inputs', () => {
  assert.equal(normalizePhone('+966 (500) 000-001'), '+966500000001');
  assert.equal(normalizePhone('not-a-phone'), null);
  assert.equal(isValidBirthDate('90101-09-20'), false);
  assert.equal(isValidBirthDate('2099-01-01'), false);
  assert.equal(isValidBirthDate('2000-01-01'), true);
});

test('meeting links allow HTTPS providers and reject executable/insecure URLs', () => {
  assert.equal(isSafeMeetingUrl('https://meet.google.com/abc-defg-hij'), true);
  assert.equal(isSafeMeetingUrl('https://zoom.us/j/12345'), true);
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>', 'http://meet.google.com/a', 'https://user:pass@example.com', 'https://127.0.0.1/path']) assert.equal(isSafeMeetingUrl(value), false, value);
});

test('learning goal validates selected ranges and array bounds', () => {
  const goal = { track: 'HIFZ_NEW', targetSurahOrJuzAr: 'الحفظ', targetSurahOrJuzEn: 'Memorization', agreedWeeklyDaysAr: ['الإثنين'], agreedWeeklyDaysEn: ['Monday'], hifzSurahNumbers: [2], surahAyahCustomMap: { 2: { startAyah: 1, endAyah: 15 } }, dayTimeSlots: { 'الإثنين': '12:00' } };
  assert.equal(isValidQuranGoal(goal), true);
  assert.equal(isValidQuranGoal({ ...goal, hifzSurahNumbers: [115] }), false);
  assert.equal(isValidQuranGoal({ ...goal, surahAyahCustomMap: { 2: { startAyah: 10, endAyah: 1 } } }), false);
  assert.equal(isValidQuranGoal({ ...goal, dayTimeSlots: { 'الإثنين': '25:00' } }), false);
});

test('receipts preserve supported PDF onboarding and reject arbitrary HTML/SVG or malformed data', () => {
  assert.equal(isValidReceiptDataUrl('data:application/pdf;base64,JVBERg=='), true);
  assert.equal(isValidReceiptDataUrl('data:image/svg+xml;base64,AA=='), false);
  assert.equal(isValidReceiptDataUrl('data:text/html;base64,AA=='), false);
  assert.equal(isValidReceiptDataUrl('data:image/png;base64,A'), false);
  assert.equal(initialStudentProfile({ pendingPlanId: 'plan-basic', paymentReceiptUrl: 'data:application/pdf;base64,JVBERg==', bankTransferRef: 'REF' }, identity, ['plan-basic']).verificationStatus, 'PENDING_VERIFICATION');
});
