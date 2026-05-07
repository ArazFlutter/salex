import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-[16px] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
