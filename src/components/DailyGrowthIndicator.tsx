import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';

export default function DailyGrowthIndicator() {
  const growthPercentage = 3.85;

  return (
    <div id="daily-growth-indicator" className="flex items-center justify-center gap-2 text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 w-max mx-auto mt-2 font-medium">
      <TrendingUp size={13} className="text-emerald-500" />
      <span className="font-bold text-emerald-500">+{growthPercentage}%</span>
      <span className="text-slate-500 dark:text-slate-400">Pre-IPO Valuation Momentum</span>
      <span className="hidden sm:inline text-slate-400">·</span>
      <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-mono">NGX: DANGOTE-REF</span>
    </div>
  );
}
