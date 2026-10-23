import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowDownCircle, ArrowUpCircle, ShoppingBag, RefreshCw } from 'lucide-react';

interface QuickActionsFABProps {
  onDepositClick: () => void;
  onWithdrawClick?: () => void;
  onBuySharesClick?: () => void;
  onResellSharesClick?: () => void;
}

export default function QuickActionsFAB({ 
  onDepositClick, 
  onWithdrawClick,
  onBuySharesClick,
  onResellSharesClick
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: 'Buy Shares', icon: ShoppingBag, color: 'text-amber-500', action: onBuySharesClick || (() => {}) },
    { name: 'Resell Shares', icon: RefreshCw, color: 'text-emerald-500', action: onResellSharesClick || (() => {}) },
    { name: 'Deposit Funds', icon: ArrowDownCircle, color: 'text-blue-500', action: onDepositClick },
    { name: 'Withdraw Cash', icon: ArrowUpCircle, color: 'text-rose-500', action: onWithdrawClick || (() => {}) },
  ];

  return (
    <div className="fixed bottom-24 right-5 z-40" id="quick-actions-fab">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-2.5 mb-3 items-end"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsOpen(false);
                  action.action();
                }}
                className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-amber-500/30 hover:bg-slate-800 transition active:scale-95"
              >
                <action.icon size={17} className={action.color} />
                <span className="text-xs font-bold whitespace-nowrap">{action.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white p-3.5 rounded-full shadow-2xl hover:brightness-110 active:scale-95 transition border-2 border-amber-400/50 flex items-center justify-center cursor-pointer"
        aria-label="Quick Actions"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus size={22} />
        </motion.div>
      </button>
    </div>
  );
}
