/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, LayoutGrid, Users, User, ShieldCheck } from 'lucide-react';
import Header from './components/Header';
import AssetBalanceCard from './components/AssetBalanceCard';
import PerformanceChart from './components/PerformanceChart';
import ProductList from './components/ProductList';
import Transactions from './components/Transactions';
import ProfileSettings from './components/ProfileSettings';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/Auth';
import SkeletonCard from './components/SkeletonCard';
import SplashScreen from './components/SplashScreen';
import QuickActionsFAB from './components/QuickActionsFAB';
import DailyGrowthIndicator from './components/DailyGrowthIndicator';
import InvestmentBreakdownChart from './components/InvestmentBreakdownChart';
import DepositModal from './components/DepositModal';
import FinanceNews from './components/FinanceNews';
import GuidedTour from './components/GuidedTour';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [realInvestments, setRealInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [forceStartTour, setForceStartTour] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 1. Authenticated User Observer
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setRealInvestments([]);
        setLoading(false);
      }
    });
  }, []);

  // 2. Real-time database observers (Profile Data and Investment Products)
  useEffect(() => {
    if (!user) return;

    // Failsafe timer: If Firestore takes longer than 2 seconds to respond,
    // let the app boot with elegant fallback values so the user is never stuck loading!
    const failsafeTimer = setTimeout(() => {
      console.warn("Firestore connectivity slow. Proceeding with fallback user profile.");
      setLoading(false);
    }, 2000);

    // Listen to real-time balance & username updates
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      clearTimeout(failsafeTimer);
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      } else {
        setUserData({ email: user.email, balance: 0 });
      }
      setLoading(false);
    }, (error) => {
      console.error("User snap error:", error);
      clearTimeout(failsafeTimer);
      setLoading(false);
    });

    // Listen to active investments dynamically
    const qInv = query(collection(db, 'investments'), where('userId', '==', user.email));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setRealInvestments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Investment snap error:", error);
    });

    return () => {
      clearTimeout(failsafeTimer);
      unsubUser();
      unsubInv();
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === 'Home') {
      setDashboardLoading(true);
      const timer = setTimeout(() => setDashboardLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="p-8 text-slate-500 text-sm font-semibold animate-pulse">Initializing Security & Assets...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isAdmin = user.email?.toLowerCase() === 'danlamimathias2025@gmail.com';
  const balanceVal = userData?.balance || 0;

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen font-sans pb-20 text-slate-900 dark:text-slate-100">
      {activeTab === 'Home' && (
        <>
          <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          
          <div id="dashboard-user-banner" className="p-4 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/10">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 capitalize">
              {userData?.userName ? userData.userName.charAt(0) : user.email?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-xs leading-none">Welcome, {userData?.userName || 'Member'}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{user.email}</span>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="p-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              <AssetBalanceCard balance={balanceVal} />
              <DailyGrowthIndicator />
              <PerformanceChart />
              
              <FinanceNews />
              
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl mt-4 shadow-xs mx-4">
                <h3 className="font-bold text-sm mb-3">Yield Distribution</h3>
                {realInvestments.length > 0 ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <InvestmentBreakdownChart investments={realInvestments} />
                    <p className="text-[10px] text-slate-400 mt-3">Distribution based on plan subscription capital</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No active packages yet. Scroll down and subscribe to a VIP plan to initiate daily profit payouts!
                  </div>
                )}
              </div>

              <div className="mt-6">
                <ProductList userBalance={balanceVal} />
              </div>
              
              <QuickActionsFAB onDepositClick={() => setIsDepositModalOpen(true)} />
            </>
          )}
        </>
      )}
      
      {activeTab === 'Transactions' && <Transactions />}
      {activeTab === 'Mine' && <ProfileSettings onStartTour={() => { setActiveTab('Home'); setForceStartTour(true); }} />}
      {activeTab === 'Admin' && isAdmin && <AdminPanel />}
      
      <AnimatePresence>
        {isDepositModalOpen && <DepositModal onClose={() => setIsDepositModalOpen(false)} />}
      </AnimatePresence>

      {user && (
        <GuidedTour userId={user.uid} forceStart={forceStartTour} onClose={() => setForceStartTour(false)} />
      )}

      <nav id="dashboard-nav-bar" className="fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-900/60 p-2 pb-4 sm:pb-2 flex justify-around text-slate-400 z-50 shadow-2xl shadow-black/80">
        <motion.button 
          onClick={() => setActiveTab('Home')} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === 'Home' ? 'text-yellow-400' : 'hover:text-slate-200'}`}
        >
          {activeTab === 'Home' && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          <Home size={19} className="transition-transform duration-200 group-hover:scale-105" />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">Home</span>
        </motion.button>

        <motion.button 
          onClick={() => setActiveTab('Transactions')} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === 'Transactions' ? 'text-yellow-400' : 'hover:text-slate-200'}`}
        >
          {activeTab === 'Transactions' && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          <LayoutGrid size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">Activity</span>
        </motion.button>

        <motion.button 
          onClick={() => alert("ONEFUNDZ Investment Cooperative Team Referral program coming soon!")} 
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          className="relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl text-slate-450 hover:text-yellow-300 transition-colors duration-300"
        >
          <Users size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">Coop</span>
        </motion.button>

        <motion.button 
          onClick={() => setActiveTab('Mine')} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === 'Mine' ? 'text-yellow-400' : 'hover:text-slate-200'}`}
        >
          {activeTab === 'Mine' && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          <User size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">Mine</span>
        </motion.button>

        {isAdmin && (
          <motion.button 
            onClick={() => setActiveTab('Admin')} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === 'Admin' ? 'text-yellow-400 font-bold' : 'hover:text-slate-200'}`}
          >
            {activeTab === 'Admin' && (
              <motion.div
                layoutId="nav-bg-glow"
                className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <ShieldCheck size={19} className={activeTab === 'Admin' ? 'animate-pulse text-yellow-400' : ''} />
            <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">Admin</span>
          </motion.button>
        )}
      </nav>
    </div>
  );
}
