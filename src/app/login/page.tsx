'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  BookOpen,
  Mail,
  Lock,
  AlertCircle,
  LogIn
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { language, login, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  useEffect(() => {
    if (isHydrated && currentUser) {
      if (currentUser.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (currentUser.role === 'TEACHER') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    }
  }, [isHydrated, currentUser, router]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isSigningIn, setIsSigningIn] = useState(false);
  const signIn = async (email: string, pass: string) => {
    if (isSigningIn) return;
    setErrorMessage('');
    setIsSigningIn(true);
    try {
      const res = await login(email.trim(), pass);
      if (!res.success) {
        setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password'));
        return;
      }
      router.push(res.role === 'ADMIN' ? '/admin/dashboard' : res.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
    } catch {
      setErrorMessage(isAr ? 'تعذر تسجيل الدخول. حاول مرة أخرى.' : 'Unable to sign in. Please try again.');
    } finally { setIsSigningIn(false); }
  };
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await signIn(identifier, password);
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

        {/* Error Alert */}
        {errorMessage && (
          <div role="alert" className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
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
                aria-label={isAr ? "البريد الإلكتروني" : "Email address"}
                autoComplete="username"
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
                aria-label={isAr ? "كلمة المرور" : "Password"}
                autoComplete="current-password"
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
            disabled={isSigningIn}
            className="w-full py-3.5 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>{isSigningIn ? (isAr ? 'جارٍ تسجيل الدخول...' : 'Signing in…') : (isAr ? 'تسجيل الدخول' : 'Sign In')}</span>
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
