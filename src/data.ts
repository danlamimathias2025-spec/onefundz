import { Transaction, Investment } from './types';

export const ONEFUNDZ_MIN_DEPOSIT = 5000;
export const ONEFUNDZ_MIN_WITHDRAWAL = 5000;

export const mockTransactions: Transaction[] = [
  { id: '1', description: 'VIP 1 Subscription Plan Deposit', amount: 4000, category: 'purchase', status: 'approved', date: '2026-10-18' },
  { id: '2', description: 'Daily Yield Payout (VIP 1)', amount: 400, category: 'purchase', status: 'approved', date: '2026-10-19' },
  { id: '3', description: 'Referral Bonus Reward', amount: 500, category: 'referral', status: 'approved', date: '2026-10-20' },
];

export const mockInvestments: Investment[] = [
  {
    id: 'inv1',
    productName: 'VIP 1 Plan',
    remainingDays: 45,
    nextPayoutDate: '2026-10-29',
    amount: 4000,
    dailyPayout: 400,
  },
];
