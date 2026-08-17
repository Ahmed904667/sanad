'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, Mail, Phone, Lock, GraduationCap, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'TEACHER_REGISTER';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'STUDENT_REGISTER',
  onClose,
  onSuccess
}) => {
  const { language, registerStudentAccount, login, applyAsTeacher } = useApp();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'TEACHER_REGISTER'>(initialMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [password, setPassword] = useState('');
  const [ijazahDetails, setIjazahDetails] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    if (mode === 'STUDENT_REGISTER') {
      if (!name.trim()) {
        setErrorMessage(isAr ? 'يرجى إدخال الاسم الكامل' : 'Please enter full name');
        return;
      }
      registerStudentAccount(name, email, gender, phone, password || '123456');
      setIsSuccess(true);
    } else if (mode === 'STUDENT_LOGIN') {
      const res = login(email, password || '123456');
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password'));
      }
    } else {
      if (!name.trim() || !ijazahDetails.trim()) {
        setErrorMessage(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }
      applyAsTeacher(name, email, gender, ijazahDetails, ['الإجازة بالسند المتصل'], password || '123456');
      setIsSuccess(true);
    }
  };

  const handleFinish = () => {
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="flex border-b border-slate-200 mb-6">
              <button
                onClick={() => setMode('STUDENT_REGISTER')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                  mode === 'STUDENT_REGISTER'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAr ? 'حساب طالب جديد' : 'New Student'}
              </button>

              <button
                onClick={() => setMode('STUDENT_LOGIN')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                  mode === 'STUDENT_LOGIN'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAr ? 'تسجيل دخول الطالب' : 'Student Login'}
              </button>

              <button
                onClick={() => setMode('TEACHER_REGISTER')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                  mode === 'TEACHER_REGISTER'
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAr ? 'انضمام كمعلم' : 'Join as Teacher'}
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-black text-xl text-emerald-950">
                {mode === 'STUDENT_REGISTER' && (isAr ? 'إنشاء حساب طالب جديد' : 'Create Student Account')}
                {mode === 'STUDENT_LOGIN' && (isAr ? 'تسجيل الدخول لمنصة سَنَد' : 'Login to Sanad')}
                {mode === 'TEACHER_REGISTER' && (isAr ? 'تقديم طلب انضمام كمعلم مجاز' : 'Apply as Certified Teacher')}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {mode === 'TEACHER_REGISTER'
                  ? (isAr ? 'انضم لنخبة المعلمين المجازين ودرّس القرآن أونلاين' : 'Join our faculty of certified Quran scholars')
                  : (isAr ? 'أنشئ حسابك وابدأ اختيار خطتك والمعلم المناسب' : 'Create account to choose plan and schedule lessons')}
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode !== 'STUDENT_LOGIN' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الاسم الكامل:' : 'Full Name:'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: أحمد عبد الله' : 'e.g., Ahmed Abdullah'}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {mode !== 'STUDENT_LOGIN' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الجنس:' : 'Gender:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('MALE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        gender === 'MALE'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {isAr ? 'ذكر' : 'Male'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('FEMALE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        gender === 'FEMALE'
                          ? 'border-pink-600 bg-pink-50 text-pink-950 ring-2 ring-pink-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {isAr ? 'أنثى' : 'Female'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode === 'STUDENT_REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الجوال (اختياري):' : 'Phone Number (Optional):'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {mode === 'TEACHER_REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'تفاصيل الإجازة والمؤهلات القرآنية:' : 'Ijazah Credentials:'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={ijazahDetails}
                    onChange={(e) => setIjazahDetails(e.target.value)}
                    placeholder={isAr ? 'اذكر اسم الروايات الشاطبية أو الدرة والسند المتصل...' : 'Detail your unbroken Ijazah chain...'}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'TEACHER_REGISTER'
                    ? 'gold-gradient-bg text-emerald-950'
                    : 'emerald-gradient-bg text-white'
                }`}
              >
                <span>
                  {mode === 'STUDENT_REGISTER' && (isAr ? 'إنشاء حساب طالب والمتابعة' : 'Create Account & Continue')}
                  {mode === 'STUDENT_LOGIN' && (isAr ? 'دخول الطالب' : 'Login')}
                  {mode === 'TEACHER_REGISTER' && (isAr ? 'تقديم طلب الانضمام كمعلم' : 'Submit Teacher Application')}
                </span>
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <h3 className="font-extrabold text-xl text-emerald-950">
              {mode === 'TEACHER_REGISTER'
                ? (isAr ? 'تم استلام طلب المعلم بنجاح!' : 'Teacher Application Submitted!')
                : (isAr ? 'تم إنشاء حساب الطالب بنجاح!' : 'Account Created Successfully!')}
            </h3>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {isAr ? 'المتابعة' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
