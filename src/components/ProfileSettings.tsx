import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { signOut, updatePassword } from 'firebase/auth';
import { 
  User, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  Shield, 
  ArrowLeft, 
  UploadCloud, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  Landmark, 
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Lock,
  Coins,
  Smartphone,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const banks = [
  "Access Bank", "Zenith Bank", "GTBank", "First Bank", "UBA", "Sterling Bank",
  "OPay", "Palmpay", "Moniepoint", "FCMB", "Wema Bank", "Fidelity Bank", 
  "Fairmoney", "Tenn", "Union Bank", "Stanbic IBTC", "Polaris Bank", 
  "Keystone Bank", "Heritage Bank", "Unity Bank", "Citibank", "Providus Bank", 
  "Titan Trust Bank", "Globus Bank"
];

export default function ProfileSettings({ onStartTour }: { onStartTour?: () => void }) {
  const [activeView, setActiveView] = useState<'profile' | 'deposit' | 'withdraw'>('profile');
  const [userData, setUserData] = useState({
    userName: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    balance: 0,
    email: '',
    fullName: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(true);
  
  // PWA Support States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initial check for standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install choice processed outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Elegant step-by-step guides for custom setups or Apple user agents
      alert(
        "📱 OneFundz Companion App Setup Guide\n\n" +
        "1. Open OneFundz inside Google Chrome or Apple Safari.\n" +
        "2. Tap the 'Share' button (Safari) or the 'Menu' dots icon (Chrome).\n" +
        "3. Select 'Add to Home Screen' or 'Install App' from the listed options.\n\n" +
        "Enjoy rapid 1-tap launcher access, smooth full-screen views, and lightning-fast loading."
      );
    }
  };
  
  // Accordions inside Profile Settings
  const [isBankInfoOpen, setIsBankInfoOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [securityData, setSecurityData] = useState({ newUsername: '', newPassword: '', confirmPassword: '' });

  // Deposit Form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReceiptUrl, setDepositReceiptUrl] = useState('');
  const [isReceiptDropdownOpen, setIsReceiptDropdownOpen] = useState(true);
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);
  const [draggingReceipt, setDraggingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Payment Confirmation Explicit Step Checkbox
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Withdrawal Form State
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawalSubmitting, setIsWithdrawalSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<'primary' | null>(null);
  
  // In-app interactive Withdrawal Confirmation Modal state (prevents iframe blockers)
  const [showWithdrawCheckOverlay, setShowWithdrawCheckOverlay] = useState(false);
  
  // In-app interactive Logout Confirmation Modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Subscribe dynamically so balance reflects instantly
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(prev => ({
          ...prev,
          userName: data.userName || '',
          bankName: data.bankName || '',
          accountName: data.accountName || '',
          accountNumber: data.accountNumber || '',
          balance: data.balance || 0,
          email: data.email || auth.currentUser?.email || '',
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || ''
        }));
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore user sub error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (userData.bankName && userData.accountNumber) {
      setSelectedAccount('primary');
    } else {
      setSelectedAccount(null);
    }
  }, [userData.bankName, userData.accountNumber]);

  // Handle core profile changes
  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        userName: userData.userName,
        bankName: userData.bankName,
        accountName: userData.accountName,
        accountNumber: userData.accountNumber
      });
      alert('Profile details successfully updated!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile.');
    }
  };

  const handleSecurityUpdate = async () => {
    if (!auth.currentUser) return;
    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      if (securityData.newPassword) {
          await updatePassword(auth.currentUser, securityData.newPassword);
      }
      if (securityData.newUsername) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(docRef, { userName: securityData.newUsername });
          setUserData(prev => ({ ...prev, userName: securityData.newUsername }));
      }
      alert('Security settings updated successfully!');
      setSecurityData({ newUsername: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to update security credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  // Deposit Actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 850;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setDepositReceiptUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDepositSubmit = async () => {
    if (!auth.currentUser || !auth.currentUser.email || !depositAmount || !depositReceiptUrl) return;
    
    const amtFloat = parseFloat(depositAmount);
    if (isNaN(amtFloat) || amtFloat <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    if (!paymentConfirmed) {
      alert('Please confirm that you completed the Paystack transaction by checking the payment verification box.');
      return;
    }

    setIsDepositSubmitting(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: auth.currentUser.email,
        amount: amtFloat,
        receiptUrl: depositReceiptUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Deposit submitted successfully! It will be reviewed and approved by administrators within a short timeframe.');
      
      // Reset form and return
      setDepositAmount('');
      setDepositReceiptUrl('');
      setPaymentConfirmed(false);
      setActiveView('profile');
    } catch (error) {
      console.error(error);
      alert('Error logging deposit request. Please try again.');
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  // Withdrawal Validation & Flow
  const openWithdrawalPreview = () => {
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (amt < 5000) {
      alert('Minimum withdrawal amount is ₦ 5,000.00.');
      return;
    }

    if (userData.balance < amt) {
      alert(`Insufficient funds. Your current wallet balance is ₦ ${userData.balance.toLocaleString('en-NG')} but you requested ₦ ${amt.toLocaleString('en-NG')}.`);
      return;
    }

    if (!selectedAccount) {
      alert('Please select or configure your primary Saved Bank Account first.');
      return;
    }

    if (!userData.bankName || !userData.accountNumber || !userData.accountName) {
      alert('Your Bank settlement details are incomplete. Please configure them inside Bank Information.');
      return;
    }

    // Launch beautiful check overlay modal (100% bypasses sandbox confirmation triggers)
    setShowWithdrawCheckOverlay(true);
  };

  const handleWithdrawalSubmitReal = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const amt = parseFloat(withdrawalAmount);

    setIsWithdrawalSubmitting(true);
    try {
      // 1. Deduct immediately from database profile balance
      const newBalance = (userData.balance || 0) - amt;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: newBalance
      });

      // 2. Log withdrawal record
      await addDoc(collection(db, 'withdrawals'), {
        userId: auth.currentUser.email,
        amount: amt,
        bankName: userData.bankName,
        accountName: userData.accountName,
        accountNumber: userData.accountNumber,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert(`Withdrawal request of ₦ ${amt.toLocaleString('en-NG')} submitted! Your claim status is now pending review.`);
      
      setWithdrawalAmount('');
      setShowWithdrawCheckOverlay(false);
      setActiveView('profile');
    } catch (err) {
      console.error(err);
      alert('Failed to process settlement withdrawal. Please try again.');
    } finally {
      setIsWithdrawalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-purple-200 bg-purple-950 min-h-screen flex items-center justify-center font-bold">
        <Loader2 className="animate-spin text-purple-400 mr-2" />
        Synchronizing Mine Account Hub...
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-tr from-purple-950 via-purple-900 to-indigo-950 min-h-screen text-white pb-24 font-sans selection:bg-purple-600 block">
      
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* VIEW 1: GENERAL PROFILE HUB SCREEN                       */}
        {/* ========================================================= */}
        {activeView === 'profile' && (
          <motion.div
            key="profile-main"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            id="mine-profile-main-view"
            className="space-y-6"
          >
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">Mine Profile</h2>
                <p className="text-[10px] text-purple-300 font-medium tracking-wide uppercase">Member Account Dashboard</p>
              </div>
              <span className="bg-purple-800/40 border border-purple-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold text-purple-200 uppercase flex items-center gap-1.5 shadow-sm">
                <Sparkles size={11} className="text-purple-300" /> Member Hub
              </span>
            </div>

            {/* User Card Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center relative shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <Coins size={96} className="text-white" />
              </div>

              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-full flex items-center justify-center mb-3 relative shadow-inner border border-purple-300/20"
              >
                <User size={38} className="text-white" />
                <div className="absolute bottom-0 right-0 p-1 bg-purple-900 rounded-full border border-purple-500/30">
                  <Camera size={12} className="text-purple-300" />
                </div>
              </motion.div>
              
              <h3 className="font-extrabold text-lg text-white mb-0.5">{userData.userName || 'ONEFUNDZ Member'}</h3>
              <p className="text-[11px] text-purple-200 opacity-80 font-mono mb-4">{userData.email}</p>

              {/* Real-time Dynamic Portfolio Cash balance indicator */}
              <div className="bg-purple-950/50 rounded-xl p-4 border border-purple-800/40 w-full text-center mt-2 shadow-inner">
                <span className="text-[9px] font-bold tracking-wider text-purple-300 uppercase block mb-1">Available Portfolio Balance</span>
                <p className="text-xl font-extrabold text-white">₦ {userData.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Embedded Bento Grid Deposit & Withdrawal Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setActiveView('deposit')}
                className="bg-gradient-to-b from-purple-850 to-purple-900 hover:from-purple-800 hover:to-purple-850 p-4 rounded-xl shadow-lg border border-purple-850 flex flex-col items-center justify-center gap-2 transition active:scale-95"
                id="profile-fast-deposit-btn"
              >
                <div className="w-10 h-10 rounded-full bg-purple-700/50 flex flex-col items-center justify-center text-white border border-purple-600/40 shadow-sm">
                  <ArrowDownLeft size={18} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs block text-white">Deposit NGN</span>
                  <span className="text-[9px] text-purple-300 block">Invest Funds</span>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => setActiveView('withdraw')}
                className="bg-gradient-to-b from-purple-850 to-purple-900 hover:from-purple-800 hover:to-purple-850 p-4 rounded-xl shadow-lg border border-purple-850 flex flex-col items-center justify-center gap-2 transition active:scale-95"
                id="profile-fast-withdraw-btn"
              >
                <div className="w-10 h-10 rounded-full bg-purple-700/50 flex flex-col items-center justify-center text-white border border-purple-600/40 shadow-sm">
                  <ArrowUpRight size={18} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs block text-white">Withdraw NGN</span>
                  <span className="text-[9px] text-purple-300 block">Fast Settlement</span>
                </div>
              </button>
            </div>

            {/* Profile Forms / Settings */}
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10 shadow-sm space-y-4">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Modify Member Profile</span>
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">Username / Identifier</label>
                    <input 
                      type="text" 
                      value={userData.userName} 
                      onChange={(e) => setUserData({...userData, userName: e.target.value})} 
                      className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs bg-slate-50 text-white placeholder-purple-400/50 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none" 
                      placeholder="Username for payouts" 
                    />
                  </div>
                  <button 
                    onClick={handleUpdate} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold shadow-md active:scale-98 transition text-xs"
                  >
                    Update Account Profile
                  </button>
                </div>
              </div>

              {/* Accordion: Bank Information  */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setIsBankInfoOpen(!isBankInfoOpen)}
                  className="w-full p-4 flex justify-between items-center text-left font-bold text-xs text-white"
                  id="settings-bank-accordion-toggle"
                >
                  <span className="flex items-center gap-2 text-purple-200">
                    <Landmark size={15} />
                    Bank Settlement details
                  </span>
                  {isBankInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                <AnimatePresence>
                  {isBankInfoOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 space-y-4"
                    >
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">Select Bank</label>
                          <select 
                            value={userData.bankName} 
                            onChange={(e) => setUserData({...userData, bankName: e.target.value})} 
                            className="w-full bg-purple-950 border border-purple-850 p-3 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="" className="bg-purple-950 text-white">Select Bank</option>
                            {banks.map(bank => (
                              <option key={bank} value={bank} className="bg-purple-950 text-white">{bank}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">Account Name</label>
                          <input 
                            type="text" 
                            value={userData.accountName} 
                            onChange={(e) => setUserData({...userData, accountName: e.target.value})} 
                            className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none" 
                            placeholder="Account Name" 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">Account Number (10 Digits)</label>
                          <input 
                            type="text" 
                            value={userData.accountNumber} 
                            onChange={(e) => setUserData({...userData, accountNumber: e.target.value})} 
                            className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-white uppercase focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono" 
                            placeholder="e.g. 0123456789" 
                          />
                        </div>

                        <button 
                          onClick={handleUpdate} 
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold shadow-md transition text-xs"
                        >
                          Save Bank Settlement Credentials
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion: Security Password settings */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                  className="w-full p-4 flex justify-between items-center text-left font-bold text-xs text-white"
                  id="settings-security-accordion-toggle"
                >
                  <span className="flex items-center gap-2 text-purple-200">
                    <Shield size={15} />
                    Change Credentials
                  </span>
                  {isSecurityOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                <AnimatePresence>
                  {isSecurityOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 space-y-4"
                    >
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">New Username (Optional)</label>
                          <input 
                            type="text" 
                            value={securityData.newUsername} 
                            onChange={(e) => setSecurityData({...securityData, newUsername: e.target.value})} 
                            className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-505" 
                            placeholder="New Username" 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">New Security Password</label>
                          <input 
                            type="password" 
                            value={securityData.newPassword} 
                            onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})} 
                            className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-505" 
                            placeholder="New Password" 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-purple-300 mb-1">Confirm Security Password</label>
                          <input 
                            type="password" 
                            value={securityData.confirmPassword} 
                            onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})} 
                            className="w-full bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-505" 
                            placeholder="Confirm Password" 
                          />
                        </div>

                        <button 
                          onClick={handleSecurityUpdate} 
                          className="w-full bg-purple-650 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold shadow-md transition text-xs"
                        >
                          Save Password & Identity Credentials
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* PWA Companion App Installation Card */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between text-xs my-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
                  <Smartphone className="text-yellow-400" size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">PWA Mobile Companion</span>
                  <span className="text-[10px] text-slate-300">
                    {isInstalled ? "App launcher successfully installed" : "Install on your home screen for rapid access"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallPWA}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition active:scale-95 flex items-center gap-1.5 ${
                  isInstalled
                    ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 cursor-default"
                    : "bg-yellow-500 hover:bg-yellow-600 border border-yellow-400/30 text-slate-950"
                }`}
              >
                {isInstalled ? (
                  <>Installed</>
                ) : (
                  <>
                    <Download size={11} /> Install
                  </>
                )}
              </button>
            </div>

            {/* Guided Tour Reset Tool */}
            {onStartTour && (
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center justify-between text-xs my-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Platform Onboarding</span>
                  <span className="text-[10px] text-purple-300">Replay the platform interactive guided tour anytime</span>
                </div>
                <button
                  type="button"
                  onClick={onStartTour}
                  className="bg-purple-600/50 hover:bg-purple-600 border border-purple-500/30 text-white px-3.5 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition active:scale-95"
                >
                  Start Tour
                </button>
              </div>
            )}

            {/* Logout Panel */}
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="flex items-center justify-center gap-2 w-full p-3.5 rounded-lg text-red-200 hover:text-white font-semibold border border-red-900/30 bg-red-950/20 hover:bg-red-950/45 transition text-xs"
            >
              <LogOut size={16} />
              Logout from Member Account
            </button>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: PURPLE DEPOSIT FUNDING SCREEN                     */}
        {/* ========================================================= */}
        {activeView === 'deposit' && (
          <motion.div
            key="profile-deposit"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
            id="mine-deposit-view"
            className="space-y-6"
          >
            {/* Header / Nav Back */}
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  setDepositAmount('');
                  setDepositReceiptUrl('');
                  setPaymentConfirmed(false);
                  setActiveView('profile');
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition decoration-none"
                title="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Fund Wallet</h2>
                <p className="text-[10px] text-purple-300 font-semibold tracking-wide uppercase">Direct Deposit Settlements</p>
              </div>
            </div>

            {/* Step 1: Paystack Redirect */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3.5 shadow-md">
              <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block">Step 1: Complete Paystack Payment</span>
              <p className="text-xs text-purple-100 leading-relaxed">
                Click the Paystack button below to deposit funds through our safe payment portal. Paystack supports cards, bank transfers, and USSD. Once you complete your payment, return here to log the claim.
              </p>
              
              <a 
                href="https://paystack.shop/pay/onefundz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl text-xs font-bold shadow-md shadow-green-950/20 transition active:scale-[0.98]"
                id="deposit-paystack-btn-mine"
              >
                Continue to Paystack Checkout <ExternalLink size={14} />
              </a>

              {/* PAYMENT CONFIRMATION TOGGLE BUTTON - Requested element */}
              <div className="pt-2 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setPaymentConfirmed(!paymentConfirmed)}
                  className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                    paymentConfirmed
                      ? 'bg-purple-900/60 border-purple-500 font-semibold shadow-sm'
                      : 'bg-white/5 border-white/10 hover:border-purple-650'
                  }`}
                  id="confirm-paystack-payment-step-btn"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${paymentConfirmed ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/20'}`}>
                    {paymentConfirmed && <CheckCircle size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white font-bold leading-normal">Payment Confirmation Step</p>
                    <p className="text-[9px] text-purple-300 leading-none mt-0.5">I confirm that I have made this payment of NGN via Paystack</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Amount configuration input */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3 shadow-md">
              <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block" htmlFor="mine-deposit-amount-input">Step 2: Deposit Amount (NGN)</label>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 font-extrabold font-mono text-base">₦</span>
                <input 
                  id="mine-deposit-amount-input"
                  type="number" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)} 
                  placeholder="e.g. 5,000" 
                  disabled={!paymentConfirmed}
                  className="w-full pl-9 pr-4 py-3.5 bg-purple-950/40 border border-purple-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-mono text-sm focus:border-purple-550 focus:ring-1 focus:ring-purple-550 outline-none placeholder-purple-400/50 text-white transition"
                />
              </div>
            </div>

            {/* Step 3: Receipt Upload Form */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block">Step 3: Receipt Image Upload</span>
                {depositReceiptUrl && (
                  <span className="bg-green-950/50 border border-green-800 text-green-400 font-bold px-2 py-0.5 rounded-full text-[9px]">Loaded</span>
                )}
              </div>

              {!depositReceiptUrl ? (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setDraggingReceipt(true); }}
                  onDragLeave={() => setDraggingReceipt(false)}
                  onDrop={(e) => { e.preventDefault(); setDraggingReceipt(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { processFile(e.dataTransfer.files[0]); } }}
                  onClick={() => { if (paymentConfirmed) fileInputRef.current?.click(); else alert('Please complete the Paystack payment confirmation first.'); }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    !paymentConfirmed ? 'opacity-30 cursor-not-allowed border-white/10' :
                    draggingReceipt ? 'border-purple-500 bg-purple-950/40' : 'border-purple-800/40 hover:border-purple-600 hover:bg-white/5'
                  }`}
                  id="mine-deposit-upload-dropzone"
                >
                  <UploadCloud size={30} className={draggingReceipt ? 'text-purple-400 animate-bounce' : 'text-purple-300'} />
                  <div>
                    <p className="text-xs font-semibold text-white">Click or upload Payment Receipt</p>
                    <p className="text-[10px] text-purple-200 mt-1">Accept formats: PNG, JPG, or JPEG size</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={!paymentConfirmed}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border border-purple-850 bg-purple-950/60 rounded-xl p-3 text-center" id="mine-deposit-receipt-preview">
                  <img 
                    src={depositReceiptUrl} 
                    alt="Settlement receipt print screen" 
                    className="max-h-52 w-auto mx-auto rounded-lg object-contain shadow-md border border-purple-900/50" 
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => setDepositReceiptUrl('')}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition active:scale-95"
                    title="Remove receipt image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setDepositAmount('');
                  setDepositReceiptUrl('');
                  setPaymentConfirmed(false);
                  setActiveView('profile');
                }} 
                className="flex-1 py-3.5 text-xs font-bold rounded-xl text-purple-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDepositSubmit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0 || !depositReceiptUrl || !paymentConfirmed || isDepositSubmitting}
                className={`flex-1 py-3.5 text-xs font-bold rounded-xl text-white shadow-md transition flex items-center justify-center gap-2 ${
                  (!depositAmount || parseFloat(depositAmount) <= 0 || !depositReceiptUrl || !paymentConfirmed || isDepositSubmitting)
                    ? 'bg-purple-800/40 text-purple-300 border border-purple-700/20 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                }`}
                id="mine-deposit-submit-btn"
              >
                {isDepositSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Submit Funding Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PURPLE WITHDRAWAL SETTLEMENT SCREEN               */}
        {/* ========================================================= */}
        {activeView === 'withdraw' && (
          <motion.div
            key="profile-withdraw"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
            id="mine-withdraw-view"
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  setWithdrawalAmount('');
                  setShowWithdrawCheckOverlay(false);
                  setActiveView('profile');
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition decoration-none"
                title="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Select Settlement & Withdraw</h2>
                <p className="text-[10px] text-purple-300 font-semibold tracking-wide uppercase">Request Wallet Settlement</p>
              </div>
            </div>

            {/* Saved Account Card Selection */}
            {userData.bankName && userData.accountNumber ? (
              <div className="bg-white/5 p-5 rounded-2xl border border-white/15 space-y-3.5 shadow-md">
                <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block">Selected Settlement Node</span>
                <div className="p-4 bg-purple-900/60 border border-purple-500/35 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-950 flex items-center justify-center text-purple-300 border border-purple-800/40">
                      <Landmark size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{userData.bankName} • {userData.accountNumber}</h4>
                      <p className="text-[10px] text-purple-200 mt-0.5 font-medium">{userData.accountName}</p>
                    </div>
                  </div>
                  <span className="text-[8px] bg-purple-500 text-white font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border border-purple-400">
                    Active Primary
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-950/25 border border-yellow-800/30 p-5 rounded-2xl space-y-3 shadow-md text-slate-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-500" />
                  <p className="text-xs font-bold text-yellow-450">Settlement Info Missing</p>
                </div>
                <p className="text-[11px] leading-relaxed text-yellow-101 opacity-80">
                  Please configure and save a valid primary bank settlement node inside the Profile Home section before initiating claims.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('profile');
                    setIsBankInfoOpen(true);
                  }}
                  className="bg-purple-650 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition"
                >
                  Configure Bank Details Now
                </button>
              </div>
            )}

            {/* Amount Claimed Input */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/15 space-y-4 shadow-md">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block" htmlFor="mine-withdrawal-amount-input">Withdrawal Amount (NGN)</label>
                <span className="text-[9px] font-bold text-purple-200 bg-purple-800/40 border border-purple-700/25 px-2 py-0.5 rounded">
                  Min: ₦ 5,000.00
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300 font-extrabold font-mono text-base">₦</span>
                <input 
                  id="mine-withdrawal-amount-input"
                  type="number" 
                  value={withdrawalAmount} 
                  onChange={(e) => setWithdrawalAmount(e.target.value)} 
                  placeholder="5,000" 
                  disabled={!userData.bankName || !userData.accountNumber}
                  className="w-full pl-9 pr-4 py-3.5 bg-purple-950/40 border border-purple-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-mono text-sm focus:border-purple-550 focus:ring-1 focus:ring-purple-550 outline-none text-white transition placeholder-purple-400/50"
                />
              </div>

              <div className="grid grid-cols-2 pt-1 text-[10px] text-purple-250 border-t border-purple-900/30">
                <div>Available Portfolio Cash:</div>
                <div className="text-right font-bold text-white font-mono">
                  ₦ {userData.balance.toLocaleString('en-NG')}
                </div>
              </div>
            </div>

            {/* Complete submit button */}
            <button 
              type="button"
              onClick={openWithdrawalPreview}
              disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || !selectedAccount || isWithdrawalSubmitting}
              className={`w-full py-3.5 text-xs font-semibold rounded-xl text-white shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || !selectedAccount || isWithdrawalSubmitting)
                  ? 'bg-purple-800/40 text-purple-300 border border-purple-700/25 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 shadow-purple-950/30'
              }`}
              id="mine-withdraw-panel-submit-btn"
            >
              Configure & Request Withdrawal
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ========================================================= */}
      {/* IN-APP INTERACTIVE WITHDRAWAL CONFIRMATION DIALOG MODAL  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showWithdrawCheckOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-55 flex items-center justify-center p-4 backdrop-blur-sm"
            id="withdrawal-inapp-confirmation-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-purple-950 border border-purple-800/70 p-6 rounded-2xl w-full max-w-sm space-y-5 text-white shadow-2xl relative overflow-hidden"
              id="withdrawal-inapp-confirmation-container"
            >
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-full bg-purple-900 mx-auto flex items-center justify-center border border-purple-750 text-purple-300 mb-2 shadow-inner animate-pulse">
                  <Coins size={22} />
                </div>
                <h3 className="font-extrabold text-white text-base">Verify Settlement Claim</h3>
                <p className="text-[10px] text-purple-350">Confirm immediately debit & payout log</p>
              </div>

              <div className="bg-purple-900/50 rounded-xl p-4 space-y-2.5 border border-purple-850 text-purple-100 shadow-inner">
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-purple-950/40">
                  <span className="text-purple-300">Amount Requested:</span>
                  <span className="font-bold text-white font-mono text-sm">
                    ₦ {parseFloat(withdrawalAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-[8px] text-purple-300 uppercase font-extrabold tracking-wider">Settlement Target Account</p>
                  <p className="text-xs text-white font-bold">{userData.bankName}</p>
                  <p className="text-[10px] text-purple-200">Acc Name: {userData.accountName}</p>
                  <p className="text-[10px] text-purple-200 font-mono">Acc Num: {userData.accountNumber}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-900/30 border border-purple-900/60 flex gap-2.5">
                <div className="text-purple-400 shrink-0">
                  <AlertCircle size={15} />
                </div>
                <p className="text-[9px] text-purple-350 leading-relaxed font-medium">
                  By clicking confirm, ₦ {parseFloat(withdrawalAmount).toLocaleString()} will be charged from your available wallet balance immediately. Your requested settlement is registered as "pending" for admin disbursement review.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawCheckOverlay(false)}
                  disabled={isWithdrawalSubmitting}
                  className="flex-1 py-3 text-xs font-bold rounded-xl text-purple-300 bg-purple-900/40 hover:bg-purple-900 border border-purple-800/50 transition"
                  id="claim-preview-cancel-btn"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawalSubmitReal}
                  disabled={isWithdrawalSubmitting}
                  className="flex-1 py-3 text-xs font-bold rounded-xl bg-gradient-to-tr from-purple-550 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white shadow-md flex items-center justify-center gap-1.5"
                  id="claim-preview-confirm-btn"
                >
                  {isWithdrawalSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Debiting Balance...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      Confirm & Place
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-55 flex items-center justify-center p-4 backdrop-blur-sm"
            id="logout-inapp-confirmation-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl w-full max-w-sm space-y-5 text-white shadow-2xl relative overflow-hidden"
              id="logout-inapp-confirmation-container"
            >
              <div className="text-center space-y-1">
                <div className="w-11 h-11 rounded-full bg-red-950 mx-auto flex items-center justify-center border border-red-900/40 text-red-400 mb-2 shadow-inner">
                  <LogOut size={20} />
                </div>
                <h3 className="font-extrabold text-white text-base">Sign Out Confirmation</h3>
                <p className="text-[10px] text-slate-400">Are you sure you want to log out of your account?</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 flex gap-2.5">
                <div className="text-yellow-500 shrink-0 mt-0.5 animate-pulse">
                  <AlertCircle size={15} />
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  Logging out will end your current session. You will need to sign back in with your credentials to access your dashboard, balances, and community coops.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 text-xs font-bold rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 transition active:scale-95"
                  id="logout-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-3 text-xs font-bold rounded-xl bg-gradient-to-tr from-red-650 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                  id="logout-confirm-btn"
                >
                  <LogOut size={13} />
                  Confirm Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
