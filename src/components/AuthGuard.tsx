'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Role } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const { isHydrated, currentUser, language } = useApp();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isHydrated) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      if (currentUser.role === 'STUDENT') {
        router.replace('/student/dashboard');
      } else if (currentUser.role === 'TEACHER') {
        router.replace('/teacher/dashboard');
      } else if (currentUser.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [isHydrated, currentUser, allowedRoles, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-amber-400 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {isAr ? 'جاري التحقق من الجلسة...' : 'Authenticating session...'}
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-amber-400 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {isAr ? 'يرجى تسجيل الدخول للوصول لهذه الصفحة...' : 'Redirecting to login...'}
        </p>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-amber-400 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {isAr ? 'جاري التوجيه إلى لوحة التحكم المخصصة لحسابك...' : 'Redirecting to your dashboard...'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
