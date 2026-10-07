import { QURAN_SURAHS } from '@/data/quranData';

const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const localizeWeekday = (day: string, isAr: boolean) => isAr ? day : englishDays[arabicDays.indexOf(day)] || day;

/** Translate generated curriculum metadata; Quran verses and freeform notes stay untouched. */
export function localizeQuranScope(text: string | undefined, isAr: boolean) {
  if (!text || isAr) return text || '';
  const withoutDiacritics = (value: string) => value.normalize('NFKC').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '');
  let translated = withoutDiacritics(text);
  for (const surah of [...QURAN_SURAHS].sort((a, b) => b.nameAr.length - a.nameAr.length)) {
    translated = translated.replaceAll(`سورة ${withoutDiacritics(surah.nameAr)}`, `Surah ${surah.nameEn}`);
  }
  const labels: [string, string][] = [['صفحات', 'pages'], ['صفحة', 'page'], ['الآيات', 'verses'], ['آيات', 'verses'], ['آية', 'verse'], ['السورة كاملة', 'full surah'], ['كاملة', 'full'], ['مقرر', 'Scope'], ['الحفظ', 'Memorization'], ['التلاوة', 'Recitation'], ['أجزاء', 'Juz'], ['الجزء', 'Juz'], ['جزء', 'Juz'], ['سور أخرى', 'other surahs'], ['سور', 'surahs'], ['إلى', 'to']];
  for (const [ar, en] of labels) translated = translated.replaceAll(ar, en);
  return translated;
}

const languageNames: Record<string, [string, string]> = {
  'العربية': ['العربية', 'Arabic'], 'Arabic': ['العربية', 'Arabic'],
  'الإنجليزية': ['الإنجليزية', 'English'], 'English': ['الإنجليزية', 'English'],
  'الأردية': ['الأردية', 'Urdu'], 'Urdu': ['الأردية', 'Urdu'],
  'الفرنسية': ['الفرنسية', 'French'], 'French': ['الفرنسية', 'French'],
  'التركية': ['التركية', 'Turkish'], 'Turkish': ['التركية', 'Turkish'],
  'الإندونيسية': ['الإندونيسية', 'Indonesian'], 'Indonesian': ['الإندونيسية', 'Indonesian'],
  'البنغالية': ['البنغالية', 'Bengali'], 'Bengali': ['البنغالية', 'Bengali'],
};
export const localizeLanguage = (language: string, isAr: boolean) => languageNames[language.trim()]?.[isAr ? 0 : 1] || language;

const knownSpecialties: Record<string, string> = {
  'الإجازة بالسند المتصل': 'Continuous Chain Ijazah',
  'تصحيح التلاوة وتجويد الحروف': 'Tajweed & Pronunciation',
  'إتقان المتون والتسميع': 'Advanced Hifz Revision',
  'حفظ القرآن': 'Quran Memorization', 'التجويد': 'Tajweed', 'تصحيح التلاوة': 'Recitation Correction',
};
export const localizeSpecialty = (specialty: string, isAr: boolean) => isAr ? specialty : knownSpecialties[specialty] || specialty;
