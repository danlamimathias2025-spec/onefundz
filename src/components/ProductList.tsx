import React, { useState } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { ipoShareTranches, DANGOTE_IPO_PRICE, refineryFacts, DANGOTE_IPO_ISSUER, DANGOTE_IPO_MIN_SHARES, DANGOTE_IPO_MIN_COST } from '../data';
import { ShareTranche } from '../types';
import { 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Calculator, 
  Flame, 
  Coins,
  ChevronRight,
  Zap,
  Info,
  Maximize2,
  X,
  Clock
} from 'lucide-react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface ProductListProps {
  userBalance: number;
  onOpenDeposit?: () => void;
  onOpenCustomBuy?: () => void;
  onOpenPortfolio?: () => void;
}

export default function ProductList({ userBalance, onOpenDeposit, onOpenCustomBuy, onOpenPortfolio }: ProductListProps) {
  const { success, error: toastError } = useToast();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'retail' | 'executive' | 'institutional'>('all');
  
  // Custom calculator state inside the component
  const [customUnits, setCustomUnits] = useState<number>(100);
  const [customBuying, setCustomBuying] = useState(false);
  const [selectedAssetModal, setSelectedAssetModal] = useState<{
    title: string;
    tag: string;
    image: string;
    specs: { label: string; value: string }[];
    description: string;
  } | null>(null);

  const filteredTranches = ipoShareTranches.filter((t) => {
    if (filter === 'retail') return t.shares <= 250;
    if (filter === 'executive') return t.shares > 250 && t.shares <= 1000;
    if (filter === 'institutional') return t.shares > 1000;
    return true;
  });

  const handleBuyTranche = async (tranche: ShareTranche) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toastError('Login Required', 'Please log in to purchase IPO shares.');
      return;
    }

    if (userBalance < tranche.totalPrice) {
      toastError(
        'Insufficient Balance', 
        `This allotment costs ₦${tranche.totalPrice.toLocaleString('en-NG')}, but your available balance is ₦${userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}. Please fund your wallet via Deposit.`
      );
      return;
    }

    const confirmPurchase = window.confirm(
      `Confirm Dangote Refinery IPO Allotment:\n\n` +
      `Tranche: ${tranche.name} (${tranche.code})\n` +
      `Shares Quantity: ${tranche.shares.toLocaleString()} Ordinary Shares\n` +
      `Price per Share: ₦ ${tranche.pricePerShare}\n` +
      `Total Cost: ₦ ${tranche.totalPrice.toLocaleString('en-NG')}\n` +
      `Est. Annual Dividend: ${tranche.dividendYield}% p.a.\n\n` +
      `Proceed and debit ₦ ${tranche.totalPrice.toLocaleString('en-NG')} from your account balance?`
    );

    if (!confirmPurchase) return;

    setBuyingId(tranche.id);
    try {
      const certId = `DRP-IPO-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Deduct balance from user profile document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: increment(-tranche.totalPrice),
      });

      // 2. Add an active investment / shareholding document
      await addDoc(collection(db, 'investments'), {
        userId: auth.currentUser.email.toLowerCase(),
        productName: `${tranche.name} (${tranche.shares.toLocaleString()} Shares)`,
        trancheCode: tranche.code,
        sharesCount: tranche.shares,
        sharePrice: tranche.pricePerShare,
        amount: tranche.totalPrice,
        remainingDays: 365,
        dailyPayout: Math.round((tranche.totalPrice * (tranche.dividendYield / 100)) / 365),
        totalReturn: Math.round(tranche.totalPrice * (1 + tranche.dividendYield / 100)),
        certificateNumber: certId,
        nextPayoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastSettledAt: serverTimestamp(),
        status: 'active',
        createdAt: serverTimestamp(),
      });

      // 3. Add to ledger transactions
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Subscribed to ${tranche.name} - ${tranche.shares.toLocaleString()} Shares (Cert #${certId})`,
        amount: tranche.totalPrice,
        category: 'purchase',
        status: 'approved',
        sharesCount: tranche.shares,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });

      success(
        'Allotment Successful! 📜',
        `Congratulations! You now own ${tranche.shares.toLocaleString()} Ordinary Shares in Dangote Petroleum Refinery & Petrochemicals PLC (Cert #${certId}). View them in your Portfolio.`
      );
      if (onOpenPortfolio) {
        setTimeout(onOpenPortfolio, 600);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toastError('Allotment Failed', 'An error occurred during allotment validation. Please verify network and try again.');
    } finally {
      setBuyingId(null);
    }
  };

  const handleCustomBuy = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toastError('Login Required', 'Please log in to purchase shares.');
      return;
    }

    if (customUnits < 10) {
      toastError('Minimum Order', 'Minimum order is 10 shares.');
      return;
    }

    const cost = customUnits * DANGOTE_IPO_PRICE;
    if (userBalance < cost) {
      toastError(
        'Insufficient Balance',
        `This custom order requires ₦${cost.toLocaleString('en-NG')}, but your balance is ₦${userBalance.toLocaleString('en-NG')}. Please deposit funds.`
      );
      return;
    }

    const confirmCustom = window.confirm(
      `Confirm Custom Allotment:\n\nQuantity: ${customUnits.toLocaleString()} Shares\nTotal Cost: ₦ ${cost.toLocaleString('en-NG')}\n\nProceed?`
    );
    if (!confirmCustom) return;

    setCustomBuying(true);
    try {
      const certId = `DRP-IPO-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { balance: increment(-cost) });

      await addDoc(collection(db, 'investments'), {
        userId: auth.currentUser.email.toLowerCase(),
        productName: `Dangote Custom Lot (${customUnits.toLocaleString()} Shares)`,
        sharesCount: customUnits,
        sharePrice: DANGOTE_IPO_PRICE,
        amount: cost,
        remainingDays: 365,
        dailyPayout: Math.round(cost * 0.0006),
        totalReturn: Math.round(cost * 1.22),
        certificateNumber: certId,
        nextPayoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastSettledAt: serverTimestamp(),
        status: 'active',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Bought ${customUnits.toLocaleString()} Dangote Refinery Shares (Cert #${certId})`,
        amount: cost,
        category: 'purchase',
        status: 'approved',
        sharesCount: customUnits,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });

      success(
        'Order Executed! 📜',
        `Successfully bought ${customUnits.toLocaleString()} Dangote Refinery shares (Cert #${certId}). View them in your Portfolio.`
      );
      if (onOpenPortfolio) {
        setTimeout(onOpenPortfolio, 600);
      }
    } catch (err) {
      console.error(err);
      toastError('Order Failed', 'Could not complete custom order.');
    } finally {
      setCustomBuying(false);
    }
  };

  return (
    <div id="dashboard-product-list" className="px-4 pb-20 space-y-5">
      {/* REFINERY AERIAL HERO CARD */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-amber-500/30 bg-slate-900">
        <div className="h-48 sm:h-56 w-full relative">
          <img 
            src={DANGOTE_ASSETS.refineryAerialHero} 
            alt="Dangote Petroleum Refinery Lekki" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1931] via-[#0a1931]/60 to-transparent" />
          <div className="absolute top-3 left-3 bg-red-600/90 text-white font-extrabold text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-red-400/30">
            <Flame size={12} className="text-amber-300" />
            <span>650,000 BPD · Lekki Free Zone</span>
          </div>
          <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-amber-400 font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full border border-amber-500/40 shadow-lg">
            Offer Price: ₦525 / Share
          </div>
        </div>

        <div className="p-4 bg-gradient-to-b from-[#0a1931] to-[#071120] text-white -mt-4 relative z-10 border-t border-amber-500/20">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Dangote Refinery IPO Offerings</span>
            <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">Pre-IPO Tranches</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Direct public participation in Africa’s largest energy infrastructure asset. 4.1 billion ordinary shares offered at ₦525 per share to raise ₦2.15 trillion ($1.6 billion). Instant digital share certificates and CSCS clearing.
          </p>

          {/* Quick Refinery Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-[10px]">
            {refineryFacts.map((fact, i) => (
              <div key={i} className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block">{fact.label}</span>
                <span className="font-bold text-amber-400 text-[11px] block">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OFFICIAL KEY OFFER DETAILS CARD */}
      <div className="bg-gradient-to-br from-[#0c1f3f] via-[#09172e] to-[#061020] rounded-2xl p-4 sm:p-5 border-2 border-amber-500/40 shadow-xl space-y-3.5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">Official Prospectus</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Public Subscription</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              Key Offer Details
            </h3>
            <p className="text-[11px] text-slate-300">
              {DANGOTE_IPO_ISSUER}
            </p>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-2.5 sm:text-right shrink-0">
            <span className="text-[10px] text-amber-300 font-medium block">Official Offer Price</span>
            <span className="text-xl font-black text-amber-400 font-mono">₦525.00 <span className="text-xs text-slate-300 font-normal">/ Share</span></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Offering</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">4.1 Billion Shares</span>
            <span className="text-[9px] text-emerald-400 font-semibold block">~₦2.15T ($1.6B USD)</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Min Subscription</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 block mt-0.5">10 Shares</span>
            <span className="text-[9px] text-slate-300 block">Cost: ₦5,250</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Opening Date</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">Sept 14, 2026</span>
            <span className="text-[9px] text-emerald-400 font-semibold block">Now Open</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Target Demographics</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">10 Million</span>
            <span className="text-[9px] text-slate-300 block">Retail Investors</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Clock size={13} className="shrink-0" />
            <span>Closing Date: <strong>Until further notice</strong></span>
          </div>
          <button 
            onClick={onOpenCustomBuy}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            Apply for Shares →
          </button>
        </div>
      </div>

      {/* CUSTOM SHARE CALCULATOR QUICK BOX */}
      <div className="bg-gradient-to-r from-[#0d2552] to-[#0a1931] p-4 rounded-2xl border border-amber-500/30 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-amber-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Custom Share Calculator</h3>
          </div>
          <span className="text-[10px] text-amber-300 font-mono">₦525.00 / Share</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <input
              type="number"
              min="10"
              step="10"
              value={customUnits}
              onChange={(e) => setCustomUnits(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-[#071120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:border-amber-400 outline-none"
              placeholder="Shares quantity"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">Units</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="text-right sm:text-left">
              <span className="text-[9px] text-slate-400 block uppercase">Total Cost</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                ₦ {(customUnits * DANGOTE_IPO_PRICE).toLocaleString('en-NG')}
              </span>
            </div>

            <button
              onClick={handleCustomBuy}
              disabled={customBuying || customUnits < 10}
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 whitespace-nowrap"
            >
              {customBuying ? 'Processing...' : 'Instant Buy'}
            </button>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>Curated IPO Allotment Tranches</span>
          <span className="text-slate-400 font-normal text-xs">({filteredTranches.length})</span>
        </h3>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px]">
          {(['all', 'retail', 'executive', 'institutional'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                filter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TRANCHES GRID / LIST */}
      <div className="space-y-3">
        {filteredTranches.map((tranche) => {
          const isAffordable = userBalance >= tranche.totalPrice;
          const isBuying = buyingId === tranche.id;

          return (
            <div
              key={tranche.id}
              className={`rounded-2xl p-4 transition-all border ${
                tranche.popular
                  ? 'bg-gradient-to-br from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0a1931] to-[#0d2552] border border-amber-500/30 flex flex-col items-center justify-center text-white shrink-0 shadow-md">
                    <span className="text-[9px] text-amber-300 font-mono">LOT</span>
                    <span className="text-xs font-black font-mono text-white">{tranche.shares}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {tranche.name}
                      </h4>
                      {tranche.badge && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tranche.badge === 'Popular'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-red-600/15 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {tranche.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {tranche.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Allotment Price</span>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                    ₦ {tranche.totalPrice.toLocaleString('en-NG')}
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Shares Count</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {tranche.shares.toLocaleString()} Units
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Price / Share</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    ₦ {tranche.pricePerShare}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Est. Annual Yield</span>
                  <span className="font-bold text-emerald-500 dark:text-emerald-400 font-mono">
                    +{tranche.dividendYield}% p.a.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  <span>Certified digital share warrant</span>
                </div>

                {isAffordable ? (
                  <button
                    onClick={() => handleBuyTranche(tranche)}
                    disabled={isBuying}
                    className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    {isBuying ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Allotting...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe Shares</span>
                        <ChevronRight size={13} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onOpenDeposit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Deposit to Subscribe</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TANGIBLE REFINING & DISTRIBUTION ASSETS SHOWCASE */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={16} className="text-amber-500" />
              <span>Infrastructure Backing Your Shares</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tangible multi-billion dollar installations securing investor capital and dividend flows
            </p>
          </div>
          <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Lekki Free Zone
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* ASSET 1: CRUDE OIL STORAGE TANK */}
          <div 
            onClick={() => setSelectedAssetModal({
              title: "120,000,000 Litres Crude Oil Storage Tank",
              tag: "Asset Tag: 711-TT-1101-B",
              image: DANGOTE_ASSETS.crudeTank,
              specs: [
                { label: "Nominal Capacity", value: "120,000,000 Litres (754,000 bbl)" },
                { label: "Engineering Type", value: "External Floating Roof Crude Tank" },
                { label: "Feedstock Blend", value: "Escravos, Forcados, Bonny Light, US WTI" },
                { label: "Operational Role", value: "Continuous 24/7 distillation buffer" }
              ],
              description: "The giant 120-million-litre crude tank (711-TT-1101-B) is among the largest single crude holding units in the world. It guarantees uninterrupted feedstock supply to the 650,000 BPD single-train distillation tower, protecting throughput from ocean supply delays."
            })}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-amber-500/40 transition-all flex flex-col"
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-950">
              <img 
                src={DANGOTE_ASSETS.crudeTank} 
                alt="120,000,000 Litres Crude Storage Tank" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                120M Litres Tank
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                <Maximize2 size={10} />
                <span>Inspect</span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  120M-Litre Crude Tank (711-TT-1101-B)
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  World-record crude storage vessel sustaining 650,000 BPD continuous refining operations.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Capacity</span>
                <span className="font-bold text-amber-500">120,000,000 L</span>
              </div>
            </div>
          </div>

          {/* ASSET 2: ECOWAS DISTRIBUTION TERMINAL */}
          <div 
            onClick={() => setSelectedAssetModal({
              title: "ECOWAS Distribution Terminal & Tanker Fleet",
              tag: "Logistics Hub: Lekki Gantry",
              image: DANGOTE_ASSETS.ecowasTerminal,
              specs: [
                { label: "Dispatch Gantry", value: "Daily loadout of 2,900+ trucks" },
                { label: "Export Corridors", value: "Ghana, Togo, Benin, Niger, Mali" },
                { label: "Marine SBM", value: "Single-Point Mooring for offshore tankers" },
                { label: "Products", value: "Euro-V PMS (Gasoline), Low-Sulfur Diesel, Jet A1" }
              ],
              description: "The dedicated Lekki loading terminal and maritime single-point mooring infrastructure connects Dangote Petroleum Refinery to regional West African energy markets, converting local crude processing into regional export revenues."
            })}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-amber-500/40 transition-all flex flex-col"
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-950">
              <img 
                src={DANGOTE_ASSETS.ecowasTerminal} 
                alt="ECOWAS Distribution Network" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                ECOWAS Corridor
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                <Maximize2 size={10} />
                <span>Inspect</span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  Loading Terminal & ECOWAS Fleet
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  Strategic haulage network & marine gantry dispatching refined fuels across West Africa.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Coverage</span>
                <span className="font-bold text-emerald-500">15 ECOWAS Nations</span>
              </div>
            </div>
          </div>

          {/* ASSET 3: CATALYTIC TOWERS & CAPITAL MARKETS ALLOTMENT */}
          <div 
            onClick={() => setSelectedAssetModal({
              title: "Capital Markets Dual-Listing & Distillation Units",
              tag: "NGX Ticker: DPR-IPO",
              image: DANGOTE_ASSETS.badgeRefinery,
              specs: [
                { label: "Offer Price", value: "₦525.00 / Ordinary Share" },
                { label: "Exchange", value: "Nigerian Exchange Group (NGX) + Dual LSE" },
                { label: "Processing Units", value: "RFCC, Hydrocracker, Alkylation Train" },
                { label: "Project Valuation", value: "> $20,000,000,000 USD" }
              ],
              description: "Representing Africa's largest corporate equity listing in capital markets history. Certified by securities regulators with automated share allotment, digital depository registration, and guaranteed secondary liquidity."
            })}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-amber-500/40 transition-all flex flex-col"
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-950">
              <img 
                src={DANGOTE_ASSETS.badgeRefinery} 
                alt="Capital Markets & Distillation Columns" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                NGX Listing
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                <Maximize2 size={10} />
                <span>Inspect</span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">
                  Distillation Train & Dual-Listing
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  World's largest single-train RFCC refinery complex listed on the Nigerian Exchange.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Offer Price</span>
                <span className="font-bold text-red-500">₦525.00 / Unit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASSET INSPECTION DETAIL MODAL */}
      {selectedAssetModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-[#0a1931] border border-amber-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl text-white my-6 flex flex-col max-h-[90vh]">
            <div className="relative h-56 sm:h-64 w-full bg-slate-950">
              <img 
                src={selectedAssetModal.image} 
                alt={selectedAssetModal.title} 
                className="w-full h-full object-contain sm:object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1931] via-transparent to-black/60" />
              <button 
                onClick={() => setSelectedAssetModal(null)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full border border-white/20 transition active:scale-95"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                  {selectedAssetModal.tag}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedAssetModal.title}
                </h3>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedAssetModal.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Technical Specifications & Asset Profile
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedAssetModal.specs.map((spec, i) => (
                    <div key={i} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{spec.label}</span>
                      <span className="font-bold text-white text-xs block mt-0.5">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setSelectedAssetModal(null)}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-95"
                >
                  Close Asset Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
