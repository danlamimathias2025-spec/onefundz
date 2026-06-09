import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function PerformanceChart({ investments = [] }: { investments?: any[] }) {
  const chartData = useMemo(() => {
    // Determine the total daily compounding yield from active investments
    const activeDaily = investments
      .filter((inv) => inv.status === 'active')
      .reduce((sum, inv) => sum + (inv.dailyPayout || 0), 0);

    // If there's no active investment, return a flat / static baseline line
    if (activeDaily === 0) {
      return [
        { name: 'Today', value: 0 },
        { name: 'Day 1', value: 0 },
        { name: 'Day 2', value: 0 },
        { name: 'Day 3', value: 0 },
        { name: 'Day 4', value: 0 },
      ];
    }

    // Generate upcoming 5 day projection linearly based on active compounding
    return [
      { name: 'Today', value: 0 },
      { name: 'Day 1', value: activeDaily * 1 },
      { name: 'Day 2', value: activeDaily * 2 },
      { name: 'Day 3', value: activeDaily * 3 },
      { name: 'Day 4', value: activeDaily * 4 },
      { name: 'Day 5', value: activeDaily * 5 },
    ];
  }, [investments]);

  return (
    <div className="px-3 mb-4">
      <h3 className="font-bold text-slate-900 mb-2">Performance Projection</h3>
      <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
        {['7 Days', '14 Days', '30 Days'].map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-0.5 text-[10px] rounded-full font-bold ${
              i === 0 ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="h-40 w-full" id="performance-chart">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={['dataMin - 100', 'dataMax + 1000']} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', fontSize: '10px' }}
              formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Projected Return']}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#0f172a" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#0f172a' }} 
              activeDot={{ r: 5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 px-1">Chart shows estimated future cumulative profit based on currently active VIP plans.</p>
    </div>
  );
}
