import React, { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { getDocs, doc, deleteDoc, updateDoc, query, collection, where, addDoc, serverTimestamp, increment } from 'firebase/firestore';
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
  Bell
} from 'lucide-react';
import EmptyState from './EmptyState';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'notifications'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveDeposit = async (id: string, userId: string, amount: number) => {
    try {
      const targetEmail = (userId || '').trim().toLowerCase();
      // 1. Update deposit status to approved
      await updateDoc(doc(db, 'deposits', id), { status: 'approved' });
      
      // 2. Increase user balance
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(amount) });
          
          setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'approved' } : d));
          // Sync local users list too
          setUsers(users.map(u => u.email?.toLowerCase() === targetEmail ? { ...u, balance: (u.balance || 0) + amount } : u));
          
          alert('Deposit approved successfully. User balance has been credited.');
      } else {
          setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'approved' } : d));
          alert(`Deposit request approved successfully, but warning: User of email (${targetEmail}) was not found in the users database. Balance update skipped.`);
      }
      
      setSelectedDepositForReview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to approve deposit.');
    }
  };

  const rejectDeposit = async (id: string) => {
    try {
      // Update deposit status to rejected - balance is not modified
      await updateDoc(doc(db, 'deposits', id), { status: 'rejected' });
      setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
      alert('Deposit request has been rejected.');
      setSelectedDepositForReview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to reject deposit.');
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
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'approved' });
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'approved' } : w));
      alert('Withdrawal request approved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to approve withdrawal.');
    }
  };

  const rejectWithdrawal = async (id: string, userId: string, amount: number) => {
    try {
      const targetEmail = (userId || '').trim().toLowerCase();
      // 1. Mark status as 'rejected'
      await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected' });
      
      // 2. Refund balance to the user
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { balance: increment(amount) });
          
          setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
          // Sync local users list too if user is listed
          setUsers(users.map(u => u.email?.toLowerCase() === targetEmail ? { ...u, balance: (u.balance || 0) + amount } : u));
          
          alert(`Withdrawal request rejected. Fund amount of ₦ ${amount.toLocaleString('en-NG')} has been refunded to the user's balance.`);
      } else {
          setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
          alert(`Withdrawal request rejected, but warning: User of email (${targetEmail}) was not found in the users database. Refund update skipped.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject withdrawal request and refund.');
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
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(user => user.id !== id));
      alert('User deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
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
      const parsedBalance = parseFloat(editForm.balance as any) || 0;
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

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen pb-24" id="admin-panel-root">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4" id="admin-header-section">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg text-xs font-bold uppercase tracking-widest">Admin</span>
            Control Workspace
          </h2>
          <p className="text-sm text-slate-500">Manage user accounts, transaction receipts, broadcasts, and live support channels</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex rounded-xl bg-slate-200/50 p-1 mb-6 border border-slate-200/30 overflow-x-auto max-w-3xl" id="admin-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-users-btn"
        >
          <UsersIcon size={16} />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'deposits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-deposits-btn"
        >
          <ArrowDownCircle size={16} />
          Deposits ({deposits.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-withdrawals-btn"
        >
          <CreditCard size={16} />
          Withdrawals ({withdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition duration-200 whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-notifications-btn"
        >
          <Bell size={16} />
          Broadcasts
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
            {deposits.length === 0 ? (
              <EmptyState title="No Deposit Logs" message="There are currently no logged deposit claims in the database." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="deposits-table-container">
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider">
                        <th className="p-4">Sender Email</th>
                        <th className="p-4">Fund Amount</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Verify Status</th>
                        <th className="p-4">Receipt Slip</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {deposits.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4 font-medium text-slate-900">{d.userId}</td>
                          <td className="p-4">
                            <span className="font-extrabold text-slate-900 font-mono">${d.amount?.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-xs text-slate-500 font-mono">
                            {d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
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
                              <span className="capitalize">{d.status}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            {d.receiptUrl ? (
                              <button 
                                onClick={() => setSelectedReceiptUrl(d.receiptUrl)}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg"
                                id={`view-receipt-btn-${d.id}`}
                              >
                                <Eye size={12} />
                                View Receipt
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
                                  className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
                                  id={`approve-deposit-${d.id}`}
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectDeposit(d.id)}
                                  className="flex items-center gap-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm"
                                  id={`reject-deposit-${d.id}`}
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                                <button
                                  onClick={() => deleteDeposit(d.id)}
                                  className="flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400 font-semibold px-2">Completed</span>
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
                                  className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectWithdrawal(w.id, w.userId, w.amount)}
                                  className="flex items-center gap-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm"
                                >
                                  <XCircle size={14} />
                                  Reject & Refund
                                </button>
                                <button
                                  onClick={() => deleteWithdrawal(w.id)}
                                  className="flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm"
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

      </AnimatePresence>

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" id="edit-user-modal">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold">Edit Registered Member Account</h3>
                  <p className="text-xs text-slate-400">UID: <span className="font-mono">{selectedUser.id}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveUserChanges} className="flex-1 overflow-y-auto p-6 space-y-5">
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
