'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lesson, Role } from '../types';
import { useApp } from '../context/AppContext';
import { AvatarBadge } from './AvatarBadge';
import { X, Calendar as CalendarIcon, Clock, Video, ArrowRight, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';

interface DaySummaryModalProps {
  dateStr: string;
  lessons: Lesson[];
  userRole: Role;
  onClose: () => void;
}

export const DaySummaryModal: React.FC<DaySummaryModalProps> = ({
  dateStr,
  lessons,
  userRole,
  onClose
}) => {
  const router = useRouter();
  const { language } = useApp();
  const isAr = language === 'ar';

  const isTeacherView = userRole === 'TEACHER';

  const handleSelectClass = (lessonId: string) => {
    onClose();
    router.push(`/classes/${lessonId}`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] overflow-y-auto transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl emerald-gradient-bg flex items-center justify-center text-amber-400 shadow-md">
            <CalendarIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 block uppercase">
              {isAr ? 'ملخص حصص اليوم:' : 'Day Summary:'}
            </span>
            <h3 className="font-black text-xl text-emerald-950">
              {dateStr}
            </h3>
          </div>
        </div>

        {/* Lessons List in Modal */}
        {lessons.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-semibold mb-2">
              {isAr ? `يتوفر ${lessons.length} حصص مجدولة في هذا اليوم:` : `${lessons.length} classes scheduled for this date:`}
            </p>

            {lessons.map((lesson) => {
              const partnerNameAr = isTeacherView ? lesson.studentNameAr : lesson.teacherNameAr;
              const partnerNameEn = isTeacherView ? lesson.studentNameEn : lesson.teacherNameEn;

              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectClass(lesson.id)}
                  className="bg-slate-50 hover:bg-emerald-50/70 p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <AvatarBadge nameAr={partnerNameAr} nameEn={partnerNameEn} size="md" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        {isAr ? partnerNameAr : partnerNameEn}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-600 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lesson.time} ({lesson.durationMinutes} {isAr ? 'دقيقة' : 'min'})</span>
                      </div>
                      {lesson.surahTargetAr && (
                        <p className="text-[11px] text-slate-500 font-serif line-clamp-1">
                          {isAr ? lesson.surahTargetAr : lesson.surahTargetEn}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-700 group-hover:text-emerald-950 font-extrabold text-xs shrink-0">
                    <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p className="font-bold text-slate-700">{isAr ? 'لا توجد حصص مجدولة لهذا اليوم' : 'No classes scheduled for this date'}</p>
            <p className="text-[11px] text-slate-400">{isAr ? 'يمكنك اختيار يوم آخر من التقويم' : 'Please select another date on the calendar'}</p>
          </div>
        )}

      </div>
    </div>
  );
};
