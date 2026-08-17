'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PlansGrid } from '@/components/PlansGrid';
import { PaymentWizardModal } from '@/components/PaymentWizardModal';
import { SubscriptionPlan } from '@/types';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  PlusCircle
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { 
    language, 
    student, 
    plans, 
    teachers, 
    lessons, 
    bankInfo,
    scheduleNextCyclePlan,
    purchaseExtraClass,
    pauseSubscription, 
    resumeSubscription, 
    cancelSubscription 
  } = useApp();
  const isAr = language === 'ar';

  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [showNextMonthModal, setShowNextMonthModal] = useState<SubscriptionPlan | null>(null);
  const [showExtraClassModal, setShowExtraClassModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState('');

  // Extra class form state
  const [extraBankRef, setExtraBankRef] = useState('');
  const [extraReceiptFile, setExtraReceiptFile] = useState<File | null>(null);
  const [extraClassSubmitted, setExtraClassSubmitted] = useState(false);

  const activePlan = plans.find(p => p.id === (student.activePlanId || student.pendingPlanId)) || plans[1];
  const nextPlan = plans.find(p => p.id === student.nextCyclePlanId);
  const assignedTeacher = teachers.find(t => t.id === student.assignedTeacherId) || teachers[0];

  const totalMonthlyQuota = activePlan.lessonsPerMonth + (student.extraPurchasedClassesCount || 0);
  const rawStudentLessons = lessons.filter(l => l.studentId === student.id && l.status !== 'CANCELLED');
  const completedCount = rawStudentLessons.filter(l => l.status === 'COMPLETED').length;
  const allowedUpcomingCount = Math.max(0, totalMonthlyQuota - completedCount);
  const scheduledCount = Math.min(
    allowedUpcomingCount,
    rawStudentLessons.filter(l => l.status === 'SCHEDULED').length
  );

  const handlePauseConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    pauseSubscription(pauseReasonInput || (isAr ? 'طلب تجميد مؤقت من الطالب' : 'Temporary student pause request'));
    setShowPauseModal(false);
  };

  const handleCancelConfirm = () => {
    cancelSubscription();
    setShowCancelModal(false);
  };

  const handleExtraClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    purchaseExtraClass(
      extraReceiptFile ? extraReceiptFile.name : 'إيصال_حصة_إضافية_20_ريال.png',
      extraBankRef || 'REF-EXT-' + Math.floor(100000 + Math.random() * 900000)
    );
    setExtraClassSubmitted(true);
    setTimeout(() => {
      setExtraClassSubmitted(false);
      setShowExtraClassModal(false);
      setExtraBankRef('');
      setExtraReceiptFile(null);
    }, 1500);
  };

  const handleConfirmNextMonthPlan = () => {
    if (showNextMonthModal) {
      scheduleNextCyclePlan(showNextMonthModal.id);
      setShowNextMonthModal(null);
    }
  };

  return (
    <div className="py-10 bg-slate-50/70 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'إدارة الاشتراك الشهري الثابت' : '1-Month Fixed Subscription'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950">
            {isAr ? 'اشتراكك الحالي وخطة الشهر القادم' : 'Current Plan & Next Month Options'}
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            {isAr 
              ? 'مدة كل اشتراك شهر كامل ثابت. يمكنك شراء حصص إضافية بـ 20 ر.س أو جدولة خطة الشهر القادم.' 
              : 'Each subscription lasts for 1 full month. Purchase extra classes for 20 SAR or schedule next month’s plan.'}
          </p>
        </div>

        {/* ACTIVE 1-MONTH PLAN STATUS BANNER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{isAr ? 'الخطة النشطة للشهر الحالي:' : 'Active Current Month Plan:'}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                  {isAr ? 'دورة شهرية ثابتة (30 يوماً)' : 'Fixed 30-Day Cycle'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
                  {isAr ? activePlan.titleAr : activePlan.titleEn}
                </h2>

                <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                  student.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : student.verificationStatus === 'PENDING_VERIFICATION'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : student.verificationStatus === 'PAUSED'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : student.verificationStatus === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {student.verificationStatus === 'VERIFIED' && (isAr ? 'اشتراك مفعل للشهر الحالي' : 'Active Subscription')}
                  {student.verificationStatus === 'PENDING_VERIFICATION' && (isAr ? 'قيد اعتماد الإيصال من الإدارة' : 'Pending Admin Verification')}
                  {student.verificationStatus === 'PAUSED' && (isAr ? 'الاشتراك مجمد مؤقتاً' : 'Subscription Paused')}
                  {student.verificationStatus === 'CANCELLED' && (isAr ? 'الاشتراك ملغى' : 'Subscription Cancelled')}
                  {student.verificationStatus === 'UNVERIFIED' && (isAr ? 'غير مفعل' : 'Inactive')}
                </span>
              </div>

              <p className="text-slate-500 text-xs font-medium">
                {isAr ? activePlan.subtitleAr : activePlan.subtitleEn} • {isAr ? `المعلم: ${assignedTeacher.nameAr}` : `Scholar: ${assignedTeacher.nameEn}`}
              </p>
            </div>

            <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
              <span className="text-3xl font-black text-emerald-900">{activePlan.priceMonthlySar} ر.س</span>
              <span className="text-xs text-slate-500 block font-bold">
                {isAr ? 'ينتهي في: 1 سبتمبر 2026' : 'Renews: Sep 1, 2026'}
              </span>
            </div>
          </div>

          {/* Next Cycle Scheduled Plan Banner if applicable */}
          {nextPlan && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-amber-950 block">
                    {isAr ? `الخطة المجدولة للشهر القادم: ${nextPlan.titleAr} (${nextPlan.priceMonthlySar} ر.س • ${nextPlan.lessonsPerMonth} حصص)` : `Next Month Plan: ${nextPlan.titleEn}`}
                  </span>
                  <p className="text-amber-800 text-[11px]">
                    {isAr ? 'سيتم تفعيل هذه الباقة تلقائياً فور انتهاء الدورة الشهرية الحالية.' : 'This plan will automatically activate at the next billing cycle.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => scheduleNextCyclePlan('')}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950 shrink-0"
              >
                {isAr ? 'إلغاء التغيير' : 'Cancel Change'}
              </button>
            </div>
          )}

          {/* Plan Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 text-sm block">
                  {student.remainingLessons} / {totalMonthlyQuota} {isAr ? 'حصص متبقية' : 'Classes Left'}
                </span>
                <span className="text-slate-500 text-[11px]">{isAr ? `(مكتمل: ${completedCount} | مجدول: ${scheduledCount})` : `(${completedCount} done)`}</span>
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black text-amber-950 text-sm block">
                  {activePlan.lessonDurationMinutes} {isAr ? 'دقيقة لكل حصة' : 'min / class'}
                </span>
                <span className="text-slate-500 text-[11px]">{isAr ? 'مدة الجلسة المباشرة' : 'Direct class duration'}</span>
              </div>
            </div>

            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="font-black text-teal-950 text-sm block font-mono">
                  {student.bankTransferRef || 'REF-894120'}
                </span>
                <span className="text-slate-500 text-[11px]">{isAr ? 'رقم مرجع التحويل' : 'Bank Reference'}</span>
              </div>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <span className="font-black text-purple-950 text-sm block">
                  {student.extraClassCredits || 0} {isAr ? 'حصص إضافية مشتراة' : 'Extra Classes'}
                </span>
                <span className="text-slate-500 text-[11px]">{isAr ? '20 ر.س للحصة' : '20 SAR / class'}</span>
              </div>
            </div>
          </div>

          {/* Action Bar: Extra Class Purchase & Pause/Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowExtraClassModal(true)}
                className="px-4 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-sm hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAr ? 'شراء حصة إضافية (20 ر.س)' : 'Buy Extra Class (20 SAR)'}</span>
              </button>

              {student.verificationStatus === 'PAUSED' ? (
                <button
                  onClick={resumeSubscription}
                  className="px-4 py-2.5 rounded-xl emerald-gradient-bg text-white font-black text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'استئناف الاشتراك' : 'Resume Subscription'}</span>
                </button>
              ) : student.verificationStatus === 'VERIFIED' ? (
                <button
                  onClick={() => setShowPauseModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? '⏸️ تجميد الخطة مؤقتاً' : 'Pause'}
                </button>
              ) : null}

              {student.verificationStatus !== 'CANCELLED' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? 'إلغاء الاشتراك' : 'Cancel'}
                </button>
              )}
            </div>

            <Link
              href="/student/plan"
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الخطة وتعديل السور والمواعيد' : 'View & Edit Quran Plan'}</span>
            </Link>
          </div>
        </div>

        {/* EXTRA CLASS PURCHASE BANNER */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-emerald-50 rounded-3xl p-6 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-amber-200/90 text-amber-950 px-3 py-1 rounded-full text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'الحصص الإضافية الفردية' : 'Single Extra Classes'}</span>
            </div>
            <h3 className="text-lg font-black text-emerald-950">
              {isAr ? 'هل تحتاج إلى حصة إضافية للتسميع أو المراجعة؟' : 'Need an extra session for revision or testing?'}
            </h3>
            <p className="text-slate-600 text-xs max-w-2xl leading-relaxed">
              {isAr 
                ? 'يمكنك شراء أي عدد من الحصص الإضافية بسعر 20 ريال فقط للحصة الواحدة مع معلمك المعتمد. يتم رفع إيصال التحويل للاعتماد الفوري من الإدارة.' 
                : 'Purchase individual lessons for 20 SAR each with your scholar. Upload the receipt for instant Admin approval.'}
            </p>
          </div>

          <button
            onClick={() => setShowExtraClassModal(true)}
            className="px-6 py-3 rounded-2xl gold-gradient-bg text-emerald-950 font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAr ? 'شراء حصة إضافية (20 ر.س)' : 'Buy Extra Class (20 SAR)'}</span>
          </button>
        </div>

        {/* NEXT MONTH PLAN SWITCHER SECTION */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
              {isAr ? 'جدولة خطة الشهر القادم (ترقية أو تقليص)' : 'Schedule Next Month Plan (Upgrade or Downgrade)'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              {isAr 
                ? 'خطة الشهر الحالي ثابتة. اختر الخطة التي ترغب بالانتقال إليها تلقائياً بدءاً من الدورة القادمة.' 
                : 'Current month is fixed. Select the plan you wish to switch to starting from your next monthly cycle.'}
            </p>
          </div>

          <PlansGrid onSelectPlan={(plan) => setShowNextMonthModal(plan)} />
        </div>

      </div>

      {/* 20 SAR EXTRA CLASS PURCHASE MODAL */}
      {showExtraClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-emerald-950 font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-950">
                    {isAr ? 'شراء حصة إضافية فردية (20 ر.س)' : 'Buy Extra Lesson (20 SAR)'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? `مع الشيخ: ${assignedTeacher.nameAr}` : `With: ${assignedTeacher.nameEn}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtraClassModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bank Info Summary */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <span className="font-bold text-emerald-950 block">{isAr ? 'بيانات التحويل البنكي (20 ر.س):' : 'Bank Details (20 SAR):'}</span>
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'البنك:' : 'Bank:'}</span>
                <span className="font-bold">{isAr ? bankInfo.bankNameAr : bankInfo.bankNameEn}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>IBAN:</span>
                <span className="font-mono font-bold text-emerald-900">{bankInfo.iban}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'المبلغ المطلوب:' : 'Amount:'}</span>
                <span className="font-black text-emerald-950">20 ر.س</span>
              </div>
            </div>

            {extraClassSubmitted ? (
              <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl text-center text-xs font-bold space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-700" />
                <p>{isAr ? 'تم إرسال طلب الحصة والإيصال بنجاح إلى الإدارة للاعتماد!' : 'Receipt submitted to admin for verification!'}</p>
              </div>
            ) : (
              <form onSubmit={handleExtraClassSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isAr ? 'رقم مرجع التحويل البنكي (Ref Number)' : 'Bank Transfer Reference'}
                  </label>
                  <input
                    type="text"
                    required
                    value={extraBankRef}
                    onChange={(e) => setExtraBankRef(e.target.value)}
                    placeholder="مثال: REF-928411"
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isAr ? 'إرفاق إيصال التحويل (صورة / PDF)' : 'Upload Receipt File'}
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setExtraReceiptFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExtraClassModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl gold-gradient-bg text-emerald-950 text-xs font-black shadow-md cursor-pointer"
                  >
                    {isAr ? 'إرسال الإيصال للاعتماد (20 ر.س)' : 'Submit Receipt (20 SAR)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM NEXT MONTH PLAN SWITCH MODAL */}
      {showNextMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-emerald-950">
              {isAr ? `تأكيد اختيار ${showNextMonthModal.titleAr} للشهر القادم` : `Confirm Next Month Plan: ${showNextMonthModal.titleEn}`}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr 
                ? `خطتك الحالية (${activePlan.titleAr}) ستبقى نشطة حتى نهاية الدورة الشهرية الحالية (1 سبتمبر 2026). سيتم الانتقال إلى (${showNextMonthModal.titleAr}) تلقائياً للشهر القادم.`
                : `Your active plan will run until the end of the current 1-month cycle. The new plan will activate next month.`}
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>{isAr ? 'الخطة الحالية:' : 'Current Plan:'}</span>
                <span>{isAr ? activePlan.titleAr : activePlan.titleEn}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-900">
                <span>{isAr ? 'الخطة القادمة:' : 'Next Month:'}</span>
                <span>{isAr ? showNextMonthModal.titleAr : showNextMonthModal.titleEn} ({showNextMonthModal.priceMonthlySar} ر.س)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNextMonthModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmNextMonthPlan}
                className="flex-1 py-2.5 rounded-xl emerald-gradient-bg text-white text-xs font-black shadow-sm"
              >
                {isAr ? 'تأكيد جدولة الخطة' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-emerald-950">
              {isAr ? 'تجميد الاشتراك مؤقتاً' : 'Pause Subscription'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr 
                ? 'يمكنك تجميد خطتك مؤقتاً خلال فترات السفر أو الاختبارات، وستبقى حصصك المتبقية محفوظة بالكامل حتى تستأنف الاشتراك.' 
                : 'Pause your subscription during travel or exams. Your remaining class balance will be preserved.'}
            </p>
            <form onSubmit={handlePauseConfirm} className="space-y-3">
              <input
                type="text"
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                placeholder={isAr ? 'سبب التجميد (مثال: سفر، اختبارات نهائية...)' : 'Reason (e.g. travel, exams)'}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold"
              />
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm"
                >
                  {isAr ? 'تأكيد التجميد' : 'Confirm Pause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-rose-950">
              {isAr ? 'هل أنت متأكد من رغبتك في إلغاء الاشتراك؟' : 'Confirm Subscription Cancellation'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr 
                ? 'عند الإلغاء، سيتم إيقاف تجديد الخطة وإلغاء الحصص المجدولة غير المكتملة. ستبقى جميع حصصك السابقة وسجل إنجازك القرآني محفوظاً ويمكنك إعادة التفعيل في أي وقت.' 
                : 'Cancelling stops recurring renewal and releases uncompleted scheduled slots. Completed records remain saved.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
              >
                {isAr ? 'تراجع' : 'Keep Plan'}
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm"
              >
                {isAr ? 'نعم، إلغاء الاشتراك' : 'Yes, Cancel Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT / RENEWAL MODAL */}
      {checkoutPlan && (
        <PaymentWizardModal
          plan={checkoutPlan}
          teacher={assignedTeacher}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
}
