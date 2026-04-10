import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Headset, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import type { SupportRequest } from '@/lib/app-state';

interface SupportScreenProps {
  onNavigate: (screen: string) => void;
  hasPrioritySupport: boolean;
  requests: SupportRequest[];
  onSubmitRequest: (payload: { subject: string; message: string }) => void;
}

const supportCopy: Record<
  Language,
  {
    title: string;
    priorityLane: string;
    standardLane: string;
    priorityHint: string;
    standardHint: string;
    responseTime: string;
    queuePosition: string;
    subject: string;
    message: string;
    submit: string;
    empty: string;
    queued: string;
    priorityBadge: string;
    priorityEta: string;
    standardEta: string;
  }
> = {
  az: {
    title: 'Kömək və dəstək',
    priorityLane: 'Prioritet dəstək',
    standardLane: 'Standart dəstək',
    priorityHint: 'Premium+ istifadəçiləri sorğularını sürətli növbədə göndərir və daha tez cavab alır.',
    standardHint: 'Standart növbə aktivdir. Premium+ ilə prioritet dəstək əldə edə bilərsiniz.',
    responseTime: 'Cavab müddəti',
    queuePosition: 'Növbə',
    subject: 'Mövzu',
    message: 'Mesajınızı yazın',
    submit: 'Sorğu göndər',
    empty: 'Hələ dəstək sorğusu yoxdur.',
    queued: 'Gözləmədə',
    priorityBadge: 'Prioritet',
    priorityEta: '10 dəq',
    standardEta: '2 saat',
  },
  en: {
    title: 'Help & Support',
    priorityLane: 'Priority support',
    standardLane: 'Standard support',
    priorityHint: 'Premium+ users are routed into the fast support queue with quicker handling.',
    standardHint: 'Standard queue is active. Upgrade to Premium+ for priority support.',
    responseTime: 'Response time',
    queuePosition: 'Queue',
    subject: 'Subject',
    message: 'Write your message',
    submit: 'Send request',
    empty: 'No support requests yet.',
    queued: 'Queued',
    priorityBadge: 'Priority',
    priorityEta: '10 min',
    standardEta: '2 hours',
  },
  ru: {
    title: 'Помощь и поддержка',
    priorityLane: 'Приоритетная поддержка',
    standardLane: 'Стандартная поддержка',
    priorityHint: 'Пользователи Premium+ попадают в быструю очередь поддержки и получают ответ быстрее.',
    standardHint: 'Активна стандартная очередь. Перейдите на Premium+ для приоритетной поддержки.',
    responseTime: 'Время ответа',
    queuePosition: 'Очередь',
    subject: 'Тема',
    message: 'Напишите сообщение',
    submit: 'Отправить запрос',
    empty: 'Пока нет запросов в поддержку.',
    queued: 'В очереди',
    priorityBadge: 'Приоритет',
    priorityEta: '10 мин',
    standardEta: '2 часа',
  },
};

export const SupportScreen = ({
  onNavigate,
  hasPrioritySupport: prioritySupportEntitlement,
  requests,
  onSubmitRequest,
}: SupportScreenProps) => {
  const { language } = useLanguage();
  const copy = supportCopy[language] ?? supportCopy.en;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const isPriorityLane = prioritySupportEntitlement;


  const handleSubmit = () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      return;
    }

    onSubmitRequest({
      subject: trimmedSubject,
      message: trimmedMessage,
    });
    setSubject('');
    setMessage('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex h-screen flex-col bg-[#F7F8FC] px-4 pb-6 pt-5">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => onNavigate('profile')}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#F9FAFB]"
          type="button"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{copy.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <Card className={`mb-6 border shadow-sm ${isPriorityLane ? 'border-[#5B5CFF]/30 bg-[#EEF0FF]' : 'border-[#E5E7EB] bg-white'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isPriorityLane ? 'bg-[#5B5CFF] text-white' : 'bg-[#F7F8FC] text-[#111827]'}`}>
                {isPriorityLane ? <ShieldCheck size={20} /> : <Headset size={20} />}
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#111827]">{isPriorityLane ? copy.priorityLane : copy.standardLane}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{isPriorityLane ? copy.priorityHint : copy.standardHint}</p>
              </div>
            </div>
            {isPriorityLane ? (
              <span className="rounded-full bg-[#5B5CFF] px-3 py-1 text-[12px] font-semibold text-white">{copy.priorityBadge}</span>
            ) : null}
          </div>


        </Card>

        <Card className="mb-6 border border-[#E5E7EB] bg-white shadow-sm">
          <div className="space-y-4">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={copy.subject} />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.message}
              className="min-h-[120px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#5B5CFF]"
            />
            <Button onClick={handleSubmit} disabled={!subject.trim() || !message.trim()} className="w-full">
              {copy.submit}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <Card className="border border-[#E5E7EB] bg-white text-[14px] text-[#6B7280] shadow-sm">{copy.empty}</Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="border border-[#E5E7EB] bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#111827]">{request.subject}</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{request.message}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${isPriorityLane ? 'bg-[#EEF0FF] text-[#5B5CFF]' : 'bg-[#F3F4F6] text-[#4B5563]'}`}>
                    {copy.queued}
                  </span>
                </div>

              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
