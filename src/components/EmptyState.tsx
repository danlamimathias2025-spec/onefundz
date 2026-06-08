import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
      <div className="text-4xl mb-4">📭</div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
