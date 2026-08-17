'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Star, MessageSquare, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ teacherId, teacherName, onClose }) => {
  const { language, addReview } = useApp();
  const isAr = language === 'ar';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addReview(teacherId, rating, comment, comment);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <h3 className="font-extrabold text-xl text-emerald-950">
                {isAr ? 'تقييم تجربة الدرس' : 'Rate Your Lesson Experience'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isAr ? `شارك رأيك وتقييمك للمعلم ${teacherName}` : `Leave feedback for ${teacherName}`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Picker */}
              <div className="flex justify-center items-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-115 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'ملاحظاتك وتقييمك الشخصي:' : 'Your Feedback:'}
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isAr 
                      ? 'اذكر أثر الحصة وطريقة الشرح وتوجيهات المعلم...' 
                      : 'Share your thoughts on teaching methodology and guidance...'
                  }
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-extrabold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? 'إرسال التقييم' : 'Submit Review'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h4 className="font-extrabold text-lg text-emerald-950">
              {isAr ? 'شكراً لتقييمك!' : 'Thank You for Your Review!'}
            </h4>
            <p className="text-xs text-slate-600">
              {isAr ? 'تم إضافة تقييمك إلى ملف المعلم بنجاح.' : 'Your review has been published.'}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
