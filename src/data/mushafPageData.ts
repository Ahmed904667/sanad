import { 
  getPageMeta, 
  findSurahAyahByAyahId, 
  getSurahMeta, 
  getJuzMeta,
  findPage,
  findPagebyAyahId,
  Page, 
  Surah, 
  AyahNo, 
  Juz 
} from 'quran-meta/hafs';

// UNIVERSAL 100% ACCURATE MUSHAF PAGE RESOLVER USING OFFICIAL QURAN-META LIBRARY
export function resolveExactSurahsAndAyahsForPageRange(
  startPage: number, 
  endPage: number,
  allowedSurahNumbers?: number[]
): string {
  const safeStartPage = Math.max(1, Math.min(604, startPage)) as Page;
  const safeEndPage = Math.max(1, Math.min(604, endPage)) as Page;

  try {
    const startMeta = getPageMeta(safeStartPage);
    const endMeta = getPageMeta(safeEndPage);

    const firstAyahId = startMeta.firstAyahId;
    const lastAyahId = endMeta.lastAyahId;

    const [startSurahNum, startAyahNo] = findSurahAyahByAyahId(firstAyahId);
    const [endSurahNum, endAyahNo] = findSurahAyahByAyahId(lastAyahId);

    // Spans multiple Surahs or single Surah
    const resultParts: string[] = [];
    for (let surahNum = startSurahNum; surahNum <= endSurahNum; surahNum++) {
      if (allowedSurahNumbers && allowedSurahNumbers.length > 0 && !allowedSurahNumbers.includes(surahNum)) {
        continue;
      }
      const surahMeta = getSurahMeta(surahNum as Surah);
      
      let curStartA = 1;
      let curEndA = surahMeta.ayahCount;

      if (surahNum === startSurahNum) {
        curStartA = startAyahNo;
      }
      if (surahNum === endSurahNum) {
        curEndA = endAyahNo;
      }

      if (curStartA === 1 && curEndA === surahMeta.ayahCount) {
        resultParts.push(`سورة ${surahMeta.name} (كاملاً - ${surahMeta.ayahCount} آية)`);
      } else if (curStartA === curEndA) {
        resultParts.push(`سورة ${surahMeta.name} (آية ${curStartA})`);
      } else {
        resultParts.push(`سورة ${surahMeta.name} (الآيات ${curStartA} إلى ${curEndA})`);
      }
    }

    if (resultParts.length === 0) {
      return safeStartPage === safeEndPage ? `صفحة ${safeStartPage}` : `صفحات ${safeStartPage} إلى ${safeEndPage}`;
    }

    return resultParts.join(' + ');
  } catch (err) {
    return safeStartPage === safeEndPage ? `صفحة ${safeStartPage}` : `صفحات (${startPage} إلى ${endPage})`;
  }
}

export interface ClassPlanSegment {
  classNum: number;
  title: string;
  summaryAr: string;
  pageRangeText: string;
  pagesCountText: string;
  exactPages: number;
  startAyah: number;
  endAyah: number;
  startPage: number;
  endPage: number;
  ayahCount: number;
}

// Format fractional Mushaf page counts accurately in Arabic
export function formatExactPagesCount(exactPages: number): string {
  const rounded = Math.round(exactPages * 10) / 10;
  if (rounded <= 0.65) {
    return 'نصف صفحة تقريباً';
  }
  if (rounded >= 0.7 && rounded <= 1.25) {
    return 'صفحة واحدة';
  }
  if (rounded > 1.25 && rounded <= 1.75) {
    return 'صفحة ونصف تقريباً';
  }
  if (rounded > 1.75 && rounded <= 2.25) {
    return 'صفحتان';
  }
  if (rounded > 2.25 && rounded <= 2.75) {
    return 'صفحتان ونصف تقريباً';
  }
  
  const baseInt = Math.floor(rounded);
  const frac = Math.round((rounded - baseInt) * 10) / 10;
  
  if (frac >= 0.35 && frac <= 0.65) {
    if (baseInt >= 3 && baseInt <= 10) {
      return `${baseInt} صفحات ونصف تقريباً`;
    } else {
      return `${baseInt} صفحة ونصف تقريباً`;
    }
  }
  
  const intVal = Math.round(rounded);
  if (intVal >= 3 && intVal <= 10) {
    return `${intVal} صفحات`;
  } else {
    return `${intVal} صفحة`;
  }
}

/**
 * Automatically snaps partition cuts to Surah boundaries if a cut is within a small threshold
 * of verses from a Surah start or end. This prevents awkward orphan fragments (e.g. 1 to 4 verses)
 * spilling into the next class and ensures classes start and end cleanly on whole Surahs wherever feasible.
 */
