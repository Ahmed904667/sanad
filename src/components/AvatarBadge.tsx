'use client';

import React from 'react';

interface AvatarBadgeProps {
  nameAr?: string;
  nameEn?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  nameAr = '',
  nameEn = '',
  size = 'md',
  className = ''
}) => {
  // Extract initials from Arabic or English name
  const getInitials = () => {
    if (nameAr && nameAr.trim().length > 0) {
      const parts = nameAr.trim().split(' ').filter(p => !['الشيخ', 'الشيخة', 'د.', 'أ.', 'دكتور', 'أستاذ'].includes(p));
      if (parts.length >= 2) {
        return `${parts[0][0]} ${parts[1][0]}`;
      } else if (parts.length === 1) {
        return parts[0].substring(0, 2);
      }
    }
    if (nameEn && nameEn.trim().length > 0) {
      const parts = nameEn.trim().split(' ').filter(p => !['Dr.', 'Sheikh', 'Ustadhah', 'Mr.', 'Mrs.'].includes(p));
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    return 'ر ت';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-10 h-10 text-sm font-extrabold',
    lg: 'w-14 h-14 text-base font-black',
    xl: 'w-20 h-20 text-xl font-black'
  };

  return (
    <div
      className={`rounded-2xl emerald-gradient-bg text-amber-300 border border-amber-400/40 shadow-sm flex items-center justify-center tracking-wider select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <span>{getInitials()}</span>
    </div>
  );
};
