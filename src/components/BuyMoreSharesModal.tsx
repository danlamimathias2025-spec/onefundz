import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { DANGOTE_IPO_PRICE } from '../data';
import { X, Plus, ShieldCheck, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface BuyMoreSharesModalProps {
  userBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenDeposit: () => void;
}

export default function BuyMoreSharesModal({
  userBalance,
  onClose,
  onSuccess,
  onOpenDeposit,
}: BuyMoreSharesModalProps) {
  const { success, error: toastError } = useToast();
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pricePerShare = DANGOTE_IPO_PRICE;
  const totalCost = sharesInput * pricePerShare;
  const isBalanceSufficient = userBalance >= totalCost;
  const shortfall = Math.max(0, totalCost - userBalance);

  // Quick increment buttons starting with the minimum subscription of 10 shares
  const quickQuantities = [10, 50, 100, 250, 500, 1000];

  const handleBuy = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toastError('Login Required', 'Please log in to purchase shares.');
      return;
    }

    if (sharesInput < 10) {
      toastError('Minimum Subscription', 'The minimum subscription is 10 shares (costing ₦5,250).');
      return;
    }

    if (!isBalanceSufficient) {
      toastError(
        'Insufficient Balance',
        `This purchase requires ₦${totalCost.toLocaleString('en-NG')}, but your current available balance is ₦${userBalance.toLocaleString('en-NG')}. Please top up your wallet via Deposit.`
      );
      return;
    }

    const confirmBuy = window.confirm(
      `Confirm Share Purchase Allotment:\n\n` +
      `Issuer: Dangote Petroleum Refinery and Petrochemicals FZE (DPRP)\n` +
      `Shares Quantity: ${sharesInput.toLocaleString()} Ordinary Shares\n` +
      `Offer Price: ₦ ${pricePerShare} / share\n` +
      `Total Cost: ₦ ${totalCost.toLocaleString('en-NG')}\n` +
      `Minimum Subscription Met: Yes (Min 10 shares / ₦5,250)\n\n` +
      `Proceed and debit ₦ ${totalCost.toLocaleString('en-NG')} from your account?`
    );

    if (!confirmBuy) return;

    setIsSubmitting(true);
    try {
      const certId = `DRP-IPO-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Deduct balance
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: increment(-totalCost),
      });

      // 2. Add investment document
      await addDoc(collection(db, 'investments'), {
        userId: auth.currentUser.email.toLowerCase(),
        productName: `Dangote Refinery Direct Allotment (${sharesInput.toLocaleString()} Shares)`,
        sharesCount: sharesInput,
        sharePrice: pricePerShare,
        amount: totalCost,
        remainingDays: 365,
        dailyPayout: Math.round(totalCost * 0.0006),
        totalReturn: Math.round(totalCost * 1.22),
        certificateNumber: certId,
        nextPayoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastSettledAt: serverTimestamp(),
        status: 'active',
        createdAt: serverTimestamp(),
      });

      // 3. Ledger transaction
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Bought ${sharesInput.toLocaleString()} Dangote Refinery Shares (Cert #${certId})`,
        amount: totalCost,
        category: 'purchase',
        status: 'approved',
        sharesCount: sharesInput,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });

      success(
        'Shares Allotted Successfully! 📜',
        `Congratulations! You have acquired ${sharesInput.toLocaleString()} Dangote Refinery shares (Cert #${certId}). Your holding has been registered in the digital order book.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Share acquisition error:', err);
      toastError('Allotment Error', 'Failed to complete share allotment. Please verify network connectivity.');
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
              <h3 className="font-bold text-sm text-white">Buy Dangote Refinery Shares</h3>
              <p className="text-[10px] text-amber-300">Dangote Petroleum Refinery & Petrochemicals FZE (DPRP)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Market Offer Price Banner */}
          <div className="bg-[#071120] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Official Offer Price</span>
              <div className="text-lg font-black text-amber-400 font-mono">₦ {pricePerShare.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ Share</span></div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Your Available Cash</span>
              <div className="text-xs font-bold text-emerald-400 font-mono">₦ {userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Enter Desired Shares Quantity
              </label>
              <span className="text-[10px] text-slate-400">Min Subscription: 10 Shares (₦5,250)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="10"
                value={sharesInput || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSharesInput(isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="w-full bg-[#071120] border border-slate-700 rounded-xl px-4 py-3 text-base font-mono font-bold text-white focus:border-amber-400 outline-none"
                placeholder="10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                Units
              </span>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-6 gap-1.5 mt-2">
              {quickQuantities.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setSharesInput(qty)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition border ${
                    sharesInput === qty
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="bg-[#071120] rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Purchase Value:</span>
              <span className="font-bold text-white font-mono text-sm">
                ₦ {totalCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Projected Annual Dividend:</span>
              <span className="font-bold text-emerald-400 font-mono">
                ~ ₦ {Math.round(totalCost * 0.22).toLocaleString('en-NG')} (22% Est.)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Allotment Class:</span>
              <span className="text-amber-300 font-medium">Dangote Ordinary Shares</span>
            </div>
          </div>

          {/* Insufficient balance warning / deposit shortcut */}
          {!isBalanceSufficient && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] text-rose-300 leading-snug">
                  You need an additional <strong>₦{shortfall.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong> to complete this purchase.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="mt-2 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-lg transition inline-flex items-center gap-1"
                >
                  <span>Deposit Funds Now</span>
                  <TrendingUp size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          {isBalanceSufficient ? (
            <button
              onClick={handleBuy}
              disabled={isSubmitting || sharesInput < 10}
              className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Issuing Digital Certificate...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Confirm Purchase (₦{totalCost.toLocaleString('en-NG')})</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            >
              <span>Deposit ₦{shortfall.toLocaleString('en-NG')} to Complete Order</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 text-center pt-1">
            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            <span>Digital Share Certificate generated and filed under Dangote Shareholder Registry</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
