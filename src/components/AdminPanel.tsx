import React, { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { getDocs, doc, getDoc, deleteDoc, updateDoc, query, collection, where, addDoc, serverTimestamp, increment, setDoc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users as UsersIcon, 
  ArrowDownCircle, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  User as UserIcon, 
  Phone, 
  Building, 
  CreditCard,
  XCircle,
  Clock,
  CheckCircle2,
  Lock,
  Bell,
  ClipboardList,
  Coins,
  Settings,
  Save,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import EmptyState from './EmptyState';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'shares' | 'deposits' | 'withdrawals' | 'settings' | 'notifications' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [paymentLinkInput, setPaymentLinkInput] = useState('https://paystack.shop/pay/dangote_refinary_deposit');
  const [ipoPriceInput, setIpoPriceInput] = useState('525');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});

  const logAction = async (action: string, targetUserId: string, targetUserEmail: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    try {
      await addDoc(collection(db, 'admin_audit_logs'), {
        adminEmail: auth.currentUser?.email || 'Unknown Admin',
        action,
        targetUserId,
        targetUserEmail,
        details,
        severity,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  };
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedDepositForReview, setSelectedDepositForReview] = useState<any | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Notifications state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all'
  });
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Form states for editing users
  const [editForm, setEditForm] = useState({
    userName: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    balance: 0,
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const fetchData = async () => {
    // We isolate each collection fetch block in its own try/catch to guarantee that any single
    // source failing or being empty does not prevent the other lists (like registered users) from loading successfully.
    try {
      const usersQuery = await getDocs(collection(db, 'users'));
      setUsers(usersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to load users for Admin Panel:", err);
      // Still log via helper for developer analytics if needed
      try {
        handleFirestoreError(err, 'list', 'users');
      } catch (e) {
        // Do not block rendering, we log to console
      }
    }
    
    try {
      const depositsQuery = await getDocs(collection(db, 'deposits'));
      setDeposits(depositsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to load deposits gracefully:", err);
    }

    try {
      const withdrawalsQuery = await getDocs(collection(db, 'withdrawals'));
      setWithdrawals(withdrawalsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to load withdrawals gracefully:", err);
    }

    try {
      const invQuery = await getDocs(collection(db, 'investments'));
      setAllInvestments(invQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to load investments:", err);
    }

    try {
      const cfgDoc = await getDoc(doc(db, 'system_config', 'deposit'));
      if (cfgDoc.exists() && cfgDoc.data()?.paymentLink) {
        setPaymentLinkInput(cfgDoc.data().paymentLink);
      }
    } catch (err) {
      console.warn("Failed to load deposit config:", err);
    }

    try {
      const auditQuery = await getDocs(query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc')));
      setAuditLogs(auditQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.warn("Failed to load audit logs gracefully:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveDeposit = async (id: string, userId: string, amount: number) => {
    if (processingIds[id]) return;
    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      // 1. Fetch current deposit status to prevent multiple approvals
      const depositRef = doc(db, 'deposits', id);
      const depositSnap = await getDoc(depositRef);
      if (!depositSnap.exists()) {
        alert('Deposit request not found.');
        return;
      }
      const depositData = depositSnap.data();
      if (depositData && depositData.status !== 'pending' && depositData.status !== undefined && depositData.status !== '') {
        alert(`This deposit has already been processed (current status: ${depositData.status}).`);
        setDeposits(deposits.map(d => d.id === id ? { ...d, status: depositData.status } : d));
        return;
      }

      const targetEmail = (userId || '').trim().toLowerCase();
      // 2. Update deposit status to approved with review metadata
      await updateDoc(depositRef, { 
        status: 'approved',
        approvedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.email || 'admin'
      });
      
      // 3. Increase user balance
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(amount) });
          
          setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'approved' } : d));
          setUsers(users.map(u => u.email?.toLowerCase() === targetEmail ? { ...u, balance: (u.balance || 0) + amount } : u));
          
          // 4. Record approved transaction
          await addDoc(collection(db, 'transactions'), {
            userId: targetEmail,
            description: `Deposit Credited (Paystack) - Admin Approved`,
            amount: amount,
            category: 'deposit',
            status: 'approved',
            date: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
          });

          // 5. Send notification to user
          await addDoc(collection(db, 'notifications'), {
            title: 'Deposit Approved! 🎉',
            message: `Your deposit of ₦${amount.toLocaleString('en-NG')} has been verified by the administrator and credited to your wallet balance. You can now subscribe to shares.`,
            type: 'deposit',
            target: targetEmail,
            createdAt: serverTimestamp()
          });

          await logAction('APPROVE_DEPOSIT', userDoc.id, targetEmail, `Admin approved deposit of ₦${amount.toLocaleString('en-NG')}`, 'INFO');
          
          alert(`Deposit approved successfully! ₦${amount.toLocaleString('en-NG')} credited to ${targetEmail}'s wallet.`);
      } else {
          setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'approved' } : d));
          alert(`Deposit marked as approved, but user email (${targetEmail}) was not found in users database.`);
      }
      
      setSelectedDepositForReview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to approve deposit.');
    } finally {
      setProcessingIds(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const rejectDeposit = async (id: string, reasonPrompt?: string) => {
    if (processingIds[id]) return;
    
    const defaultReason = reasonPrompt || window.prompt(
      "Enter reason for rejecting this deposit (or click OK for default):", 
      "Transaction could not be verified in payment records"
    );
    if (defaultReason === null) return; // User pressed Cancel

    const rejectionReason = defaultReason.trim() || "Transaction unverified";

    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      const depositRef = doc(db, 'deposits', id);
      const depositSnap = await getDoc(depositRef);
      if (!depositSnap.exists()) {
        alert('Deposit request not found.');
        return;
      }
      const depositData = depositSnap.data();
      if (depositData && depositData.status !== 'pending' && depositData.status !== undefined && depositData.status !== '') {
        alert(`This deposit has already been processed (current status: ${depositData.status}).`);
        setDeposits(deposits.map(d => d.id === id ? { ...d, status: depositData.status } : d));
        return;
      }

      const targetEmail = deposits.find(d => d.id === id)?.userId || deposits.find(d => d.id === id)?.email || 'unknown';
      const depositAmount = deposits.find(d => d.id === id)?.amount || 0;

      // Update deposit status to rejected with reason - balance is NOT modified
      await updateDoc(depositRef, { 
        status: 'rejected',
        rejectionReason,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.email || 'admin'
      });
      setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'rejected', rejectionReason } : d));

      // Notify the user of rejection
      await addDoc(collection(db, 'notifications'), {
        title: 'Deposit Unverified',
        message: `Your deposit submission of ₦${depositAmount.toLocaleString('en-NG')} was rejected. Reason: ${rejectionReason}`,
        type: 'warning',
        target: targetEmail.toLowerCase(),
        createdAt: serverTimestamp()
      });
      
      await logAction('REJECT_DEPOSIT', id, targetEmail, `Admin rejected deposit of ₦${depositAmount.toLocaleString('en-NG')}. Reason: ${rejectionReason}`, 'WARNING');
      
      alert(`Deposit request marked as rejected. Balance remains untouched.`);
      setSelectedDepositForReview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to reject deposit.');
    } finally {
      setProcessingIds(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const deleteDeposit = async (id: string) => {
    if (!window.confirm('Are you certain you want to delete this deposit request? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'deposits', id));
      setDeposits(deposits.filter(d => d.id !== id));
      alert('Deposit request deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete deposit request.');
    }
  };

  const approveWithdrawal = async (id: string) => {
    if (processingIds[id]) return;
    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      const withdrawalRef = doc(db, 'withdrawals', id);
      const withdrawalSnap = await getDoc(withdrawalRef);
      if (!withdrawalSnap.exists()) {
        alert('Withdrawal request not found.');
        return;
      }
      const withdrawalData = withdrawalSnap.data();
      if (withdrawalData && withdrawalData.status !== 'pending' && withdrawalData.status !== undefined && withdrawalData.status !== '') {
        alert(`This withdrawal is already processed (current status: ${withdrawalData.status}).`);
        setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: withdrawalData.status } : w));
        return;
      }

      const targetEmail = withdrawals.find(w => w.id === id)?.email || 'unknown';
      await updateDoc(withdrawalRef, { status: 'approved' });
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'approved' } : w));
      
      await logAction('APPROVE_WITHDRAWAL', id, targetEmail, `Admin approved withdrawal of ₦${withdrawals.find(w => w.id === id)?.amount?.toLocaleString('en-NG') || '0'}`, 'INFO');
      
      alert('Withdrawal request approved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to approve withdrawal.');
    } finally {
      setProcessingIds(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const rejectWithdrawal = async (id: string, userId: string, amount: number) => {
    if (processingIds[id]) return;
    setProcessingIds(prev => ({ ...prev, [id]: true }));
    try {
      const withdrawalRef = doc(db, 'withdrawals', id);
      const withdrawalSnap = await getDoc(withdrawalRef);
      if (!withdrawalSnap.exists()) {
        alert('Withdrawal request not found.');
        return;
      }
      const withdrawalData = withdrawalSnap.data();
      if (withdrawalData && withdrawalData.status !== 'pending' && withdrawalData.status !== undefined && withdrawalData.status !== '') {
        alert(`This withdrawal is already processed (current status: ${withdrawalData.status}).`);
        setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: withdrawalData.status } : w));
        return;
      }

      const targetEmail = (userId || '').trim().toLowerCase();
      // 1. Mark status as 'rejected'
      await updateDoc(withdrawalRef, { status: 'rejected' });
      
      // 2. Refund balance to the user
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(amount) });
          
          setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
          // Sync local users list too if user is listed
          setUsers(users.map(u => u.email?.toLowerCase() === targetEmail ? { ...u, balance: (u.balance || 0) + amount } : u));

          await logAction('REJECT_WITHDRAWAL', userDoc.id, targetEmail, `Admin rejected withdrawal of ₦${amount.toLocaleString('en-NG')} (refunded to balance)`, 'WARNING');
          
          alert(`Withdrawal request rejected. Fund amount of ₦ ${amount.toLocaleString('en-NG')} has been refunded to the user's balance.`);
      } else {
          setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
          alert(`Withdrawal request rejected, but warning: User of email (${targetEmail}) was not found in the users database. Refund update skipped.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject withdrawal request and refund.');
    } finally {
      setProcessingIds(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const deleteWithdrawal = async (id: string) => {
    if (!window.confirm('Are you certain you want to delete this withdrawal request? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'withdrawals', id));
      setWithdrawals(withdrawals.filter(w => w.id !== id));
      alert('Withdrawal request deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete withdrawal request.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you absolute sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const targetEmail = users.find(u => u.id === id)?.email || 'unknown';
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(user => user.id !== id));
      await logAction('DELETE_USER', id, targetEmail, `Admin deleted user heavily: ${targetEmail}`, 'CRITICAL');
      alert('User deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  const initializeAdminAccount = async () => {
    try {
      if (!auth.currentUser) {
        alert("You must be logged in to initialize the admin account.");
        return;
      }
      const adminEmail = 'danlamimathias2025@gmail.com';
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        email: adminEmail,
        userName: 'Admin',
        fullName: 'System Administrator',
        balance: 1000000000,
        role: 'admin',
        createdAt: serverTimestamp()
      }, { merge: true });
      await logAction('INITIALIZE_ADMIN', auth.currentUser.uid, adminEmail, `Master admin account initialized by ${auth.currentUser.email}`, 'WARNING');
      alert("Admin account initialized successfully! You can now edit it in the users list.");
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to initialize admin account.");
    }
  };

  const purgeAllNonAdminUsers = async () => {
    const adminEmail = 'danlamimathias2025@gmail.com';
    const nonAdminUsers = users.filter(user => (user.email || '').trim().toLowerCase() !== adminEmail);

    if (nonAdminUsers.length === 0) {
      alert('There are no registered users in the database to purge.');
      return;
    }

    const doubleConfirmed = window.confirm(
      `⚠️ ALERT - CRITICAL MAINTENANCE ACTION:\n\nYou are about to DELETE all ${nonAdminUsers.length} user accounts from the database except the master admin account (${adminEmail}).\n\nThis is irreversible and will fully reset their balances and subscriptions. Are you absolutely certain?`
    );
    if (!doubleConfirmed) return;

    setIsPurging(true);
    let successCount = 0;
    let failCount = 0;

    for (const u of nonAdminUsers) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
        successCount++;
      } catch (err) {
        console.error(`Failed to delete user doc: ${u.id}`, err);
        failCount++;
      }
    }

    alert(`Purge completed successfully!\n\nDeleted: ${successCount} user accounts.\nFailed: ${failCount} accounts.`);
    setIsPurging(false);
    
    await logAction('PURGE_USERS', 'all_non_admin', 'multiple', `System purge executed. Successfully deleted: ${successCount}, Failed: ${failCount}`, 'CRITICAL');
    
    await fetchData();
  };

  const openEditUserModal = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      userName: user.userName || '',
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      balance: user.balance || 0,
      bankName: user.bankName || '',
      accountName: user.accountName || '',
      accountNumber: user.accountNumber || ''
    });
  };

  const handleSaveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSavingUser(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const sanitizedBalanceStr = String(editForm.balance).replace(/[^0-9.-]/g, '');
      const parsedBalance = parseFloat(sanitizedBalanceStr) || 0;
      const updatedFields = {
        userName: editForm.userName,
        fullName: editForm.fullName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        balance: parsedBalance,
        bankName: editForm.bankName,
        accountName: editForm.accountName,
        accountNumber: editForm.accountNumber
      };

      await updateDoc(userRef, updatedFields);
      
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedFields } : u));
      
      await logAction('UPDATE_USER', selectedUser.id, selectedUser.email, `Admin updated user details/balance. New balance: ₦${parsedBalance.toLocaleString('en-NG')}`, 'WARNING');
      
      alert('User account details updated successfully!');
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingNotif(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        target: notificationForm.target.trim().toLowerCase(),
        createdAt: serverTimestamp()
      });
      alert('Notification sent successfully!');
      setNotificationForm({ title: '', message: '', type: 'system', target: 'all' });
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification. Please try again.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'system_config', 'deposit'), {
        paymentLink: paymentLinkInput.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Settings updated successfully! Users opening the deposit modal will now see your new payment link.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen pb-24" id="admin-panel-root">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4" id="admin-header-section">
        <div className="flex items-center gap-3">
          <div className="h-14 sm:h-16 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
            <img src={DANGOTE_ASSETS.logo} alt="Dangote Petroleum Refinery Logo" className="h-full w-auto object-contain max-w-[150px]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Admin</span>
              Shareholder IPO Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Manage investors, share allotments, deposits, withdrawals, and gateway payment settings</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex rounded-xl bg-slate-200/50 p-1 mb-6 border border-slate-200/30 overflow-x-auto max-w-4xl" id="admin-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-users-btn"
        >
          <UsersIcon size={15} />
          Investors ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('shares')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'shares' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-shares-btn"
        >
          <Coins size={15} className="text-amber-500" />
          Share Allotments ({allInvestments.length})
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'deposits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-deposits-btn"
        >
          <ArrowDownCircle size={15} />
          Deposits ({deposits.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-withdrawals-btn"
        >
          <CreditCard size={15} />
          Withdrawals ({withdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-settings-btn"
        >
          <Settings size={15} />
          IPO Gateway Settings
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-notifications-btn"
        >
          <Bell size={15} />
          Broadcasts
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-audit-btn"
        >
          <ClipboardList size={15} />
          Audit ({auditLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            id="panel-users-section"
          >
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm mb-4" id="admin-init-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                  <Lock className="text-indigo-600" size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-900">Initialize Admin Account</h4>
                  <p className="text-xs text-indigo-800 leading-relaxed mt-0.5">
                    Add the master admin account (<span className="font-mono">danlamimathias2025@gmail.com</span>) to the database to enable balance overrides.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={initializeAdminAccount}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition flex items-center gap-1.5 shadow-sm shadow-indigo-900/15"
              >
                Add Admin Account
              </button>
            </div>

            {users.length === 0 ? (
              <EmptyState title="No Registered Users" message="There are currently no registered users in your database." />
            ) : (
              <>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="admin-purge-card">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 className="text-rose-600" size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-rose-900">Database Purge Workspace</h4>
                      <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                        Instantly purge all user accounts from the database, except the primary administrator account (<span className="font-mono">danlamimathias2025@gmail.com</span>).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={purgeAllNonAdminUsers}
                    disabled={isPurging}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition flex items-center gap-1.5 shadow-sm shadow-rose-900/15"
                  >
                    {isPurging ? 'Purging Accounts...' : 'Purge Non-Admin Users'}
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="users-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                        <th className="p-4">User Identity</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">Balance</th>
                        <th className="p-4">Bank Details</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                {(user.userName || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">{user.userName || 'No Username'}</p>
                                <p className="text-xs text-slate-400 font-mono select-all">{(user.id || '').slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="font-medium text-slate-800">{user.email}</p>
                              <p className="text-xs text-slate-400 font-mono">{user.phoneNumber || 'No phone'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs">
                              ₦ {(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-4">
                            {user.bankName ? (
                              <div className="text-xs space-y-0.5 text-slate-600">
                                <p className="font-semibold">{user.bankName}</p>
                                <p>{user.accountNumber} • <span className="text-slate-400">{user.accountName}</span></p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not Provided</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
                                title="Edit user account"
                                id={`edit-user-${user.id}`}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 border border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                title="Delete user"
                                id={`delete-user-${user.id}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'deposits' && (
          <motion.div
            key="deposits-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            id="panel-deposits-section"
          >
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex gap-1 text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setDepositFilter(f)}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                      depositFilter === f
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f} ({
                      f === 'all' ? deposits.length :
                      deposits.filter(d => (d.status || 'pending') === f).length
                    })
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Admin approval updates investor wallet balance in real-time
              </span>
            </div>

            {deposits.length === 0 ? (
              <EmptyState title="No Deposit Logs" message="There are currently no logged deposit claims in the database." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="deposits-table-container">
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                        <th className="p-4">Investor Identity</th>
                        <th className="p-4">Deposit Amount</th>
                        <th className="p-4">Timestamp & Method</th>
                        <th className="p-4">Review Status</th>
                        <th className="p-4">Receipt Slip</th>
                        <th className="p-4 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {deposits
                        .filter(d => depositFilter === 'all' ? true : (d.status || 'pending') === depositFilter)
                        .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{d.userId || d.email}</p>
                              {d.depositorName && (
                                <p className="text-xs text-slate-500">{d.depositorName}</p>
                              )}
                              {d.reference && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {d.reference}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              ₦ {(d.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            <div className="space-y-0.5">
                              <p className="font-mono">{d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                              <span className="inline-block px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600 font-semibold">{d.paymentMethod || 'Paystack'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                              d.status === 'approved' ? 'bg-green-100 text-green-700' :
                              d.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {d.status === 'approved' && <CheckCircle2 size={12} />}
                              {d.status === 'rejected' && <XCircle size={12} />}
                              {d.status === 'pending' && <Clock size={12} />}
                              <span className="capitalize">{d.status || 'pending'}</span>
                            </span>
                            {d.rejectionReason && (
                              <p className="text-[10px] text-red-500 mt-1 max-w-xs">{d.rejectionReason}</p>
                            )}
                          </td>
                          <td className="p-4">
                            {d.receiptUrl ? (
                              <button 
                                onClick={() => setSelectedDepositForReview(d)}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition"
                                id={`view-receipt-btn-${d.id}`}
                              >
                                <Eye size={12} />
                                Inspect Slip
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No Upload</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {d.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => approveDeposit(d.id, d.userId, d.amount)}
                                  disabled={processingIds[d.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 ${processingIds[d.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                  id={`approve-deposit-${d.id}`}
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectDeposit(d.id)}
                                  disabled={processingIds[d.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 ${processingIds[d.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                  id={`reject-deposit-${d.id}`}
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                                <button
                                  onClick={() => deleteDeposit(d.id)}
                                  disabled={processingIds[d.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-2 py-1.5 rounded-lg shadow-sm transition ${processingIds[d.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400 font-semibold px-2 capitalize">{d.status}</span>
                                <button
                                  onClick={() => deleteDeposit(d.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'withdrawals' && (
          <motion.div
            key="withdrawals-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {withdrawals.length === 0 ? (
              <EmptyState title="No Withdrawal Requests" message="There are currently no withdrawal requests in the database." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                        <th className="p-4">User Email</th>
                        <th className="p-4">Amount (NGN)</th>
                        <th className="p-4">Bank Name</th>
                        <th className="p-4">Account Number</th>
                        <th className="p-4">Account Name</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4 font-semibold text-slate-900">{w.userId}</td>
                          <td className="p-4 font-bold font-mono text-slate-950">
                            ₦ {w.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{w.bankName}</td>
                          <td className="p-4 text-slate-600 font-mono">{w.accountNumber}</td>
                          <td className="p-4 text-slate-500">{w.accountName}</td>
                          <td className="p-4 text-xs text-slate-500 font-mono">
                            {w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                              w.status === 'approved' ? 'bg-green-105 text-green-700 bg-green-100' :
                              w.status === 'rejected' ? 'bg-red-105 text-red-700 bg-red-100' :
                              'bg-amber-105 text-amber-700 bg-amber-100'
                            }`}>
                              <span className="capitalize">{w.status || 'pending'}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {(w.status || 'pending') === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => approveWithdrawal(w.id)}
                                  disabled={processingIds[w.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition ${processingIds[w.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectWithdrawal(w.id, w.userId, w.amount)}
                                  disabled={processingIds[w.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm transition ${processingIds[w.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                >
                                  <XCircle size={14} />
                                  Reject & Refund
                                </button>
                                <button
                                  onClick={() => deleteWithdrawal(w.id)}
                                  disabled={processingIds[w.id]}
                                  className={`flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm transition ${processingIds[w.id] ? 'opacity-55 cursor-not-allowed' : ''}`}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400 font-semibold px-2">Completed</span>
                                <button
                                  onClick={() => deleteWithdrawal(w.id)}
                                  className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-2xl"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Bell className="text-indigo-600" />
                Broadcast Notification
              </h3>
              <p className="text-sm text-slate-500 mb-6">Send important updates, system maintenance messages, or targeted alerts to users. Notifications will appear instantly in their dashboard.</p>
              
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notification Title</label>
                    <input 
                      type="text" 
                      required
                      value={notificationForm.title} 
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})} 
                      placeholder="e.g. System Update, Coming Soon"
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notification Type</label>
                    <select 
                      value={notificationForm.type} 
                      onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})} 
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500"
                    >
                      <option value="system">System / General</option>
                      <option value="update">Product Update / Coming Soon</option>
                      <option value="admin">Direct Message from Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Audience</label>
                  <input 
                    type="text" 
                    required
                    value={notificationForm.target} 
                    onChange={(e) => setNotificationForm({...notificationForm, target: e.target.value})} 
                    placeholder="'all' for everyone, or a specific user's email address"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave as "all" to broadcast to every user, or type an exact email address.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message Content</label>
                  <textarea 
                    required
                    rows={4}
                    value={notificationForm.message} 
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})} 
                    placeholder="Enter the main body of the notification here..."
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 resize-y"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSendingNotif}
                    className="flex justify-center items-center gap-2 py-3 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-sm transition disabled:opacity-50"
                  >
                    {isSendingNotif ? 'Sending Broadcast...' : 'Broadcast Notification'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div
            key="audit-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            id="panel-audit-section"
          >
            {auditLogs.length === 0 ? (
              <EmptyState title="No Audit Logs" message="There are no system actions recorded yet." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="audit-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                        <th className="p-4">Action</th>
                        <th className="p-4">Admin Email</th>
                        <th className="p-4">Target Details</th>
                        <th className="p-4">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                log.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                                log.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}>
                                {log.severity || 'INFO'}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{log.action}</span>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="font-mono text-slate-500 text-xs">{log.adminEmail}</span>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-900 font-medium">{log.details}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Target ID: {log.targetUserId || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                            {log.timestamp?.seconds 
                              ? new Date(log.timestamp.seconds * 1000).toLocaleString('en-GB') 
                              : 'Pending...'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SHARES / ALLOTMENTS PANEL */}
        {activeTab === 'shares' && (
          <motion.div
            key="shares-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            id="panel-shares-section"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Shares Issued</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {allInvestments.reduce((sum, i) => sum + (i.sharesCount || 0), 0).toLocaleString()} Units
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Capital Allocated</span>
                <span className="text-xl font-black text-emerald-600 font-mono">
                  ₦ {allInvestments.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString('en-NG')}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Allotment Lots</span>
                <span className="text-xl font-black text-amber-600 font-mono">
                  {allInvestments.filter(i => i.status === 'active').length} of {allInvestments.length}
                </span>
              </div>
            </div>

            {allInvestments.length === 0 ? (
              <EmptyState title="No Shares Issued Yet" message="No shareholders have purchased Dangote Refinery IPO shares yet." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Registered Share Allotments</h3>
                  <span className="text-xs text-slate-500">{allInvestments.length} Records</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {allInvestments.map((inv) => (
                    <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{inv.productName || 'Share Allotment'}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            inv.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {inv.status || 'Active'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span>Investor: <strong className="text-slate-800">{inv.userId}</strong></span>
                          <span>·</span>
                          <span>Cert: <strong className="font-mono text-slate-800">#{inv.certificateNumber || inv.id.slice(0, 8)}</strong></span>
                          <span>·</span>
                          <span>Units: <strong className="font-mono text-amber-600">{(inv.sharesCount || Math.floor((inv.amount || 0) / (inv.sharePrice || 525))).toLocaleString()} Shares</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Value</span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ₦ {(inv.amount || 0).toLocaleString('en-NG')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SETTINGS PANEL (PAYMENT LINK & CONFIG) */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-2xl"
            id="panel-settings-section"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Deposit & Payment Gateway Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the active payment gateway link for investor deposits. Once updated here, all users clicking "Proceed to Online Checkout" will be directed to this link.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deposit Payment Gateway URL (Paystack / Moniepoint / Checkout)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={paymentLinkInput}
                      onChange={(e) => setPaymentLinkInput(e.target.value)}
                      placeholder="https://paystack.shop/pay/your-link"
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                    {paymentLinkInput && (
                      <a
                        href={paymentLinkInput}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Test Link"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    When you receive your live payment link, paste it here and click Save.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current IPO Offer Price (NGN)
                    </label>
                    <input
                      type="number"
                      value={ipoPriceInput}
                      onChange={(e) => setIpoPriceInput(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:border-red-500 outline-none font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Baseline offer price per share</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Refinery Capacity Benchmark
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="650,000 Barrels / Day"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-xs font-mono text-slate-600 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Lekki Free Zone, Lagos State</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md active:scale-95 flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>{isSavingConfig ? 'Saving Settings...' : 'Save Payment & Portal Settings'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[100] overflow-y-auto w-full h-full" id="edit-user-modal">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 min-h-screen flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h3 className="text-base font-bold">Edit Registered Member Account</h3>
                  <p className="text-xs text-slate-400">UID: <span className="font-mono">{selectedUser.id}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 p-2 focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveUserChanges} className="p-6 space-y-6 flex-1 pb-24">
                {/* Section 1: Identities */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                    <UserIcon size={12} />
                    Personal Representation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.userName} 
                        onChange={(e) => setEditForm({...editForm, userName: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.fullName} 
                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email Account</label>
                      <input 
                        type="email" 
                        required
                        value={editForm.email} 
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.phoneNumber} 
                        onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-mono font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Balance */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                    <CreditCard size={12} />
                    Account Valuation
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Account Balance (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">₦</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={editForm.balance} 
                        onChange={(e) => setEditForm({...editForm, balance: parseFloat(e.target.value) || 0})} 
                        className="w-full border border-slate-200 pl-8 pr-4 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-bold font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">This directly overrides the user's spendable asset wallet balance in real-time.</p>
                  </div>
                </div>

                {/* Section 3: Bank details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                    <Building size={12} />
                    Banking Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                      <input 
                        type="text" 
                        value={editForm.bankName} 
                        onChange={(e) => setEditForm({...editForm, bankName: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Account Name</label>
                      <input 
                        type="text" 
                        value={editForm.accountName} 
                        onChange={(e) => setEditForm({...editForm, accountName: e.target.value})} 
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Account Number</label>
                    <input 
                      type="text" 
                      value={editForm.accountNumber} 
                      onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})} 
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-indigo-500 font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    disabled={isSavingUser}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold bg-white text-slate-700 hover:bg-slate-100 transition text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingUser}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-sm transition flex items-center justify-center gap-1"
                  >
                    {isSavingUser ? 'Saving Changes...' : 'Save Member Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Deposit Inspection & Judgment Review Modal */}
      <AnimatePresence>
        {selectedDepositForReview && (
          <div className="fixed inset-0 bg-slate-900/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm" id="deposit-review-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    Admin Review
                  </span>
                  <h3 className="font-bold text-sm text-white">Deposit Receipt Judgment</h3>
                </div>
                <button
                  onClick={() => setSelectedDepositForReview(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-slate-800 text-xs">
                {/* Receipt Image */}
                <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex items-center justify-center relative group">
                  {selectedDepositForReview.receiptUrl ? (
                    <img
                      src={selectedDepositForReview.receiptUrl}
                      alt="Deposit Receipt"
                      className="max-h-64 max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      No receipt image uploaded
                    </div>
                  )}
                  {selectedDepositForReview.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptUrl(selectedDepositForReview.receiptUrl)}
                      className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 shadow flex items-center gap-1 hover:bg-black transition"
                    >
                      <Eye size={12} />
                      Full Screen Zoom
                    </button>
                  )}
                </div>

                {/* Claim Information Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Claimant Account</span>
                    <span className="font-bold text-slate-900 text-xs break-all block">
                      {selectedDepositForReview.userId || selectedDepositForReview.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Depositor Name</span>
                    <span className="font-semibold text-slate-800 text-xs block">
                      {selectedDepositForReview.depositorName || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Deposit Claim Amount</span>
                    <span className="font-mono font-black text-emerald-600 text-base block">
                      ₦ {(selectedDepositForReview.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Review Status</span>
                    <span className={`inline-flex items-center gap-1 font-bold text-xs uppercase px-2 py-0.5 rounded-full ${
                      selectedDepositForReview.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      selectedDepositForReview.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedDepositForReview.status || 'pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Gateway</span>
                    <span className="font-medium text-slate-700 text-xs">
                      {selectedDepositForReview.paymentMethod || 'Paystack Official'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference / Narration</span>
                    <span className="font-mono text-slate-700 text-xs">
                      {selectedDepositForReview.reference || 'None provided'}
                    </span>
                  </div>
                </div>

                {selectedDepositForReview.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700">
                    <strong>Rejection Reason:</strong> {selectedDepositForReview.rejectionReason}
                  </div>
                )}
              </div>

              {/* Judgment Action Buttons */}
              <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDepositForReview(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition text-xs"
                >
                  Close
                </button>

                {selectedDepositForReview.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingIds[selectedDepositForReview.id]}
                      onClick={() => rejectDeposit(selectedDepositForReview.id)}
                      className="px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold transition text-xs border border-red-200 flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      Reject Deposit
                    </button>
                    <button
                      type="button"
                      disabled={processingIds[selectedDepositForReview.id]}
                      onClick={() => approveDeposit(
                        selectedDepositForReview.id, 
                        selectedDepositForReview.userId, 
                        selectedDepositForReview.amount
                      )}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1"
                    >
                      <Check size={14} />
                      Accept & Credit ₦{(selectedDepositForReview.amount || 0).toLocaleString('en-NG')}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">
                    This request has been resolved as <strong className="capitalize text-slate-800">{selectedDepositForReview.status}</strong>.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slideout Full Screen/Click Zoom Receipt Viewer */}
      <AnimatePresence>
        {selectedReceiptUrl && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" id="receipt-lightbox">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center gap-4"
            >
              {/* Image Container with maximum height & rounded elements */}
              <div className="relative border border-slate-750 rounded-2xl overflow-hidden bg-black/50 p-2 shadow-2xl flex items-center justify-center">
                <img 
                  src={selectedReceiptUrl} 
                  alt="Receipt Log Lightbox View" 
                  className="max-h-[75vh] max-w-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Close Button overlay */}
              <button 
                onClick={() => setSelectedReceiptUrl(null)}
                className="bg-white text-slate-900 p-3 rounded-full hover:bg-slate-200 transition font-bold text-sm shadow-xl flex items-center gap-1.5"
                id="close-lightbox-btn"
              >
                <X size={16} />
                Dismiss Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
