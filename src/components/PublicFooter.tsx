'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';

export function PublicFooter() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <footer className="py-8 bg-slate-950 text-slate-400 text-xs text-center border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sanad" width={28} height={28} className="h-6 w-auto" />
          <span className="font-bold text-slate-200">{isAr ? 'منصة سَنَد لتعليم القرآن الكريم' : 'Sanad Quran Platform'}</span>
        </div>
        <nav className="flex gap-4" aria-label={isAr ? 'روابط مساعدة' : 'Helpful links'}><Link href="/teachers">{isAr ? 'المعلمون' : 'Teachers'}</Link><Link href="/help">{isAr ? 'المساعدة' : 'Help'}</Link></nav>
        <div>© {new Date().getFullYear()} {isAr ? 'سَنَد. جميع الحقوق محفوظة.' : 'Sanad. All rights reserved.'}</div>
      </div>
    </footer>
  );
}
