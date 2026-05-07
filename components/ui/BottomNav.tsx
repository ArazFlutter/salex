import React from 'react';
import { Home, List, Package, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { t } = useLanguage();

  const tabs = [
    { name: 'Home', labelKey: 'home', icon: Home },
    { name: 'Listings', labelKey: 'listings', icon: List },
    { name: 'Packages', labelKey: 'packages', icon: Package },
    { name: 'Stats', labelKey: 'stats', icon: BarChart2 },
    { name: 'Profile', labelKey: 'profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5E7EB] bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex h-[56px] items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name;
        return (
          <button
            type="button"
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className={cn(
              'flex min-w-[56px] flex-col items-center gap-1 rounded-[14px] px-2 py-2 transition-colors',
              isActive ? 'text-[#5B5CFF]' : 'text-[#6B7280]'
            )}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
};
