import type { Teacher } from '@/types';

// A display-only empty state. It is never a bookable profile or a seed account.
export const UNAVAILABLE_TEACHER: Teacher = {
  id: '', nameAr: 'المعلم غير متاح', nameEn: 'Teacher unavailable', email: '',
  titleAr: 'لم يُعيّن معلم متاح', titleEn: 'No available teacher assigned', rating: 0, reviewsCount: 0,
  ijazahDetailsAr: '', ijazahDetailsEn: '', experienceYears: 0, languagesSpoken: [],
  specializationsAr: [], specializationsEn: [], bioAr: '', bioEn: '', hourlyRateSar: 0,
  availableSlots: [], availabilityRanges: [], availabilityByDay: {}, workingDaysAr: [],
  workingHoursStart: '00:00', workingHoursEnd: '00:00', bookedTimeSlots: [],
  gender: 'MALE', isFullyBooked: true, approvalStatus: 'REJECTED',
};
