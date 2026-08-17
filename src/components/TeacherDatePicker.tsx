'use client';

import React, { useState, useMemo } from 'react';
import { getDayNameArFromDate } from '@/data/quranData';
import { Calendar, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface TeacherDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  workingDaysAr?: string[];
  isAr?: boolean;
}

export function TeacherDatePicker({
  selectedDate,
  onSelectDate,
  workingDaysAr,
  isAr = true
}: TeacherDatePickerProps) {
  // Offset in weeks from current week (0 = current week starting from tomorrow, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate 7 days for the active week view
  const weekDays = useMemo(() => {
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start offset from tomorrow
    const startDayIndex = 1 + weekOffset * 7;

    for (let i = 0; i < 7; i++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() + startDayIndex + i);

      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const mmdd = `${mm}/${dd}`;
      const dayNameAr = getDayNameArFromDate(dateStr);

      const isWorkingDay = !workingDaysAr || workingDaysAr.length === 0 || workingDaysAr.includes(dayNameAr);

      items.push({
        dateStr,
        mmdd,
        dayNameAr,
        isWorkingDay,
        dayNumber: dd,
        monthNumber: mm
      });
    }
    return items;
  }, [workingDaysAr, weekOffset]);

  // Week range summary label (e.g. 08/18 - 08/24)
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0].mmdd;
    const end = weekDays[6].mmdd;
    if (weekOffset === 0) {
      return isAr ? `الأسبوع الحالي (${start} - ${end})` : `Current Week (${start} - ${end})`;
    }
    if (weekOffset === 1) {
      return isAr ? `الأسبوع القادم (${start} - ${end})` : `Next Week (${start} - ${end})`;
    }
    return isAr ? `الأسبوع ${weekOffset + 1} (${start} - ${end})` : `Week ${weekOffset + 1} (${start} - ${end})`;
  }, [weekDays, weekOffset, isAr]);

  // Ensure initial selectedDate is valid
  React.useEffect(() => {
    if (workingDaysAr && workingDaysAr.length > 0) {
      const currentDayName = getDayNameArFromDate(selectedDate);
      if (!workingDaysAr.includes(currentDayName)) {
        const firstValid = weekDays.find(item => item.isWorkingDay);
        if (firstValid) {
          onSelectDate(firstValid.dateStr);
        }
      }
    }
  }, [selectedDate, workingDaysAr, weekDays, onSelectDate]);

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs">
      {/* Header & Week Pager */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-black text-slate-900">{weekRangeLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              weekOffset === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
            }`}
            title={isAr ? 'الأسبوع السابق' : 'Previous Week'}
          >
            {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{isAr ? 'السابق' : 'Prev'}</span>
          </button>

          <button
            type="button"
            disabled={weekOffset >= 4}
            onClick={() => setWeekOffset(prev => Math.min(4, prev + 1))}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              weekOffset >= 4
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
            }`}
            title={isAr ? 'الأسبوع التالي' : 'Next Week'}
          >
            <span className="hidden sm:inline text-[11px]">{isAr ? 'التالي' : 'Next'}</span>
            {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Single Compact 7-Day Horizontal Row */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          if (!item.isWorkingDay) {
            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={true}
                className="py-2.5 px-1 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-400 text-center opacity-40 cursor-not-allowed select-none flex flex-col items-center justify-center space-y-0.5"
                title={isAr ? `المعلم لا يعمل يوم ${item.dayNameAr}` : 'Scholar Off'}
              >
                <span className="text-[10px] font-mono text-slate-400 line-through font-bold">
                  {item.mmdd}
                </span>
                <span className="text-[10px] font-extrabold truncate max-w-full text-slate-400">
                  {item.dayNameAr}
                </span>
                <span className="text-[8px] font-black text-rose-700 flex items-center gap-0.5">
                  <Lock className="w-2 h-2" />
                  <span>{isAr ? 'غير متاح' : 'Off'}</span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-md scale-[1.03] ring-2 ring-emerald-400'
                  : 'bg-white border-slate-200 text-slate-800 font-bold hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-amber-300' : 'text-emerald-800'}`}>
                {item.mmdd}
              </span>
              <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {item.dayNameAr}
              </span>
              <span className={`text-[8px] font-black px-1 rounded-md ${
                isSelected ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {isAr ? 'متاح' : 'Available'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
