import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Gift, Copy, Check, Users, Coins, Award, ArrowRight, Share2, Sparkles, HelpCircle } from 'lucide-react';

interface CoopReferralProps {
  userData: any;
}

export default function CoopReferral({ userData }: CoopReferralProps) {
  const [refTransactions, setRefTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userRefCode, setUserRefCode] = useState<string>('');

  useEffect(() => {
    if (!userData) return;

    const userId = userData.id || auth.currentUser?.uid;
    if (!userId) return;

    // 1. Maintain referral code. If user exists but is missing a code, generate and save it
    const fetchOrGenerateCode = async () => {
      if (userData.referralCode) {
        setUserRefCode(userData.referralCode);
        return;
      }

      // Generate upper code based on username or email
      const customCode = (userData.userName || auth.currentUser?.email?.split('@')[0] || 'COOP').trim().toUpperCase();
      try {
        // Double check if code is already registered in mapping index
        const indexDocRef = doc(db, 'referralCodes', customCode);
        const indexDocSnap = await getDoc(indexDocRef);
        
        let finalCode = customCode;
        if (indexDocSnap.exists() && indexDocSnap.data()?.userId !== userId) {
          // Add random digits to ensure absolute uniqueness
          finalCode = `${customCode}${Math.floor(100 + Math.random() * 900)}`;
        }

        // Save on both user doc and mapping index with safe merge format to avoid crashes
        await setDoc(doc(db, 'users', userId), {
          referralCode: finalCode
        }, { merge: true });

        await setDoc(doc(db, 'referralCodes', finalCode), {
          userId: userId,
          userName: userData.userName || 'Member',
          email: userData.email || auth.currentUser?.email || '',
        });

        setUserRefCode(finalCode);
      } catch (err) {
        console.error("Error setting up missing referral code:", err);
        // Fallback local setting to keep UI functional
        setUserRefCode(customCode);
      }
    };

    fetchOrGenerateCode();

    // 2. Fetch standard user referral rewards in real-time from transactions collection
    const userEmail = (userData.email || auth.currentUser?.email || '').toLowerCase();
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userEmail)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allTx = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const createdTime = data.createdAt?.seconds 
          ? data.createdAt.seconds * 1000 
          : (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());
        return {
          id: doc.id,
          ...data,
          timeMs: createdTime,
          dateString: data.date || new Date(createdTime).toLocaleDateString()
        };
      });

      // Filter for those marked as referral earnings
      const filtered = allTx
        .filter(t => t.category === 'referral')
        .sort((a, b) => b.timeMs - a.timeMs);

      setRefTransactions(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error loading referral rewards:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userData]);

  const referralCode = userRefCode || (userData?.userName ? userData.userName.toUpperCase() : 'COOP');
  const invitationLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate statistics with bulletproof string safeguards
  const totalInvited = refTransactions.filter(t => {
    const desc = t.description || '';
    return desc.includes('Introd') || desc.includes('Invited') || t.amount === 1200;
  }).length;
  const totalEarnings = refTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24" id="coop-referral-screen">
      <div className="max-w-md mx-auto space-y-5">
        
        {/* Page Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30 font-mono">
              COOPERATIVE POWER
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Referral Network Hub
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Invite your investment cooperative colleagues to ONEFUNDZ and watch your mutual portfolio grow.
          </p>
        </div>

        {/* Highlight Banner / Program terms */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-800/40 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-yellow-400">
              <Gift size={20} className="animate-bounce" />
              <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono">Generous Dual Bonuses</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 divide-x divide-purple-800/50">
              <div className="space-y-1">
                <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider font-mono">You get</p>
                <p className="text-2xl font-black text-white">₦ 1,200</p>
                <p className="text-[9px] text-purple-200/80">For every verified sign-up</p>
              </div>
              <div className="space-y-1 pl-4">
                <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider font-mono">They get</p>
                <p className="text-2xl font-black text-yellow-400">₦ 1,000</p>
                <p className="text-[9px] text-purple-200/80">Immediate welcome balance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyable Invitation Panel */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Your Invitation Code</p>
              <p className="text-[10px] text-slate-400">Share with prospective members</p>
            </div>
            <span className="text-xs font-black font-mono px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-800 tracking-wide select-all shadow-inner">
              {referralCode}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Unique Referral URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={invitationLink}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 p-2.5 rounded-xl text-[10px] text-slate-500 font-mono outline-none select-all"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-4 py-2 text-xs font-extrabold rounded-xl bg-purple-600 hover:bg-purple-750 text-white transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 mx-auto flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users size={16} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Direct Friends Invited</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none pt-0.5">{totalInvited}</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950 mx-auto flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <Coins size={16} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Bonus Cash Earned</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none pt-0.5">
              ₦ {totalEarnings.toLocaleString('en-NG')}
            </p>
          </div>
        </div>

        {/* Step-by-Step Guide Instruction Panel */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            How The Cooperative Network Works
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 border border-purple-200 dark:border-purple-800">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Invite Your Capital Partners</p>
                <p className="text-[10px] text-slate-400">Copy the unique invitation link and share with coworkers or investment associates.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 border border-purple-200 dark:border-purple-800">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Partner Registers Account</p>
                <p className="text-[10px] text-slate-400">When your referral registers, they use your invitation link and your code will get automatically pre-filled.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 border border-purple-200 dark:border-purple-800">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Instant Double Credit</p>
                <p className="text-[10px] text-slate-400">You immediately gain ₦1,200 in your wallet balance, while your registering partner starts with ₦1,000 cash credit.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Referral Completion Logs / History */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
            Network Operations Log
          </h3>

          {loading ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-center text-xs text-slate-400">
              Loading payouts...
            </div>
          ) : refTransactions.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl text-center text-xs text-slate-400 py-10 space-y-1">
              <Sparkles className="mx-auto text-slate-300 dark:text-slate-750 mb-1" size={24} />
              <p className="font-semibold text-slate-500 dark:text-slate-400">No referrals registered yet</p>
              <p className="text-[10px] text-slate-400">Share your link and once people register, details populate here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {refTransactions.map(tx => (
                <div key={tx.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{tx.description}</p>
                    <p className="text-[9px] font-mono text-slate-400 tracking-wider">REF ID: {tx.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+₦{(tx.amount || 0).toLocaleString('en-NG')}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-mono">{tx.dateString}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
