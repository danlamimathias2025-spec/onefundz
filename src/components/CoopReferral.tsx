import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Sparkles, Copy, Check, ShieldCheck, Share2, Award, Building2, Flame, Gift, ArrowRight } from 'lucide-react';
import { useToast } from '../lib/toast';

interface CoopReferralProps {
  userData: any;
}

export default function CoopReferral({ userData }: CoopReferralProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const primaryDomain = 'https://onefundz.vercel.app';
  const baseUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('run.app')
    ? window.location.origin
    : primaryDomain;
  const refCode = userData?.referralCode || (userData?.userName ? userData.userName.toUpperCase() : 'ONEFUNDZ');
  // Format: onefundz.vercel.app/ref?-"referral code"
  const referralLink = `${baseUrl}/ref?-"${encodeURIComponent(refCode)}"`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success('Referral Link Copied! 📋', 'Share with friends to earn ₦1,000 bonus per active subscriber.');
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'OneFundz Wealth Management & Vault',
        text: `Join OneFundz and start your secure wealth journey using my invitation link:`,
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-900 dark:text-slate-100 font-sans" id="coop-referral-screen">
      <div className="max-w-md mx-auto space-y-5 pt-2">
        {/* Header Block */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-black uppercase tracking-wider">
            <Flame size={11} className="text-yellow-500" />
            <span>OneFundz Referral Ambassador</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Ambassador & Referral Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Invite friends to join OneFundz and earn a <strong className="text-yellow-500 font-bold">₦1,000 bonus</strong> for every successful member referral.
          </p>
        </div>

        {/* Ambassador Link Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-yellow-500/30 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Your Referral Code</h3>
                <p className="text-[10px] text-yellow-300">Earn ₦1,000 bonus per active referral</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-yellow-500/40 px-3 py-1 rounded-xl text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Code</span>
              <span className="font-mono font-black text-yellow-400 text-sm tracking-wider">{refCode}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Unique Referral Link</span>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs font-mono text-slate-300 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleShareNative}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black shadow-md transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Share2 size={15} />
            <span>Share Invitation Link</span>
          </button>
        </div>

        {/* Benefits Roadmap */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
            Referral Rewards & Perks
          </h4>

          <div className="space-y-2.5">
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shrink-0">
                <Award size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">₦1,000 Referrer Bonus</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Instant cash bonus credited to your available balance when someone registers using your exclusive Ambassador link.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Secure Yield Growth</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  All referred members gain access to secure, disciplined wealth vaults and structured growth plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
