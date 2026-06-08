import React from 'react';
import { Sun, Moon, MessageCircle } from 'lucide-react';
import logoSrc from '../assets/images/onefundz_logo_1780826034862.png';

interface HeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Header({ toggleTheme, isDarkMode }: HeaderProps) {
  return (
    <header className="bg-slate-900 dark:bg-slate-950 p-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <img src={logoSrc} alt="ONEFUNDZ Logo" className="w-8 h-8 rounded-full border border-yellow-400/20" referrerPolicy="no-referrer" />
        <div className="text-white font-bold text-lg tracking-tight">
          ONE<span className="text-yellow-400">F</span>UNDZ
        </div>
      </div>
      <div className="flex items-center gap-3">
        <a 
          href="https://www.wa.me/+2348082076038" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm transition-all"
        >
          <MessageCircle size={15} />
          <span>Support</span>
        </a>
        <button onClick={toggleTheme} className="text-white hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-800">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
