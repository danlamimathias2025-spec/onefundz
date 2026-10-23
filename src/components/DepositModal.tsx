import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  UploadCloud, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  Coins,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../lib/toast';
import { DANGOTE_DEPOSIT_PAYSTACK_LINK, DANGOTE_IPO_PRICE } from '../data';
import { DANGOTE_ASSETS } from '../assets/dangoteAssets';

interface DepositModalProps {
  onClose: () => void;
  onOpenPortfolio?: () => void;
}

export default function DepositModal({ onClose, onOpenPortfolio }: DepositModalProps) {
  const { success, error: toastError } = useToast();
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasVisitedPaymentLink, setHasVisitedPaymentLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState(DANGOTE_DEPOSIT_PAYSTACK_LINK);
  const [userDeposits, setUserDeposits] = useState<any[]>([]);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if custom payment link is stored in system_config
    const fetchConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'system_config', 'deposit'));
        if (configDoc.exists() && configDoc.data()?.paymentLink) {
          setPaymentLink(configDoc.data().paymentLink);
        }
      } catch (e) {
        // Fallback to default
      }
    };
    fetchConfig();
  }, []);

  // Listen to current user's deposits in real-time
  useEffect(() => {
    if (!auth.currentUser?.email) return;

    const email = auth.currentUser.email.toLowerCase();
    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // sort client-side by timestamp descending
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setUserDeposits(list);
    }, (err) => {
      console.warn('Could not listen to user deposits:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenPaymentLink = () => {
    setHasVisitedPaymentLink(true);
    window.open(paymentLink, '_blank', 'noopener,noreferrer');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('Invalid File', 'Please upload a valid image receipt (PNG, JPG, JPEG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 900;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setReceiptUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDepositSubmit = async () => {
    if (!auth.currentUser?.email) {
      toastError('Auth Required', 'Please log in to submit a deposit request.');
      return;
    }

    const amtFloat = parseFloat(amount);
    if (isNaN(amtFloat) || amtFloat <= 0) {
      toastError('Invalid Amount', 'Please enter a valid deposit amount greater than 0.');
      return;
    }

    if (!receiptUrl) {
      toastError('Receipt Required', 'Please upload your payment receipt image so admin can verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: auth.currentUser.email.toLowerCase(),
        amount: amtFloat,
        receiptUrl,
        reference: reference.trim() || 'Paystack Deposit',
        depositorName: depositorName.trim() || auth.currentUser.displayName || 'Shareholder',
        paymentMethod: 'Paystack',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Also log pending transaction
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.email.toLowerCase(),
        description: `Deposit via Paystack (Pending Admin Approval)`,
        amount: amtFloat,
        category: 'deposit',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });

      success(
        'Receipt Submitted for Review! 📜',
        `Your deposit of ₦${amtFloat.toLocaleString('en-NG')} has been logged. An administrator will review your receipt and credit your balance shortly.`
      );

      // Reset form fields
      setAmount('');
      setReference('');
      setReceiptUrl('');
      setHasVisitedPaymentLink(false);
    } catch (error) {
      console.error('Deposit submission error:', error);
      toastError('Submission Failed', 'Failed to submit deposit. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[100] overflow-y-auto w-full h-full"
      id="deposit-modal-backdrop"
    >
      <div 
        className="w-full max-w-lg mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col"
        id="deposit-modal-container"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1931] to-[#0d2552] border-b border-amber-500/20 px-5 py-4 text-white flex justify-between items-center sticky top-0 z-20 shadow-lg" id="deposit-modal-header">
          <div className="flex items-center gap-3">
            <div className="h-10 px-2 py-0.5 rounded-xl bg-white border border-amber-400 flex items-center justify-center shrink-0">
              <img src={DANGOTE_ASSETS.logo} alt="Dangote Petroleum Refinery Logo" className="h-full w-auto object-contain max-w-[110px]" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Deposit Funds</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">Paystack Official</span>
              </h2>
              <p className="text-[11px] text-slate-300">Fund your balance to purchase Dangote Refinery IPO shares</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-sm p-2 rounded-lg hover:bg-slate-800 focus:outline-none"
            id="deposit-close-btn"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 pb-24 text-slate-900 dark:text-slate-100" id="deposit-modal-body">
          {/* Important Rule Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Coins size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">Deposit & Share Purchase Protocol</h4>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Shares can <strong>only</strong> be purchased using your account balance. Complete your deposit payment on Paystack, return here to upload your payment receipt, and our treasury administrators will verify and credit your balance.
              </p>
            </div>
          </div>

          {/* STEP 1: REDIRECT TO PAYSTACK PAYMENT LINK */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Step 1: Make Payment on Paystack
              </span>
              {hasVisitedPaymentLink && (
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle size={10} /> Link Opened
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tap the button below to proceed to our secure Paystack checkout portal to make your payment (supports debit cards, instant bank transfers, and USSD).
            </p>

            <button
              type="button"
              onClick={handleOpenPaymentLink}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-xs tracking-wide shadow-md transition cursor-pointer"
              id="open-paystack-deposit-btn"
            >
              <span>Pay on Paystack Portal</span>
              <ExternalLink size={14} />
            </button>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center break-all select-all">
              {paymentLink}
            </p>
          </div>

          {/* STEP 2: ENTER DEPOSIT AMOUNT & SENDER DETAILS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Step 2: Enter Amount & Payment Details
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Deposited (₦ NGN) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₦</span>
                  <input 
                    type="number" 
                    placeholder="e.g. 24,000" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Equivalent to ~{Math.floor(parseFloat(amount) / DANGOTE_IPO_PRICE).toLocaleString()} Dangote Refinery Ordinary Shares (@ ₦{DANGOTE_IPO_PRICE}/unit).
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Transaction Reference / Narration (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Paystack Ref or Depositor Name" 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 font-mono text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: UPLOAD RECEIPT IMAGE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Step 3: Upload Payment Receipt Image <span className="text-red-500">*</span>
              </span>
              {receiptUrl && (
                <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Receipt Loaded
                </span>
              )}
            </div>

            {!receiptUrl ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  dragging
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-300 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-950/60'
                }`}
                id="deposit-receipt-dropzone"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <UploadCloud className="h-8 w-8 text-amber-500 mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tap to Upload or Drag & Drop Payment Receipt
                </p>
                <p className="text-[10px] text-slate-400">
                  Supports PNG, JPG, JPEG, and mobile transaction screenshots
                </p>
              </div>
            ) : (
              <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-950">
                <img 
                  src={receiptUrl} 
                  alt="Receipt Preview" 
                  className="max-h-52 w-full object-contain rounded-lg"
                />
                <button 
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg"
                  title="Remove Receipt"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleDepositSubmit}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !receiptUrl}
            className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            id="submit-deposit-receipt-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Submitting Receipt to Admin Review...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Submit Deposit for Admin Review</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <span>Balance updates automatically upon admin verification of your payment receipt</span>
          </div>

          {/* USER'S RECENT DEPOSIT CLAIMS & STATUS */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>My Deposit History & Review Status</span>
              <span className="text-[10px] font-normal text-slate-400">({userDeposits.length})</span>
            </h3>

            {userDeposits.length === 0 ? (
              <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-4 text-center text-xs text-slate-400">
                No deposit requests logged yet. Complete payment via Paystack and upload your receipt above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {userDeposits.map((dep) => (
                  <div 
                    key={dep.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          ₦ {dep.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                          dep.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          dep.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {dep.status === 'approved' && <CheckCircle size={10} />}
                          {dep.status === 'rejected' && <XCircle size={10} />}
                          {dep.status === 'pending' && <Clock size={10} />}
                          <span className="capitalize">{dep.status || 'pending'}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {dep.createdAt?.seconds ? new Date(dep.createdAt.seconds * 1000).toLocaleString() : 'Just now'} · {dep.paymentMethod || 'Paystack'}
                      </p>
                      {dep.rejectionReason && (
                        <p className="text-[10px] text-red-400 mt-1">
                          Admin note: {dep.rejectionReason}
                        </p>
                      )}
                    </div>

                    {dep.receiptUrl && (
                      <button
                        onClick={() => setSelectedReceiptPreview(dep.receiptUrl)}
                        className="px-2.5 py-1 text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20"
                      >
                        Receipt Slip
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL RECEIPT LIGHTBOX MODAL */}
      {selectedReceiptPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-3">
            <div className="flex items-center justify-between text-white">
              <h4 className="text-xs font-bold">Payment Receipt Preview</h4>
              <button 
                onClick={() => setSelectedReceiptPreview(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-2">
              <img 
                src={selectedReceiptPreview} 
                alt="Receipt Full View" 
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
