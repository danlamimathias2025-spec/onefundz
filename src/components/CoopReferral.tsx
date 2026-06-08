import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Sparkles, Lock, Gift, Bell, Check, Shield, Rocket, ArrowRight } from 'lucide-react';
import { useToast } from '../lib/toast';

interface CoopReferralProps {
  userData: any;
}

export default function CoopReferral({ userData }: CoopReferralProps) {
  const [isNotified, setIsNotified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success } = useToast();

  const handleNotifyMe = () => {
    setLoading(true);
    setTimeout(() => {
      setIsNotified(true);
      setLoading(false);
      success(
        "Notification set", 
        "Fantastic! We've registered your interest. We will notify you immediately when OneFundz Coop & Team Pool goes live."
      );
    }, 900);
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24" id="coop-referral-screen">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        
        {/* Coming Soon Graphic Badge */}
        <div className="flex justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-405 text-[10px] font-black uppercase tracking-wider font-mono animate-pulse"
          >
            <Sparkles size={11} />
            Coming Soon to OneFundz
          </motion.div>
        </div>

        {/* Header Block */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Coop & Pool Hub
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Collaborative investment pools, collective savings circles, and micro-split compound returns with your trusted network.
          </p>
        </div>

        {/* Interactive Launch Card */}
        <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border border-purple-900/30 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden text-center space-y-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg border border-indigo-400/20">
            <Users size={28} className="text-white animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-base">OneFundz Team Pools v2.0</h3>
            <p className="text-[11px] text-purple-300 leading-relaxed max-w-xs mx-auto">
              Our engineering team is actively coding multiplayer savings and high-yield circles. Be the first to know when we deploy!
            </p>
          </div>

          <div className="pt-2">
            {isNotified ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-3 px-4 bg-emerald-950/45 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Check size={14} className="text-emerald-400 animate-bounce" />
                <span>You are on the Priority Access List!</span>
              </motion.div>
            ) : (
              <button
                onClick={handleNotifyMe}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-950/50 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Bell size={13} className={loading ? 'animate-spin' : 'animate-bounce'} />
                <span>{loading ? 'Securing Spot...' : 'Notify Me Upon Deployment'}</span>
              </button>
            )}
            <p className="text-[9px] text-slate-500 mt-2.5">
              Over 2,400 members have already locked in priority early-access.
            </p>
          </div>
        </div>

        {/* Futuristic Features Sneak Peek Grid */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            Upcoming Capabilities Roadmap
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {/* Feature 1 */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl shadow-xs flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Rocket size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Joint Capital Pools</h5>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Combine wallets with friends, family, or colleagues to unlock higher VIP investment brackets with multiplied compound yield rates.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl shadow-xs flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/20 text-pink-600 dark:text-pink-400 shrink-0">
                <Shield size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Cooperative Trust Guard</h5>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Cryptographically secured smart clauses which ensure funds cannot be withdrawn or moved without collective network approval.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-xl shadow-xs flex gap-3.5 items-start">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Gift size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Autonomous Dividend Splitting</h5>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Compound interest returns are automatically distributed to members' individual bank accounts in precise, custom allocations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program Hint Panel */}
        <div className="p-4 bg-purple-50 dark:bg-purple-950/15 border border-purple-200/40 dark:border-purple-900/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-extrabold text-[11px] uppercase tracking-wider font-mono">
            <Lock size={12} />
            Referrals are Active!
          </div>
          <p className="text-[10.5px] text-purple-600/90 dark:text-purple-300 leading-relaxed">
            Our dual-bonus recommendation program is fully operational! You can secure <span className="font-bold text-slate-900 dark:text-white">₦1,200.00 cash rewards</span> for sharing, and <span className="font-bold text-slate-900 dark:text-white">₦1,000.00</span> for newcomers. Access invitation claiming instantly inside your <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">MINE</span> tab.
          </p>
        </div>

      </div>
    </div>
  );
}
