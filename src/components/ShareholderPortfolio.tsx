import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  PlusCircle, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Award, 
  ChevronRight,
  ExternalLink,
  Coins,
  CheckCircle2,
  X,
  Printer
} from 'lucide-react';
import { DANGOTE_IPO_PRICE } from '../data';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface ShareholderPortfolioProps {
  investments: any[];
  userBalance: number;
  onOpenBuyMore: () => void;
  onOpenResell: (targetId?: string) => void;
  onOpenWithdraw: () => void;
  onOpenDeposit: () => void;
}

export default function ShareholderPortfolio({
  investments,
  userBalance,
  onOpenBuyMore,
  onOpenResell,
  onOpenWithdraw,
  onOpenDeposit,
}: ShareholderPortfolioProps) {
  const [selectedCertForView, setSelectedCertForView] = useState<any | null>(null);

  // Active investments with positive shares or active status
  const activeHoldings = investments.filter(
    (inv) => inv.status === 'active' && ((inv.sharesCount && inv.sharesCount > 0) || (inv.amount && inv.amount > 0))
  );

  const totalShares = activeHoldings.reduce((sum, inv) => {
    const count = inv.sharesCount || Math.floor((inv.amount || 0) / DANGOTE_IPO_PRICE);
    return sum + count;
  }, 0);

  const currentValuation = totalShares * DANGOTE_IPO_PRICE;
  const totalCost = activeHoldings.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const capitalGain = Math.max(0, currentValuation - totalCost);
  const estimatedDividends = activeHoldings.reduce((sum, inv) => sum + (inv.dailyPayout || 0) * 30, 0);

  return (
    <div className="mx-4 my-4 space-y-4 font-sans" id="shareholder-portfolio-section">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Shareholder Position</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Dangote Petroleum Refinery & Petrochemicals PLC</p>
          </div>
        </div>

        <span className="bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
          <Award size={12} />
          <span>CSCS Registered</span>
        </span>
      </div>

      {/* PRIMARY HOLDINGS METRIC CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1931] via-[#0d2552] to-[#081226] p-5 text-white shadow-xl border border-amber-500/30">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-300/90 block">
              Total Shares Held
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
              {totalShares.toLocaleString()} <span className="text-sm font-semibold text-amber-400">Shares</span>
            </div>
          </div>

          <div className="h-11 px-2.5 py-0.5 rounded-xl bg-white border border-amber-400/70 shadow-md shrink-0 flex items-center justify-center">
            <img src={DANGOTE_ASSETS.logo} alt="Dangote Petroleum Refinery Logo" className="h-full w-auto object-contain max-w-[110px]" />
          </div>
        </div>

        {/* Financial Valuation Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60 mt-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Portfolio Market Value</span>
            <span className="font-bold text-white font-mono text-sm">
              ₦ {currentValuation.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Available Liquid Cash</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              ₦ {userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/60">
          <button
            onClick={onOpenBuyMore}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
          >
            <PlusCircle size={14} />
            <span>Buy More</span>
          </button>

          <button
            onClick={() => onOpenResell()}
            disabled={totalShares === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/40 rounded-xl text-xs font-bold active:scale-95 transition"
          >
            <RefreshCw size={14} />
            <span>Resell</span>
          </button>

          <button
            onClick={onOpenWithdraw}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold active:scale-95 transition"
          >
            <ArrowUpRight size={14} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* LIST OF SHAREHOLDING CERTIFICATES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-amber-500" />
            <span>Active Share Certificates</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">
            {activeHoldings.length} {activeHoldings.length === 1 ? 'Lot' : 'Lots'} Allocated
          </span>
        </div>

        {activeHoldings.length === 0 ? (
          <div className="text-center py-7 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
              <Coins size={22} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">No Shares Purchased Yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Secure your equity in Africa’s largest 650,000 BPD petroleum refinery before public NGX trading commences.
              </p>
            </div>
            <button
              onClick={onOpenBuyMore}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
            >
              <span>Subscribe to IPO Shares</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeHoldings.map((inv) => {
              const sharesCount = inv.sharesCount || Math.floor((inv.amount || 0) / DANGOTE_IPO_PRICE);
              const holdingValuation = sharesCount * DANGOTE_IPO_PRICE;
              const certId = inv.certificateNumber || `DRP-IPO-2026-${inv.id.slice(0, 6).toUpperCase()}`;

              return (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-500 shrink-0 text-xs font-mono">
                      {sharesCount}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {inv.productName || 'Dangote Refinery Allotment'}
                        </h4>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>Cert: <strong className="font-mono text-slate-700 dark:text-slate-300">#{certId}</strong></span>
                        <span>·</span>
                        <span>{sharesCount.toLocaleString()} Shares @ ₦{DANGOTE_IPO_PRICE}</span>
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        Valuation: ₦ {holdingValuation.toLocaleString('en-NG')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedCertForView({
                        ...inv,
                        sharesCount,
                        holdingValuation,
                        certId
                      })}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
                    >
                      <FileText size={12} className="text-amber-500" />
                      <span>Certificate</span>
                    </button>

                    <button
                      onClick={() => onOpenResell(inv.id)}
                      className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
                    >
                      <RefreshCw size={12} />
                      <span>Resell Lot</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASSET BACKING RIBBON */}
      <div className="bg-gradient-to-r from-[#0a1931] via-[#0d2552] to-[#0a1931] border border-amber-500/20 rounded-2xl p-4 text-white space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <h4 className="text-xs font-bold tracking-wide uppercase text-amber-300">
              Tangible Balance Sheet Underpinning
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">Audited Energy Assets</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Every allocated share represents fractional ownership in Dangote Petroleum Refinery's 120,000,000 Litres Crude Oil Tank battery, 650,000 BPD distillation train, and 2,000+ regional distribution tanker fleet.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <img 
              src={DANGOTE_ASSETS.crudeTank} 
              alt="Crude Tank" 
              className="w-10 h-10 rounded-lg object-cover border border-amber-500/30"
            />
            <div>
              <span className="text-[9px] text-slate-400 block">Crude Capacity</span>
              <span className="text-[11px] font-bold text-amber-400">120M Litres Tank</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <img 
              src={DANGOTE_ASSETS.ecowasTerminal} 
              alt="ECOWAS Terminal" 
              className="w-10 h-10 rounded-lg object-cover border border-emerald-500/30"
            />
            <div>
              <span className="text-[9px] text-slate-400 block">Fleet & Gantry</span>
              <span className="text-[11px] font-bold text-emerald-400">2,000+ Trucks</span>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL DIGITAL SHARE CERTIFICATE MODAL */}
      {selectedCertForView && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-[#091528] border-2 border-amber-400/60 w-full max-w-lg rounded-2xl shadow-2xl text-white overflow-hidden my-6 relative flex flex-col">
            {/* Certificate Header Banner */}
            <div className="bg-gradient-to-r from-[#061020] via-[#0b214a] to-[#061020] p-4 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 px-2.5 py-1 rounded-xl bg-white flex items-center justify-center border border-amber-400 shadow-md">
                  <img 
                    src={DANGOTE_ASSETS.logo} 
                    alt="Dangote Petroleum Refinery Logo" 
                    className="h-full w-auto object-contain max-w-[110px]"
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-wide leading-tight">
                    DANGOTE PETROLEUM REFINERY
                  </h3>
                  <p className="text-[10px] text-amber-400 font-medium">
                    and Petrochemicals FZE (DPRP)
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Lekki Free Zone, Ibeju-Lekki, Lagos State, Nigeria
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCertForView(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-5 space-y-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950">
              {/* Subtle watermark badge in background */}
              <div className="absolute right-4 bottom-4 w-40 h-40 opacity-10 pointer-events-none rounded-full overflow-hidden">
                <img 
                  src={DANGOTE_ASSETS.badgeRefinery} 
                  alt="Watermark Seal" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center pb-2 border-b border-amber-500/20">
                <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  Electronic Certificate of Ordinary Shares
                </div>
                <h4 className="text-xs text-slate-300">
                  Initial Public Offering (IPO) Allotment Warrant
                </h4>
              </div>

              {/* Shareholder & Allotment Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Certificate Number</span>
                  <span className="font-mono font-bold text-amber-400">#{selectedCertForView.certId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Allotment Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>CSCS Registered</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Ordinary Shares Held</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {selectedCertForView.sharesCount?.toLocaleString()} Units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Nominal Holding Value</span>
                  <span className="font-bold text-white font-mono text-sm">
                    ₦ {selectedCertForView.holdingValuation?.toLocaleString('en-NG')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Issue Price per Share</span>
                  <span className="text-slate-300 font-mono">₦ {DANGOTE_IPO_PRICE}.00</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Depository Listing</span>
                  <span className="text-slate-300 font-medium">NGX Dual-Listing Allotment</span>
                </div>
              </div>

              {/* Legal confirmation statement */}
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center px-2">
                "This certifies that the designated holder is registered in the Register of Members of Dangote Petroleum Refinery and Petrochemicals FZE (DPRP) as the absolute proprietor of the Ordinary Shares specified herein, subject to the Articles of Association of the Company."
              </p>

              {/* Official Seal and Signatures */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 p-0.5 bg-amber-500/10 overflow-hidden shadow-lg shadow-amber-500/20">
                    <img 
                      src={DANGOTE_ASSETS.badgeRefinery} 
                      alt="Official Seal" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold block">
                      Registrar Seal
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      SEC / NGX Verified
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-serif italic text-amber-300 text-xs tracking-wider">
                    Aliko Dangote, GCON
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase block">
                    Chairman & Founder
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
                >
                  <Printer size={13} />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setSelectedCertForView(null)}
                  className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg text-xs font-bold shadow-md hover:brightness-110 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
