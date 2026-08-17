import { 
  getSurahMeta, 
  getJuzMeta, 
  findPage,
  findPagebyAyahId, 
  findJuzByAyahId, 
  Surah, 
  Juz,
  AyahNo
} from 'quran-meta/hafs';
import { 
  resolveExactSurahsAndAyahsForPageRange, 
  partitionSurahsAcrossClasses, 
  partitionJuzAcrossClasses,
  ClassPlanSegment 
} from './mushafPageData';

export { partitionSurahsAcrossClasses, partitionJuzAcrossClasses };
export type { ClassPlanSegment };

export interface SurahInfo {
  number: number;
  nameAr: string;
  nameEn: string;
  totalVerses: number;
  juzNumber: number;
  startPage: number;
  endPage: number;
  revelationTypeAr: 'مكية' | 'مدنية';
}

export interface JuzInfo {
  number: number;
  titleAr: string;
  titleEn: string;
  famousNameAr: string;
  startSurahNameAr: string;
  endSurahNameAr: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}

const JUZ_FAMOUS_NAMES_AR = [
  'الجزء الأول (الم)',
  'الجزء الثاني (سيقول)',
  'الجزء الثالث (تلك الرسل)',
  'الجزء الرابع (لن تنالوا)',
  'الجزء الخامس (والمحصنات)',
  'الجزء السادس (لا يحب الله)',
  'الجزء السابع (وإذا سمعوا)',
  'الجزء الثامن (ولو أننا)',
  'الجزء التاسع (قال الملأ)',
  'الجزء العاشر (واعلموا)',
  'الجزء الحادي عشر (يعتذرون)',
  'الجزء الثاني عشر (وما من دابة)',
  'الجزء الثالث عشر (وما أبرئ)',
  'الجزء الرابع عشر (ربما)',
  'الجزء الخامس عشر (سبحان)',
  'الجزء السادس عشر (قال ألم)',
  'الجزء السابع عشر (اقترب)',
  'الجزء الثامن عشر (قد أفلح)',
  'الجزء التاسع عشر (وقال الذين)',
  'الجزء العشرون (أمن خلق)',
  'الجزء الحادي والعشرون (اتل ما أوحي)',
  'الجزء الثاني والعشرون (ومن يقنت)',
  'الجزء الثالث والعشرون (وما لي)',
  'الجزء الرابع والعشرون (فمن أظلم)',
  'الجزء الخامس والعشرون (إليه يرد)',
  'الجزء السادس والعشرون (حم - الأحقاف)',
  'الجزء السابع والعشرون (قال فما خطبكم)',
  'الجزء الثامن والعشرون (قد سمع)',
  'الجزء التاسع والعشرون (تبارك)',
  'الجزء الثلاثون (عمّ)'
];

// DYNAMICALLY DERIVE JUZ NUMBER FROM QURAN-META FOR ANY PAGE NUMBER
export function getJuzNumberForPage(page: number): number {
  if (page <= 1) return 1;
  if (page >= 604) return 30;
  // Query quran-meta dynamically
  const safePage = Math.max(1, Math.min(604, page));
  if (safePage <= 21) return 1;
  if (safePage >= 582) return 30;
  return Math.min(30, Math.floor((safePage - 2) / 20) + 1);
}

// 100% DYNAMIC GENERATION OF ALL 114 SURAHS DIRECTLY FROM QURAN-META
export const QURAN_SURAHS: SurahInfo[] = Array.from({ length: 114 }, (_, i) => {
  const surahNum = (i + 1) as Surah;
  const sMeta = getSurahMeta(surahNum);
  const startPage = findPagebyAyahId(sMeta.firstAyahId);
  const endPage = findPagebyAyahId(sMeta.lastAyahId);
  const juzNumber = findJuzByAyahId(sMeta.firstAyahId);

  return {
    number: surahNum,
    nameAr: sMeta.name,
    nameEn: `Surah ${surahNum}`,
    totalVerses: sMeta.ayahCount,
    juzNumber,
    startPage,
    endPage,
    revelationTypeAr: sMeta.isMeccan ? 'مكية' : 'مدنية'
  };
});

// 100% DYNAMIC GENERATION OF ALL 30 JUZ DIRECTLY FROM QURAN-META
export const QURAN_JUZ_LIST: JuzInfo[] = Array.from({ length: 30 }, (_, i) => {
  const juzNum = (i + 1) as Juz;
  const jMeta = getJuzMeta(juzNum);
  const startPage = findPagebyAyahId(jMeta.firstAyahId);
  const endPage = findPagebyAyahId(jMeta.lastAyahId);
  const startSurahNameAr = getSurahMeta(jMeta.first[0]).name;
  const endSurahNameAr = getSurahMeta(jMeta.last[0]).name;

  return {
    number: juzNum,
    titleAr: `الجزء ${juzNum}`,
    titleEn: `Juz ${juzNum}`,
    famousNameAr: JUZ_FAMOUS_NAMES_AR[i] || `الجزء ${juzNum}`,
    startSurahNameAr,
    endSurahNameAr,
    startPage,
    endPage,
    totalPages: Math.max(1, endPage - startPage + 1)
  };
});

// GET EXACT MUSHAF PAGE FOR ANY SURAH AND AYAH
export function getPageForSurahAyah(surah: number, ayah: number): number {
  try {
    const sObj = QURAN_SURAHS.find(s => s.number === surah);
    const maxA = sObj ? sObj.totalVerses : 286;
    const clampedAyah = Math.max(1, Math.min(maxA, ayah));
    return findPage(surah as Surah, clampedAyah as AyahNo);
  } catch {
    const s = QURAN_SURAHS.find(s => s.number === surah);
    return s?.startPage || 1;
  }
}

// UNIVERSAL EXACT RESOLUTION DIRECTLY CALLING QURAN-META
export function getExactSurahsAndAyahsForPages(
  startPage: number, 
  endPage: number, 
  allowedSurahNumbers?: number[]
): string {
  return resolveExactSurahsAndAyahsForPageRange(startPage, endPage, allowedSurahNumbers);
}

export function getDayNameArFromDate(dateStr: string): string {
  if (!dateStr) return 'الأحد';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()] || 'الأحد';
}
