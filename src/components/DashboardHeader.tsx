'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
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
  LogOut,
  CreditCard,
  HelpCircle,
  Clock,
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
    setRole, 
    currentUser,
    student, 
    teacherProfile, 
    notifications, 
    markNotificationRead,
    logout 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isAr = language === 'ar';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getDashboardTitle = () => {
    if (role === 'STUDENT' || pathname.startsWith('/student')) {
      return {
        titleAr: 'لوحة تحكم الطالب',
        titleEn: 'Student Portal',
        badgeAr: 'حساب طالب',
        badgeEn: 'Student Account',
        icon: Calendar,
        iconColor: 'text-emerald-400'
      };
    } else if (role === 'TEACHER' || pathname.startsWith('/teacher')) {
      return {
        titleAr: 'لوحة تحكم المعلم',
        titleEn: 'Teacher Workspace',
        badgeAr: 'حساب معلم مجاز',
        badgeEn: 'Certified Scholar',
        icon: GraduationCap,
        iconColor: 'text-amber-400'
      };
    } else {
      return {
        titleAr: 'لوحة إدارة المنصة',
        titleEn: 'Admin Control Center',
        badgeAr: 'مدير النظام',
        badgeEn: 'Super Admin',
        icon: ShieldCheck,
        iconColor: 'text-amber-400'
      };
    }
  };

  const dashboardInfo = getDashboardTitle();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Portal Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group" title="Return to Landing Page">
            <div className="w-9 h-9 rounded-xl emerald-gradient-bg flex items-center justify-center text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              سَنَـد <span className="text-amber-400 text-xs font-bold">Sanad</span>
            </span>
          </Link>

          {/* Dedicated Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-300">
            {role === 'STUDENT' && (
              <>
                <Link
                  href="/student/dashboard"
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/student/dashboard' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isAr ? 'جدول الحصص' : 'Schedule'}</span>
                </Link>

                <Link
                  href="/student/plan"
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/student/plan' || pathname === '/student/plan-builder' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خطتي القرآنية' : 'My Quran Plan'}</span>
                </Link>

                <Link
                  href="/subscriptions"
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/subscriptions' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
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
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/teacher/dashboard' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إدارة الحصص' : 'Class Schedule'}</span>
                </Link>

                <Link
                  href="/teacher/students"
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/teacher/students' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? 'قائمة الطلاب' : 'My Students'}</span>
                </Link>

                <Link
                  href="/student/plan-builder"
                  className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                    pathname === '/student/plan-builder' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فهرس وتصميم السور' : 'Quran Plan Builder'}</span>
                </Link>
              </>
            )}

            {role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                  pathname === '/admin/dashboard' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'مراجعة طلبات المعلمين' : 'Approvals Center'}</span>
              </Link>
            )}

            <Link
              href="/profile"
              className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 ${
                pathname === '/profile' ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : ''
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? 'الملف الشخصي' : 'Profile'}</span>
            </Link>
          </nav>
        </div>

        {/* Dashboard Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            {!isHydrated ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse border border-slate-700"></div>
            ) : (
              <Link href="/profile" title="View Profile">
                <AvatarBadge
                  nameAr={currentUser?.nameAr || (role === 'STUDENT' ? student.nameAr : role === 'TEACHER' ? teacherProfile.nameAr : 'مدير المنصة')}
                  nameEn={currentUser?.nameEn || (role === 'STUDENT' ? student.nameEn : role === 'TEACHER' ? teacherProfile.nameEn : 'Admin')}
                  size="sm"
                />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors cursor-pointer"
              title={isAr ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
