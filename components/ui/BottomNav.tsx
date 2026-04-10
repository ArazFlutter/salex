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
    <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-[#E5E7EB] flex justify-around items-center px-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className={cn(
              'flex flex-col items-center gap-1',
              isActive ? 'text-[#5B5CFF]' : 'text-[#6B7280]'
            )}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};
