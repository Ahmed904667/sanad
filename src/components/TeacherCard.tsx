'use client';

import React, { useState } from 'react';
import { Teacher } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarBadge } from './AvatarBadge';
import { Star, Award, Clock, Globe, Calendar, Lock, User } from 'lucide-react';

import { TeacherReviewsModal } from './TeacherReviewsModal';
import { Review } from '../types';

interface TeacherCardProps {
  teacher: Teacher;
  onBook: (teacher: Teacher) => void;
  onViewDetails: (teacher: Teacher) => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onBook, onViewDetails }) => {
  const { language, reviews } = useApp();
  const isAr = language === 'ar';
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const isFull = teacher.isFullyBooked || (teacher.bookedTimeSlots && teacher.availableSlots && teacher.bookedTimeSlots.length >= teacher.availableSlots.length);

  return (
    <div className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between group ${
      isFull ? 'border-slate-300 opacity-80 bg-slate-50/70' : 'border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300'
    }`}>
      <div>
        {/* Full Timetable or Gender Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
            teacher.gender === 'FEMALE' ? 'bg-pink-100 text-pink-900' : 'bg-emerald-100 text-emerald-900'
          }`}>
            <User className="w-3 h-3" />
            <span>{isAr ? (teacher.gender === 'FEMALE' ? 'معلمة (للأخوات)' : 'معلم (للرجال)') : (teacher.gender === 'FEMALE' ? 'Female Scholar' : 'Male Scholar')}</span>
          </span>

          {isFull && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 inline-flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" />
              <span>{isAr ? 'الجدول مكتمل بالكامل' : 'Full Timetable'}</span>
            </span>
          )}
        </div>

        {/* Avatar Badge & Main info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <AvatarBadge
              nameAr={teacher.nameAr}
              nameEn={teacher.nameEn}
              size="xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-emerald-950 p-1 rounded-lg shadow-xs" title="Verified Ijazah">
              <Award className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-lg text-emerald-950 group-hover:text-emerald-700 transition-colors">
                {isAr ? teacher.nameAr : teacher.nameEn}
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReviewsOpen(true);
                }}
                className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer transition-colors"
                title={isAr ? 'عرض آراء وتقييمات الطلاب' : 'View Reviews'}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="font-bold text-xs text-amber-900">{teacher.rating.toFixed(1)}</span>
                <span className="text-[10px] text-amber-900 underline font-bold">
                  ({reviews.filter((r: Review) => r.teacherId === teacher.id).length || teacher.reviewsCount})
                </span>
              </button>
            </div>

            <p className="text-emerald-800 font-semibold text-xs mb-2 line-clamp-1">
              {isAr ? teacher.titleAr : teacher.titleEn}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {teacher.experienceYears} {isAr ? 'سنوات خبرة' : 'Yrs Exp'}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                {teacher.languagesSpoken.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Ijazah Credentials Box */}
        <div className="bg-emerald-950 text-emerald-100 p-3 rounded-xl text-xs mb-4 border border-emerald-800 flex items-start gap-2">
          <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed text-[11px] font-serif">
            {isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn}
          </p>
        </div>

        {/* Specializations Tags */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-1.5">
            {(isAr ? teacher.specializationsAr : teacher.specializationsEn).map((spec, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-lg text-[11px] font-bold"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
        <button
          onClick={() => onViewDetails(teacher)}
          className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all text-center cursor-pointer"
        >
          {isAr ? 'عرض الملف' : 'View Profile'}
        </button>

        <button
          disabled={isFull}
          onClick={() => onBook(teacher)}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isFull 
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              : 'emerald-gradient-bg text-white hover:opacity-95 shadow-md hover:shadow-lg'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isFull ? (isAr ? 'الجدول مكتمل' : 'Full Schedule') : (isAr ? 'اختيار المعلم' : 'Select Scholar')}</span>
        </button>
      </div>

      {isReviewsOpen && (
        <TeacherReviewsModal
          teacher={teacher}
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
        />
      )}
    </div>
  );
};
