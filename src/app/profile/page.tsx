'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatAvailabilityRanges } from '@/utils/timeFormat';
import { UNAVAILABLE_TEACHER } from '@/utils/unavailableTeacher';
import { AvatarBadge } from '@/components/AvatarBadge';
import { TeacherAvailabilityModal } from '@/components/TeacherAvailabilityModal';
import { AuthGuard } from '@/components/AuthGuard';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  LogOut,
  Clock
} from 'lucide-react';

function ProfileContent() {
  const {
    language,
    role,
    currentUser,
    student,
    teacherProfile,
    teachers,
    plans,
    logout,
    updateUserProfile
  } = useApp();
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ijazah, setIjazah] = useState('');
  const [teacherTitle, setTeacherTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [teacherBio, setTeacherBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // The profile form is initialized from session data after AuthGuard hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(currentUser.nameAr || currentUser.nameEn || (role === 'STUDENT' ? student.nameAr : teacherProfile.nameAr));
      setEmail(currentUser.email || (role === 'STUDENT' ? student.email : teacherProfile.email));
      setPhone(role === 'STUDENT' ? (student.phone || '') : (teacherProfile.phone || ''));
      setIjazah(teacherProfile.ijazahChainAr || '');
      setTeacherTitle(teacherProfile.titleAr || '');
      setExperienceYears(teacherProfile.experienceYears || 0);
      setLanguagesSpoken(teacherProfile.languagesSpoken?.join(', ') || '');
      setSpecializations(teacherProfile.specializationsAr?.join(', ') || '');
      setTeacherBio(teacherProfile.bioAr || '');
    }
  }, [currentUser, role, student, teacherProfile]);

  const activePlan = plans.find(p => p.id === (student.activePlanId || student.pendingPlanId)) || plans[1];
  const assignedTeacher = teachers.find(t => t.id === student.assignedTeacherId) || UNAVAILABLE_TEACHER;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !name.trim() || !email.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await updateUserProfile(name, email, phone, ijazah, currentUser?.role === 'TEACHER' ? {
        title: teacherTitle,
        experienceYears,
        languages: languagesSpoken,
        specializations,
        bio: teacherBio,
      } : undefined);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : (isAr ? 'تعذر حفظ الملف الشخصي.' : 'Unable to save your profile.'));
    } finally { setIsSaving(false); }
  };

  const displayName = currentUser?.nameAr || currentUser?.nameEn || name || 'المستخدم';

  return (
    <div className="py-12 bg-slate-50/70 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-start">
            <AvatarBadge
              nameAr={displayName}
              nameEn={currentUser?.nameEn || displayName}
              size="xl"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {currentUser?.role === 'STUDENT' && (isAr ? 'حساب طالب' : 'Student Account')}
                  {currentUser?.role === 'TEACHER' && (isAr ? 'حساب معلم مجاز' : 'Certified Teacher')}
                  {currentUser?.role === 'ADMIN' && (isAr ? 'مدير المنصة' : 'Super Admin')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-emerald-950">
                {displayName}
              </h1>

              <p className="text-slate-500 text-xs font-semibold">
                {currentUser?.email || email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>

        {/* Profile Information Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <User className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-lg text-emerald-950">
              {isAr ? 'تعديل البيانات الشخصية' : 'Personal Information'}
            </h3>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-xs font-bold text-center border border-emerald-200">
              {isAr ? 'تم حفظ التعديلات بنجاح!' : 'Profile updated successfully!'}
            </div>
          )}
          {saveError && <p role="alert" className="text-xs font-bold text-rose-700">{saveError}</p>}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الاسم الكامل:' : 'Full Name:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'رقم الجوال:' : 'Phone Number:'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966500000000"
                  className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {currentUser?.role === 'TEACHER' && (
              <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                <h3 className="font-extrabold text-emerald-950">{isAr ? 'ملفك التعريفي كمعلم' : 'Teacher profile'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-xs font-bold text-slate-700">{isAr ? 'المسمى التعليمي' : 'Teaching title'}
                    <input value={teacherTitle} onChange={e => setTeacherTitle(e.target.value)} maxLength={120} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white" placeholder={isAr ? 'معلم قرآن وتجويد' : 'Quran and Tajweed teacher'} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">{isAr ? 'سنوات الخبرة' : 'Years of experience'}
                    <input type="number" min={0} max={60} value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">{isAr ? 'اللغات (افصل بينها بفاصلة)' : 'Languages (comma separated)'}
                    <input value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} maxLength={300} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white" placeholder={isAr ? 'العربية، الإنجليزية' : 'Arabic, English'} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">{isAr ? 'مجالات التعليم' : 'Teaching specializations'}
                    <input value={specializations} onChange={e => setSpecializations(e.target.value)} maxLength={500} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white" placeholder={isAr ? 'حفظ، تجويد، تصحيح تلاوة' : 'Memorization, Tajweed, recitation'} />
                  </label>
                </div>
                <label className="block text-xs font-bold text-slate-700">{isAr ? 'نبذة عن المعلم' : 'About the teacher'}
                  <textarea rows={3} value={teacherBio} onChange={e => setTeacherBio(e.target.value)} maxLength={2000} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white" />
                </label>
                <label className="block text-xs font-bold text-slate-700">{isAr ? 'الإجازة والسند' : 'Ijazah and certification'}
                  <textarea rows={3} value={ijazah} onChange={e => setIjazah(e.target.value)} maxLength={2000} className="mt-1 w-full p-3 rounded-xl border border-slate-300 bg-white font-serif" />
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              aria-busy={isSaving}
              className="px-6 py-3.5 rounded-2xl emerald-gradient-bg text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {/* TEACHER AVAILABILITY CARD */}
        {currentUser?.role === 'TEACHER' && (
          <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gold-gradient-bg text-emerald-950 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {isAr ? 'أوقات وساعات العمل اليومية' : 'Daily Working Hours & Availability'}
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium">
                    {formatAvailabilityRanges(teacherProfile.availabilityRanges, teacherProfile.workingHoursStart, teacherProfile.workingHoursEnd, isAr, teacherProfile.availabilityByDay)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAvailabilityModalOpen(true)}
                className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>{isAr ? 'تعديل الساعات والمواعيد' : 'Edit Hours & Slots'}</span>
              </button>
            </div>

            <p className="text-xs text-emerald-200/90 font-medium leading-relaxed">
              {isAr
                ? 'يمكنك تعديل توقيت الدوام اليومي في أي وقت. في حال وجود حصص مجدولة سابقة متعارضة، يوفر النظام خيارات المعالجة التلقائية أو الإبقاء عليها لحماية مواعيد الطلاب.'
                : 'Manage your daily working slots. System auto-handles scheduled class conflicts.'}
            </p>
          </div>
        )}

        <TeacherAvailabilityModal
          isOpen={isAvailabilityModalOpen}
          onClose={() => setIsAvailabilityModalOpen(false)}
          teacher={teacherProfile}
        />

        {/* ROLE SPECIFIC OVERVIEW CARD */}
        {currentUser?.role === 'STUDENT' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-emerald-950 border-b border-slate-100 pb-3">
              {isAr ? 'بيانات المعلم الموكل والخطة' : 'Assigned Instructor & Plan'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">{isAr ? 'المعلم الحالي:' : 'Current Teacher:'}</span>
                <span className="font-extrabold text-slate-900 text-sm block">{isAr ? assignedTeacher.nameAr : assignedTeacher.nameEn}</span>
                <span className="text-emerald-700 font-serif text-[11px] block">{isAr ? assignedTeacher.ijazahDetailsAr : assignedTeacher.ijazahDetailsEn}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">{isAr ? 'الخطة الحالية:' : 'Current Plan:'}</span>
                <span className="font-extrabold text-emerald-950 text-sm block">{activePlan.titleAr} ({activePlan.priceMonthlySar} ر.س)</span>
                <span className="text-slate-500 block">{student.remainingLessons} دروس متبقية هذا الشهر</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
