'use client';

import { useState } from 'react';
import Link from 'next/link';
import { localizeLanguage } from '@/utils/localization';
import { useApp } from '@/context/AppContext';
import { formatAvailabilityRanges } from '@/utils/timeFormat';
import { TeacherReviewsModal } from '@/components/TeacherReviewsModal';
import type { Teacher } from '@/types';

export default function TeachersPage() {
  const { teachers, language, isHydrated } = useApp();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');
  const [reviewTeacher, setReviewTeacher] = useState<Teacher | null>(null);
  const visible = teachers.filter(teacher => teacher.approvalStatus === 'APPROVED' && (!gender || teacher.gender === gender) && `${teacher.nameAr} ${teacher.nameEn} ${teacher.languagesSpoken.join(' ')} ${teacher.specializationsAr.join(' ')} ${teacher.specializationsEn.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="min-h-screen bg-slate-50">
    <section aria-label={isAr ? "المعلمون" : "Teachers"} className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3"><h1 className="text-3xl font-black text-emerald-950">{isAr ? 'اختر معلّمك' : 'Find your teacher'}</h1><p className="text-slate-600">{isAr ? 'تعرّف على خبرات المعلمين ولغاتهم ومواعيدهم. يتأكد الموعد عند التسجيل.' : 'Explore teacher experience, languages, and working hours. Your chosen time is confirmed during enrollment.'}</p></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label htmlFor="teacher-search" className="block text-sm font-bold mb-2">{isAr ? 'الاسم أو اللغة أو التخصص' : 'Name, language, or specialty'}</label><input id="teacher-search" type="search" value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-3" /></div>
        <div><label htmlFor="teacher-gender" className="block text-sm font-bold mb-2">{isAr ? 'المعلّم / المعلّمة' : 'Teacher preference'}</label><select id="teacher-gender" value={gender} onChange={event => setGender(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">{isAr ? 'الجميع' : 'All teachers'}</option><option value="MALE">{isAr ? 'معلم' : 'Male teacher'}</option><option value="FEMALE">{isAr ? 'معلمة' : 'Female teacher'}</option></select></div>
      </div>
      <p role="status" className="text-sm text-slate-600">{!isHydrated ? (isAr ? 'جارٍ تحميل المعلمين...' : 'Loading teachers...') : isAr ? `${visible.length} معلّم متاح` : `${visible.length} teachers found`}</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{visible.map(teacher => <article key={teacher.id} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-4 shadow-sm">
        <div><h2 className="text-xl font-extrabold text-emerald-950">{isAr ? teacher.nameAr : teacher.nameEn}</h2><p className="text-sm text-slate-500">{isAr ? teacher.titleAr : teacher.titleEn}</p></div>
        <p className="text-sm text-slate-700">{(isAr ? teacher.bioAr : teacher.bioEn) || (isAr ? 'تفاصيل إضافية غير متوفرة بعد.' : 'Additional details have not been provided yet.')}</p>
        <dl className="text-sm space-y-3"><div><dt className="font-bold">{isAr ? 'الخبرة' : 'Experience'}</dt><dd>{teacher.experienceYears} {isAr ? 'سنوات' : 'years'}</dd></div><div><dt className="font-bold">{isAr ? 'اللغات' : 'Languages'}</dt><dd>{teacher.languagesSpoken.map(language => localizeLanguage(language, isAr)).join(' · ') || '—'}</dd></div><div><dt className="font-bold">{isAr ? 'تفاصيل الإجازة المقدمة' : 'Submitted qualification details'}</dt><dd className="text-slate-600">{(isAr ? teacher.ijazahDetailsAr : teacher.ijazahDetailsEn) || '—'}</dd></div><div><dt className="font-bold">{isAr ? 'ساعات العمل — الرياض (UTC+3)' : 'Working hours — Riyadh (UTC+3)'}</dt><dd>{formatAvailabilityRanges(teacher.availabilityRanges, teacher.workingHoursStart, teacher.workingHoursEnd, isAr, teacher.availabilityByDay)}</dd></div></dl>
        <button type="button" onClick={() => setReviewTeacher(teacher)} className="text-start text-sm font-bold text-emerald-800 underline">{teacher.reviewsCount ? `${teacher.rating.toFixed(1)} / 5 · ${teacher.reviewsCount} ${isAr ? 'تقييمات' : 'reviews'}` : isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</button>
        <Link href={`/register/student?teacher=${encodeURIComponent(teacher.id)}&gender=${teacher.gender}`} className="mt-auto rounded-xl bg-emerald-950 p-3 text-center font-bold text-white">{isAr ? 'اختيار هذا المعلّم' : 'Choose this teacher'}</Link>
      </article>)}</div>
      {isHydrated && !visible.length && <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-3"><p>{isAr ? 'لا توجد نتائج مطابقة. جرّب تغيير البحث أو التفضيل.' : 'No teachers match. Try changing your search or preference.'}</p><Link href="/help" className="text-emerald-800 underline">{isAr ? 'المساعدة' : 'Get help'}</Link></div>}
    </section>
    {reviewTeacher && <TeacherReviewsModal isOpen onClose={() => setReviewTeacher(null)} teacher={reviewTeacher} />}
  </div>;
}
