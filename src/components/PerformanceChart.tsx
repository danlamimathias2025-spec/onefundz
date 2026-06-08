import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { name: '10k', value: 10000 },
  { name: '500k', value: 500000 },
  { name: '1m', value: 1000000 },
  { name: '500k', value: 500000 },
  { name: '10k', value: 10000 },
];

export default function PerformanceChart() {
  return (
    <div className="px-3 mb-4">
      <h3 className="font-bold text-slate-900 mb-2">Performance</h3>
      <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
        {['All Time', 'Today', '1M', '6M', 'YTD'].map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-0.5 text-[10px] rounded-full ${
              i === 0 ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
