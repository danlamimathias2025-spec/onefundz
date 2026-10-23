import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Sparkles, Copy, Check, ShieldCheck, Share2, Award, Building2, Flame, Gift, ArrowRight, Truck } from 'lucide-react';
import { useToast } from '../lib/toast';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface CoopReferralProps {
  userData: any;
}

export default function CoopReferral({ userData }: CoopReferralProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const refCode = userData?.referralCode || (userData?.userName ? userData.userName.toUpperCase() : 'DANGOTE');
  const referralLink = `${window.location.origin}/?ref=${encodeURIComponent(refCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success('Referral Link Copied! 📋', 'Share with prospective investors to earn ₦1,200 per active subscriber.');
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Dangote Petroleum Refinery IPO Allotment',
        text: `Subscribe to official Dangote Petroleum Refinery & Petrochemicals IPO shares using my invitation link:`,
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
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Flame size={11} className="text-amber-500" />
            <span>Dangote Shareholder Ambassador</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Syndicate & Ambassador Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Invite fellow retail investors to subscribe to the Dangote Petroleum Refinery IPO and earn ₦1,200 commission per accredited shareholder.
          </p>
        </div>

        {/* Ambassador Link Card */}
        <div className="bg-gradient-to-br from-[#0a1931] via-[#0d2552] to-[#081226] border border-amber-500/30 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Your Ambassador Code</h3>
                <p className="text-[10px] text-amber-300">Earn ₦1,200 per activated subscriber</p>
              </div>
            </div>

            <div className="bg-[#061021] border border-amber-500/40 px-3 py-1 rounded-xl text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Code</span>
              <span className="font-mono font-black text-amber-400 text-sm tracking-wider">{refCode}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Unique Referral Link</span>
            <div className="flex items-center gap-2 bg-[#061021] p-2 rounded-xl border border-slate-700">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs font-mono text-slate-300 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleShareNative}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/40 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Share2 size={15} />
            <span>Share Invitation Link</span>
          </button>
        </div>

        {/* ECOWAS Distribution Network Showcase Card */}
        <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 shadow-xl relative">
          <div className="h-36 w-full relative">
            <img 
              src={DANGOTE_ASSETS.ecowasTerminal} 
              alt="ECOWAS Distribution Network" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1931] via-transparent to-transparent" />
            <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
              Regional Syndicate Corridor
            </div>
          </div>
          <div className="p-3.5 bg-gradient-to-b from-[#0a1931] to-[#071120] text-white space-y-1.5 -mt-3 relative z-10">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Truck size={14} className="text-emerald-400" />
              <span>West African Distribution Network</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Our investor ambassadors help mobilize retail capital across West Africa as Dangote Refinery tankers roll out across 15 ECOWAS member states.
            </p>
          </div>
        </div>

        {/* Benefits Roadmap */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
            Ambassador & Syndicate Benefits
          </h4>

          <div className="space-y-2.5">
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                <Award size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">₦1,200 Cash Commission</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Direct cash reward automatically credited to your available liquid balance for each investor who signs up and subscribes using your link.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Group Capital Syndicates</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Pool subscription capital with family or corporate partners to qualify for Major Syndicate Blocks (5,000+ shares) with institutional pricing.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Direct CSCS Share Allotment</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  All invited investors receive authentic digital share warrants filed directly on the central shareholder register.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
