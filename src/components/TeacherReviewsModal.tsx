'use client';

import { AccessibleModal } from './AccessibleModal';

import React from 'react';
import { Star, X, MessageSquare, User } from 'lucide-react';
import { Teacher } from '../types';
import { useApp } from '../context/AppContext';

interface TeacherReviewsModalProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherReviewsModal: React.FC<TeacherReviewsModalProps> = ({ teacher, isOpen, onClose }) => {
  const { language, reviews } = useApp();
  const isAr = language === 'ar';

  const teacherReviews = reviews.filter((r) => r.teacherId === teacher.id);
  if (!isOpen) return null;

  // Calculate rating stats
  const totalRevs = teacherReviews.length;
  const avgRating = totalRevs > 0
    ? (teacherReviews.reduce((sum, r) => sum + r.rating, 0) / totalRevs).toFixed(1)
    : (isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet');

  return (
    <AccessibleModal onClose={onClose} aria-label={isAr ? "آراء الطلاب" : "Student reviews"} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-lg shadow-sm">
              {teacher.nameAr.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isAr ? teacher.nameAr : teacher.nameEn}
              </h2>
              <p className="text-xs text-emerald-200">
                {isAr ? teacher.titleAr : teacher.titleEn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* Overall Rating Summary */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-right space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-3xl font-black text-emerald-950">{avgRating}</span>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 font-bold text-xs">
                {isAr ? `استناداً إلى ${totalRevs} تقييماً من الطلاب` : `Based on ${totalRevs} student reviews`}
              </p>
            </div>

            <div className="text-emerald-900 bg-white px-4 py-2 rounded-xl border border-emerald-200 font-bold text-center">
              <span>{isAr ? 'تقييمات موثقة 100% من طلاب منصة سنَد' : '100% Verified Student Reviews'}</span>
            </div>
          </div>

          {/* List of All Student Reviews */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? `جميع آراء وتقييمات الطلاب (${totalRevs}):` : `All Student Reviews (${totalRevs}):`}</span>
            </h3>

            {teacherReviews.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-bold">{isAr ? 'لا توجد تعليقات مكتوبة لهذا المعلم بعد.' : 'No written reviews for this scholar yet.'}</p>
                <p className="text-[11px] pt-1">{isAr ? 'كن أول من يضيف تقييماً وتعليقاً!' : 'Be the first to rate!'}</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {teacherReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-black text-slate-900 text-xs">
                          {isAr ? rev.studentNameAr : rev.studentNameEn}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className={`w-3.5 h-3.5 ${st <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>

                    {(rev.commentAr || rev.commentEn) && (
                      <p className="text-slate-700 text-xs font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        {isAr ? rev.commentAr : (rev.commentEn || rev.commentAr)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-extrabold text-xs hover:bg-slate-300 cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};
