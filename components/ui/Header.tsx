import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
}

export const Header = ({ title, onBack }: HeaderProps) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      {onBack && (
        <button 
          onClick={onBack} 
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#E6E9F5] transition-colors shrink-0"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
      )}
      {title && <h1 className="text-[24px] font-semibold text-[#111827]">{title}</h1>}
    </div>
  );
};
