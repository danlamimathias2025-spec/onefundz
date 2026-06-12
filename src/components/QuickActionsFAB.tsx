import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function QuickActionsFAB({ onDepositClick, onWithdrawClick }: { onDepositClick: () => void, onWithdrawClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: 'Deposit', icon: ArrowDownCircle, action: onDepositClick },
    { name: 'Withdraw', icon: ArrowUpCircle, action: onWithdrawClick || (() => alert('Withdraw modal')) },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40" id="quick-actions-fab">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 mb-4"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <action.icon size={20} className="text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold">{action.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white p-4 rounded-full shadow-xl hover:bg-purple-700 transition"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