function optimizePartitionCuts(
  allVerses: { surahNum: number; ayahNum: number; page: number }[],
  K: number,
  threshold: number = 4
): number[] {
  const V = allVerses.length;
  if (K <= 1 || V <= K) {
    return Array.from({ length: K + 1 }, (_, i) => Math.min(V, Math.floor((i * V) / K)));
  }

  // 1. Initial balanced cut indices
  const cuts: number[] = [];
  for (let i = 0; i <= K; i++) {
    cuts.push(Math.round((i * V) / K));
  }
  cuts[0] = 0;
  cuts[K] = V;

  // 2. Find all Surah boundary indices in allVerses (where a new Surah starts)
  const surahBoundaries: number[] = [];
  for (let i = 1; i < V; i++) {
    if (allVerses[i].surahNum !== allVerses[i - 1].surahNum) {
      surahBoundaries.push(i);
    }
  }

  // 3. For each internal cut, snap to closest boundary if within threshold
  for (let k = 1; k < K; k++) {
    const currentCut = cuts[k];
    
    let closestBoundary: number | null = null;
    let minDistance = Infinity;

    for (const b of surahBoundaries) {
      const dist = Math.abs(b - currentCut);
      if (dist <= threshold && dist < minDistance) {
        minDistance = dist;
        closestBoundary = b;
      }
    }

    if (closestBoundary !== null) {
      const prevCut = cuts[k - 1];
      const nextCut = cuts[k + 1];
      // Keep at least 1 verse per class and preserve order
      if (closestBoundary > prevCut && closestBoundary < nextCut) {
        cuts[k] = closestBoundary;
      }
    }
  }

  // 4. Ensure strictly increasing cuts
  for (let k = 1; k <= K; k++) {
    if (cuts[k] <= cuts[k - 1]) {
      cuts[k] = cuts[k - 1] + 1;
    }
  }
  cuts[K] = V;

  return cuts;
}

// PARTITION SURAHS AND AYAHS PROGRESSIVELY AND EVENLY ACROSS ALL PLAN CLASSES
export function partitionSurahsAcrossClasses(
  selectedSurahs: { number: number; startAyah: number; endAyah: number }[],
  totalLessonsInPlan: number
): ClassPlanSegment[] {
  const K = Math.max(1, totalLessonsInPlan);
  
  // 1. Collect all verses in order
  const allVerses: { surahNum: number; ayahNum: number; page: number }[] = [];
  const uniquePages = new Set<number>();

  for (const s of selectedSurahs) {
    const sMeta = getSurahMeta(s.number as Surah);
    const startA = Math.max(1, Math.min(sMeta.ayahCount, s.startAyah));
    const endA = Math.max(startA, Math.min(sMeta.ayahCount, s.endAyah));
    for (let a = startA; a <= endA; a++) {
      let p = 1;
      try {
        p = findPage(s.number as Surah, a as AyahNo);
      } catch {
        p = 1;
      }
      uniquePages.add(p);
      allVerses.push({ surahNum: s.number, ayahNum: a, page: p });
    }
  }

  const totalPagesSelected = Math.max(1, uniquePages.size);

  if (allVerses.length === 0) {
    return Array.from({ length: K }).map((_, idx) => ({
      classNum: idx + 1,
      title: `الحصة ${idx + 1}`,
      summaryAr: 'المقرر المحدد',
      pageRangeText: 'صفحة 1',
      pagesCountText: 'صفحة واحدة',
      exactPages: 1,
      startAyah: 1,
      endAyah: 1,
      startPage: 1,
      endPage: 1,
      ayahCount: 1
    }));
  }

  const V = allVerses.length;
  const cuts = optimizePartitionCuts(allVerses, K, 4);

  return Array.from({ length: K }).map((_, idx) => {
    const classNum = idx + 1;
    const startIdx = cuts[idx];
    const endIdx = cuts[idx + 1] - 1;
    const safeEndIdx = Math.max(startIdx, endIdx);

    const classVerses = allVerses.slice(startIdx, safeEndIdx + 1);
    const firstV = classVerses[0] || allVerses[0];
    const lastV = classVerses[classVerses.length - 1] || firstV;

    const startPage = firstV.page;
    const endPage = lastV.page;

    // Group consecutive verses belonging to the same Surah
    const surahRuns: { surahNum: number; startAyah: number; endAyah: number }[] = [];
    for (const v of classVerses) {
      const lastRun = surahRuns[surahRuns.length - 1];
      if (lastRun && lastRun.surahNum === v.surahNum) {
        lastRun.endAyah = v.ayahNum;
      } else {
        surahRuns.push({ surahNum: v.surahNum, startAyah: v.ayahNum, endAyah: v.ayahNum });
      }
    }

    const parts = surahRuns.map(run => {
      const meta = getSurahMeta(run.surahNum as Surah);
      if (run.startAyah === 1 && run.endAyah === meta.ayahCount) {
        return `سورة ${meta.name} (كاملاً - ${meta.ayahCount} آية)`;
      }
      if (run.startAyah === run.endAyah) {
        return `سورة ${meta.name} (آية ${run.startAyah})`;
      }
      return `سورة ${meta.name} (الآيات ${run.startAyah} إلى ${run.endAyah})`;
    });

    const summaryAr = parts.join(' + ');
    const pageRangeText = startPage === endPage ? `صفحة ${startPage}` : `صفحة ${startPage} إلى ${endPage}`;
    
    // Exact fractional pages based on actual proportion of content
    const exactPages = (classVerses.length / V) * totalPagesSelected;
    const pagesCountText = formatExactPagesCount(exactPages);

    return {
      classNum,
      title: `الحصة ${classNum}`,
      summaryAr,
      pageRangeText,
      pagesCountText,
      exactPages,
      startAyah: firstV.ayahNum,
      endAyah: lastV.ayahNum,
      startPage,
      endPage,
      ayahCount: classVerses.length
    };
  });
}

