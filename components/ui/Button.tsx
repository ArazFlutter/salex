import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-[#5B5CFF] text-white shadow-[0_8px_24px_rgba(91,92,255,0.25)]',
    secondary: 'bg-[#EEF0FF] text-[#5B5CFF]',
    ghost: 'border border-[#E5E7EB] text-[#111827]',
  };

  return (
    <button
      className={cn(
        'flex h-[52px] items-center justify-center rounded-[14px] px-6 font-semibold transition-all active:scale-95 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:active:scale-100 disabled:active:brightness-100',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
