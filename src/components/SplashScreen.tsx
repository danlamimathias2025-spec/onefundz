import React, { useEffect, useState } from 'react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show the exact full screen splash screen image for 2.2s, then smooth transition
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
      className={`fixed inset-0 z-[9999] w-screen h-screen bg-[#edf0f5] flex items-center justify-center overflow-hidden cursor-pointer select-none transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      id="application-splash-screen"
      title="Tap anywhere to enter"
    >
      <img 
        src={DANGOTE_ASSETS.splash} 
        alt="Dangote Petroleum Refinery Splash Screen" 
        className="w-full h-full object-cover sm:object-contain object-center max-w-full max-h-screen" 
        draggable={false}
      />
    </div>
  );
}
