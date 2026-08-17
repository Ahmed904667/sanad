'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LearningGoalTrack, StudentQuranGoal } from '../types';
import { X, Target, BookOpen, Calendar, Clock, CheckCircle2, Sparkles, Award, Repeat } from 'lucide-react';

interface GoalCustomizerModalProps {
  onClose: () => void;
  onSaveGoal: (goal: StudentQuranGoal) => void;
}

export const GoalCustomizerModal: React.FC<GoalCustomizerModalProps> = ({
  onClose,
  onSaveGoal
}) => {
  const { language, student } = useApp();
  const isAr = language === 'ar';

  const [track, setTrack] = useState<LearningGoalTrack>(student.quranGoal?.track || 'HIFZ_NEW');
  const [targetSurahAr, setTargetSurahAr] = useState(student.quranGoal?.targetSurahOrJuzAr || 'الجزء الثلاثون (جزء عم) + سورة البقرة');
  const [selectedDays, setSelectedDays] = useState<string[]>(['الإثنين', 'الأربعاء']);
  const [timeSlot, setTimeSlot] = useState('18:00');

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGoal: StudentQuranGoal = {
      track,
      targetSurahOrJuzAr: targetSurahAr,
      targetSurahOrJuzEn: targetSurahAr,
      orientationCompleted: true,
      agreedWeeklyDaysAr: selectedDays,
      agreedWeeklyDaysEn: selectedDays
    };

    onSaveGoal(updatedGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 shadow-md">
            <Target className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
              {isAr ? 'بعد الحصة التمهيدية والتأسيسية' : 'Post-Orientation Goal Alignment'}
            </span>
            <h3 className="font-extrabold text-xl text-emerald-950">
              {isAr ? 'تصميم الخطة والهدف القرآني المخصص' : 'Custom Quran Plan & Goal Setup'}
            </h3>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Track Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              {isAr ? 'اختر مسار التعلم القرآني:' : 'Select Quran Learning Track:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setTrack('HIFZ_NEW')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer space-y-1 ${
                  track === 'HIFZ_NEW'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-400 font-bold'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">{isAr ? 'مسار الحفظ جديد' : 'New Hifz Track'}</span>
                  {track === 'HIFZ_NEW' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  {isAr ? 'حفظ سور جديدة مع التثبيت الأسبوعي' : 'Memorize new surahs systematically'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTrack('TILAWAH_CORRECTION')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer space-y-1 ${
                  track === 'TILAWAH_CORRECTION'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-400 font-bold'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">{isAr ? 'تصحيح تلاوة وتجويد' : 'Tilawah & Tajweed'}</span>
                  {track === 'TILAWAH_CORRECTION' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  {isAr ? 'قراءة متقنة مع تطبيق أحكام التجويد' : 'Correct pronunciation & Tajweed'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTrack('IJAZAH_REVIEW')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer space-y-1 ${
                  track === 'IJAZAH_REVIEW'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-400 font-bold'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">{isAr ? 'مراجعة إجازة' : 'Ijazah Review'}</span>
                  {track === 'IJAZAH_REVIEW' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  {isAr ? 'ختم ومراجعة بالسند المتصل برواية حفص أو ورش' : 'Review for continuous chain Ijazah certification'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTrack('COMBINED')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer space-y-1 ${
                  track === 'COMBINED'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-400 font-bold'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm">{isAr ? 'مزيج مشترك' : 'Combined Track'}</span>
                  {track === 'COMBINED' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  {isAr ? 'تلاوة جزء وحفظ جزء وفق الاتفاق مع المعلم' : 'Combine both Tilawah and Hifz'}
                </p>
              </button>
            </div>
          </div>

          {/* Target Surah / Juz Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1">
              {isAr ? '2. السور والأجزاء المستهدفة لهذا الشهر:' : '2. Target Surahs & Juz for this Month:'}
            </label>
            <textarea
              rows={2}
              required
              value={targetSurahAr}
              onChange={(e) => setTargetSurahAr(e.target.value)}
              placeholder={isAr ? 'مثال: الجزء الثلاثون (جزء عم) + حفظ سورة البقرة الآيات 1-100' : 'e.g. Juz 30 + Surah Al-Baqarah Verses 1-100'}
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-serif focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Agreed Weekly Class Days */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-2">
              {isAr ? '3. الأيام الأسبوعية المتفق عليها للحصص:' : '3. Agreed Weekly Class Days:'}
            </label>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'emerald-gradient-bg text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1">
              {isAr ? '4. توقيت الحصص اليومي المفضل:' : '4. Preferred Daily Class Time:'}
            </label>
            <input
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'اعتماد الخطة المخصصة وتوليد الجدول الشهري' : 'Save Plan & Generate Monthly Schedule'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
