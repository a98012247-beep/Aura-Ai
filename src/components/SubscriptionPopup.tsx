import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, MessageCircle, Crown } from 'lucide-react';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({ isOpen, onClose }) => {
  const whatsappNumber = "+92324877900";
  const whatsappMessage = encodeURIComponent("Hi, I want to get Awavox AI Studio Pro Lifetime Access for 2999 PKR. Please share the payment details and access process. I also want the complete guide video and free private WhatsApp group membership.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const benefits = [
    "Unlimited Text-to-Speech",
    "Unlimited Voice Generation",
    "Unlimited Voice Cloning",
    "Realistic, natural-sounding voices",
    "Generate long-form voiceovers in a single script",
    "Support for 1-hour, 2-hour & 3-hour voice generation",
    "Full Voice Library",
    "Video Guide & Private Community Access"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white border border-neutral-200/85 rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 md:p-10 flex flex-col items-center">
              {/* Header Icon */}
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100 mb-6 shadow-sm">
                <Crown className="w-7 h-7 text-purple-600" />
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 text-center leading-tight mb-2">
                Get Unlimited <span className="font-serif italic font-normal text-purple-600 block sm:inline">Voice Generation</span>
              </h2>
              
              {/* Price Section */}
              <div className="flex flex-col items-center gap-1 mt-2 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 line-through">10,000 PKR Regular Price</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-neutral-900">2,999 PKR</span>
                  <div className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg uppercase tracking-tighter border border-purple-200">
                    One-time
                  </div>
                </div>
              </div>

              {/* Benefits List */}
              <div className="w-full space-y-3.5 mb-10">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-[13px] md:text-sm font-semibold text-neutral-700 leading-snug">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4.5 rounded-full text-[15px] font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
              >
                <MessageCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                Get Lifetime Access
              </a>

              {/* Support Info */}
              <p className="mt-6 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                Direct Support via WhatsApp
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
