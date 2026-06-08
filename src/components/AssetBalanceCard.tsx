import React from 'react';
import { ChevronDown } from 'lucide-react';

interface AssetBalanceCardProps {
  balance?: number;
}

export default function AssetBalanceCard({ balance = 0 }: AssetBalanceCardProps) {
  return (
    <div className="bg-slate-900 rounded-2xl p-4 text-white text-center mx-4 my-4 shadow-lg" id="asset-balance-card">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">Total Balance</span>
        <button className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px] flex items-center" id="currency-select-btn">
          NGN <ChevronDown size={12} className="ml-1" />
        </button>
      </div>
      <div className="text-3xl font-bold my-1" id="balance-amount-display">
        ₦ {balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="bg-emerald-500/10 text-emerald-400 text-[10px] py-0.5 px-3.5 rounded-full inline-block font-medium border border-emerald-500/20">
        Wallet Connected
      </div>
    </div>
  );
}
