import React from 'react';
import { motion } from 'motion/react';
import { Store } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#5B5CFF] to-[#7A7BFF]"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-24 h-24 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-md"
      >
        <Store size={48} className="text-white" />
      </motion.div>
      <div className="mt-8 text-white/80">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm"
        >
          Loading...
        </motion.div>
      </div>
    </motion.div>
  );
};
