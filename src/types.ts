export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'purchase' | 'withdrawal' | 'resale' | 'deposit' | 'referral';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  userId?: string;
  createdAt?: any;
  sharesCount?: number;
}

export interface Investment {
  id: string;
  productName: string;
  sharesCount?: number;
  sharePrice?: number;
  remainingDays?: number;
  nextPayoutDate?: string;
  amount: number;
  certificateNumber?: string;
  status?: 'active' | 'resold' | 'completed';
  dailyPayout?: number;
  totalReturn?: number;
  userId?: string;
  lastSettledAt?: any;
  createdAt?: any;
}

export interface ShareTranche {
  id: string;
  name: string;
  code: string;
  shares: number;
  pricePerShare: number;
  totalPrice: number;
  dividendYield: number; // estimated annual yield %
  minAllotment: number;
  badge?: string;
  description: string;
  popular?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  receiptUrl: string;
  paymentMethod?: string;
  depositorName?: string;
  reference?: string;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  approvedAt?: any;
  reviewedBy?: string;
}

export interface SystemConfig {
  ipoSharePrice: number;
  paymentLink: string;
  refineryBpdCapacity: number;
  currentAllotmentTranche: string;
  minSharePurchase: number;
}
