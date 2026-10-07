'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DashboardHeader } from './DashboardHeader';
import { PublicNavbar } from './PublicNavbar';

export function Header() {
  const pathname = usePathname();
  const { isHydrated, currentUser } = useApp();
  const isPrivateRoute = ['/student', '/teacher', '/admin', '/profile', '/subscriptions', '/classes']
    .some(segment => pathname === segment || pathname.startsWith(`${segment}/`));

  // The landing page renders its own shared public navigation.
  if (pathname === '/' || pathname === '/new-landing') return null;
  // Avoid showing the public links for a frame while an existing session loads.
  // Both real headers are 64px tall, so keep that space stable during hydration.
  if (!isHydrated || (!currentUser && isPrivateRoute)) {
    return (
      <header aria-label="Loading navigation" aria-busy="true" className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={46} height={46} className="h-11 w-auto object-contain" priority />
            <span className="hidden text-lg font-black text-emerald-950 sm:block">سَنَد</span>
          </div>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
            <span className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </header>
    );
  }
  if (currentUser) return <DashboardHeader />;
  return <PublicNavbar />;
}
