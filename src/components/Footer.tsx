'use client';

import { usePathname } from 'next/navigation';
import { PublicFooter } from './PublicFooter';

export function Footer() {
  const pathname = usePathname();
  // The landing page renders the shared public footer itself.
  if (pathname === '/' || pathname === '/new-landing') return null;
  return <PublicFooter />;
}
