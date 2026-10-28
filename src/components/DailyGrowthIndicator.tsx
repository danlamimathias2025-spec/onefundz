import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function DailyGrowthIndicator() {
  const growthPercentage = 4.25;

  return (
    <div id="daily-growth-indicator" className="flex items-center justify-center gap-2 text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25 w-max mx-auto mt-2 font-medium">
      <TrendingUp size={13} className="text-emerald-500" />
      <span className="font-bold text-emerald-500">+{growthPercentage}%</span>
      <span className="text-slate-500 dark:text-slate-400">Daily Compound Yield Momentum</span>
      <span className="hidden sm:inline text-slate-400">·</span>
      <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-mono">ONEFUNDZ: ELITE</span>
    </div>
  );
}
