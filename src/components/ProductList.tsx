import React, { useState } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../lib/toast';

const products = [
  { tier: 'VIP 1', price: '4,000', days: 60, daily: 800, total: 48000 },
  { tier: 'VIP 2', price: '8,000', days: 60, daily: 1600, total: 96000 },
  { tier: 'VIP 3', price: '20,000', days: 60, daily: 4200, total: 252000 },
  { tier: 'VIP 4', price: '30,000', days: 60, daily: 6000, total: 360000 },
  { tier: 'VIP 5', price: '40,000', days: 60, daily: 10000, total: 600000 },
  { tier: 'VIP 6', price: '60,000', days: 60, daily: 15000, total: 900000 },
  { tier: 'VIP 7', price: '80,000', days: 60, daily: 22000, total: 1320000 },
  { tier: 'VIP 8', price: '100,000', days: 60, daily: 30000, total: 1800000 },
  { tier: 'VIP 9', price: '150,000', days: 60, daily: 45000, total: 2700000 },
  { tier: 'VIP 10', price: '200,000', days: 60, daily: 65000, total: 3900000 },
];

interface ProductListProps {
  userBalance: number;
}

export default function ProductList({ userBalance }: ProductListProps) {
  const { success, error: toastError } = useToast();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuyProduct = async (product: typeof products[0]) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toastError("Login Required", "Please log in to purchase a plan.");
      return;
    }

    const price = parseFloat(product.price.replace(/,/g, ''));
    if (userBalance < price) {
      toastError(
        "Insufficient Funds", 
        `This plan costs ₦${product.price}, but your balance is ₦${userBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}. Please fund your account using the Deposit option.`
      );
      return;
    }

    const confirmPurchase = window.confirm(
      `Confirm Package Subscription:\n\nPlan: ${product.tier}\nPrice: ₦ ${product.price}\nDaily Profit: ₦ ${product.daily.toLocaleString()}\nValidity: ${product.days} days\n\nDo you want to proceed and debit ₦ ${product.price} from your account?`
    );

    if (!confirmPurchase) return;

    setBuyingId(product.tier);
    try {
      // 1. Deduct balance from user profile document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: userBalance - price
      });

      // 2. Add an active investment document
      await addDoc(collection(db, 'investments'), {
        userId: auth.currentUser.email.toLowerCase(),
        productName: product.tier,
        amount: price,
        remainingDays: product.days,
        dailyPayout: product.daily,
        totalReturn: product.total,
        nextPayoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        createdAt: serverTimestamp()
      });

      // 3. Add to standard transactions ledger
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Subscribed to ${product.tier} Plan`,
        amount: price,
        category: 'purchase',
        status: 'approved',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      success(
        "Subscription Successful!",
        `Congratulations! You have subscribed to the ${product.tier} package (₦${product.price}). Daily payouts of ₦${product.daily.toLocaleString('en-NG')} will begin within 24 hours.`
      );
    } catch (error) {
      console.error("Purchase error: ", error);
      toastError("Subscription Failed", "An error occurred during purchase validation. Please verify connectivity and try again.");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div id="dashboard-product-list" className="px-3 pb-20">
      <h3 className="font-bold text-lg px-1 mb-4">Investment Modules</h3>
      {products.map((product) => (
        <div key={product.tier} className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-3 flex items-center shadow-sm border border-slate-200/40 dark:border-slate-800/60">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 rounded-lg mr-3 flex items-center justify-center font-bold text-red-600 dark:text-red-400 text-sm">
            {product.tier}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-600 dark:text-red-400 mb-0.5 text-sm">{product.tier}</h4>
            <div className="grid grid-cols-2 gap-y-0.5 text-[10px] text-slate-700 dark:text-slate-300">
              <p>Price: <span className="font-bold text-red-600 dark:text-red-400">₦ {product.price}</span></p>
              <p>Validity: <span className="font-bold text-red-600 dark:text-red-400">{product.days} days</span></p>
              <p>Daily: <span className="font-bold text-red-600 dark:text-red-400">₦ {product.daily.toLocaleString()}</span></p>
              <p>Total: <span className="font-bold text-red-600 dark:text-red-400">₦ {product.total.toLocaleString()}</span></p>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              Yield is automatically processed and credited daily.
            </p>
          </div>
          <button 
            onClick={() => handleBuyProduct(product)}
            disabled={buyingId !== null}
            className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95"
          >
            {buyingId === product.tier ? "Buying..." : "Subscribe"}
          </button>
        </div>
      ))}
    </div>
  );
}
