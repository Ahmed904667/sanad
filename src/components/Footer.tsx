'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldCheck, Heart, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-16 pb-8 border-t border-emerald-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-800/50">
          
          {/* Col 1: Brand & Ayah */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Sanad Logo" 
                width={56} 
                height={56} 
                className="h-14 w-auto object-contain brightness-125"
              />
            </div>
            
            <p className="text-amber-300 font-serif italic text-base bg-emerald-900/60 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
              «وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا»
            </p>

            <p className="text-emerald-200/80 text-xs leading-relaxed">
              {isAr 
                ? 'منصة تعليمية عالمية تربط بين حفظة كتاب الله والمجازين بالسند المتصل والطلاب الراغبين في التعلم المتقن للحفظ والتجويد عبر حصص افتراضية تفاعلية.' 
                : 'A global educational platform connecting certified Quran teachers holding continuous Ijazah with students through interactive virtual classes.'}
            </p>
          </div>

          {/* Col 2: Subscription Plans */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-bold text-sm tracking-wider uppercase border-b border-emerald-800 pb-2">
              {isAr ? 'خطط الاشتراك الشهري' : 'Subscription Plans'}
            </h4>
            <ul className="space-y-2 text-xs text-emerald-200/90 font-medium">
              <li>
                <Link href="/#plans" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {isAr ? 'باقة التلاوة والتصحيح (4 حصص / شهر)' : 'Tilawah & Tajweed (4 classes/mo)'}
                </Link>
              </li>
              <li>
                <Link href="/#plans" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {isAr ? 'باقة الحفظ والمدارسة (8 حصص / شهر)' : 'Hifz & Study Plan (8 classes/mo)'}
                </Link>
              </li>
              <li>
                <Link href="/#plans" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {isAr ? 'الباقة المكثفة والإجازة (12 حصة / شهر)' : 'Intensive & Ijazah (12 classes/mo)'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quality Guarantee */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-bold text-sm tracking-wider uppercase border-b border-emerald-800 pb-2">
              {isAr ? 'معايير الجودة والاعتماد' : 'Quality Assurance'}
            </h4>
            <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/80 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-100 font-medium">
                  {isAr ? 'جميع معلمينا مجازون بالسند المتصل ومتحقق من مؤهلاتهم العلمية.' : 'All instructors are certified with verified unbroken Ijazah chains.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{isAr ? 'دمج مباشر مع Google Meet للحصص' : 'Direct Google Meet Virtual Classrooms'}</span>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-bold text-sm tracking-wider uppercase border-b border-emerald-800 pb-2">
              {isAr ? 'التواصل والدعم' : 'Contact & Support'}
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-200/90">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>support@sanad-quran.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span dir="ltr">+966 800 124 9999</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'المملكة العربية السعودية / القاهرة' : 'Saudi Arabia / Cairo'}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-emerald-400/80 gap-4">
          <p>© {new Date().getFullYear()} Sanad Platform (منصة سَنَد). جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-300 transition-colors">
              {isAr ? 'الشروط والأحكام' : 'Terms of Service'}
            </Link>
            <Link href="/" className="hover:text-amber-300 transition-colors">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
