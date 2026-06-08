import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles, HelpCircle, Eye, ArrowUp, ArrowDown } from 'lucide-react';

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
    title: 'Cooperative Identity Hub',
    description: 'This is your verified member profile index. It showcases your custom Username, registered Email Address, and instant ID designation within the ONEFUNDZ Cooperative network.',
    position: 'bottom'
  },
  {
    targetId: 'asset-balance-card',
    title: 'Secure Asset Balance Card',
    description: 'This panel shows your current NGN cash balance. It aggregates raw wallet deposits along with active investment interests generated progressively every 24 hours.',
    position: 'bottom'
  },
  {
    targetId: 'daily-growth-indicator',
    title: 'Daily Compound Rate Growth',
    description: 'Monitor your portfolio performance multiplier over the last 7 days. High active subscription levels spark positive continuous indicators for visual verification.',
    position: 'bottom'
  },
  {
    targetId: 'dashboard-product-list',
    title: 'Cooperative Yield Plans',
    description: 'Scroll through and acquire high-performance, risk-managed cooperative plans (VIP 1 through VIP 10). Starting at ₦4,000, each tier boosts your cumulative daily payout potential.',
    position: 'top'
  },
  {
    targetId: 'quick-actions-fab',
    title: 'Instant Cash Actions FAB',
    description: 'Tap this expanding action button to deposit funds or initialize fast settlements. Supported by standard payment channels for safe processing.',
    position: 'top'
  },
  {
    targetId: 'dashboard-nav-bar',
    title: 'Seamless Navigation Menu',
    description: 'Effortlessly jump between the initial Dashboard, complete Activities/Transaction histories, the referral Cooperative team center, or customizable settings inside Mine.',
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

  // Check if tour should run
  useEffect(() => {
    if (forceStart) {
      setIsActive(true);
      setCurrentStep(0);
      setShowPrompt(false);
      return;
    }

    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Show the introductory banner layout after a 1.5s delay on first login
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, forceStart, storageKey]);

  // Recalculate highlighted element boundaries
  const updateHighlight = () => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const element = document.getElementById(step.targetId);

    if (element) {
      activeElementRef.current = element;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Give browser some ms to settle scrolling
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          position: 'fixed' as const,
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '16px',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 25px 5px rgba(147, 51, 234, 0.35)',
          zIndex: 998,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        });
      }, 150);
    } else {
      // If element is not found on current page layout, center default helper
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

  // Safe layout card calculation based on highlight position
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
    const isBottom = spaceBelow > 260; // Card needs about 240px height

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
      {/* 1. INITIAL SYSTEM PROMPT BANNER */}
      {showPrompt && (
        <React.Fragment>
          {/* Black Backdrop to minimize layout distraction */}
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[9999] pointer-events-auto" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-5 z-[10000] text-white"
            id="guided-tour-initial-prompt"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="text-purple-400 animate-pulse" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Dashboard Assist</span>
                <h3 className="font-extrabold text-sm text-white mt-0.5">Welcome to ONEFUNDZ!</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  Would you like a quick interactive tour to highlight your wallet, daily compounds, and VIP packages?
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
                className="bg-purple-600 hover:bg-purple-700 active:scale-95 transition text-white text-xs font-extrabold px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-purple-900/30"
              >
                Take Tour <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}

      {/* 2. ACTIVE TOUR VIEW OVERLAY */}
      {isActive && (
        <div className="fixed inset-0 z-[990] pointer-events-none">
          {/* Spotlight highlight overlay */}
          <div style={highlightStyle} />

          {/* Transparent interactive block to capture layout clicks so user cannot click outer objects during tour */}
          <div className="fixed inset-0 z-[997] pointer-events-auto bg-transparent" />

          {/* Tour Help Modal Card Panel */}
          <motion.div
            key={`tour-card-${currentStep}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={getCardPosition()}
            className="z-[999] pointer-events-auto bg-slate-900/95 dark:bg-slate-900/95 border border-purple-500/25 rounded-2xl p-5 text-white shadow-2xl backdrop-blur-md"
            id="guided-tour-active-card"
          >
            {/* Navigation Card Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 select-none text-[9px] font-bold">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  {TOUR_STEPS[currentStep].position === 'top' ? (
                    <ArrowDown size={11} className="text-purple-400 animate-bounce" />
                  ) : (
                    <ArrowUp size={11} className="text-purple-400 animate-bounce" />
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

            {/* Instruction Description details */}
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                {TOUR_STEPS[currentStep].title}
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 shadow-inner">
                {TOUR_STEPS[currentStep].description}
              </p>
            </div>

            {/* Footer Commands */}
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
                  className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
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
