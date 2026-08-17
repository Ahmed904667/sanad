'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GraduationCap, Mail, Award, Lock, CheckCircle2, User, BookOpen } from 'lucide-react';

export default function TeacherRegisterPage() {
  const router = useRouter();
  const { language, applyAsTeacher } = useApp();
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [password, setPassword] = useState('');
  const [ijazahDetails, setIjazahDetails] = useState('');
  const [specializations, setSpecializations] = useState<string[]>(['الإجازة بالسند المتصل']);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !ijazahDetails) return;

    applyAsTeacher(name, email, gender, ijazahDetails, specializations, password);
    router.push('/teacher/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg flex items-center justify-center text-emerald-950 mx-auto shadow-md">
            <GraduationCap className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black text-emerald-950">
            {isAr ? 'التقديم كمعلم قرآن مجاز' : 'Teacher Application'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'انضم لنخبة المعلمين المعلمين والمعلمات المجازين' : 'Apply to join our faculty of certified Quran scholars'}
          </p>
        </div>

        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'الاسم الثلاثي مع اللقب العلمـي:' : 'Full Name & Academic Title:'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: الشيخ د. عمر المكي / الشيخة فاطمة الزهراني' : 'e.g., Dr. Sheikh Omar / Ustadha Fatima'}
                className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* GENDER SELECTION FIELD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'الجنس (معلم / معلمة):' : 'Gender (Male / Female Scholar):'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  gender === 'MALE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span>{isAr ? 'معلم (ذكر)' : 'Male Scholar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  gender === 'FEMALE'
                    ? 'border-pink-600 bg-pink-50 text-pink-950 ring-2 ring-pink-400'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <User className="w-4 h-4 text-pink-700" />
                <span>{isAr ? 'معلمة (أنثى)' : 'Female Scholar'}</span>
              </button>
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
                placeholder="scholar@sanad.com"
                className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'تفاصيل السند بالإجازة واسم الشيخ:' : 'Continuous Ijazah Details:'}
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={ijazahDetails}
                onChange={(e) => setIjazahDetails(e.target.value)}
                placeholder={isAr ? 'مثال: إجازة برواية حفص عن عاصم بالسند المتصل' : 'e.g., Continuous Hafs Ijazah chain'}
                className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'كلمة المرور:' : 'Password:'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'تقديم طلب الانضمام كمعلم' : 'Submit Teacher Application'}</span>
          </button>
        </form>

        <div className="pt-4 text-center text-xs border-t border-slate-100">
          <span className="text-slate-500">{isAr ? 'لديك حساب معلم بالفعل؟ ' : 'Already registered? '}</span>
          <Link href="/login" className="font-bold text-emerald-800 underline">
            {isAr ? 'تسجيل الدخول' : 'Log in'}
          </Link>
        </div>

      </div>
    </div>
  );
}
