'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  UserCheck
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { language, login } = useApp();
  const isAr = language === 'ar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier) {
      setErrorMessage(isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    const res = login(identifier, password);
    if (!res.success) {
      setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password'));
      return;
    }

    if (res.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (res.role === 'TEACHER') {
      router.push('/teacher/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };


  const handleQuickLogin = (email: string, pass: string) => {
    setErrorMessage('');
    const res = login(email, pass);
    if (!res.success) {
      setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid login'));
      return;
    }
    if (res.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (res.role === 'TEACHER') {
      router.push('/teacher/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl emerald-gradient-bg flex items-center justify-center text-amber-400 font-black shadow-md mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-emerald-950">
            {isAr ? 'تسجيل الدخول لمنصة سَنَد' : 'Login to Sanad Platform'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'ادخل إلى حسابك لمتابعة خطة الحفظ والتلاوة والمواعيد' : 'Access your Quran learning timetable & sessions'}
          </p>
        </div>

        {/* Quick Login Options */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-500 block text-center">
            {isAr ? 'خيارات الدخول السريع المباشر:' : 'Quick 1-Click Access:'}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('abdulrahman@sanad.com', '123456')}
              className="px-2.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 text-xs font-bold transition-all text-center shadow-2xs cursor-pointer"
            >
              {isAr ? 'طالب (عبد الرحمن)' : 'Student (Male)'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sulami@sanad.com', '123456')}
              className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 text-xs font-bold transition-all text-center shadow-2xs cursor-pointer"
            >
              {isAr ? 'معلم (د. السلمي)' : 'Teacher (Male)'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@sanad.com', '123456')}
            className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-all text-center shadow-2xs cursor-pointer"
          >
            {isAr ? 'لوحة تحكم مدير المنصة (Admin)' : 'Platform Admin'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">
            {isAr ? 'أو عبر البريد الإلكتروني' : 'or with email'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 pointer-events-none" />
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@domain.com"
                required
                className="w-full pr-9 pl-3 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {isAr ? 'كلمة المرور:' : 'Password:'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pr-9 pl-3 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          {isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link href="/register/student" className="font-bold text-emerald-700 underline hover:text-emerald-900">
            {isAr ? 'سجل طالب جديد' : 'Register Student Account'}
          </Link>
        </div>

      </div>
    </div>
  );
}
