'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TeacherCard } from '@/components/TeacherCard';
import { BookingModal } from '@/components/BookingModal';
import { AvatarBadge } from '@/components/AvatarBadge';
import { Teacher } from '@/types';
import { Search, Filter, Award, Star, BookOpen, X, CheckCircle2, Globe, Clock, User, ShieldAlert } from 'lucide-react';

export default function TeachersPage() {
  const { language, teachers, student, selectedTeacherForBooking, setSelectedTeacherForBooking } = useApp();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>(student.gender || 'MALE');
  const [hideFullyBooked, setHideFullyBooked] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);

  const filterOptions = isAr ? [
    { id: 'ALL', label: 'كافة التخصصات' },
    { id: 'الإجازة بالسند المتصل', label: 'الإجازة بالسند المتصل' },
    { id: 'التجويد المتقدم', label: 'التجويد المتقدم' },
    { id: 'تحفيظ النساء والأطفال', label: 'النساء والأطفال' },
    { id: 'رواية ورش', label: 'رواية ورش' },
    { id: 'الترتيل وحسن الصوت', label: 'الترتيل والمقامات' }
  ] : [
    { id: 'ALL', label: 'All Specializations' },
    { id: 'Continuous Chain Ijazah', label: 'Chain Ijazah' },
    { id: 'Advanced Tajweed', label: 'Advanced Tajweed' },
    { id: 'Women & Children Hifz', label: 'Women & Kids' },
    { id: 'Warsh Recitation', label: 'Warsh' },
    { id: 'Tarteel & Vocal Performance', label: 'Tarteel' }
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const isFull = teacher.isFullyBooked || (teacher.bookedTimeSlots && teacher.availableSlots && teacher.bookedTimeSlots.length >= teacher.availableSlots.length);

    // Rule 1: Exclude full timetable teachers if hideFullyBooked is enabled
    if (hideFullyBooked && isFull) return false;

    // Rule 2: Gender matching filter (Male student -> Male teachers, Female student -> Female teachers)
    if (selectedGender !== 'ALL' && teacher.gender !== selectedGender) return false;

    const matchesSearch = 
      teacher.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.ijazahDetailsAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.ijazahDetailsEn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpec = selectedSpec === 'ALL' || 
      teacher.specializationsAr.includes(selectedSpec) || 
      teacher.specializationsEn.includes(selectedSpec);

    return matchesSearch && matchesSpec;
  });

  return (
    <div className="py-12 bg-slate-50/70 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold">
            <Award className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'نخبة المقرئين المعتمَدين' : 'Certified Scholars'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
            {isAr ? 'دليل المعلمين وتصفح المواعيد المتاحة' : 'Certified Scholars Directory'}
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            {isAr 
              ? 'تصفح سِيَر المقرئين الحاملين للإجازات المعتمدة بالسند المتصل واطلع على المواعيد المتاحة.' 
              : 'Browse certified Quran scholars holding authentic Ijazah credentials.'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 mb-8 space-y-4">
          
          {/* Gender Tabs & Availability Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedGender('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('MALE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === 'MALE' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {isAr ? 'معلمون رجال' : 'Male Scholars'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('FEMALE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === 'FEMALE' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {isAr ? 'معلمات نساء' : 'Female Scholars'}
              </button>
            </div>

            {/* HIDE FULL TIMETABLE TEACHERS CHECKBOX TOGGLE */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={hideFullyBooked}
                onChange={(e) => setHideFullyBooked(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>{isAr ? 'المواعيد المتاحة فقط' : 'Available Slots Only'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="w-5 h-5 text-slate-400 absolute top-3.5 right-4 pointer-events-none" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث باسم المعلم، نوع الإجازة، أو التخصص...' : 'Search by teacher name or Ijazah...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="md:col-span-6 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-emerald-700 shrink-0 hidden sm:inline" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedSpec(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedSpec === opt.id
                      ? 'emerald-gradient-bg text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onBook={(t) => setSelectedTeacherForBooking(t)}
                onViewDetails={(t) => setDetailTeacher(t)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-slate-700 text-sm font-bold">
              {isAr ? 'لا يوجد معلمون مطابقون لشروط البحث والمواعيد المتاحة حالياً.' : 'No available teachers found matching criteria.'}
            </p>
            <p className="text-slate-400 text-xs font-medium">
              {isAr ? 'جرّب تغيير تصفية الجنس أو إيقاف إخفاء الجداول المكتملة.' : 'Try adjusting gender filter or showing fully booked teachers.'}
            </p>
          </div>
        )}

      </div>

      {selectedTeacherForBooking && (
        <BookingModal
          teacher={selectedTeacherForBooking}
          onClose={() => setSelectedTeacherForBooking(null)}
        />
      )}
    </div>
  );
}
