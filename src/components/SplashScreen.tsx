import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2200);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      className={`fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      id="application-splash-screen"
      title="Tap anywhere to enter"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-6 max-w-xs mx-auto text-center">
        <Logo size="xl" variant="full" animated={true} showTagline={true} className="flex-col items-center text-center" />

        <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
          Wealth & Investment Vault
        </span>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 w-full animate-[shimmer_1.5s_infinite] rounded-full" />
        </div>

        <span className="text-[11px] text-yellow-300/80 font-mono tracking-widest uppercase animate-pulse">
          Initializing Secure Session...
        </span>
      </div>
    </div>
  );
}
