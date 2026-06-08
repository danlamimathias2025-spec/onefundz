export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'purchase' | 'withdrawal';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Investment {
  id: string;
  productName: string;
  remainingDays: number;
  nextPayoutDate: string;
  amount: number;
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}
