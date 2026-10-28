import React from 'react';
import { Sun, Moon, MessageCircle } from 'lucide-react';
import NotificationsBell from './NotificationsBell';
import Logo from './Logo';

interface HeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Header({ toggleTheme, isDarkMode }: HeaderProps) {
  return (
    <header className="bg-slate-900 dark:bg-slate-950 p-3 flex items-center justify-between shadow-md sticky top-0 z-40 backdrop-blur-md">
      <Logo size="sm" variant="full" />
      <div className="flex items-center gap-3">
        <a 
          href="https://www.wa.me/+2348082076038" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm transition-all"
        >
          <MessageCircle size={15} />
          <span className="hidden sm:inline">Support</span>
        </a>
        <NotificationsBell />
        <button onClick={toggleTheme} className="text-white hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-800">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
