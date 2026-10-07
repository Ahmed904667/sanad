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
  HelpCircle,
  User,
  GraduationCap
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { language, currentUser, isHydrated } = useApp();
  const isAr = language === 'ar';

  if (pathname === '/' || pathname === '/new-landing') return null;

  const routeRole = pathname.startsWith('/student')
    ? 'STUDENT'
    : pathname.startsWith('/teacher')
      ? 'TEACHER'
      : pathname.startsWith('/admin')
        ? 'ADMIN'
        : null;

  // On role-specific pages, show a same-size placeholder until the session is known.
  if (!isHydrated && routeRole) {
    return (
      <div aria-hidden="true" className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1">
        <div className="flex items-center justify-around rounded-2xl border border-slate-200 bg-white/95 px-2 py-1.5 shadow-xl backdrop-blur-xl">
          {Array.from({ length: routeRole === 'TEACHER' ? 3 : 4 }, (_, index) => (
            <span key={index} className="flex min-w-[56px] flex-col items-center gap-1.5 py-1.5">
              <span className="h-5 w-5 animate-pulse rounded-md bg-slate-100" />
              <span className="h-2 w-10 animate-pulse rounded bg-slate-100" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Define tab items based on active role & auth state
  const getNavItems = () => {
    const activeRole = isHydrated ? currentUser?.role : routeRole;

    if (activeRole === 'STUDENT') {
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
          labelAr: 'حسابي',
          labelEn: 'Profile',
          href: '/profile',
          icon: User,
        },
      ];
    }

    if (activeRole === 'TEACHER') {
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
          labelAr: 'حسابي',
          labelEn: 'Profile',
          href: '/profile',
          icon: User,
        },
      ];
    }

    if (activeRole === 'ADMIN') {
      return [
        {
          labelAr: 'الطلبات',
          labelEn: 'Approvals',
          href: '/admin/dashboard',
          icon: ShieldCheck,
          exact: true,
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

    // Public pages use the shared top navigation instead of the signed-in app tab bar.
    return [];
  };

  const items = getNavItems();

  if (items.length === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-auto">
      <nav className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl px-2 py-1.5 flex items-center justify-around">
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
                  ? 'text-emerald-950 bg-amber-100 font-bold scale-105'
                  : 'text-slate-500 hover:text-emerald-900 active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-5 h-1 rounded-full bg-amber-500" />
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
