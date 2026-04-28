'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError, confirmDevPayment, getPaymentOrder, type PaymentOrder, type UserPackageInfo } from '@/lib/api';
import { getPlanLabel, type PlanId } from '@/lib/app-state';

interface DevPaymentScreenProps {
  orderId: string;
  onCancel: () => void;
  onConfirmed: (payload: { activePlan: PlanId; package?: UserPackageInfo }) => void;
}

export function DevPaymentScreen({ orderId, onCancel, onConfirmed }: DevPaymentScreenProps) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loadError, setLoadError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const paidSyncedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getPaymentOrder(orderId);
      setOrder(data.paymentOrder);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Dev auto-confirm flow is intentionally disabled after Telegram Stars migration.
  // useEffect(() => {
  //   if (order?.status !== 'paid' || paidSyncedRef.current) {
  //     return;
  //   }
  //   paidSyncedRef.current = true;
  //   onConfirmed({ activePlan: order.plan as PlanId, package: undefined });
  // }, [order, onConfirmed]);

  const handleConfirm = async () => {
    setConfirmError('');
    setConfirming(true);
    try {
      const data = await confirmDevPayment(orderId);
      paidSyncedRef.current = true;
      setOrder(data.paymentOrder);
      onConfirmed({ activePlan: data.user.activePlan as PlanId, package: data.package });
    } catch (err) {
      setConfirmError(err instanceof ApiError ? err.message : 'Payment failed');
    } finally {
      setConfirming(false);
    }
  };

  const planLabel = order ? getPlanLabel(order.plan as PlanId, t) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen flex-col bg-[#F7F8FC] px-4 pb-6 pt-5"
    >
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#F9FAFB]"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">Dev payment</h1>
      </div>

      <p className="mb-6 text-[13px] leading-5 text-[#6B7280]">
        Fake checkout for development. No real provider is called. Confirm to activate your package.
      </p>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B5CFF]" />
        </div>
      ) : loadError ? (
        <Card className="border border-[#FECACA] bg-[#FEF2F2] p-4">
          <p className="text-[14px] text-[#B91C1C]">{loadError}</p>
          <Button variant="ghost" className="mt-4 w-full" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      ) : order ? (
        <div className="flex flex-1 flex-col gap-4">
          <Card className="border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EEF0FF] text-[#5B5CFF]">
                <CreditCard size={22} />
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[#6B7280]">Plan</p>
                <p className="text-[18px] font-semibold text-[#111827]">{planLabel}</p>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#F3F4F6] pt-4">
              <span className="text-[14px] text-[#6B7280]">Amount</span>
              <span className="text-[22px] font-bold text-[#111827]">
                {order.amount} {order.currency}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">Status</span>
              <span
                className={`font-semibold ${
                  order.status === 'paid' ? 'text-[#16A34A]' : order.status === 'failed' ? 'text-[#DC2626]' : 'text-[#D97706]'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="mt-3 truncate text-[11px] text-[#9CA3AF]">Order: {order.id}</p>
          </Card>

          {order.status === 'paid' ? (
            <Button className="w-full" onClick={onCancel}>
              {t('continue')}
            </Button>
          ) : (
            <>
              {confirmError ? <p className="text-center text-[13px] text-[#DC2626]">{confirmError}</p> : null}
              <Button
                className="w-full bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF] text-white"
                disabled={confirming || order.status !== 'pending'}
                onClick={() => void handleConfirm()}
              >
                {confirming ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Confirm payment (dev)'}
              </Button>
              <Button variant="ghost" className="w-full" disabled={confirming} onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
