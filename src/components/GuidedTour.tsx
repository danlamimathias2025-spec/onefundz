import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface GuidedTourProps {
  userId: string;
  onClose?: () => void;
  forceStart?: boolean;
}

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'dashboard-user-banner',
    title: 'Member Profile Index',
    description: 'This is your verified user profile hub. It showcases your custom Username, registered Email Address, and instant profile completion progress.',
    position: 'bottom'
  },
  {
    targetId: 'asset-balance-card',
    title: 'Secure Asset Balance Card',
    description: 'This panel shows your current NGN portfolio cash balance and projected investment returns.',
    position: 'bottom'
  },
  {
    targetId: 'daily-growth-indicator',
    title: 'Daily Growth & Yield Momentum',
    description: 'Monitor your portfolio compounding rate. Active VIP subscriptions generate steady daily returns.',
    position: 'bottom'
  },
  {
    targetId: 'dashboard-product-list',
    title: 'VIP Investment Plans',
    description: 'Choose from structured VIP subscription modules. Note that withdrawals remain locked until your active subscription finishes.',
    position: 'top'
  },
  {
    targetId: 'quick-actions-fab',
    title: 'Instant Cash Actions FAB',
    description: 'Tap this action button to deposit funds or submit withdrawal requests.',
    position: 'top'
  },
  {
    targetId: 'dashboard-nav-bar',
    title: 'Seamless Navigation Menu',
    description: 'Jump between Dashboard, Activity history, Referral Ambassador hub, and Profile Settings.',
    position: 'top'
  }
];

export default function GuidedTour({ userId, onClose, forceStart = false }: GuidedTourProps) {
  const storageKey = `onefundz_tour_completed_${userId}`;
  const [showPrompt, setShowPrompt] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({
    display: 'none',
    position: 'fixed' as const,
  });

  const activeElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (forceStart) {
      setIsActive(true);
      setCurrentStep(0);
      setShowPrompt(false);
      return;
    }

    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, forceStart, storageKey]);

  const updateHighlight = () => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const element = document.getElementById(step.targetId);

    if (element) {
      activeElementRef.current = element;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          position: 'fixed' as const,
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '16px',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 25px 5px rgba(234, 179, 8, 0.35)',
          zIndex: 998,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        });
      }, 150);
    } else {
      setHighlightStyle({
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        width: '0px',
        height: '0px',
        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
        zIndex: 998,
        pointerEvents: 'none',
      });
    }
  };

  useEffect(() => {
    if (isActive) {
      updateHighlight();
      window.addEventListener('resize', updateHighlight);
      window.addEventListener('scroll', updateHighlight);
    }
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [isActive, currentStep]);

  const handleStartTour = () => {
    setShowPrompt(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleSkipOrReject = () => {
    localStorage.setItem(storageKey, 'true');
    setShowPrompt(false);
    setIsActive(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsActive(false);
    if (onClose) onClose();
  };

  const getCardPosition = () => {
    if (!isActive) return {};
    const step = TOUR_STEPS[currentStep];
    const element = document.getElementById(step.targetId);
    if (!element) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
      };
    }

    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const isBottom = spaceBelow > 260;

    return {
      top: isBottom ? rect.bottom + 16 : undefined,
      bottom: !isBottom ? (window.innerHeight - rect.top) + 16 : undefined,
      left: '50%',
      transform: 'translateX(-50%)',
      position: 'fixed' as const,
      width: 'calc(100% - 32px)',
      maxWidth: '380px',
    };
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <React.Fragment>
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[9999] pointer-events-auto" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-900 border border-yellow-500/30 rounded-2xl shadow-2xl p-5 z-[10000] text-white"
            id="guided-tour-initial-prompt"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="text-yellow-400 animate-pulse" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">Dashboard Assist</span>
                <h3 className="font-extrabold text-sm text-white mt-0.5">Welcome to OneFundz!</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  Would you like a quick interactive tour to highlight your wallet, vault balances, and subscription rules?
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkipOrReject}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSkipOrReject}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={handleStartTour}
                className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 transition text-slate-950 text-xs font-black px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-md"
              >
                Take Tour <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}

      {isActive && (
        <div className="fixed inset-0 z-[990] pointer-events-none">
          <div style={highlightStyle} />
          <div className="fixed inset-0 z-[997] pointer-events-auto bg-transparent" />

          <motion.div
            key={`tour-card-${currentStep}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={getCardPosition()}
            className="z-[999] pointer-events-auto bg-slate-900/95 dark:bg-slate-900/95 border border-yellow-500/25 rounded-2xl p-5 text-white shadow-2xl backdrop-blur-md"
            id="guided-tour-active-card"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 select-none text-[9px] font-bold">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  {TOUR_STEPS[currentStep].position === 'top' ? (
                    <ArrowDown size={11} className="text-yellow-400 animate-bounce" />
                  ) : (
                    <ArrowUp size={11} className="text-yellow-400 animate-bounce" />
                  )}
                  Focus
                </span>
              </div>
              
              <button
                type="button"
                className="text-slate-400 hover:text-white transition p-1 rounded-full hover:bg-white/5"
                onClick={handleSkipOrReject}
                title="Cancel Tour"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-400 shrink-0" />
                {TOUR_STEPS[currentStep].title}
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 shadow-inner">
                {TOUR_STEPS[currentStep].description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSkipOrReject}
                className="text-slate-400 hover:text-white text-[10px] uppercase font-bold tracking-wider transition underline decoration-dotted"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="p-1 px-2.5 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 text-xs text-white transition flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Back
                </button>
                
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    'Complete'
                  ) : (
                    <>
                      Next <ChevronRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
