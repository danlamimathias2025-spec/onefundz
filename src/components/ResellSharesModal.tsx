import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { DANGOTE_IPO_PRICE } from '../data';
import { X, RefreshCw, AlertCircle, CheckCircle, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface ResellSharesModalProps {
  investments: any[];
  userBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
  targetInvestmentId?: string;
}

export default function ResellSharesModal({
  investments,
  userBalance,
  onClose,
  onSuccess,
  targetInvestmentId,
}: ResellSharesModalProps) {
  const { success, error: toastError } = useToast();
  
  // Filter only active shareholdings with sharesCount > 0
  const activeHoldings = investments.filter(
    (inv) => inv.status === 'active' && (inv.sharesCount > 0 || inv.amount > 0)
  );

  const initialSelected = targetInvestmentId
    ? activeHoldings.find((inv) => inv.id === targetInvestmentId) || activeHoldings[0]
    : activeHoldings[0];

  const [selectedHoldingId, setSelectedHoldingId] = useState<string>(initialSelected?.id || '');
  const selectedHolding = activeHoldings.find((inv) => inv.id === selectedHoldingId);

  // Compute shares count for selected holding
  const maxShares = selectedHolding
    ? selectedHolding.sharesCount || Math.floor((selectedHolding.amount || 0) / (selectedHolding.sharePrice || DANGOTE_IPO_PRICE))
    : 0;

  const [sharesToSell, setSharesToSell] = useState<number>(maxShares > 0 ? maxShares : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pricePerShare = selectedHolding?.sharePrice || DANGOTE_IPO_PRICE;
  const estimatedProceeds = Math.max(0, sharesToSell * pricePerShare);

  const handlePercentageSelect = (pct: number) => {
    const computed = Math.floor((maxShares * pct) / 100);
    setSharesToSell(Math.max(1, computed));
  };

  const handleResellSubmit = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toastError('Authentication Required', 'Please log in to resell shares.');
      return;
    }

    if (!selectedHolding || sharesToSell <= 0 || sharesToSell > maxShares) {
      toastError('Invalid Quantity', 'Please specify a valid number of shares to resell.');
      return;
    }

    const confirmResell = window.confirm(
      `Confirm Share Buyback Resale:\n\n` +
      `Holding: ${selectedHolding.productName || 'Dangote Refinery Shares'}\n` +
      `Certificate: #${selectedHolding.certificateNumber || selectedHolding.id.slice(0, 8)}\n` +
      `Shares to Resell: ${sharesToSell.toLocaleString()} Units\n` +
      `Proceeds: ₦ ${estimatedProceeds.toLocaleString('en-NG')}\n\n` +
      `This amount will be immediately credited to your available cash balance, ready for bank withdrawal. Proceed?`
    );

    if (!confirmResell) return;

    setIsSubmitting(true);
    try {
      const holdingRef = doc(db, 'investments', selectedHolding.id);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const isSellingAll = sharesToSell >= maxShares;

      // 1. Update or settle the investment document
      if (isSellingAll) {
        await updateDoc(holdingRef, {
          sharesCount: 0,
          status: 'resold',
          resoldAt: serverTimestamp(),
          resellProceeds: estimatedProceeds,
        });
      } else {
        const remainingShares = maxShares - sharesToSell;
        const newAmount = remainingShares * pricePerShare;
        await updateDoc(holdingRef, {
          sharesCount: remainingShares,
          amount: newAmount,
          lastResellAt: serverTimestamp(),
        });
      }

      // 2. Credit the user's cash balance
      await updateDoc(userRef, {
        balance: increment(estimatedProceeds),
      });

      // 3. Record transaction ledger
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Resold ${sharesToSell.toLocaleString()} Dangote Refinery Shares (Cert #${selectedHolding.certificateNumber || selectedHolding.id.slice(0, 8)})`,
        amount: estimatedProceeds,
        category: 'resale',
        status: 'approved',
        sharesCount: sharesToSell,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });

      success(
        'Shares Resold Successfully! 💰',
        `₦${estimatedProceeds.toLocaleString('en-NG')} has been credited directly to your cash balance. You may now withdraw to your bank account anytime.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error reselling shares:', err);
      toastError('Resale Error', 'Failed to process share resale. Please try again or check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0a1931] border border-amber-500/30 rounded-2xl shadow-2xl text-white overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d2552] to-[#0a1931] p-4 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 px-2 py-0.5 rounded-xl bg-white border border-amber-400 shadow flex items-center justify-center shrink-0">
              <img 
                src={DANGOTE_ASSETS.logo} 
                alt="Dangote Petroleum Refinery Logo" 
                className="h-full w-auto object-contain max-w-[95px]"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Resell Dangote Shares</h3>
              <p className="text-[10px] text-amber-300">Secondary Liquidity Pool · Instant Cash Back</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {activeHoldings.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <AlertCircle size={24} />
            </div>
            <h4 className="font-bold text-sm">No Active Shares Held</h4>
            <p className="text-xs text-slate-300">
              You do not have any active Dangote Refinery share allocations to resell. Subscribe to an IPO tranche or buy shares first to start trading.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110"
            >
              Browse Share Offerings
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Step 1: Select Holding */}
            <div>
              <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                Select Share Lot / Certificate
              </label>
              <select
                value={selectedHoldingId}
                onChange={(e) => {
                  setSelectedHoldingId(e.target.value);
                  const found = activeHoldings.find((h) => h.id === e.target.value);
                  if (found) {
                    const count = found.sharesCount || Math.floor(found.amount / DANGOTE_IPO_PRICE);
                    setSharesToSell(count);
                  }
                }}
                className="w-full bg-[#071120] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              >
                {activeHoldings.map((h) => {
                  const shares = h.sharesCount || Math.floor((h.amount || 0) / DANGOTE_IPO_PRICE);
                  return (
                    <option key={h.id} value={h.id}>
                      {h.productName || 'Dangote Share Batch'} ({shares.toLocaleString()} Shares) - Cert #{h.certificateNumber || h.id.slice(0, 6)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Holding Details Pill */}
            {selectedHolding && (
              <div className="bg-[#071120] p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Available to Resell:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {maxShares.toLocaleString()} Units
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Market Price:</span>
                  <span className="font-bold text-white font-mono">₦ {pricePerShare.toLocaleString()} / share</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Certificate Ref:</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {selectedHolding.certificateNumber || 'DRP-IPO-2026-ACTIVE'}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Choose Shares to Resell */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Quantity to Resell
                </label>
                <span className="text-[10px] text-slate-400">
                  Max: {maxShares.toLocaleString()} Shares
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={maxShares}
                  value={sharesToSell || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) setSharesToSell(0);
                    else setSharesToSell(Math.min(maxShares, Math.max(0, val)));
                  }}
                  className="w-full bg-[#071120] border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-amber-400 outline-none"
                  placeholder="Enter units"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  Shares
                </span>
              </div>

              {/* Quick Percentage Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageSelect(pct)}
                    className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-300 border border-slate-700 transition"
                  >
                    {pct === 100 ? 'All (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Payout Preview */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Cash Proceeds (Credited to Balance)
              </span>
              <div className="text-2xl font-black text-emerald-300 font-mono">
                ₦ {estimatedProceeds.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                Liquidity buyback is guaranteed under the Dangote Petroleum Refinery Secondary Market Facility. Funds appear instantly in your wallet and can be withdrawn to your bank.
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleResellSubmit}
              disabled={isSubmitting || sharesToSell <= 0 || sharesToSell > maxShares}
              className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Processing Buyback...</span>
                </>
              ) : (
                <>
                  <DollarSign size={15} />
                  <span>Execute Resale & Credit ₦{estimatedProceeds.toLocaleString('en-NG')}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 text-center pt-1">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
              <span>Certified Buyback Protocol · Central Securities Clearing System (CSCS) compliant</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
