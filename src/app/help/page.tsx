'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function HelpPage() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = isAr ? [
    {
      q: 'كيف تعمل طريقة سداد اشتراكات منصة سَنَد بالتحويل البنكي؟',
      a: 'بعد اختيار الخطة التعليمية المناسبة، يتم عرض بيانات حساب شركة سَنَد المعتمد لدى مصرف الراجحي (IBAN). يقوم الطالب بتحويل المبلغ المطلوب، ثم يرفِع صورة الإيصال عبر المنصة. تراجع إدارة المنصة الإيصال قبل تفعيل الاشتراك. تابع حالة الطلب في الاشتراكات؛ عند الرفض يظهر السبب ويمكنك إرسال إيصال جديد.'
    },
    {
      q: 'كيف يتم توليد وتأكيد جدول الحصص بدون أي تعارض؟',
      a: 'نظام سَنَد الذكي يقوم بحساب المواعيد المتاحة لدى معلمك الخاص وفق عدد حصص الخطة، ويتحقق من عدم وجود تعارض مع أي حصص سابقة، ثم يحفظ الجدول. يضيف المعلم رابط الاجتماع إلى تفاصيل الحصة؛ إن لم يظهر الرابط، انتظر تحديث المعلم.'
    },
    {
      q: 'كيف يمكنني الانضمام إلى الحصة الافتراضية المباشرة مع المعلم؟',
      a: 'عند حلول موعد الحصة، يمكنك الدخول إلى لوحة تحكم الطالب أو التقويم التفاعلي والنقر على زر "انضم للحصة الآن (Google Meet)" للانتقال فوراً لغرفة الدرس الافتراضية.'
    },
    {
      q: 'ما هي معايير اعتماد المعلمين المجازين في المنصة؟',
      a: 'تراجع الإدارة طلبات المعلمين وبيانات الخبرة والإجازة المقدمة قبل قبول الحساب. راجع تفاصيل كل معلم ولا تفترض أن كل معلومة في الملف شهادة مستقلة موثقة.'
    }
  ] : [
    {
      q: 'How does the bank transfer payment verification work?',
      a: 'After selecting your plan in SAR, official Al Rajhi Bank account details (IBAN) are displayed. You transfer the fee and upload your receipt screenshot. Platform administrators review the receipt before activating your subscription. Track the request in Subscriptions; if rejected, read the reason and submit a replacement receipt.'
    },
    {
      q: 'How are conflict-free classes scheduled automatically?',
      a: 'Sanad automated generator checks your teacher available slots against existing bookings, ensuring no double-booking occurs, and saves the schedule. The teacher supplies the meeting link in each class detail; if a link is missing, wait for the teacher to add it.'
    },
    {
      q: 'How do I join my live virtual class on Google Meet?',
      a: 'When it is time for your scheduled lesson, navigate to your Student Dashboard or Interactive Calendar and click "Join Google Meet" for 1-click access.'
    },
    {
      q: 'How are certified teachers verified on the platform?',
      a: 'Administrators review teacher applications and supplied experience/certification information before approving the account. Read the individual profile; account approval does not independently certify every profile claim.'
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
                    aria-expanded={isOpen} aria-controls={`faq-${idx}`} onClick={() => setOpenFaq(isOpen ? null : idx)}
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
                    <div id={`faq-${idx}`} className="px-4 pb-4 text-xs text-slate-600 leading-relaxed font-medium pt-1 border-t border-amber-200/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Contact Box */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-3xl p-7 shadow-xl text-center space-y-4 border border-emerald-700/60">
          <h3 className="text-xl sm:text-2xl font-black">
            {isAr ? 'لم تجد الإجابة التي تبحث عنها؟' : 'Still Need Assistance?'}
          </h3>
          <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            {isAr ? 'تابع طلبات الاشتراك وحالة الحصص من حسابك.' : 'Track subscription requests and class status from your account.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-bold">
            {supportEmail && <a href={`mailto:${supportEmail}`} className="rounded-xl border border-emerald-700 px-4 py-3">{supportEmail}</a>}
            {supportPhone && <a href={`tel:${supportPhone.replace(/[^+\d]/g, '')}`} dir="ltr" className="rounded-xl border border-emerald-700 px-4 py-3">{supportPhone}</a>}
            <Link href="/subscriptions" className="rounded-xl border border-emerald-700 px-4 py-3">{isAr ? 'الاشتراكات وطلبات الدفع' : 'Subscriptions and payments'}</Link>
            <Link href="/login" className="rounded-xl border border-emerald-700 px-4 py-3">{isAr ? 'الدخول إلى الحساب' : 'Sign in to your account'}</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
