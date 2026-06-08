import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onFinish: () => void;
}

const letters = [
  { char: 'O', color: 'text-red-500' },
  { char: 'N', color: 'text-blue-500' },
  { char: 'E', color: 'text-green-500' },
  { char: 'F', color: 'text-yellow-500' },
  { char: 'U', color: 'text-purple-500' },
  { char: 'N', color: 'text-pink-500' },
  { char: 'D', color: 'text-indigo-500' },
  { char: 'Z', color: 'text-teal-500' },
];

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 z-50">
      <img src="/src/assets/images/onefundz_logo_1780826034862.png" alt="ONEFUNDZ Logo" className="w-24 h-24 rounded-full mb-8" referrerPolicy="no-referrer" />
      <div className="flex space-x-2">
        {letters.map((item, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, y: index % 2 === 0 ? -100 : 100, rotate: -180 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1, type: 'spring', stiffness: 100 }}
            className={`text-5xl font-extrabold ${item.color}`}
          >
            {item.char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
