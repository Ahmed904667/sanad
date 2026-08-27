/**
 * Converts any time string (e.g. "14:00", "06:30", "21:30")
 * to a clean 12-hour format string with AM/PM (English) or ص/م (Arabic).
 */
export function formatTime12h(timeStr: string | undefined | null, isAr: boolean = true): string {
  if (!timeStr) return '';

  const clean = timeStr.trim();

  // Handle strings already containing AM/PM or ص/م
  if (clean.includes('ص') || clean.includes('م') || clean.includes('AM') || clean.includes('PM')) {
    if (isAr) {
      return clean.replace(/AM/gi, 'ص').replace(/PM/gi, 'م');
    } else {
      return clean.replace(/ص/g, 'AM').replace(/م/g, 'PM');
    }
  }

  // Extract HH:MM
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return clean;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  const isPM = hours >= 12;
  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }

  const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const period = isAr ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');

  return `${paddedHours}:${minutes} ${period}`;
}

/**
 * Returns a list of 12-hour time options for dropdowns with raw 24h value and formatted 12-hour display label.
 */
export function getTimeOptions12h(isAr: boolean = true): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  
  for (let h = 5; h <= 23; h++) {
    for (let m of [0, 30]) {
      const padH = h < 10 ? `0${h}` : `${h}`;
      const padM = m === 0 ? '00' : `${m}`;
      const val = `${padH}:${padM}`;
      options.push({
        value: val,
        label: formatTime12h(val, isAr)
      });
    }
  }
  return options;
}
