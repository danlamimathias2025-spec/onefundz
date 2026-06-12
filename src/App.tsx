/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useToast } from "./lib/toast";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  LayoutGrid,
  Users,
  User,
  ShieldCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  Share2,
  History,
} from "lucide-react";
import Header from "./components/Header";
import AssetBalanceCard from "./components/AssetBalanceCard";
import PerformanceChart from "./components/PerformanceChart";
import ProductList from "./components/ProductList";
import Transactions from "./components/Transactions";
import ProfileSettings from "./components/ProfileSettings";
import AdminPanel from "./components/AdminPanel";
import CoopReferral from "./components/CoopReferral";
import AuthPage from "./components/Auth";
import SkeletonCard from "./components/SkeletonCard";
import SplashScreen from "./components/SplashScreen";
import QuickActionsFAB from "./components/QuickActionsFAB";
import DailyGrowthIndicator from "./components/DailyGrowthIndicator";
import InvestmentBreakdownChart from "./components/InvestmentBreakdownChart";
import DepositModal from "./components/DepositModal";
import FinanceNews from "./components/FinanceNews";
import GuidedTour from "./components/GuidedTour";
import EditProfileModal from "./components/EditProfileModal";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [realInvestments, setRealInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [forceStartTour, setForceStartTour] = useState(false);
  const [mineInitialView, setMineInitialView] = useState<
    "profile" | "deposit" | "withdraw"
  >("profile");
  const { success } = useToast();
  const prevProfileCompletion = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
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
      console.warn(
        "Firestore connectivity slow. Proceeding with fallback user profile.",
      );
      setLoading(false);
    }, 2000);

    // Listen to real-time balance & username updates
    const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(
      userDocRef,
      (snap) => {
        clearTimeout(failsafeTimer);
        if (snap.exists()) {
          setUserData({ id: snap.id, ...snap.data() });
        } else {
          setUserData({ email: user.email, balance: 0 });
        }
        setLoading(false);
      },
      (error) => {
        console.error("User snap error:", error);
        clearTimeout(failsafeTimer);
        setLoading(false);
      },
    );

    // Listen to active investments dynamically
    const qInv = query(
      collection(db, "investments"),
      where("userId", "==", user.email),
    );
    const unsubInv = onSnapshot(
      qInv,
      (snap) => {
        setRealInvestments(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        console.error("Investment snap error:", error);
      },
    );

    return () => {
      clearTimeout(failsafeTimer);
      unsubUser();
      unsubInv();
    };
  }, [user]);

  // 3. Process automatic payouts based on Elapsed Time in realInvestments
  useEffect(() => {
    if (!user || realInvestments.length === 0) return;

    const performCrediting = () => {
      let totalNewBalance = 0;
      const batchUpdates: Array<{ ref: any; data: any }> = [];

      realInvestments.forEach((inv) => {
        if (inv.status !== "active") return;

        const timestamp = inv.lastSettledAt?.seconds || inv.createdAt?.seconds;
        if (!timestamp) return;

        const lastSettleMs = timestamp * 1000;
        const nowMs = Date.now();
        const diffMs = nowMs - lastSettleMs;
        const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        if (daysPassed > 0) {
          // Compute how many actual days we can payout (cap by remainingDays)
          const actualDaysToSettle = Math.min(
            daysPassed,
            Math.ceil(inv.remainingDays || 0),
          );

          if (actualDaysToSettle > 0) {
            totalNewBalance += inv.dailyPayout * actualDaysToSettle;
            const newRemaining = inv.remainingDays - actualDaysToSettle;

            batchUpdates.push({
              ref: doc(db, "investments", inv.id),
              data: {
                remainingDays: Math.max(0, newRemaining),
                lastSettledAt: new Date(
                  lastSettleMs + actualDaysToSettle * (24 * 60 * 60 * 1000),
                ),
                status: newRemaining <= 0 ? "completed" : "active",
              },
            });
          }
        }
      });

      if (totalNewBalance > 0) {
        const applyUpdates = async () => {
          try {
            // Increment the user's primary wallet balance
            await updateDoc(doc(db, "users", user.uid), {
              balance: increment(totalNewBalance),
            });
            // Update the localized investment records tracking
            for (const update of batchUpdates) {
              await updateDoc(update.ref, update.data);
            }
          } catch (error) {
            console.error("Auto-crediting error:", error);
          }
        };
        applyUpdates();
      }
    };

    performCrediting();

    // Check every 30 seconds to support live compounding effects while app is open
    const intervalTimer = setInterval(performCrediting, 30000);
    return () => clearInterval(intervalTimer);
  }, [realInvestments, user]);

  // 4. Auto-heal and sync referral code details to the global index
  useEffect(() => {
    if (!user || !userData) return;

    const syncReferralIndex = async () => {
      let myRefCode = userData.referralCode;

      // If code is not set on the user document yet, auto-generate & write it
      if (!myRefCode) {
        myRefCode = (userData.userName || user.email?.split("@")[0] || "COOP")
          .trim()
          .toUpperCase();
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              referralCode: myRefCode,
            },
            { merge: true },
          );
          console.log(
            "[Self-Healing] Created missing referralCode on user document:",
            myRefCode,
          );
        } catch (err) {
          console.error("Failed to set missing referralCode:", err);
          return;
        }
      }

      try {
        const refUpper = myRefCode.trim().toUpperCase();
        const indexDocRef = doc(db, "referralCodes", refUpper);
        const indexDocSnap = await getDoc(indexDocRef);

        if (!indexDocSnap.exists()) {
          console.log(
            "[Self-Healing] Generating missing referral index document under referralCodes collection for:",
            refUpper,
          );
          await setDoc(indexDocRef, {
            userId: user.uid,
            userName: userData.userName || "Member",
            email: userData.email || user.email || "",
          });
        }
      } catch (err) {
        console.error("Referral map self-healing error:", err);
      }
    };

    syncReferralIndex();
  }, [user, userData]);

  useEffect(() => {
    if (activeTab === "Home") {
      setDashboardLoading(true);
      const timer = setTimeout(() => setDashboardLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const profileFields = [
    "userName",
    "fullName",
    "phoneNumber",
    "bankName",
    "accountName",
    "accountNumber",
    "avatarUrl",
  ];
  const completedFields = profileFields.filter(
    (f) => userData?.[f] && userData[f].toString().trim() !== "",
  ).length;
  // If userData is null, profileCompletion is 0. But we only want to track changes once userData is loaded.
  const profileCompletion = userData
    ? Math.round((completedFields / profileFields.length) * 100)
    : 0;

  useEffect(() => {
    // Only process if userData has been loaded
    if (!loading && userData) {
      if (
        prevProfileCompletion.current !== null &&
        prevProfileCompletion.current < 100 &&
        profileCompletion === 100
      ) {
        // Just reached 100%
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.2 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6"],
          disableForReducedMotion: true,
        });
        success("Profile Complete", "Awesome! Your profile is fully set up 🎉");
      }
      prevProfileCompletion.current = profileCompletion;
    }
  }, [profileCompletion, loading, userData, success]);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="p-8 text-slate-500 text-sm font-semibold animate-pulse">
          Initializing Security & Assets...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isAdmin = user.email?.toLowerCase() === "danlamimathias2025@gmail.com";
  const balanceVal = userData?.balance || 0;

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen font-sans pb-20 text-slate-900 dark:text-slate-100">
      {activeTab === "Home" && (
        <>
          <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />

          <div
            id="dashboard-user-banner"
            onClick={() => setIsEditProfileOpen(true)}
            className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/70 dark:hover:bg-slate-900/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2">
              {userData?.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt={userData?.userName || "Profile"}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-850"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 capitalize flex-shrink-0">
                  {userData?.userName
                    ? userData.userName.charAt(0)
                    : user.email?.charAt(0)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white text-xs leading-none flex items-center gap-1.5">
                  Welcome, {userData?.userName || "Member"}
                  <span className="text-[9px] text-indigo-550 dark:text-indigo-400 font-medium tracking-normal hover:underline">
                    (Edit)
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end whitespace-nowrap ml-2">
              <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Profile {profileCompletion}%
              </span>
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${profileCompletion === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 px-4 pb-4 border-b border-slate-100 dark:border-slate-900/60">
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
            >
              <ArrowDownCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-1.5" />
              <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
                Deposit
              </span>
            </button>
            <button
              onClick={() => {
                setMineInitialView("withdraw");
                setActiveTab("Mine");
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
            >
              <ArrowUpCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 mb-1.5" />
              <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
                Withdraw
              </span>
            </button>
            <button
              onClick={() => setActiveTab("Coop")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
            >
              <Share2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-1.5" />
              <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
                Referral
              </span>
            </button>
            <button
              onClick={() => setActiveTab("Transactions")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
            >
              <History className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-1.5" />
              <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
                History
              </span>
            </button>
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
              <PerformanceChart investments={realInvestments} />

              <FinanceNews />

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl mt-4 shadow-xs mx-4">
                <h3 className="font-bold text-sm mb-3">Yield Distribution</h3>
                {realInvestments.length > 0 ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <InvestmentBreakdownChart investments={realInvestments} />
                    <p className="text-[10px] text-slate-400 mt-3">
                      Distribution based on plan subscription capital
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No active packages yet. Scroll down and subscribe to a VIP
                    plan to initiate daily profit payouts!
                  </div>
                )}
              </div>

              <div className="mt-6">
                <ProductList userBalance={balanceVal} />
              </div>

              <QuickActionsFAB
                onDepositClick={() => setIsDepositModalOpen(true)}
                onWithdrawClick={() => {
                  setMineInitialView("withdraw");
                  setActiveTab("Mine");
                }}
              />
            </>
          )}
        </>
      )}

      {activeTab === "Transactions" && <Transactions />}
      {activeTab === "Coop" && <CoopReferral userData={userData} />}
      {activeTab === "Mine" && (
        <ProfileSettings
          onStartTour={() => {
            setActiveTab("Home");
            setForceStartTour(true);
          }}
          isAdmin={isAdmin}
          initialView={mineInitialView}
        />
      )}
      {activeTab === "Admin" && isAdmin && <AdminPanel />}

      <AnimatePresence>
        {isDepositModalOpen && (
          <DepositModal onClose={() => setIsDepositModalOpen(false)} />
        )}
        {isEditProfileOpen && (
          <EditProfileModal
            userId={user.uid}
            currentUserName={userData?.userName || ""}
            currentAvatarUrl={userData?.avatarUrl || ""}
            onClose={() => setIsEditProfileOpen(false)}
          />
        )}
      </AnimatePresence>

      {user && (
        <GuidedTour
          userId={user.uid}
          forceStart={forceStartTour}
          onClose={() => setForceStartTour(false)}
        />
      )}

      <nav
        id="dashboard-nav-bar"
        className="fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-900/60 p-2 pb-4 sm:pb-2 flex justify-around text-slate-400 z-50 shadow-2xl shadow-black/80"
      >
        <motion.button
          onClick={() => setActiveTab("Home")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === "Home" ? "text-yellow-400" : "hover:text-slate-200"}`}
        >
          {activeTab === "Home" && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <Home
            size={19}
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">
            Home
          </span>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab("Transactions")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === "Transactions" ? "text-yellow-400" : "hover:text-slate-200"}`}
        >
          {activeTab === "Transactions" && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <LayoutGrid size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">
            Activity
          </span>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab("Coop")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === "Coop" ? "text-yellow-400 font-bold" : "hover:text-slate-200"}`}
        >
          {activeTab === "Coop" && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <Users size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">
            Coop
          </span>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab("Mine")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === "Mine" ? "text-yellow-400" : "hover:text-slate-200"}`}
        >
          {activeTab === "Mine" && (
            <motion.div
              layoutId="nav-bg-glow"
              className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <User size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">
            Mine
          </span>
        </motion.button>

        {isAdmin && (
          <motion.button
            onClick={() => setActiveTab("Admin")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className={`relative px-4 py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === "Admin" ? "text-yellow-400 font-bold" : "hover:text-slate-200"}`}
          >
            {activeTab === "Admin" && (
              <motion.div
                layoutId="nav-bg-glow"
                className="absolute inset-x-1 inset-y-0.5 bg-yellow-500/10 dark:bg-yellow-400/8 border border-yellow-500/20 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <ShieldCheck
              size={19}
              className={
                activeTab === "Admin" ? "animate-pulse text-yellow-400" : ""
              }
            />
            <span className="text-[10px] mt-1 font-medium tracking-tight font-sans">
              Admin
            </span>
          </motion.button>
        )}
      </nav>
    </div>
  );
}
