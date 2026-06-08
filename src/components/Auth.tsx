import React, { useState, useEffect } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, LogIn, Sparkles, AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    userName: '',
    referralCodeInput: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Auto-detect invitation link ?ref=CODE from url query parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        setFormData(prev => ({ ...prev, referralCodeInput: refCode.trim().toUpperCase() }));
        setIsLogin(false); // Automatically shift to the registration page for invitee
        setFeedback({
          type: 'success',
          message: `Referral promotion detected! You've received a ₦1,000 welcome bonus slot under reference link: [${refCode.toUpperCase()}].`
        });
      }
    } catch (err) {
      console.error("Error reading referral URL code parameter:", err);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Please provide a valid email address';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!isLogin) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full Name is required';
      }
      if (!formData.userName.trim()) {
        newErrors.userName = 'Username is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const genReferralCode = formData.userName.trim().toUpperCase();
      const refInput = formData.referralCodeInput.trim().toUpperCase();

      // 1. Authenticate & create user first so that lookup is performed while authenticated
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;
      
      let referrerId: string | null = null;
      let referrerEmail: string | null = null;
      let referrerUserName: string | null = null;

      if (refInput) {
        try {
          const refDocRef = doc(db, 'referralCodes', refInput);
          const refDocSnap = await getDoc(refDocRef);
          if (refDocSnap.exists()) {
            const refData = refDocSnap.data();
            if (refData.email && refData.email.toLowerCase() !== formData.email.trim().toLowerCase()) {
              referrerId = refData.userId;
              referrerEmail = refData.email;
              referrerUserName = refData.userName;
            }
          }
        } catch (err) {
          console.error("Error looking up referral code:", err);
        }
      }
      
      const newBalance = 500 + (referrerId ? 1000 : 0);

      // 2. Set Firestore record
      await setDoc(doc(db, 'users', uid), {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email.toLowerCase(),
        userName: formData.userName,
        balance: newBalance,
        referralCode: genReferralCode,
        referredBy: referrerId || null,
        referredByCode: referrerId ? refInput : null,
        createdAt: serverTimestamp(),
      });

      // 3. Register user's unique referralCode mapping index
      await setDoc(doc(db, 'referralCodes', genReferralCode), {
        userId: uid,
        userName: formData.userName,
        email: formData.email.toLowerCase(),
      });

      // 4. Record sign-up welcome bonus of N500
      await addDoc(collection(db, 'transactions'), {
        userId: formData.email.toLowerCase(),
        description: 'Welcome Registration Bonus',
        amount: 500,
        category: 'referral',
        status: 'approved',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      // 5. Handle bonuses transactions if the referral is valid
      if (referrerId && referrerEmail) {
        // Invite welcome bonus for registering user
        await addDoc(collection(db, 'transactions'), {
          userId: formData.email.toLowerCase(),
          description: `Referral welcome bonus (Invited by @${referrerUserName})`,
          amount: 1000,
          category: 'referral',
          status: 'approved',
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });

        // Credit the referrer balance with N1,200 (allowed via custom rules)
        try {
          const refUserDocRef = doc(db, 'users', referrerId);
          const refUserSnap = await getDoc(refUserDocRef);
          if (refUserSnap.exists()) {
            const currentBalance = refUserSnap.data().balance || 0;
            await updateDoc(refUserDocRef, {
              balance: currentBalance + 1200
            });

            // Log referral award transactional ledger
            await addDoc(collection(db, 'transactions'), {
              userId: referrerEmail.toLowerCase(),
              description: `Referral award: Invited @${formData.userName}`,
              amount: 1200,
              category: 'referral',
              status: 'approved',
              date: new Date().toISOString().split('T')[0],
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error updating referrer's balance or transactions:", err);
        }
      }

      setFeedback({
        type: 'success',
        message: 'Account created successfully! Preparing secure access to your dashboard...',
      });
    } catch (error: any) {
      console.error('Registration error details:', error);

      if (error.code === 'auth/email-already-in-use') {
        setShowSwitchModal(true);
        setFeedback({
          type: 'error',
          message: 'An account already exists with this email address. Click the button below or Sign In above to access your dashboard.',
        });
      } else if (error.code === 'permission-denied') {
        setFeedback({
          type: 'error',
          message: 'Access denied. Please check your network and try again.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: error.message || 'Could not complete registration. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setFeedback({
        type: 'success',
        message: 'Identity verified successfully! Resuming session...',
      });
    } catch (error: any) {
      console.error('Login error details:', error);
      if (error.code === 'auth/wrong-password') {
        setFeedback({ type: 'error', message: 'The password you entered is incorrect.' });
      } else if (error.code === 'auth/user-not-found') {
        setFeedback({ type: 'error', message: 'No account matches this email address.' });
      } else {
        setFeedback({ type: 'error', message: error.message || 'Failed to authenticate.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToLoginMode = () => {
    setIsLogin(true);
    setShowSwitchModal(false);
    setFeedback(null);
  };

  return (
    <div id="auth-screen-container" className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-white relative overflow-hidden">
      {/* Decorative ambient blurred blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-yellow-500 flex items-center justify-center shadow-md">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans bg-clip-text">
              ONEFUNDZ COOPERATIVE
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Secure Yield Multiplying Programs & Microfinance Investment Networks
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 max-w-[240px] mx-auto">
            <button
              onClick={() => { setIsLogin(true); setFeedback(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition duration-200 ${isLogin ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setFeedback(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition duration-200 ${!isLogin ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${feedback.type === 'success' ? 'bg-emerald-950/30 text-emerald-300 border-emerald-900/50' : 'bg-rose-950/30 text-rose-300 border-rose-900/50'}`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Mathias Danlami"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                    />
                  </div>
                  {errors.fullName && <p className="text-rose-400 text-[10px] mt-0.5">{errors.fullName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      name="userName"
                      placeholder="e.g. mathias99"
                      value={formData.userName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                    />
                  </div>
                  {errors.userName && <p className="text-rose-400 text-[10px] mt-0.5">{errors.userName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="+234..."
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>
              {errors.email && <p className="text-rose-400 text-[10px] mt-0.5">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>
              {errors.password && <p className="text-rose-400 text-[10px] mt-0.5">{errors.password}</p>}
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-rose-400 text-[10px] mt-0.5">{errors.confirmPassword}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Referral Code</label>
                    <span className="text-[9px] text-purple-400 font-semibold uppercase font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-800/20">Optional</span>
                  </div>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 animate-pulse" size={16} />
                    <input
                      type="text"
                      name="referralCodeInput"
                      placeholder="e.g. AMADI42_COOP"
                      value={formData.referralCodeInput}
                      onChange={(e) => setFormData({ ...formData, referralCodeInput: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-3 pl-10 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none transition uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-750 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn size={15} />
                  <span>{isLogin ? 'Sign In to Dashboard' : 'Create & Launch Account'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-550">
          By signing on, you authorize premium yield mutual allocations under regulatory microfinance guidelines.
        </p>
      </div>

      {/* CUSTOM PROMPT SWITCH DIALOG MODAL (Iframe proof) */}
      <AnimatePresence>
        {showSwitchModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl relative text-center"
            >
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-800"
              >
                <X size={16} />
              </button>

              <div className="mx-auto w-12 h-12 rounded-full bg-purple-950 flex items-center justify-center border border-purple-800">
                <HelpCircle size={24} className="text-purple-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-sm text-white">
                  Email Already In Use
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                  The email address <strong className="text-amber-300 font-mono text-[10px]">{formData.email}</strong> is already registered. Would you like to switch to Login mode instead?
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={switchToLoginMode}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-750 text-white transition"
                >
                  Switch to Login
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

