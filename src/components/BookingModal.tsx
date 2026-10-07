'use client';

import { AccessibleModal } from './AccessibleModal';

import React, { useEffect, useState } from 'react';
import { Teacher } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, Video, CheckCircle2, Sparkles } from 'lucide-react';
import { formatTime12h } from '../utils/timeFormat';
import { getTeacherAvailableSlots, lessonTimeRange, timeRangesOverlap } from '../utils/availability';
import { getDayNameArFromDate } from '@/data/quranData';

interface BookingModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ teacher, onClose }) => {
  const { language, student, bookLesson, plans, lessons } = useApp();
  const isAr = language === 'ar';

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [availabilityResult, setAvailabilityResult] = useState<{ key: string; occupied: { date: string; time: string; durationMinutes: number }[]; error?: string }>({ key: '', occupied: [] });
  const teacherId = teacher?.id;
  const availabilityKey = `${teacherId || ''}:${selectedDate}`;
  const hasFreshAvailability = availabilityResult.key === availabilityKey && !availabilityResult.error;
  const isLoadingAvailability = availabilityResult.key !== availabilityKey;
  const availabilityError = availabilityResult.key === availabilityKey ? availabilityResult.error || '' : '';
  const occupiedLessons = hasFreshAvailability ? availabilityResult.occupied : [];

