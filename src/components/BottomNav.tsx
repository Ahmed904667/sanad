'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Target, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  Home, 
  BookOpen, 
  HelpCircle, 
  LogIn, 
  User, 
  GraduationCap
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { language, role, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  // Define tab items based on active role & auth state
  const getNavItems = () => {
    if (!isHydrated) {
      return [];
    }

    if (currentUser && (role === 'STUDENT' || pathname.startsWith('/student'))) {
      return [
        {
          labelAr: 'الحصص',
          labelEn: 'Schedule',
          href: '/student/dashboard',
          icon: Calendar,
          exact: true,
        },
        {
          labelAr: 'خطتي',
          labelEn: 'My Plan',
          href: '/student/plan',
          icon: Target,
        },
        {
          labelAr: 'الاشتراكات',
          labelEn: 'Plans',
          href: '/subscriptions',
          icon: CreditCard,
        },
        {
          labelAr: 'المعلمون',
          labelEn: 'Scholars',
          href: '/teachers',
          icon: Users,
        },
        {
          labelAr: 'حسابي',
          labelEn: 'Profile',
          href: '/profile',
          icon: User,
        },
      ];
    }

    if (currentUser && (role === 'TEACHER' || pathname.startsWith('/teacher'))) {
      return [
        {
          labelAr: 'الحصص',
          labelEn: 'Classes',
          href: '/teacher/dashboard',
          icon: GraduationCap,
          exact: true,
        },
        {
          labelAr: 'الطلاب',
          labelEn: 'Students',
          href: '/teacher/students',
          icon: Users,
        },
        {
          labelAr: 'الفهرس',
          labelEn: 'Plan Builder',
          href: '/student/plan-builder',
          icon: Target,
        },
        {
          labelAr: 'حسابي',
          labelEn: 'Profile',
          href: '/profile',
          icon: User,
        },
      ];
    }

    if (currentUser && (role === 'ADMIN' || pathname.startsWith('/admin'))) {
      return [
        {
          labelAr: 'الطلبات',
          labelEn: 'Approvals',
          href: '/admin/dashboard',
          icon: ShieldCheck,
          exact: true,
        },
        {
          labelAr: 'المعلمون',
          labelEn: 'Scholars',
          href: '/teachers',
          icon: Users,
        },
        {
          labelAr: 'المساعدة',
          labelEn: 'Help',
          href: '/help',
          icon: HelpCircle,
        },
        {
          labelAr: 'حسابي',
          labelEn: 'Profile',
          href: '/profile',
          icon: User,
        },
      ];
    }

    // Default Public / Guest navigation
    return [
      {
        labelAr: 'الرئيسية',
        labelEn: 'Home',
        href: '/',
        icon: Home,
        exact: true,
      },
      {
        labelAr: 'المعلمون',
        labelEn: 'Scholars',
        href: '/teachers',
        icon: BookOpen,
      },
      {
        labelAr: 'الأسعار',
        labelEn: 'Plans',
        href: '/#plans',
        icon: CreditCard,
      },
      {
        labelAr: 'المساعدة',
        labelEn: 'Help',
        href: '/help',
        icon: HelpCircle,
      },
      {
        labelAr: currentUser ? 'حسابي' : 'دخول',
        labelEn: currentUser ? 'Profile' : 'Sign In',
        href: currentUser ? '/profile' : '/login',
        icon: currentUser ? User : LogIn,
      },
    ];
  };

  const items = getNavItems();

  if (items.length === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-auto">
      <nav className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href) && item.href !== '/';

          return (
            <Link
              key={idx}
              href={item.href}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-amber-400 bg-amber-500/10 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-5 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] mt-0.5 tracking-tight line-clamp-1">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
