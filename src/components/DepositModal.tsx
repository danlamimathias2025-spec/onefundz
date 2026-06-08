import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, CheckCircle, ChevronDown, ChevronUp, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '../lib/toast';

export default function DepositModal({ onClose }: { onClose: () => void }) {
  const { success, error: toastError } = useToast();
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 850; // balance resolution and size perfectly
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
        // Compress image to 75% quality JPEG for fast uploads and storage efficiency
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
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

  const handleDeposit = async () => {
    if (!auth.currentUser?.email || !amount || parseFloat(amount) <= 0 || !receiptUrl) return;
    if (!paymentConfirmed) {
      toastError('Payment not verified', 'Please confirm that you have made the payment on the Paystack checkout page first.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: auth.currentUser.email.toLowerCase(),
        amount: parseFloat(amount),
        receiptUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      success(
        'Deposit Request Logged!',
        `Your ₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} deposit is submitted. Our administrators will review and approve your request shortly.`
      );
      onClose();
    } catch (error) {
      console.error(error);
      toastError('Deposit Failed', 'Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        id="deposit-modal-backdrop"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
        id="deposit-modal-container"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center" id="deposit-modal-header">
          <div>
            <h2 className="text-lg font-bold">Fund Your Account</h2>
            <p className="text-xs text-slate-400">Direct wallet replenishment</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-sm p-1 rounded-lg hover:bg-slate-800"
            id="deposit-close-btn"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto" id="deposit-modal-body">
          {/* Step 1: Paystack Redirect */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">Step 1: Payment Link</span>
            <p className="text-sm text-slate-600">Please click the button below to complete your payment on our Paystack checkout page, then return here to log your transaction details.</p>
            <a 
              href="https://paystack.shop/pay/onefundz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-green-100 transition active:scale-[0.98]"
              id="deposit-paystack-btn"
            >
              Continue Deposit <ExternalLink size={16} />
            </a>

            {/* PAYMENT CONFIRMATION STEP TOGGLE */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPaymentConfirmed(!paymentConfirmed)}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  paymentConfirmed
                    ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900'
                    : 'bg-slate-50 border-slate-205 hover:bg-slate-100'
                }`}
                id="deposit-verify-payment-checkbox"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${paymentConfirmed ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-300'}`}>
                  {paymentConfirmed && <CheckCircle size={12} />}
                </div>
                <div>
                  <p className="text-xs font-bold">I Have Completed Paystack Payment</p>
                  <p className="text-[10px] text-slate-500">Enable amount input and receipt reporting</p>
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Step 2: Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block" htmlFor="deposit-amount-input">Step 2: Deposit Amount (NGN)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₦</span>
              <input 
                id="deposit-amount-input"
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                disabled={!paymentConfirmed}
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-base outline-none transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Step 3: Transaction Receipt Dropdown Accordion */}
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full text-left focus:outline-none"
              id="deposit-receipt-dropdown-toggle"
            >
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                Step 3: Receipt Upload 
                {receiptUrl ? (
                  <span className="text-green-600 flex items-center gap-0.5 text-[10px] normal-case bg-green-50 px-1.5 py-0.5 rounded-full font-medium">Ready</span>
                ) : (
                  <span className="text-slate-400 text-[10px] normal-case font-medium">Required</span>
                )}
              </span>
              <span className="text-slate-400 hover:text-slate-600">
                {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-1"
                >
                  {!receiptUrl ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => { if (paymentConfirmed) fileInputRef.current?.click(); }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                        !paymentConfirmed ? 'opacity-30 cursor-not-allowed border-slate-200' :
                        dragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      id="deposit-receipt-dropzone"
                    >
                      <UploadCloud size={32} className={`${dragging && paymentConfirmed ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Click or drag receipt photo</p>
                        <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, or JPEG formats</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3" id="deposit-receipt-preview-container">
                      <img 
                        src={receiptUrl} 
                        alt="Receipt preview" 
                        className="max-h-48 w-auto mx-auto rounded-lg object-contain shadow-sm border border-slate-100 bg-white" 
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => setReceiptUrl('')}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition transform hover:scale-105 active:scale-95"
                        title="Remove image"
                        id="deposit-receipt-remove-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer/Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100" id="deposit-modal-footer">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 py-3 text-sm font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition disabled:opacity-50"
            id="deposit-cancel-btn"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleDeposit} 
            disabled={!amount || parseFloat(amount) <= 0 || !receiptUrl || !paymentConfirmed || isSubmitting}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl text-white shadow-md transition flex items-center justify-center gap-1.5 ${
              (!amount || parseFloat(amount) <= 0 || !receiptUrl || !paymentConfirmed || isSubmitting)
                ? 'bg-indigo-300 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
            }`}
            id="deposit-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm Deposit
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
