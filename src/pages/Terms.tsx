import React from 'react';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 drop-shadow-sm flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-500" />
          Terms of Service
        </h1>
        <p className="mt-2 text-neutral-500 font-bold">Please read these terms carefully.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
        <div className="prose prose-neutral max-w-none text-sm text-neutral-700 space-y-4">
          <h3 className="font-extrabold text-neutral-900">1. Acceptance of Terms</h3>
          <p>By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          
          <h3 className="font-extrabold text-neutral-900">2. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Awavox AI Studio's website for personal, non-commercial transitory viewing only.</p>
          
          <h3 className="font-extrabold text-neutral-900">3. Disclaimer</h3>
          <p>The materials on Awavox AI Studio's website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </div>
      </div>
    </div>
  );
}
