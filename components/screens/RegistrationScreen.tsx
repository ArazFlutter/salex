import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { motion } from 'motion/react';
import { User, Store, ChevronLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendOtp, verifyOtp, ApiError } from '@/lib/api';
import type { AccountType, UserProfile } from '@/lib/app-state';

interface RegistrationScreenProps {
  onNavigate: (screen: string) => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onAuthenticated?: (user: { id: string; phone: string; fullName: string; activePlan: string }) => void;
}

export const RegistrationScreen = ({ onNavigate, profile, onSaveProfile, onAuthenticated }: RegistrationScreenProps) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [accountType, setAccountType] = useState<AccountType>(profile.accountType);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verifySubmitLock = useRef(false);

  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setAccountType(profile.accountType);
  }, [profile]);

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOtp(phone.trim());
      onSaveProfile({ ...profile, fullName: fullName.trim(), phone: phone.trim(), accountType });
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 4) return;
    if (verifySubmitLock.current) return;
    verifySubmitLock.current = true;

    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(phone.trim(), code);
      onSaveProfile({ ...profile, fullName: fullName.trim(), phone: phone.trim(), accountType });
      await onAuthenticated?.({
        id: result.user.id,
        phone: result.user.phone,
        fullName: result.user.fullName,
        activePlan: result.user.activePlan,
      });
      onNavigate('platformActivation');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP code');
    } finally {
      setLoading(false);
      verifySubmitLock.current = false;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 3) {
      document.getElementById(`reg-otp-${index + 1}`)?.focus();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 h-screen flex flex-col bg-[#F7F8FC]">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => step === 'otp' ? setStep('form') : onNavigate('onboarding')}
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('create_account')}</h1>
      </div>

      {step === 'form' && (
        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('full_name')}</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('enter_full_name')} />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('phone_number')}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 123 45 67" type="tel" />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-4">{t('account_type')}</label>
            <div className="grid grid-cols-2 gap-4">
              <Card
                onClick={() => setAccountType('individual')}
                className={`cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-3 p-4 ${accountType === 'individual' ? 'border-[#5B5CFF] bg-[#EEF0FF]' : 'border-transparent bg-white'}`}
              >
                <User size={32} className={accountType === 'individual' ? 'text-[#5B5CFF]' : 'text-[#6B7280]'} />
                <span className={`text-[14px] font-medium ${accountType === 'individual' ? 'text-[#5B5CFF]' : 'text-[#111827]'}`}>{t('individual_seller')}</span>
              </Card>

              <Card
                onClick={() => setAccountType('business')}
                className={`cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-3 p-4 ${accountType === 'business' ? 'border-[#5B5CFF] bg-[#EEF0FF]' : 'border-transparent bg-white'}`}
              >
                <Store size={32} className={accountType === 'business' ? 'text-[#5B5CFF]' : 'text-[#6B7280]'} />
                <span className={`text-[14px] font-medium ${accountType === 'business' ? 'text-[#5B5CFF]' : 'text-[#111827]'}`}>{t('business_store')}</span>
              </Card>
            </div>
          </div>

          {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}
        </div>
      )}

      {step === 'otp' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <label className="block text-[14px] font-medium text-[#111827] mb-2 text-center">{t('enter_verification_code')}</label>
          <p className="text-[#6B7280] text-[14px] text-center mb-8">{t('we_sent_code')}</p>

          <div className="flex justify-center gap-4 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`reg-otp-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                className="w-14 h-16 rounded-[14px] border border-[#E5E7EB] text-center text-[24px] font-semibold focus:border-[#5B5CFF] focus:outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-[13px] text-red-500 text-center mb-4">{error}</p>}

          <Button onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 4} className="w-full">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('verify')}
          </Button>
        </motion.div>
      )}

      {step === 'form' && (
        <Button
          onClick={handleSendOtp}
          disabled={!fullName.trim() || !phone.trim() || loading}
          className="w-full mt-auto bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF] text-white"
        >
          {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('continue')}
        </Button>
      )}
    </motion.div>
  );
};
