'use client';

import React, { useState, useMemo } from 'react';
import { getDayNameArFromDate } from '@/data/quranData';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';

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

  const selectedDayName = useMemo(() => {
    return getDayNameArFromDate(selectedDate);
  }, [selectedDate]);

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
    <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Header & Week Pager */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-4 h-4 text-emerald-800" />
          </div>
          <div>
            <span className="font-black text-slate-900 block leading-tight">{weekRangeLabel}</span>
            <span className="text-[10px] font-extrabold text-emerald-800 block">
              {isAr ? `المحدد: ${selectedDayName} (${selectedDate})` : `Selected: ${selectedDate}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Direct Native Date Input Selector */}
          <input
            type="date"
            value={selectedDate}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="py-1 px-2 text-[11px] font-bold rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer shadow-2xs focus:ring-2 focus:ring-emerald-500"
            title={isAr ? 'اختيار تاريخ مباشر' : 'Select direct date'}
          />

          <button
            type="button"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              weekOffset === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs'
            }`}
            title={isAr ? 'الأسبوع السابق' : 'Previous Week'}
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            type="button"
            disabled={weekOffset >= 4}
            onClick={() => setWeekOffset(prev => Math.min(4, prev + 1))}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              weekOffset >= 4
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs'
            }`}
            title={isAr ? 'الأسبوع التالي' : 'Next Week'}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Days Carousel / Grid (Scrollable snap row on mobile with min 85px width, 7 cols on desktop) */}
      <div className="flex sm:grid sm:grid-cols-7 overflow-x-auto gap-2 pb-1.5 pt-0.5 scrollbar-thin snap-x">
        {weekDays.map((item) => {
          const isSelected = selectedDate === item.dateStr;

          if (!item.isWorkingDay) {
            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={true}
                className="min-w-[85px] sm:min-w-0 flex-1 shrink-0 snap-start py-3 px-2 rounded-2xl border border-slate-200 bg-slate-100/90 text-slate-400 text-center opacity-40 cursor-not-allowed select-none flex flex-col items-center justify-center space-y-1"
                title={isAr ? `المعلم لا يعمل يوم ${item.dayNameAr}` : 'Scholar Off'}
              >
                <span className="text-xs font-black whitespace-nowrap text-slate-500">
                  {item.dayNameAr}
                </span>
                <span className="text-xs font-mono font-black text-slate-400 line-through">
                  {item.mmdd}
                </span>
                <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isAr ? 'إجازة' : 'Off'}</span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`min-w-[85px] sm:min-w-0 flex-1 shrink-0 snap-start py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-md ring-2 ring-emerald-400 scale-[1.02]'
                  : 'bg-white border-slate-200 text-slate-800 font-bold hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs'
              }`}
            >
              <span className={`text-xs font-black whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {item.dayNameAr}
              </span>
              <span className={`text-xs font-mono font-black ${isSelected ? 'text-amber-300' : 'text-emerald-900'}`}>
                {item.mmdd}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
                isSelected ? 'bg-amber-400 text-emerald-950 shadow-2xs' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {isSelected && <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />}
                <span>{isAr ? 'متاح' : 'Available'}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
