export function generateTimeSlots(start: string, end: string, stepMinutes = 5): string[] {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || stepMinutes <= 0 || startMinutes >= endMinutes) return [];

  return Array.from({ length: Math.ceil((endMinutes - startMinutes) / stepMinutes) }, (_, index) => {
    const totalMinutes = startMinutes + index * stepMinutes;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  });
}
