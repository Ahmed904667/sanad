'use client';

import React, { useState } from 'react';
import { Teacher } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, Video, CheckCircle2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

interface BookingModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ teacher, onClose }) => {
  const { language, student, bookLesson, plans } = useApp();
  const isAr = language === 'ar';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const startHour = parseInt((teacher?.workingHoursStart || '12:00').split(':')[0], 10);
  const endHour = parseInt((teacher?.workingHoursEnd || '18:00').split(':')[0], 10);

  const availableSlotsList: { rawSlot: string; formattedText: string; isBooked: boolean }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const slotStr = `${h.toString().padStart(2, '0')}:00`;
    const isBooked = teacher?.bookedTimeSlots?.includes(slotStr) ?? false;
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const period = h >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
    availableSlotsList.push({
      rawSlot: slotStr,
      formattedText: `${displayH}:00 ${period}`,
      isBooked
    });
  }

  const firstAvailable = availableSlotsList.find(s => !s.isBooked)?.rawSlot || '12:00';
  const [selectedTime, setSelectedTime] = useState(firstAvailable);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!teacher) return null;

  const activePlan = plans.find(p => p.id === student.activePlanId) || plans[1];

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const slotObj = availableSlotsList.find(s => s.rawSlot === selectedTime) || availableSlotsList[0];
    const timeFormatted = slotObj ? `${selectedTime} (${slotObj.formattedText})` : selectedTime;
    bookLesson(teacher.id, selectedDate, timeFormatted);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
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
                <h3 className="font-extrabold text-xl text-emerald-950">
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
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-800"
                />
              </div>

              {/* Time Slots Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'اختر الوقت المفضل من ساعات عمل المعلم المتاحة:' : 'Select Available Time Slot:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlotsList.map((slot) => {
                    const isSelected = selectedTime === slot.rawSlot;

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
                className="w-full py-3.5 rounded-2xl emerald-gradient-bg text-white font-extrabold text-sm hover:opacity-95 shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد حجز الحصة الأن' : 'Confirm Booking Now'}</span>
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
                ? `تم حجز موعدك مع ${teacher.nameAr} بتاريخ ${selectedDate} الساعة ${selectedTime}.` 
                : `Your session with ${teacher.nameEn} is scheduled for ${selectedDate} at ${selectedTime}.`}
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
    </div>
  );
};
