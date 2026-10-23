import React, { useState } from 'react';
import { Sun, Moon, MessageCircle, TrendingUp } from 'lucide-react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';
import NotificationsBell from './NotificationsBell';

interface HeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Header({ toggleTheme, isDarkMode }: HeaderProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#0a1931] via-[#0d2552] to-[#0a1931] border-b border-amber-500/20 p-3 flex items-center justify-between shadow-xl sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="h-11 sm:h-12 px-2.5 py-1 rounded-xl bg-white flex items-center justify-center shadow-md shadow-black/20 shrink-0 border border-slate-200">
          <img 
            src={DANGOTE_ASSETS.logo} 
            alt="Dangote Petroleum Refinery" 
            className="h-full w-auto object-contain" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm">
              IPO
            </span>
            <span className="text-[10px] sm:text-xs text-amber-300 font-bold flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-400 shrink-0" /> ₦525.00 / Share
            </span>
          </div>
          <span className="text-[9px] text-slate-300 hidden sm:inline mt-0.5 font-medium">
            Official Investor Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <a 
          href="https://www.wa.me/+2348082076038" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs px-2.5 py-1.5 rounded-full font-bold shadow-md transition-all border border-emerald-400/30"
          title="Investor Relations Desk"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline text-[11px]">Investor Desk</span>
        </a>
        <NotificationsBell />
        <button 
          onClick={toggleTheme} 
          className="text-slate-300 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
