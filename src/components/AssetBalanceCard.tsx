import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface AssetBalanceCardProps {
  balance?: number;
}

export default function AssetBalanceCard({ balance = 0 }: AssetBalanceCardProps) {
  const prevBalanceRef = useRef(balance);
  const [animateProps, setAnimateProps] = useState({ scale: 1, color: 'rgb(255, 255, 255)' });

  useEffect(() => {
    if (balance > prevBalanceRef.current) {
      setAnimateProps({ scale: 1.05, color: 'rgb(34, 197, 94)' }); // emerald-500
      const timer = setTimeout(() => setAnimateProps({ scale: 1, color: 'rgb(255, 255, 255)' }), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    } else if (balance < prevBalanceRef.current) {
      setAnimateProps({ scale: 1.05, color: 'rgb(239, 68, 68)' }); // red-500
      const timer = setTimeout(() => setAnimateProps({ scale: 1, color: 'rgb(255, 255, 255)' }), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    }
    prevBalanceRef.current = balance;
  }, [balance]);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 text-white text-center mx-4 my-4 shadow-lg" id="asset-balance-card">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">Total Balance</span>
        <button className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px] flex items-center" id="currency-select-btn">
          NGN <ChevronDown size={12} className="ml-1" />
        </button>
      </div>
      <motion.div 
        animate={animateProps}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-3xl font-bold my-1" 
        id="balance-amount-display"
      >
        ₦ {balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.div>
      <div className="bg-emerald-500/10 text-emerald-400 text-[10px] py-0.5 px-3.5 rounded-full inline-block font-medium border border-emerald-500/20">
        Wallet Connected
      </div>
    </div>
  );
}
