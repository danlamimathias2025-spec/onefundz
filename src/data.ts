import { Transaction, Investment } from './types';

export const mockTransactions: Transaction[] = [
  { id: '1', description: 'Tech Stocks Growth', amount: 1500, category: 'purchase', status: 'approved', date: '2026-06-05' },
  { id: '2', description: 'Quarterly Cash-Out', amount: 300, category: 'withdrawal', status: 'pending', date: '2026-06-06' },
  { id: '3', description: 'Energy ETF', amount: 800, category: 'purchase', status: 'pending', date: '2026-06-07' },
];

export const mockInvestments: Investment[] = [
  { id: 'inv1', productName: 'VIP 2 Plan', remainingDays: 45, nextPayoutDate: '2026-06-15', amount: 8000 },
  { id: 'inv2', productName: 'VIP 4 Plan', remainingDays: 12, nextPayoutDate: '2026-06-10', amount: 30000 },
];