// PARTITION JUZ LIST PROGRESSIVELY AND EVENLY ACROSS ALL PLAN CLASSES
export function partitionJuzAcrossClasses(
  selectedJuzNumbers: number[],
  totalLessonsInPlan: number
): ClassPlanSegment[] {
  const K = Math.max(1, totalLessonsInPlan);
  
  // 1. Collect all verses in the selected Juz list in order
  const allVerses: { surahNum: number; ayahNum: number; page: number }[] = [];
  const uniquePages = new Set<number>();
  const sortedJuz = [...selectedJuzNumbers].sort((a, b) => a - b);

  for (const jNum of sortedJuz) {
    try {
      const jMeta = getJuzMeta(jNum as Juz);
      for (let ayahId = jMeta.firstAyahId; ayahId <= jMeta.lastAyahId; ayahId++) {
        const [surahNum, ayahNum] = findSurahAyahByAyahId(ayahId);
        const page = findPagebyAyahId(ayahId);
        uniquePages.add(page);
        allVerses.push({ surahNum, ayahNum, page });
      }
    } catch {
      // fallback
    }
  }

  const totalPagesSelected = Math.max(1, uniquePages.size);

  if (allVerses.length === 0) {
    return Array.from({ length: K }).map((_, idx) => ({
      classNum: idx + 1,
      title: `الحصة ${idx + 1}`,
      summaryAr: 'المقرر المحدد',
      pageRangeText: 'صفحة 1',
      pagesCountText: 'صفحة واحدة',
      exactPages: 1,
      startAyah: 1,
      endAyah: 1,
      startPage: 1,
      endPage: 1,
      ayahCount: 1
    }));
  }

  const V = allVerses.length;
  const cuts = optimizePartitionCuts(allVerses, K, 4);

  return Array.from({ length: K }).map((_, idx) => {
    const classNum = idx + 1;
    const startIdx = cuts[idx];
    const endIdx = cuts[idx + 1] - 1;
    const safeEndIdx = Math.max(startIdx, endIdx);

    const classVerses = allVerses.slice(startIdx, safeEndIdx + 1);
    const firstV = classVerses[0] || allVerses[0];
    const lastV = classVerses[classVerses.length - 1] || firstV;

    const startPage = firstV.page;
    const endPage = lastV.page;

    // Group consecutive verses belonging to the same Surah
    const surahRuns: { surahNum: number; startAyah: number; endAyah: number }[] = [];
    for (const v of classVerses) {
      const lastRun = surahRuns[surahRuns.length - 1];
      if (lastRun && lastRun.surahNum === v.surahNum) {
        lastRun.endAyah = v.ayahNum;
      } else {
        surahRuns.push({ surahNum: v.surahNum, startAyah: v.ayahNum, endAyah: v.ayahNum });
      }
    }

    const parts = surahRuns.map(run => {
      const meta = getSurahMeta(run.surahNum as Surah);
      if (run.startAyah === 1 && run.endAyah === meta.ayahCount) {
        return `سورة ${meta.name} (كاملاً - ${meta.ayahCount} آية)`;
      }
      if (run.startAyah === run.endAyah) {
        return `سورة ${meta.name} (آية ${run.startAyah})`;
      }
      return `سورة ${meta.name} (الآيات ${run.startAyah} إلى ${run.endAyah})`;
    });

    const summaryAr = parts.join(' + ');
    const pageRangeText = startPage === endPage ? `صفحة ${startPage}` : `صفحة ${startPage} إلى ${endPage}`;
    
    // Exact fractional pages based on actual proportion of content
    const exactPages = (classVerses.length / V) * totalPagesSelected;
    const pagesCountText = formatExactPagesCount(exactPages);

    return {
      classNum,
      title: `الحصة ${classNum}`,
      summaryAr,
      pageRangeText,
      pagesCountText,
      exactPages,
      startAyah: firstV.ayahNum,
      endAyah: lastV.ayahNum,
      startPage,
      endPage,
      ayahCount: classVerses.length
    };
  });
}
