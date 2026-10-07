'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function PublicNavbar() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useApp();
  const isAr = language === 'ar';
  const sectionHref = (id: string) => pathname === '/' ? `#${id}` : `/#${id}`;

  const handleSectionNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/') return;
    event.preventDefault();
    const href = event.currentTarget.getAttribute('href');
    const section = href?.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    if (!section) return;
    window.history.replaceState(null, '', href);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    section.scrollIntoView({ behavior, block: 'center' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label={isAr ? 'سنَد - الصفحة الرئيسية' : 'Sanad home'}>
          <Image src="/logo.png" alt="Sanad" width={46} height={46} className="h-11 w-auto object-contain" priority />
          <div className="hidden sm:block">
            <span className="text-lg font-black text-emerald-950 block leading-tight">سَنَد</span>
            <span className="text-[10px] font-bold text-slate-500 block">{isAr ? 'تعليم القرآن الكريم' : 'Quran Learning'}</span>
          </div>
        </Link>

        <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'} className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-700">
          {[
            ['simulator', isAr ? 'خطّط لحصصك' : 'Lesson planner'],
            ['classroom', isAr ? 'الحصص المباشرة' : 'Live lessons'],
                        ['plans', isAr ? 'الأسعار' : 'Pricing'],
            ['workflow', isAr ? 'طريقة التسجيل' : 'How to join'],
            ['faq', isAr ? 'الأسئلة الشائعة' : 'FAQs'],
          ].map(([id, label]) => (
            <Link key={id} href={sectionHref(id)} onClick={handleSectionNavigation} className="hover:text-emerald-800 transition-colors whitespace-nowrap">
              {label}
            </Link>
          ))}
<Link href="/teachers" className="hover:text-emerald-800">{isAr ? 'المعلمون' : 'Teachers'}</Link><Link href="/help" className="hover:text-emerald-800">{isAr ? 'المساعدة' : 'Help'}</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-800" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
          <Link href="/login" className="px-2 sm:px-3 py-2 rounded-lg text-slate-700 hover:text-emerald-950 hover:bg-slate-50 text-xs font-semibold transition-all whitespace-nowrap">
            {isAr ? 'دخول' : 'Log in'}
          </Link>
          <Link href="/register/student" className="px-3 sm:px-4 py-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap">
            {isAr ? 'ابدأ التعلّم' : 'Get started'}
          </Link>
        </div>
      </div>
    </header>
  );
}
