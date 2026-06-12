import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { db, auth } from '@/src/lib/firebase';
import { 
  doc, 
  onSnapshot, 
  addDoc, 
  collection, 
  serverTimestamp, 
  query, 
  where, 
  updateDoc,
  increment
} from 'firebase/firestore';

interface CombinedLedgerItem {
  id: string;
  description: string;
  amount: number;
  category: 'deposit' | 'withdrawal' | 'purchase' | 'referral';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  timestamp: number;
}

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'investments' | 'withdrawals'>('transactions');
  
  const [dbInvestments, setDbInvestments] = useState<any[]>([]);
  const [dbWithdrawals, setDbWithdrawals] = useState<any[]>([]);
  const [dbDeposits, setDbDeposits] = useState<any[]>([]);
  const [dbPurchases, setDbPurchases] = useState<any[]>([]);
  
  const [bankData, setBankData] = useState<any>(null);
  const [isWithdrawalFormOpen, setIsWithdrawalFormOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWithdrawCheckOverlay, setShowWithdrawCheckOverlay] = useState(false);
  
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAccount, setSelectedAccount] = useState<'primary' | null>(null);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (bankData?.bankName && bankData?.accountNumber) {
      setSelectedAccount('primary');
    }
  }, [bankData]);

  const handleSaveBank = async () => {
    if (!auth.currentUser) return;
    if (!newBankName || !newAccountName || !newAccountNumber) {
      alert("Please fill in all bank details.");
      return;
    }
    setSavingBank(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        bankName: newBankName,
        accountName: newAccountName,
        accountNumber: newAccountNumber
      });
      alert("Bank details successfully saved to profile!");
      setIsAddingBank(false);
      setSelectedAccount('primary');
    } catch (err) {
      console.error(err);
      alert("Failed to save bank details.");
    } finally {
      setSavingBank(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.email) {
      setLoading(false);
      return;
    }

    const email = auth.currentUser.email;

    // 1. Subscribe to biological user data (balance, username, account info)
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setBankData(snap.data());
      }
      setLoading(false);
    }, (err) => {
      console.error("Error reading user data: ", err);
      setLoading(false);
    });

    // 2. Subscribe to active investments
    const qInv = query(collection(db, 'investments'), where('userId', '==', email));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setDbInvestments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Error loading investments: ", err);
    });

    // 3. Subscribe to active withdrawals
    const qWith = query(collection(db, 'withdrawals'), where('userId', '==', email));
    const unsubWith = onSnapshot(qWith, (snap) => {
      setDbWithdrawals(snap.docs.map(doc => {
        const data = doc.data();
        const createdTime = data.createdAt?.seconds 
          ? data.createdAt.seconds * 1000 
          : (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());
        return {
          id: doc.id,
          ...data,
          timeMs: createdTime,
          dateString: new Date(createdTime).toLocaleString()
        };
      }));
    }, (err) => {
      console.error("Error loading withdrawals: ", err);
    });

    // 4. Subscribe to deposits
    const qDep = query(collection(db, 'deposits'), where('userId', '==', email));
    const unsubDep = onSnapshot(qDep, (snap) => {
      setDbDeposits(snap.docs.map(doc => {
        const data = doc.data();
        const createdTime = data.createdAt?.seconds 
          ? data.createdAt.seconds * 1000 
          : (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());
        return {
          id: doc.id,
          ...data,
          timeMs: createdTime,
          dateString: new Date(createdTime).toLocaleString()
        };
      }));
    }, (err) => {
      console.error("Error loading deposits: ", err);
    });

    // 5. Subscribe to purchase transactions
    const qTrans = query(collection(db, 'transactions'), where('userId', '==', email));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setDbPurchases(snap.docs.map(doc => {
        const data = doc.data();
        const createdTime = data.createdAt?.seconds 
          ? data.createdAt.seconds * 1000 
          : (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());
        return {
          id: doc.id,
          ...data,
          timeMs: createdTime,
          dateString: data.date ? `${data.date} ${new Date(createdTime).toLocaleTimeString()}` : new Date(createdTime).toLocaleString()
        };
      }));
    }, (err) => {
      console.error("Error loading standard transactions: ", err);
    });

    return () => {
      unsubUser();
      unsubInv();
      unsubWith();
      unsubDep();
      unsubTrans();
    };
  }, []);

  const handleWithdrawalRequest = async () => {
    if (!auth.currentUser || !auth.currentUser.email || !bankData) return;
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (amount < 5000) {
      alert('Minimum withdrawal amount is ₦ 5,000.00.');
      return;
    }

    const currentBalance = bankData.balance || 0;
    if (currentBalance < amount) {
      alert(`Insufficient funds. Your current balance is ₦ ${currentBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })} but you requested ₦ ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`);
      return;
    }

    if (!selectedAccount) {
      alert("Please select a saved bank account before requesting withdrawal.");
      return;
    }

    if (!bankData.bankName || !bankData.accountNumber || !bankData.accountName) {
      alert("Withdrawal profile incomplete. Please save your bank details first.");
      return;
    }

    setShowWithdrawCheckOverlay(true);
  };

  const handleWithdrawalSubmitReal = async () => {
    if (!auth.currentUser || !auth.currentUser.email || !bankData) return;
    const amount = parseFloat(withdrawalAmount);
    const currentBalance = bankData.balance || 0;

    setSubmitting(true);
    try {
      // 1. Deduct immediately from main profile balance
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: increment(-amount)
      });

      // 2. Save active withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: auth.currentUser.email.toLowerCase(),
        amount: amount,
        bankName: bankData.bankName,
        accountName: bankData.accountName,
        accountNumber: bankData.accountNumber,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert('Withdrawal request submitted successfully!\n\n₦ ' + amount.toLocaleString('en-NG') + ' has been deducted from your balance, and the transfer is now awaiting approval from finance team.');
      setWithdrawalAmount('');
      setShowWithdrawCheckOverlay(false);
      setIsWithdrawalFormOpen(false);
    } catch (error) {
      console.error("Withdrawal processing error: ", error);
      alert('Verification or network error occurred during withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compile unified general chronological transactions ledger
  const compiledLedger: CombinedLedgerItem[] = [
    ...dbPurchases.map(t => {
      const isRef = t.category === 'referral';
      return {
        id: t.id,
        description: t.description || (isRef ? 'Referral Reward' : 'Plan Subscription'),
        amount: isRef ? t.amount : -t.amount,
        category: (t.category || 'purchase') as any,
        status: (t.status || 'approved') as any,
        date: t.dateString,
        timestamp: t.timeMs
      };
    }),
    ...dbWithdrawals.map(w => ({
      id: w.id,
      description: `Withdrawal transfer to ${w.bankName}`,
      amount: -w.amount,
      category: 'withdrawal' as const,
      status: w.status,
      date: w.dateString,
      timestamp: w.timeMs
    })),
    ...dbDeposits.map(d => ({
      id: d.id,
      description: d.remarks || 'Wallet Deposit Funding',
      amount: d.amount,
      category: 'deposit' as const,
      status: d.status,
      date: d.dateString,
      timestamp: d.timeMs
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredWithdrawals = dbWithdrawals.filter(w => {
    if (withdrawalFilter === 'all') return true;
    return (w.status || 'pending').toLowerCase() === withdrawalFilter;
  });

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Activity</h2>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-900/10',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-900/10',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-900/10',
    };
    const lookupVal = (status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected';
    const finalStyle = colors[lookupVal] || colors.pending;
    return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${finalStyle}`}>{status ? status.toUpperCase() : 'PENDING'}</span>;
  };

  const getAmountColor = (item: CombinedLedgerItem) => {
    if (item.category === 'deposit' || item.category === 'referral') {
      return item.status === 'rejected' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-emerald-600 dark:text-emerald-400';
    }
    return 'text-slate-900 dark:text-slate-100';
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Activity Ledger</h2>
      
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`pb-2 whitespace-nowrap text-sm ${activeTab === 'transactions' ? 'border-b-2 border-slate-900 dark:border-slate-100 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
        >
          General Ledger
        </button>
        <button 
          onClick={() => setActiveTab('investments')}
          className={`pb-2 whitespace-nowrap text-sm ${activeTab === 'investments' ? 'border-b-2 border-slate-900 dark:border-slate-100 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
        >
          Active Packages ({dbInvestments.length})
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-2 whitespace-nowrap text-sm ${activeTab === 'withdrawals' ? 'border-b-2 border-slate-900 dark:border-slate-100 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
        >
          Withdraw Claims ({dbWithdrawals.length})
        </button>
      </div>

      {activeTab === 'transactions' ? (
        compiledLedger.length === 0 ? (
          <EmptyState title="No Ledger Entries" message="Your wallet has no deposit funding, payout, or plan subscriptions on file yet." />
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="popLayout">
              {compiledLedger.map(item => (
                <motion.div 
                  layout
                  key={item.id} 
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.description}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{item.category} • {item.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`font-mono font-bold text-sm ${getAmountColor(item)}`}>
                      {item.amount > 0 ? '+' : ''}₦ {item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : activeTab === 'investments' ? (
        dbInvestments.length === 0 ? (
          <EmptyState title="No Account Packages" message="You have no active yield-generating subscription plans. Browse and purchase from home tab!" />
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="popLayout">
              {dbInvestments.map(inv => (
                <motion.div 
                  layout
                  key={inv.id} 
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <p className="font-bold text-red-600 dark:text-red-400 text-sm">{inv.productName}</p>
                    <span className="font-mono font-bold text-sm text-slate-950 dark:text-slate-50">₦ {inv.amount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 gap-y-1 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                    <div>Remaining Time: <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.ceil(inv.remainingDays)} days</span></div>
                    <div className="text-right">Payout Frequency: <span className="font-semibold text-slate-700 dark:text-slate-300">Continuous</span></div>
                    <div>Daily Yield: <span className="font-bold text-green-600 dark:text-green-400">₦ {inv.dailyPayout?.toLocaleString() || '0'}</span></div>
                    <div className="text-right">Next Payout: <span className="font-semibold text-slate-700 dark:text-slate-300">Live</span></div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : (
        <div className="space-y-4">
          <button 
            onClick={() => {
              setIsWithdrawalFormOpen(!isWithdrawalFormOpen);
            }}
            className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-lg font-bold hover:bg-slate-850 active:scale-95 transition-all text-xs"
          >
            {isWithdrawalFormOpen ? 'Close Withdrawal Panel' : 'Request Wallet Withdrawal'}
          </button>
          
          {isWithdrawalFormOpen && bankData && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm space-y-4">
              
              {/* SAVED ACCOUNT SELECTION OR ADDITION FLOW */}
              {bankData.bankName && bankData.accountNumber ? (
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">Select Saved Bank Account</label>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount('primary')}
                    className={`w-full p-4 text-left rounded-xl border transition-all flex items-center justify-between ${
                      selectedAccount === 'primary' 
                        ? 'bg-indigo-50/70 border-indigo-550 dark:bg-indigo-950/20 border-indigo-500' 
                        : 'bg-white border-slate-200 dark:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAccount === 'primary' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-705'}`}>
                        {selectedAccount === 'primary' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {bankData.bankName} • {bankData.accountNumber}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {bankData.accountName}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                      Primary
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-450 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-bold">No Saved Account Found</p>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Please add and save a settlement bank account to make withdrawal requests.
                  </p>
                  
                  {!isAddingBank ? (
                    <button
                      onClick={() => setIsAddingBank(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Add Bank Details
                    </button>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-amber-250/50 dark:border-amber-900/30">
                      <select 
                        value={newBankName} 
                        onChange={(e) => setNewBankName(e.target.value)} 
                        className="w-full border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select Bank</option>
                        {["Access Bank", "Zenith Bank", "GTBank", "First Bank", "UBA", "Sterling Bank", "OPay", "Palmpay", "Moniepoint", "FCMB", "Wema Bank", "Fidelity Bank", "Fairmoney"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        value={newAccountName} 
                        onChange={(e) => setNewAccountName(e.target.value)} 
                        placeholder="Account Name (e.g. John Doe)" 
                        className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <input 
                        type="text" 
                        value={newAccountNumber} 
                        onChange={(e) => setNewAccountNumber(e.target.value)} 
                        placeholder="Account Number (10 digits)" 
                        className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveBank}
                          disabled={savingBank}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          {savingBank ? 'Saving...' : 'Save Bank Account'}
                        </button>
                        <button
                          onClick={() => setIsAddingBank(false)}
                          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WITHDRAWAL AMOUNT INPUT */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">Withdrawal Amount (NGN)</label>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                    Minimum: ₦ 5,000
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-450 dark:text-slate-500 font-bold text-xs">₦</span>
                  <input 
                    type="number" 
                    value={withdrawalAmount} 
                    onChange={(e) => setWithdrawalAmount(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-850 bg-slate-100 dark:bg-slate-950 pl-7 pr-3 py-3 rounded-lg text-sm font-mono font-bold" 
                    placeholder="5,000" 
                  />
                </div>
              </div>

              <button 
                onClick={handleWithdrawalRequest} 
                disabled={submitting || !selectedAccount}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white p-3 rounded-lg font-bold shadow-md text-xs transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Authenticating and Debiting...' : 'Place Withdrawal Request'}
              </button>
            </div>
          )}
          
          {/* Dedicated Sub-section for Withdrawal Lists */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800" id="withdrawal-requests-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Withdrawal Request History</h3>
                <p className="text-[10px] text-slate-400">Track and inspect pending, approved, or rejected settlements</p>
              </div>
              
              {/* Status pills selector filter */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-max overflow-x-auto self-start sm:self-auto" id="withdrawal-status-filters">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
                  const count = f === 'all' 
                    ? dbWithdrawals.length 
                    : dbWithdrawals.filter(w => (w.status || 'pending').toLowerCase() === f).length;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setWithdrawalFilter(f)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition-all duration-200 select-none ${
                        withdrawalFilter === f 
                          ? 'bg-slate-905 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <EmptyState 
                title={`No ${withdrawalFilter !== 'all' ? withdrawalFilter : ''} Claims Found`} 
                message={`You do have not have any ${withdrawalFilter === 'all' ? '' : withdrawalFilter} withdrawal claims recorded on file.`} 
              />
            ) : (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredWithdrawals.map(w => (
                    <motion.div 
                      layout
                      key={w.id} 
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -15 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-950 dark:text-slate-50">₦ {w.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">{w.bankName} • {w.accountName}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">Acc: {w.accountNumber} • Claim: {w.dateString}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(w.status)}
                        {(w.status || 'pending') === 'pending' && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 rounded">Awaiting Review</span>
                        )}
                        {w.status === 'approved' && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Check size={8} /> Disbursed</span>
                        )}
                        {w.status === 'rejected' && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-1 rounded">Cancelled & Refunded</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* IN-APP INTERACTIVE WITHDRAWAL CONFIRMATION DIALOG MODAL  */}
      <AnimatePresence>
        {showWithdrawCheckOverlay && (
          <div
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            id="withdrawal-transactions-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-5 text-slate-900 dark:text-slate-100 shadow-2xl animate-fade-in"
            >
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-sm">Confirm Withdrawal Claim</h3>
                <p className="text-[10px] text-slate-500">Confirm transaction debit and details below</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-850 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">₦ {parseFloat(withdrawalAmount).toLocaleString('en-NG')}</span>
                </div>
                {bankData && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Target Bank Details</p>
                    <p className="font-bold text-xs">{bankData.bankName}</p>
                    <p className="text-slate-500 text-[10px]">Name: {bankData.accountName}</p>
                    <p className="text-slate-500 text-[10px] font-mono font-bold">Acc: {bankData.accountNumber}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWithdrawCheckOverlay(false)}
                  disabled={submitting}
                  className="flex-1 py-3 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawalSubmitReal}
                  disabled={submitting}
                  className="flex-1 py-3 text-xs font-bold rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
