'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Video, Building2, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function HelpPage() {
  const { language, bankInfo } = useApp();
  const isAr = language === 'ar';

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = isAr ? [
    {
      q: 'كيف تعمل طريقة سداد اشتراكات منصة سَنَد بالتحويل البنكي؟',
      a: 'بعد اختيار الخطة التعليمية المناسبة، يتم عرض بيانات حساب شركة سَنَد المعتمد لدى مصرف الراجحي (IBAN). يقوم الطالب بتحويل المبلغ المطلوب، ثم يرفِع صورة الإيصال عبر المنصة. يراجع المعلم الإيصال ويعتمد تفعيل الحساب وتوليد الحصص تلقائياً.'
    },
    {
      q: 'كيف يتم توليد وتأكيد جدول الحصص بدون أي تعارض؟',
      a: 'نظام سَنَد الذكي يقوم بحساب المواعيد المتاحة لدى معلمك الخاص وفق عدد حصص الخطة، ويتحقق من عدم وجود تعارض مع أي حصص سابقة، ثم ينشئ الجدول ورابط Google Meet الفريد لكل حصة تلقائياً.'
    },
    {
      q: 'كيف يمكنني الانضمام إلى الحصة الافتراضية المباشرة مع المعلم؟',
      a: 'عند حلول موعد الحصة، يمكنك الدخول إلى لوحة تحكم الطالب أو التقويم التفاعلي والنقر على زر "انضم للحصة الآن (Google Meet)" للانتقال فوراً لغرفة الدرس الافتراضية.'
    },
    {
      q: 'ما هي معايير اعتماد المعلمين المجازين في المنصة؟',
      a: 'تخضع جميع طلبات المعلمين المتقدمين لمراجعة دقيقة من قبل إدارة المنصة والتحقق من صحة السند والإجازة القرآنية المسندة قبل قبولهم في الدليل.'
    }
  ] : [
    {
      q: 'How does the bank transfer payment verification work?',
      a: 'After selecting your plan in SAR, official Al Rajhi Bank account details (IBAN) are displayed. You transfer the fee and upload your receipt screenshot. Your teacher verifies the receipt to activate your account and auto-schedule classes.'
    },
    {
      q: 'How are conflict-free classes scheduled automatically?',
      a: 'Sanad automated generator checks your teacher available slots against existing bookings, ensuring no double-booking occurs, and assigns unique Google Meet URLs for each session.'
    },
    {
      q: 'How do I join my live virtual class on Google Meet?',
      a: 'When it is time for your scheduled lesson, navigate to your Student Dashboard or Interactive Calendar and click "Join Google Meet" for 1-click access.'
    },
    {
      q: 'How are certified teachers verified on the platform?',
      a: 'All teacher applications undergo strict verification by platform admins to confirm authentic unbroken Ijazah chains before being activated in the directory.'
    }
  ];

  return (
    <div className="py-12 bg-slate-50/70 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'مركز المساعدة والأسئلة الشائعة' : 'Help & Support Center'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-emerald-950">
            {isAr ? 'كيف يمكننا مساعدتك اليوم؟' : 'How Can We Help You?'}
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            {isAr 
              ? 'إجابات شاملة لجميع الاستفسارات المتعلقة بالتحويل البنكي، الجدولة، ورابط Google Meet.' 
              : 'Find answers about bank transfers, auto-scheduling, and Google Meet integration.'}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-xl text-emerald-950 border-b border-slate-100 pb-4">
            {isAr ? 'الأسئلة الأكثر شيوعاً:' : 'Frequently Asked Questions:'}
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'border-amber-400 bg-amber-50/40 shadow-sm' : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-start font-extrabold text-sm text-emerald-950 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed font-medium pt-1 border-t border-amber-200/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Contact Box */}
        <div className="emerald-gradient-bg text-white rounded-3xl p-8 shadow-xl text-center space-y-4 border border-emerald-700/60">
          <h3 className="text-2xl font-black">
            {isAr ? 'لم تجد الإجابة التي تبحث عنها؟' : 'Still Need Assistance?'}
          </h3>
          <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl mx-auto">
            {isAr ? 'فريق الدعم الفني متواجد لمساعدتك طوال أيام الأسبوع.' : 'Our support team is available 7 days a week.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold">
            <div className="flex items-center gap-2 bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-700">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>support@ratel-quran.com</span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-700">
              <Phone className="w-4 h-4 text-amber-400" />
              <span dir="ltr">+966 800 124 9999</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
