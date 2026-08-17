'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { DashboardHeader } from './DashboardHeader';
import { AvatarBadge } from './AvatarBadge';
import { 
  BookOpen, 
  UserCheck, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Globe, 
  Sparkles,
  User,
  ShieldCheck,
  LogIn,
  LogOut
} from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    isHydrated,
    language, 
    toggleLanguage, 
    role, 
    currentUser,
    notifications, 
    markNotificationRead,
    logout 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isAr = language === 'ar';

  // Render DashboardHeader whenever a user is logged in
  if (currentUser !== null) {
    return <DashboardHeader />;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Keep logo emblem only */}
        <Link href="/" className="flex items-center group">
          <Image 
            src="/logo.png" 
            alt="Sanad Logo" 
            width={52} 
            height={52} 
            className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            priority
          />
        </Link>

        {/* Public Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link
            href="/"
            className={`transition-colors py-1 ${
              pathname === '/' ? 'text-emerald-700 font-extrabold border-b-2 border-amber-500' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>

          <Link
            href="/#plans"
            className="text-slate-600 hover:text-emerald-800 transition-colors py-1"
          >
            {isAr ? 'الخطط والأسعار' : 'Plans & Pricing'}
          </Link>

          <Link
            href="/teachers"
            className={`transition-colors py-1 ${
              pathname === '/teachers' ? 'text-emerald-700 font-extrabold border-b-2 border-amber-500' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            {isAr ? 'المعلمون المجازون' : 'Scholars Directory'}
          </Link>

          <Link
            href="/help"
            className={`transition-colors py-1 ${
              pathname === '/help' ? 'text-emerald-700 font-extrabold border-b-2 border-amber-500' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            {isAr ? 'المساعدة' : 'Help'}
          </Link>
        </nav>

        {/* Public Controls & Auth Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {!isHydrated ? (
            <div className="w-24 h-7 bg-slate-100 animate-pulse rounded-xl"></div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isAr ? 'دخول' : 'Sign In'}</span>
              </Link>

              <Link
                href="/register/student"
                className="emerald-gradient-bg text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition-all"
              >
                {isAr ? 'ابدأ الآن' : 'Get Started'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
