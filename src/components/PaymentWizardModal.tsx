'use client';

import React, { useState } from 'react';
import { SubscriptionPlan, Teacher } from '../types';
import { useApp } from '../context/AppContext';
import { X, Building2, Upload, FileText, CheckCircle2, ShieldCheck, Copy, Sparkles, AlertCircle } from 'lucide-react';

interface PaymentWizardModalProps {
  plan: SubscriptionPlan | null;
  teacher: Teacher | null;
  onClose: () => void;
}

export const PaymentWizardModal: React.FC<PaymentWizardModalProps> = ({ plan, teacher, onClose }) => {
  const { language, bankInfo, submitPaymentReceipt } = useApp();
  const isAr = language === 'ar';

  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!plan || !teacher) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name);
    }
  };

  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    submitPaymentReceipt(plan.id, teacher.id, receiptFileName || 'إيصال_تحويل_مصرف_الراجحي.png', bankRef);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl emerald-gradient-bg flex items-center justify-center text-amber-400 shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-emerald-950">
                  {isAr ? 'بيانات التحويل البنكي ورفع الإيصال' : 'Bank Transfer & Receipt Upload'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'حسابات شركة سنَد المعتمدة بالمملكة العربية السعودية' : 'Official Saudi Bank Transfer Details'}
                </p>
              </div>
            </div>

            {/* Plan & Price Summary Box */}
            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl mb-6 border border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-bold block">
                  {isAr ? 'الخطة والمعلم المختار:' : 'Selected Plan & Teacher:'}
                </span>
                <span className="font-extrabold text-base text-white">
                  {isAr ? plan.titleAr : plan.titleEn} ({isAr ? `مع ${teacher.nameAr}` : `With ${teacher.nameEn}`})
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">{plan.priceMonthlySar} ر.س</span>
                <span className="text-[10px] text-emerald-300 block">{isAr ? 'شهرياً' : 'Monthly'}</span>
              </div>
            </div>

            {/* Saudi Bank Transfer Details Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">{isAr ? 'البنك / Bank:' : 'Bank Name:'}</span>
                <span className="font-extrabold text-emerald-900">{isAr ? bankInfo.bankNameAr : bankInfo.bankNameEn}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">{isAr ? 'اسم الحساب / Account:' : 'Account Name:'}</span>
                <span className="font-bold text-slate-800">{isAr ? bankInfo.accountNameAr : bankInfo.accountNameEn}</span>
              </div>

              {/* IBAN Copy Box */}
              <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">رقم الآيبان (IBAN):</span>
                  <span className="font-mono font-extrabold text-xs text-emerald-950" dir="ltr">{bankInfo.iban}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bankInfo.iban, 'iban')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedField === 'iban' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* Receipt Upload Form */}
            <form onSubmit={handleSubmitReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'إرفاق صورة إيصال التحويل البنكي (Receipt File):' : 'Upload Bank Receipt Proof:'}
                </label>
                <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-emerald-50/40 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    {receiptFileName ? receiptFileName : (isAr ? 'اضغط هنا لرفع صور الإيصال' : 'Click to select receipt image')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    PNG, JPG, PDF (Max 10MB)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'رقم المرجع / الحوالة (اختياري):' : 'Reference / Transfer Number (Optional):'}
                </label>
                <input
                  type="text"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="REF-894120"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={!receiptFileName}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  receiptFileName
                    ? 'gold-gradient-bg text-emerald-950 hover:brightness-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'إرسال الإيصال واعتماد الطلب' : 'Submit Receipt for Teacher Verification'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Success Notification */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="font-extrabold text-2xl text-emerald-950">
              {isAr ? 'تم رفع إيصال التحويل بنجاح!' : 'Receipt Submitted Successfully!'}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {isAr 
                ? `طلبك الآن قيد الاعتماد لدى ${teacher.nameAr}. فور تأكيد الإيصال سيتم تحويل حسابك إلى مفعل وتوليد حصص الشهر تلقائياً بدون تعارض.` 
                : `Your receipt is pending teacher verification by ${teacher.nameEn}. Upon approval, your classes will be scheduled automatically.`}
            </p>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{isAr ? 'حالة الحساب الآن: قيد مراجعة الدفع (PENDING)' : 'Account Status: PENDING_VERIFICATION'}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {isAr ? 'إغلاق والذهاب للوحة التحكم' : 'Close & Open Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