  useEffect(() => {
    if (!teacherId) return;
    const controller = new AbortController();
    fetch(`/api/teachers/availability?teacherId=${encodeURIComponent(teacherId)}&from=${selectedDate}&to=${selectedDate}`, {
      cache: 'no-store',
      signal: controller.signal,
    }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load availability.');
      setAvailabilityResult({ key: availabilityKey, occupied: Array.isArray(result.occupied) ? result.occupied : [] });
    }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setAvailabilityResult({
        key: availabilityKey,
        occupied: [],
        error: isAr ? 'تعذر تحميل الحجوزات الحالية. حاول تحديث اليوم.' : 'Could not load current bookings. Try refreshing the date.',
      });
    });
    return () => controller.abort();
  }, [teacherId, selectedDate, availabilityKey, isAr]);

  const activePlan = plans.find(p => p.id === student.activePlanId) || plans[0];
  const durationMinutes = activePlan?.lessonDurationMinutes || 5;
  const day = getDayNameArFromDate(selectedDate);
  const rawSlots = teacher ? getTeacherAvailableSlots(teacher, day, durationMinutes) : [];
  const availableSlotsList = rawSlots.map(rawSlot => ({
    rawSlot,
    formattedText: formatTime12h(rawSlot, isAr),
    isBooked: isLoadingAvailability || !hasFreshAvailability || Boolean(availabilityError) || occupiedLessons.some(lesson => {
      if (lesson.date !== selectedDate) return false;
      const candidate = lessonTimeRange(rawSlot, durationMinutes);
      const booked = lessonTimeRange(lesson.time, lesson.durationMinutes || durationMinutes);
      return Boolean(candidate && booked && timeRangesOverlap(candidate, booked));
    }) || lessons.some(lesson => {
      if (!teacher || lesson.teacherId !== teacher.id || lesson.date !== selectedDate || lesson.status !== 'SCHEDULED') return false;
      const candidate = lessonTimeRange(rawSlot, durationMinutes);
      const booked = lessonTimeRange(lesson.time, lesson.durationMinutes || durationMinutes);
      return Boolean(candidate && booked && timeRangesOverlap(candidate, booked));
    }),
  }));

  const firstAvailable = availableSlotsList.find(s => !s.isBooked)?.rawSlot || '';
  const [selectedTime, setSelectedTime] = useState('');
  const activeSelectedTime = availableSlotsList.some(slot => slot.rawSlot === selectedTime && !slot.isBooked)
    ? selectedTime
    : firstAvailable;
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  if (!teacher) return null;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedTime) {
      setBookingError(isAr ? 'لا يوجد موعد متاح لهذا اليوم. اختر يوماً آخر.' : 'No available times on this day. Choose another date.');
      return;
    }
    setIsSubmitting(true);
    setBookingError('');
    const saved = await bookLesson(teacher.id, selectedDate, activeSelectedTime);
    setIsSubmitting(false);
    if (!saved) {
      setBookingError(isAr ? 'تعذر حجز هذا الموعد. ربما حجزه شخص آخر؛ حدّث الصفحة واختر وقتاً آخر.' : 'Could not book this time. It may have just been taken; refresh and choose another.');
      return;
    }
    setIsSuccess(true);
  };

  return (
    <AccessibleModal onClose={onClose} aria-label={isAr ? "حجز حصة" : "Book a class"} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div aria-labelledby="booking-modal-title" className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={isAr ? 'إغلاق نافذة الحجز' : 'Close booking dialog'}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg flex items-center justify-center text-amber-400 shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 id="booking-modal-title" className="font-extrabold text-xl text-emerald-950">
                  {isAr ? 'حجز حصة قرأنية جديدة' : 'Book a New Lesson'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? `مع ${teacher.nameAr}` : `With ${teacher.nameEn}`}
                </p>
              </div>
            </div>

            {/* Subscription Status Pill */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-6 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-emerald-950">
                  {isAr ? `خطة: ${activePlan.titleAr}` : `Plan: ${activePlan.titleEn}`}
                </span>
              </div>
              <span className="bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                {student.remainingLessons} {isAr ? 'دروس متبقية' : 'lessons left'}
              </span>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'اختر تاريخ الحصة (Date):' : 'Select Date:'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                    setBookingError('');
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-800"
                />
              </div>

              {/* Time Slots Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'اختر الوقت المفضل من ساعات عمل المعلم المتاحة:' : 'Select Available Time Slot:'}
                </label>
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl p-1 sm:grid-cols-3" aria-label={isAr ? 'الأوقات المتاحة' : 'Available time slots'}>
                  {availableSlotsList.map((slot) => {
                    const isSelected = activeSelectedTime === slot.rawSlot;

                    if (slot.isBooked) {
                      return (
                        <div
                          key={slot.rawSlot}
                          className="p-2.5 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-600 opacity-60 text-center cursor-not-allowed"
                        >
                          <div className="line-through">{slot.formattedText}</div>
                          <span className="text-[10px] text-rose-600 font-bold block">{isAr ? 'مشغول' : 'Booked'}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.rawSlot}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedTime(slot.rawSlot)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'emerald-gradient-bg text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                            : 'border-slate-200 hover:border-emerald-300 text-slate-700 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.formattedText}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(isLoadingAvailability || !hasFreshAvailability) && !availabilityError && <p role="status" className="text-sm text-slate-500">{isAr ? 'جارٍ التحقق من الحجوزات…' : 'Checking existing bookings…'}</p>}
              {availabilityError && <p role="alert" className="text-sm font-medium text-red-700">{availabilityError}</p>}
              {availableSlotsList.length === 0 && <p className="text-sm text-slate-500">{isAr ? 'لا توجد أوقات متاحة لهذا اليوم.' : 'No availability on this day.'}</p>}
              {bookingError && <p role="alert" className="text-sm font-medium text-red-700">{bookingError}</p>}

              {/* Class Info Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'مدة الحصة:' : 'Duration:'}</span>
                  <span className="font-bold text-slate-900">{activePlan.lessonDurationMinutes} {isAr ? 'دقيقة' : 'minutes'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'منصة الحضور الافتراضية:' : 'Virtual Platform:'}</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Google Meet
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoadingAvailability || !hasFreshAvailability || Boolean(availabilityError) || !activeSelectedTime}
                className="w-full py-3.5 rounded-2xl emerald-gradient-bg text-white font-extrabold text-sm hover:opacity-95 shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? (isAr ? 'جارٍ الحجز...' : 'Booking...') : (isAr ? 'تأكيد حجز الحصة الآن' : 'Confirm booking')}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="font-extrabold text-2xl text-emerald-950">
              {isAr ? 'تمت جدولة الحصة بنجاح!' : 'Lesson Successfully Booked!'}
            </h3>

            <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto">
              {isAr
                ? `تم حجز موعدك مع ${teacher.nameAr} بتاريخ ${selectedDate} الساعة ${activeSelectedTime}.`
                : `Your session with ${teacher.nameEn} is scheduled for ${selectedDate} at ${activeSelectedTime}.`}
            </p>

            <div className="bg-amber-50 text-amber-950 p-4 rounded-2xl border border-amber-200 text-xs flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs font-black text-amber-900">{isAr ? 'رابط القاعة الافتراضية:' : 'Virtual Classroom Link:'}</span>
              <p className="text-[11px] text-amber-800 font-medium">
                {isAr
                  ? 'سيقوم المعلم بإضافة رابط Google Meet لهذه الحصة. سيتم تفعيل زر دخول القاعة تلقائياً في حسابك فور قيام المعلم بوضعه.'
                  : 'The teacher will assign the Google Meet link. The join button will automatically activate once added.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إغلاق والذهاب للوحة التحكم' : 'Close & View Dashboard'}
            </button>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
};
