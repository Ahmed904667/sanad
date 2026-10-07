'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { AccessibleModal } from './AccessibleModal';
import { AvatarBadge } from './AvatarBadge';
import {

  GraduationCap,
  Calendar,
  Bell,
  Globe,
  User,
  ShieldCheck,
  LogOut,
  CreditCard,
  HelpCircle,
  Target,
  Users
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isHydrated,
    language,
    toggleLanguage,
    role,
    currentUser,
    student,
    teacherProfile,
    notifications,
    markNotificationRead,
    logout
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isAr = language === 'ar';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md text-slate-900 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo & Portal Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group shrink-0" title="Return to Landing Page">
            <Image
              src="/logo.png"
              alt="Sanad Logo"
              width={48}
              height={48}
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="hidden sm:block">
              <span className="block text-lg font-black leading-tight text-emerald-950">سَنَد</span>
              <span className="block text-[10px] font-bold text-slate-500">{isAr ? 'تعليم القرآن الكريم' : 'Quran Learning'}</span>
            </div>
          </Link>

          {/* Dedicated Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-700">
            {role === 'STUDENT' && (
              <>
                <Link
                  href="/student/dashboard"
                  className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/student/dashboard' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isAr ? 'جدول الحصص' : 'Schedule'}</span>
                </Link>

                <Link
                  href="/student/plan"
                  className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/student/plan' || pathname === '/student/plan-builder' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خطتي القرآنية' : 'My Quran Plan'}</span>
                </Link>

                <Link
                  href="/subscriptions"
                  className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/subscriptions' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إدارة الاشتراكات' : 'Subscriptions'}</span>
                </Link>
              </>
            )}

            {role === 'TEACHER' && (
              <>
                <Link
                  href="/teacher/dashboard"
                  className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/teacher/dashboard' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إدارة الحصص' : 'Class Schedule'}</span>
                </Link>

                <Link
                  href="/teacher/students"
                  className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/teacher/students' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? 'قائمة الطلاب' : 'My Students'}</span>
                </Link>
              </>
            )}

            {role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                  pathname === '/admin/dashboard' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'مراجعة طلبات المعلمين' : 'Approvals Center'}</span>
              </Link>
            )}

            <Link
              href="/profile"
              className={`hover:text-emerald-800 transition-colors py-1 flex items-center gap-1 ${
                pathname === '/profile' ? 'text-emerald-800 font-extrabold border-b-2 border-amber-500' : ''
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? 'الملف الشخصي' : 'Profile'}</span>
            </Link>
          </nav>
        </div>

        {/* Dashboard Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/help" aria-label={isAr ? 'المساعدة' : 'Help'} className="p-2 rounded-lg border border-slate-200"><HelpCircle className="w-4 h-4" /></Link>
          <button onClick={() => setShowNotifications(true)} aria-label={isAr ? `الإشعارات، ${unreadCount} غير مقروءة` : `Notifications, ${unreadCount} unread`} className="relative p-2 rounded-lg border border-slate-200">
            <Bell className="w-4 h-4" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-rose-600 px-1 text-[9px] text-white">{unreadCount}</span>}
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-800" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            {!isHydrated || !currentUser ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse border border-slate-200"></div>
            ) : (
              <Link href="/profile" title="View Profile">
                <AvatarBadge
                  nameAr={currentUser.nameAr || (currentUser.role === 'STUDENT' ? student.nameAr : currentUser.role === 'TEACHER' ? teacherProfile.nameAr : 'مدير المنصة')}
                  nameEn={currentUser.nameEn || (currentUser.role === 'STUDENT' ? student.nameEn : currentUser.role === 'TEACHER' ? teacherProfile.nameEn : 'Admin')}
                  size="sm"
                />
              </Link>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
              title={isAr ? 'تسجيل الخروج' : 'Logout'}
              aria-label={isLoggingOut ? (isAr ? 'جارٍ تسجيل الخروج' : 'Logging out') : (isAr ? 'تسجيل الخروج' : 'Log out')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
      {showNotifications && <AccessibleModal onClose={() => setShowNotifications(false)} aria-label={isAr ? 'الإشعارات' : 'Notifications'} className="fixed inset-0 flex items-center justify-center bg-slate-900/60 p-4">
        <section className="w-full max-w-lg max-h-[85dvh] overflow-auto rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{isAr ? 'الإشعارات' : 'Notifications'}</h2><button onClick={() => setShowNotifications(false)} className="rounded-xl border p-2">{isAr ? 'إغلاق' : 'Close'}</button></div>
          {notifications.length === 0 ? <p className="text-sm text-slate-500">{isAr ? 'لا توجد إشعارات حتى الآن.' : 'No notifications yet.'}</p> : <ul className="space-y-3">{notifications.map(notification => <li key={notification.id} className={`rounded-xl border p-3 ${notification.read ? 'bg-white' : 'bg-emerald-50 border-emerald-200'}`}><h3 className="text-sm font-bold">{isAr ? notification.titleAr : notification.titleEn}</h3><p className="mt-1 text-xs text-slate-600">{isAr ? notification.messageAr : notification.messageEn}</p><p className="mt-1 text-[10px] text-slate-400">{notification.time}</p>{!notification.read && <button onClick={() => markNotificationRead(notification.id)} className="mt-2 text-xs font-bold text-emerald-800">{isAr ? 'تحديد كمقروء' : 'Mark as read'}</button>}</li>)}</ul>}
        </section>
      </AccessibleModal>}
    </header>
  );
};
