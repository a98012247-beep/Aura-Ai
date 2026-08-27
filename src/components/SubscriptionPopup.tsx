import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, MessageCircle, Crown, Star, Zap, Briefcase } from 'lucide-react';
import { PRICING_PLANS } from '../lib/pricing';
import { Link } from 'react-router';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({ isOpen, onClose }) => {
  const whatsappNumber = "+92324877900";

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Helper to map icon based on plan ID
  const getPlanIcon = (id: string) => {
    switch (id) {
      case 'free': return { icon: <Star className="w-6 h-6 text-neutral-600" />, bg: 'bg-neutral-100 border-neutral-200' };
      case 'starter': return { icon: <Zap className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' };
      case 'pro': return { icon: <Crown className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-50 border-amber-100' };
      case 'business': return { icon: <Briefcase className="w-6 h-6 text-rose-600" />, bg: 'bg-rose-50 border-rose-100' };
      default: return { icon: <Star className="w-6 h-6 text-neutral-600" />, bg: 'bg-neutral-100 border-neutral-200' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-neutral-50 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all z-20 shadow-sm"
              aria-label="Close pricing"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto w-full pt-8 pb-12 px-4 md:px-12">
              <div className="text-center mb-10 md:mb-12 mt-4">
                <h2 className="text-3xl md:text-5xl font-extrabold text-neutral-900 leading-tight mb-4">
                  Choose Your <span className="font-serif italic font-normal text-purple-600">Credit Plan</span>
                </h2>
                <p className="text-neutral-600 font-medium text-lg max-w-2xl mx-auto">
                  Simple monthly subscription for all your audio needs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {PRICING_PLANS.map((plan) => {
                  const { icon, bg } = getPlanIcon(plan.id);
                  return (
                    <div 
                      key={plan.id} 
                      className={`relative bg-white rounded-3xl border flex flex-col p-6 lg:p-8 transition-transform hover:-translate-y-1 ${plan.recommended ? 'border-amber-300 shadow-xl shadow-amber-500/10 ring-1 ring-amber-100' : 'border-neutral-200 shadow-md'}`}
                    >
                      {plan.recommended && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                          Most Popular
                        </div>
                      )}
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 ${bg}`}>
                        {icon}
                      </div>

                      <h3 className="text-2xl font-extrabold text-neutral-900 mb-1">{plan.name}</h3>
                      <p className="text-sm font-bold text-neutral-500 mb-6">{plan.formattedCredits}</p>

                      <div className="mb-8">
                        <span className="text-3xl font-black text-neutral-900">{plan.formattedPrice}</span>
                        <span className="text-xs font-bold text-neutral-500 block mt-1 uppercase tracking-widest">Per month</span>
                      </div>

                      <div className="flex-1 space-y-4 mb-8">
                        {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                              <Check className="w-3 h-3 text-emerald-600" />
                            </div>
                            <span className="text-sm font-medium text-neutral-700 leading-snug">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>

                      {plan.id === 'free' ? (
                        <Link
                          to="/studio"
                          onClick={onClose}
                          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold transition-all bg-neutral-100 hover:bg-neutral-200 text-neutral-900 shadow-sm"
                        >
                          Go to Studio
                        </Link>
                      ) : (
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in the Awavox ${plan.name} plan for ${plan.formattedPrice}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold transition-all ${plan.recommended ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Get {plan.name}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

