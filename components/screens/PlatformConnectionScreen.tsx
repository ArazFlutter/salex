import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { connectPlatform, ApiError } from '@/lib/api';

interface PlatformConnectionScreenProps {
  onNavigate: (screen: string) => void;
  backScreen?: string;
  platformName?: string;
  onSuccess?: () => void;
}

export const PlatformConnectionScreen = ({
  onNavigate,
  backScreen = 'platformActivation',
  platformName = 'Tap.az',
  onSuccess,
}: PlatformConnectionScreenProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await connectPlatform(platformName);
      setStep('success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onNavigate('platformActivation');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => onNavigate(backScreen)}
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#E6E9F5] transition-colors shrink-0"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('connect_marketplaces')}</h1>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
          <span className="text-[32px]">🛍️</span>
        </div>
        <div>
          <h1 className="text-[24px] font-semibold">{platformName}</h1>
          <p className="text-[#6B7280] text-[14px]">{t('connect_your_account')}</p>
        </div>
      </div>

      {step === 'phone' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('phone_number')}</label>
          <div className="flex gap-3 mb-8">
            <div className="h-[52px] px-4 rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FC] flex items-center justify-center text-[#6B7280] font-medium">
              +994
            </div>
            <Input placeholder="___ ___ __ __" className="flex-1 text-[16px] tracking-widest" type="tel" />
          </div>
          <Button onClick={() => setStep('otp')} className="w-full">
            {t('send_verification_code')}
          </Button>
        </motion.div>
      )}

      {step === 'otp' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <label className="block text-[14px] font-medium text-[#111827] mb-2 text-center">{t('enter_verification_code')}</label>
          <p className="text-[#6B7280] text-[14px] text-center mb-8">{t('we_sent_code')}</p>

          <div className="flex justify-center gap-4 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                className="w-14 h-16 rounded-[14px] border border-[#E5E7EB] text-center text-[24px] font-semibold focus:border-[#5B5CFF] focus:outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-[13px] text-red-500 text-center mb-4">{error}</p>}

          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('verify')}
          </Button>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#F0FFF4] rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-[#22C55E]" />
          </div>
          <h2 className="text-[20px] font-semibold mb-2">{platformName} {t('connected_success')}</h2>
          <p className="text-[#6B7280] mb-8">{t('account_linked')}</p>
          <Button onClick={handleDone} className="w-full">
            {t('done')}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
