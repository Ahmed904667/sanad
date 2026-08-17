'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { SubscriptionPlan } from '../types';
import { CheckCircle2, Sparkles, Clock, Video, Award, Star, ArrowRight, ArrowLeft } from 'lucide-react';

interface PlansGridProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export const PlansGrid: React.FC<PlansGridProps> = ({ onSelectPlan }) => {
  const { language, plans, setSelectedPlanForCheckout } = useApp();
  const isAr = language === 'ar';

  const handleSelect = (plan: SubscriptionPlan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      setSelectedPlanForCheckout(plan);
    }
  };

  return (
    <section id="plans" className="py-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'جميع الخطط تشمل +1 حصة تمهيدية مجانية' : 'All Plans Include +1 Free Orientation Session'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
            {isAr ? 'خطط الاشتراك بالريال السعودي (SAR)' : 'Subscription Plans in SAR'}
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'تتضمن كل خطة حصة تمهيدية مجانية لمقابلة المعلم والاتفاق على هدفك (حفظ جديد، تلاوة وتصحيح، أو مراجعة)، ثم يتم تحويل الرسوم بالريال السعودي.'
              : 'Includes a free orientation class to set your Quranic goal (Hifz, Tilawah, or Review), paid via Saudi Bank transfer.'}
          </p>
        </div>

        {/* 6 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {plans.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? 'bg-white border-2 border-amber-400 shadow-xl scale-102 ring-2 ring-amber-300'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 gold-gradient-bg text-emerald-950 font-black text-[11px] px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-emerald-950" />
                    <span>{isAr ? 'الخطة الأكثر طلباً' : 'Most Popular Plan'}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-xl text-emerald-950">
                      {isAr ? plan.titleAr : plan.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {isAr ? plan.subtitleAr : plan.subtitleEn}
                    </p>
                  </div>

                  {/* Free Orientation Badge */}
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{isAr ? '+1 حصة تمهيدية مجانية مع المعلم' : '+1 Free Orientation Class'}</span>
                  </div>

                  {/* Price Banner */}
                  <div className="py-2 border-y border-slate-100 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-900">{plan.priceMonthlySar}</span>
                    <span className="text-xs font-extrabold text-slate-600">ر.س / {isAr ? 'شهرياً' : 'Monthly'}</span>
                  </div>

                  {/* Features Bullet Points */}
                  <ul className="space-y-2 text-xs font-semibold text-slate-700 pt-2">
                    {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary CTA */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => handleSelect(plan)}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'gold-gradient-bg text-emerald-950 hover:brightness-110'
                        : 'emerald-gradient-bg text-white hover:opacity-95'
                    }`}
                  >
                    <span>{isAr ? 'اختيار الخطة والتحويل البنكي' : 'Select Plan & Bank Transfer'}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
