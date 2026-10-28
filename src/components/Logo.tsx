import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  animated?: boolean;
  className?: string;
  showTagline?: boolean;
}

export default function Logo({
  size = 'md',
  variant = 'full',
  animated = false,
  className = '',
  showTagline = false
}: LogoProps) {
  // Dimension mappings for emblem size
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const taglineSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs'
  };

  // High-fidelity vector SVG emblem representing ONEFUNDZ shield + growth coin + gold/emerald ribbon
  const IconEmblem = (
    <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions[size]} ${animated ? 'animate-pulse' : ''}`}>
      {/* Outer ambient glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-500 opacity-60 blur-sm transform group-hover:opacity-100 transition duration-300" />
      
      {/* Emblem shield container */}
      <div className="relative w-full h-full rounded-xl sm:rounded-2xl bg-slate-950 border border-yellow-400/40 p-1 flex items-center justify-center shadow-2xl overflow-hidden group">
        {/* Shiny background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-900/30" />
        
        {/* Intersecting geometric 1F / dynamic fund arrow SVG */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full relative z-10 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id="centerHighlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shield / Outer Crest outline */}
          <path 
            d="M50 8 L85 24 V52 C85 72.5 69.5 89.5 50 94 C30.5 89.5 15 72.5 15 52 V24 L50 8 Z" 
            fill="url(#emeraldGrad)" 
            fillOpacity="0.15" 
            stroke="url(#goldGrad)" 
            strokeWidth="4" 
            strokeLinejoin="round" 
          />

          {/* Upward Growth / Number '1' pillar */}
          <path 
            d="M38 68 V32 L30 38 V30 L40 22 H48 V68 H38 Z" 
            fill="url(#goldGrad)" 
          />

          {/* 'F' Horizontal Wings / Fund bars with green upward arrow cap */}
          <path 
            d="M48 26 H72 V34 H48 V26 Z" 
            fill="url(#goldGrad)" 
          />
          <path 
            d="M48 42 H65 V50 H48 V42 Z" 
            fill="url(#emeraldGrad)" 
          />

          {/* Dynamic upward trend indicator arrow */}
          <path 
            d="M62 68 L76 50 L84 56 L70 74 H62 Z" 
            fill="url(#emeraldGrad)" 
          />

          {/* Center sparkle star */}
          <circle cx="50" cy="50" r="18" fill="url(#centerHighlight)" />
          <polygon points="50,40 53,47 60,50 53,53 50,60 47,53 40,50 47,47" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );

  const TextBrand = (
    <div className="flex flex-col justify-center leading-none select-none">
      <div className={`font-black tracking-tight ${textSizes[size]} font-sans flex items-center`}>
        <span className="text-white drop-shadow-sm">ONE</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 font-extrabold">
          FUNDZ
        </span>
      </div>
      {showTagline && (
        <span className={`text-slate-400 font-semibold tracking-widest uppercase mt-0.5 ${taglineSizes[size]}`}>
          Cooperative
        </span>
      )}
    </div>
  );

  if (variant === 'icon') return IconEmblem;
  if (variant === 'text') return TextBrand;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {IconEmblem}
      {TextBrand}
    </div>
  );
}
