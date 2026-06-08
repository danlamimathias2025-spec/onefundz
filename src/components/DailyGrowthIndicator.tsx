import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function DailyGrowthIndicator() {
  // Simulate 7-day growth - In a real app, this would be computed from historical data
  const growthPercentage = 2.45;
  const isPositive = growthPercentage >= 0;

  return (
    <div id="daily-growth-indicator" className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} w-max mx-auto mt-2`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="font-semibold">{isPositive ? '+' : ''}{growthPercentage}%</span>
        <span className="text-slate-500">last 7 days</span>
    </div>
  );
}
