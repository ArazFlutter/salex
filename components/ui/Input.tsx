import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        'h-[52px] w-full rounded-[14px] border border-[#E5E7EB] px-4 py-3 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#5B5CFF] focus:outline-none transition-all',
        className
      )}
      {...props}
    />
  );
};
