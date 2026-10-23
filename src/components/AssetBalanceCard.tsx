import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, TrendingUp, ShieldCheck, Coins, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

interface AssetBalanceCardProps {
  balance?: number;
  projectedValue?: number;
  totalSharesValue?: number;
  totalSharesCount?: number;
}

export default function AssetBalanceCard({ 
  balance = 0, 
  projectedValue = 0,
  totalSharesValue = 0,
  totalSharesCount = 0
}: AssetBalanceCardProps) {
  const prevBalanceRef = useRef(balance);
  const [animateProps, setAnimateProps] = useState({ scale: 1, color: 'rgb(255, 255, 255)' });

  useEffect(() => {
    if (balance > prevBalanceRef.current) {
      setAnimateProps({ scale: 1.05, color: 'rgb(34, 197, 94)' });
      const timer = setTimeout(() => setAnimateProps({ scale: 1, color: 'rgb(255, 255, 255)' }), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    } else if (balance < prevBalanceRef.current) {
      setAnimateProps({ scale: 1.05, color: 'rgb(239, 68, 68)' });
      const timer = setTimeout(() => setAnimateProps({ scale: 1, color: 'rgb(255, 255, 255)' }), 600);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    }
    prevBalanceRef.current = balance;
  }, [balance]);

  return (
    <div 
      className="bg-gradient-to-br from-[#0a1931] via-[#0d2552] to-[#081226] rounded-2xl p-4.5 text-white mx-4 my-4 shadow-xl border border-amber-500/25 relative overflow-hidden" 
      id="asset-balance-card"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <Wallet size={13} className="text-amber-400" />
          <span className="text-amber-300/90 text-[10px] font-bold tracking-wider uppercase">
            Liquid Investor Balance
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[#061021] border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-mono">
          <span>NGN (₦)</span>
          <ChevronDown size={11} />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-1">
        <span className="text-[10px] text-slate-400 font-medium">Available Cash (Instant Withdrawal / Buy Shares)</span>
        <motion.div 
          animate={animateProps}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-3xl font-extrabold my-0.5 font-mono text-white tracking-tight" 
          id="balance-amount-display"
        >
          ₦ {balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>
        
        {totalSharesCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-300/95 font-medium tracking-wide mt-1">
            <Coins size={12} className="text-amber-400" />
            <span>Equity Holdings: <strong className="font-mono text-white">{totalSharesCount.toLocaleString()} Shares</strong> (₦{totalSharesValue.toLocaleString('en-NG')})</span>
          </div>
        )}

        {projectedValue > 0 && (
          <div className="text-[10px] text-emerald-400/90 font-medium tracking-wide mt-0.5">
            + ₦ {projectedValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-slate-400 font-normal">Projected Dividend Yield</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 mt-3 text-[10px]">
        <div className="bg-emerald-500/10 text-emerald-400 py-0.5 px-3 rounded-full font-medium border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck size={11} />
          <span>CSCS Account Verified</span>
        </div>

        <div className="text-slate-400">
          Refinery Output: <strong className="text-amber-300">650,000 BPD</strong>
        </div>
      </div>
    </div>
  );
}
