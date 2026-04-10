import React from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { ShoppingBag, MessageCircle, Store, ShoppingCart, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StartScreenProps {
  onNavigate: (screen: string) => void;
}

export const StartScreen = ({ onNavigate }: StartScreenProps) => {
  const { t } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-between h-screen p-6 text-center bg-gradient-to-b from-[#5B5CFF] to-[#7A7BFF] text-white">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-24 h-24 bg-white/20 rounded-[24px] mb-8 flex items-center justify-center backdrop-blur-md">
          <Store size={48} className="text-white" />
        </div>
        <h1 className="text-[24px] font-semibold mb-4 leading-tight">
          {t('start_title')}
        </h1>
        <p className="text-white/80 mb-12 text-[14px]">
          {t('start_subtitle')}
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { name: 'Tap.az', icon: ShoppingBag },
            { name: 'Lalafo', icon: Tag },
            { name: 'Alan.az', icon: ShoppingCart },
            { name: 'Laylo.az', icon: MessageCircle },
            { name: 'Birja.com', icon: Store },
          ].map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.name} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-[10px] text-white/90">{platform.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <Button 
        onClick={() => onNavigate('language')} 
        className="w-full bg-white text-[#5B5CFF] hover:bg-white/90 shadow-none"
      >
        {t('start')}
      </Button>
    </motion.div>
  );
};
