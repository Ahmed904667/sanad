'use client';

import React, { useState } from 'react';
import { Star, X, MessageSquare, ThumbsUp, CheckCircle2, User } from 'lucide-react';
import { Teacher, Review } from '../types';
import { useApp } from '../context/AppContext';

interface TeacherReviewsModalProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherReviewsModal: React.FC<TeacherReviewsModalProps> = ({ teacher, isOpen, onClose }) => {
  const { language, reviews, currentUser, addReview } = useApp();
  const isAr = language === 'ar';

  const teacherReviews = reviews.filter((r) => r.teacherId === teacher.id);
  const currentStudentId = currentUser?.id;
  const existingUserReview = teacherReviews.find(
    (r) => r.studentId === currentStudentId || (currentUser?.nameAr && r.studentNameAr === currentUser.nameAr)
  );

  const [ratingInput, setRatingInput] = useState<number>(existingUserReview?.rating || 5);
  const [commentInput, setCommentInput] = useState<string>(existingUserReview?.commentAr || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingInput) return;

    setIsSubmitting(true);
    addReview(teacher.id, ratingInput, commentInput);
    setIsSubmitting(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Calculate rating stats
  const totalRevs = teacherReviews.length;
  const avgRating = totalRevs > 0
    ? (teacherReviews.reduce((sum, r) => sum + r.rating, 0) / totalRevs).toFixed(1)
    : teacher.rating.toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs animate-fade-in">
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

          {/* Student Add / Edit Rating Form */}
          {currentUser?.role === 'STUDENT' && (
            <form onSubmit={handleSaveReview} className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>{existingUserReview ? (isAr ? 'تحديث تقييمك للمعلم:' : 'Update Your Rating:') : (isAr ? 'تقييم المعلم (مرة واحدة لكل طالب):' : 'Rate Scholar (Once per student):')}</span>
                </h3>
                {existingUserReview && (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                    {isAr ? 'قمت بتقييمه سابقاً' : 'Previously Rated'}
                  </span>
                )}
              </div>

              {/* Interactive Star Picker */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-700 font-bold text-xs">{isAr ? 'درجة التقييم:' : 'Your Rating:'}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatingInput(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= ratingInput ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <span className="font-extrabold text-emerald-950 text-xs mr-2">
                  {ratingInput} / 5
                </span>
              </div>

              {/* Comment Input */}
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={isAr ? 'اكتب رأيك وتجربتك مع المعلم (اختياري)...' : 'Write your experience with this scholar (optional)...'}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-amber-300/80 bg-white text-xs font-bold text-slate-900 focus:outline-emerald-800"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-xs hover:brightness-105 cursor-pointer"
                >
                  {existingUserReview ? (isAr ? 'تحديث التقييم' : 'Update Review') : (isAr ? 'حفظ التقييم' : 'Submit Review')}
                </button>

                {successMsg && (
                  <span className="text-emerald-800 font-extrabold flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'تم حفظ التقييم بنجاح!' : 'Rating saved successfully!'}</span>
                  </span>
                )}
              </div>
            </form>
          )}

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
    </div>
  );
};
