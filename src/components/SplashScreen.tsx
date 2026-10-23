import React, { useEffect, useState } from 'react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash screen for 2.4s, then smooth transition
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2400);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      className={`fixed inset-0 z-[9999] w-screen h-screen bg-[#071120] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      id="application-splash-screen"
      title="Tap anywhere to enter"
    >
      {/* Blurred background image with dark overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={DANGOTE_ASSETS.splash} 
          alt="Dangote Petroleum Refinery Splash" 
          className="w-full h-full object-cover filter blur-md scale-105 opacity-60" 
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/90 via-[#0a1931]/70 to-[#061020]/90 backdrop-blur-sm" />
      </div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-6 max-w-xs mx-auto text-center">
        {/* Central Logo */}
        <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-black/80 border-2 border-amber-400/80 animate-pulse">
          <img 
            src={DANGOTE_ASSETS.logo} 
            alt="Dangote Petroleum Refinery" 
            className="w-32 h-auto object-contain"
            draggable={false}
          />
        </div>

        <div>
          <span className="bg-red-600 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full shadow-md">
            Official Shareholder Portal
          </span>
          <h1 className="text-xl font-black text-white tracking-tight mt-2 font-sans">
            DANGOTE <span className="text-amber-400">REFINERY</span> IPO
          </h1>
        </div>

        {/* Loading single bold line in center indicating loading */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 w-full animate-[shimmer_1.5s_infinite] rounded-full" />
        </div>

        <span className="text-[11px] text-amber-300 font-mono tracking-widest uppercase animate-pulse">
          Initializing Shareholder Registry...
        </span>
      </div>
    </div>
  );
}
