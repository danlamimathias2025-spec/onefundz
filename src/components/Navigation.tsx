import React from 'react';
import { Home, LayoutGrid, Users, User } from 'lucide-react';

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-3 flex justify-around text-slate-400">
      <button className="flex flex-col items-center">
        <Home size={20} />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>
      <button className="flex flex-col items-center text-white">
        <LayoutGrid size={20} />
        <span className="text-[10px] mt-0.5">Product</span>
      </button>
      <button className="flex flex-col items-center">
        <Users size={20} />
        <span className="text-[10px] mt-0.5">Team</span>
      </button>
      <button className="flex flex-col items-center">
        <User size={20} />
        <span className="text-[10px] mt-0.5">Mine</span>
      </button>
    </nav>
  );
}
