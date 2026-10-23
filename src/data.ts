import { Transaction, Investment, ShareTranche } from './types';

export const DANGOTE_IPO_PRICE = 525; // ₦525 per share baseline IPO price
export const DANGOTE_IPO_MIN_SHARES = 10; // Minimum subscription: 10 shares
export const DANGOTE_IPO_MIN_COST = 5250; // ₦5,250 minimum subscription cost (10 * 525)
export const DANGOTE_IPO_ISSUER = 'Dangote Petroleum Refinery and Petrochemicals FZE (DPRP)';
export const DANGOTE_IPO_TOTAL_SHARES = '4.1 Billion Ordinary Shares';
export const DANGOTE_IPO_TARGET_RAISE = '₦2.15 Trillion ($1.6 Billion)';
export const DANGOTE_IPO_OPENING_DATE = 'September 14, 2026';
export const DANGOTE_IPO_CLOSING_DATE = 'Until further notice';
export const DANGOTE_IPO_TARGET_INVESTORS = '10 Million Individual & Retail Investors';
export const REFINERY_CAPACITY_BPD = 650000; // 650,000 barrels per day
export const DANGOTE_DEPOSIT_PAYSTACK_LINK = 'https://paystack.shop/pay/dangote_refinary_deposit';

export const ipoOfferDetails = [
  { label: 'Issuer', value: 'Dangote Petroleum Refinery and Petrochemicals FZE (DPRP)' },
  { label: 'Offer Price', value: '₦525.00 per Ordinary Share' },
  { label: 'Total Offering', value: '4.1 Billion Ordinary Shares' },
  { label: 'Target Capital Raised', value: '₦2.15 Trillion (~$1.6 Billion USD)' },
  { label: 'Minimum Subscription', value: '10 Shares (Costing ₦5,250)' },
  { label: 'Opening Date', value: 'September 14, 2026' },
  { label: 'Closing Date', value: 'Until further notice' },
  { label: 'Target Demographic', value: '10 Million Individual & Retail Investors' },
];

export const ipoShareTranches: ShareTranche[] = [
  {
    id: 'tranche-min',
    name: 'Minimum Subscription Lot',
    code: 'DANGOTE-MS10',
    shares: 10,
    pricePerShare: 525,
    totalPrice: 5250,
    dividendYield: 18.0,
    minAllotment: 10,
    badge: 'Min Entry (₦5,250)',
    description: 'Official minimum subscription unit: 10 shares costing ₦5,250. Instant shareholder registry.',
  },
  {
    id: 'tranche-1',
    name: 'Retail Pioneer Allotment',
    code: 'DANGOTE-RT50',
    shares: 50,
    pricePerShare: 525,
    totalPrice: 26250,
    dividendYield: 18.5,
    minAllotment: 50,
    badge: 'Starter Lot',
    description: '50 Ordinary shares with quarterly dividend eligibility and CSCS digital clearing.',
  },
  {
    id: 'tranche-2',
    name: 'Citizen Shareholder Lot',
    code: 'DANGOTE-CS100',
    shares: 100,
    pricePerShare: 525,
    totalPrice: 52500,
    dividendYield: 19.2,
    minAllotment: 100,
    badge: 'Popular',
    popular: true,
    description: 'Standard Nigerian retail investor lot (100 units). Voting & dividend rights included.',
  },
  {
    id: 'tranche-3',
    name: 'Energy Growth Tranche',
    code: 'DANGOTE-EG250',
    shares: 250,
    pricePerShare: 525,
    totalPrice: 131250,
    dividendYield: 20.4,
    minAllotment: 250,
    badge: 'High Yield',
    description: 'Strategic growth allotment with priority allocation on subsequent offerings.',
  },
  {
    id: 'tranche-4',
    name: 'Commercial Partner Block',
    code: 'DANGOTE-CP500',
    shares: 500,
    pricePerShare: 525,
    totalPrice: 262500,
    dividendYield: 21.0,
    minAllotment: 500,
    badge: 'Executive',
    description: '500 Ordinary Shares. Certified digital share warrant & priority allocation.',
  },
  {
    id: 'tranche-5',
    name: 'Executive Shareholder Lot',
    code: 'DANGOTE-ES1000',
    shares: 1000,
    pricePerShare: 525,
    totalPrice: 525000,
    dividendYield: 22.5,
    minAllotment: 1000,
    badge: 'VIP Tier',
    description: '1,000 Ordinary Shares. Direct DPRP shareholder register accreditation.',
  },
  {
    id: 'tranche-6',
    name: 'Industrial Capital Tranche',
    code: 'DANGOTE-IC2500',
    shares: 2500,
    pricePerShare: 525,
    totalPrice: 1312500,
    dividendYield: 23.8,
    minAllotment: 2500,
    badge: 'Institutional',
    description: 'Institutional-grade block. Guaranteed secondary market buyback liquidity.',
  },
  {
    id: 'tranche-7',
    name: 'Major Syndicate Block',
    code: 'DANGOTE-MS5000',
    shares: 5000,
    pricePerShare: 525,
    totalPrice: 2625000,
    dividendYield: 24.5,
    minAllotment: 5000,
    badge: 'Syndicate',
    description: 'High-volume syndication allocation with dedicated investor relations desk.',
  },
  {
    id: 'tranche-8',
    name: 'Sovereign Energy Tranche',
    code: 'DANGOTE-SE10000',
    shares: 10000,
    pricePerShare: 525,
    totalPrice: 5250000,
    dividendYield: 25.0,
    minAllotment: 10000,
    badge: 'Sovereign',
    description: 'Premier qualifying allotment for ultra-high-net-worth capital partners.',
  },
];

export const refineryFacts = [
  { label: 'Offer Price', value: '₦525.00 / Share', desc: '4.1B shares raising ₦2.15T ($1.6B)' },
  { label: 'Min Subscription', value: '10 Shares (₦5,250)', desc: '10M retail investor target' },
  { label: 'Installed Capacity', value: '650,000 BPD', desc: 'World’s largest single-train refinery' },
  { label: 'Offer Timeline', value: 'Opened Sept 14, 2026', desc: 'Closing: Until further notice' },
];

export const mockTransactions: Transaction[] = [
  { id: '1', description: 'Bought 100 Dangote Refinery Shares (Allotment #DRP-8491)', amount: 52500, category: 'purchase', status: 'approved', date: '2026-10-18', sharesCount: 100 },
  { id: '2', description: 'Resold 20 Shares back to Secondary Pool', amount: 10500, category: 'resale', status: 'approved', date: '2026-10-20', sharesCount: 20 },
  { id: '3', description: 'Dividends & Allotment Growth Payout', amount: 8400, category: 'purchase', status: 'approved', date: '2026-10-21' },
];

export const mockInvestments: Investment[] = [
  {
    id: 'inv1',
    productName: 'Citizen Shareholder Lot (100 Shares)',
    sharesCount: 100,
    sharePrice: 525,
    amount: 52500,
    certificateNumber: 'DRP-IPO-2026-0042',
    status: 'active',
    dailyPayout: 320,
    totalReturn: 68000,
  },
  {
    id: 'inv2',
    productName: 'Energy Growth Tranche (250 Shares)',
    sharesCount: 250,
    sharePrice: 525,
    amount: 131250,
    certificateNumber: 'DRP-IPO-2026-0189',
    status: 'active',
    dailyPayout: 800,
    totalReturn: 175000,
  },
];
