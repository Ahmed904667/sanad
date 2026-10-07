/** Shared server rules. Dates and class times use the platform's Asia/Riyadh timezone. */
export const PLATFORM_TIME_ZONE = 'Asia/Riyadh';

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function platformToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PLATFORM_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function lessonStartsAt(date: string, time: string) {
  return Date.parse(`${date}T${time}:00+03:00`);
}

export function normalizePhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[\s()-]/g, '');
  // International E.164 or a local number; presentation punctuation is removed.
  return /^\+?[0-9]{8,15}$/.test(normalized) ? normalized : null;
}

export function isValidBirthDate(value: unknown, now = new Date()) {
  return value === undefined || value === null || value === '' ||
    isCalendarDate(value) && value <= platformToday(now) && value >= '1900-01-01';
}

export function isSafeMeetingUrl(value: string) {
  if (value === '') return true;
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.') &&
      !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch { return false; }
}

export function isValidReceiptDataUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 7_000_000) return false;
  const match = /^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[1].length % 4 !== 0) return false;
  const padding = match[1].endsWith('==') ? 2 : match[1].endsWith('=') ? 1 : 0;
  const bytes = match[1].length / 4 * 3 - padding;
  return bytes > 0 && bytes <= 5 * 1024 * 1024;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Normalized rows, never arbitrary profile JSON, own paid balances. */
export function canonicalAppData(appData: unknown, studentRow: unknown) {
  const root = asRecord(appData);
  if (!studentRow) return root;
  const row = asRecord(studentRow);
  const profile = asRecord(root.studentProfile);
  return { ...root, studentProfile: {
    ...profile, activePlanId: row.activePlanId ?? null,
    assignedTeacherId: row.assignedTeacherId ?? null,
    remainingLessons: row.remainingLessons ?? 0,
    totalLessonsCompleted: row.totalLessonsCompleted ?? 0,
    totalHoursLearned: row.totalHoursLearned ?? 0,
    ...(profile.verificationStatus === 'VERIFIED' && !row.activePlanId ? { verificationStatus: 'UNVERIFIED' } : {}),
  } };
}

export function isValidQuranGoal(value: unknown) {
  const goal = asRecord(value);
  if (!['TALQEEN', 'TILAWAH_CORRECTION', 'HIFZ_NEW', 'IJAZAH_REVIEW', 'COMBINED'].includes(String(goal.track))) return false;
  for (const key of ['targetSurahOrJuzAr', 'targetSurahOrJuzEn']) if (typeof goal[key] !== 'string' || (goal[key] as string).length > 2000) return false;
  for (const key of ['agreedWeeklyDaysAr', 'agreedWeeklyDaysEn']) if (!Array.isArray(goal[key]) || (goal[key] as unknown[]).length > 7 || (goal[key] as unknown[]).some(day => typeof day !== 'string' || day.length > 30)) return false;
  for (const [key, max] of [['hifzSurahNumbers', 114], ['tilawahSurahNumbers', 114], ['hifzJuzNumbers', 30], ['tilawahJuzNumbers', 30]] as const) {
    if (goal[key] !== undefined && (!Array.isArray(goal[key]) || (goal[key] as unknown[]).length > max || (goal[key] as unknown[]).some(number => !Number.isInteger(number) || Number(number) < 1 || Number(number) > max))) return false;
  }
  for (const slot of Object.values(asRecord(goal.dayTimeSlots))) if (typeof slot !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot)) return false;
  for (const [surah, range] of Object.entries(asRecord(goal.surahAyahCustomMap))) {
    const ayahs = asRecord(range);
    if (!/^\d+$/.test(surah) || Number(surah) < 1 || Number(surah) > 114 || !Number.isInteger(ayahs.startAyah) || !Number.isInteger(ayahs.endAyah) || Number(ayahs.startAyah) < 1 || Number(ayahs.endAyah) > 286 || Number(ayahs.startAyah) > Number(ayahs.endAyah)) return false;
  }
  return JSON.stringify(value).length <= 50_000;
}

export function initialStudentProfile(input: unknown, identity: { id: string; name: string; email: string; phone: string; gender: string; birthDate?: string }, validPlanIds: string[]) {
  const source = asRecord(input);
  const hasPayment = typeof source.pendingPlanId === 'string' && validPlanIds.includes(source.pendingPlanId) &&
    isValidReceiptDataUrl(source.paymentReceiptUrl) &&
    typeof source.bankTransferRef === 'string' && source.bankTransferRef.trim().length > 0 && source.bankTransferRef.length <= 200;
  return {
    id: identity.id, nameAr: identity.name, nameEn: identity.name, email: identity.email,
    phone: identity.phone, gender: identity.gender, birthDate: identity.birthDate || '',
    assignedTeacherId: typeof source.assignedTeacherId === 'string' ? source.assignedTeacherId : null,
    ...(source.quranGoal && typeof source.quranGoal === 'object' && !Array.isArray(source.quranGoal)
      ? { quranGoal: { ...asRecord(source.quranGoal), orientationCompleted: false, assignedTeacherId: typeof source.assignedTeacherId === 'string' ? source.assignedTeacherId : null } } : {}),
    verificationStatus: hasPayment ? 'PENDING_VERIFICATION' : 'UNVERIFIED',
    activePlanId: null, nextCyclePlanId: null,
    remainingLessons: 0, extraClassCredits: 0, extraPurchasedClassesCount: 0,
    totalLessonsCompleted: 0, totalHoursLearned: 0,
    ...(hasPayment ? {
      pendingPlanId: source.pendingPlanId, subscriptionChangeType: 'NEW',
      paymentReceiptUrl: source.paymentReceiptUrl, bankTransferRef: source.bankTransferRef,
      paymentDate: platformToday(), paymentRequestStatus: 'PENDING',
    } : {}),
  };
}
