import React from 'react';
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 drop-shadow-sm flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-500" />
          Privacy Policy
        </h1>
        <p className="mt-2 text-neutral-500 font-bold">How we protect your data.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
        <div className="prose prose-neutral max-w-none text-sm text-neutral-700 space-y-4">
          <h3 className="font-extrabold text-neutral-900">Data Collection</h3>
          <p>We collect information that you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us for support. The types of information we may collect include your name, email address, postal address, and phone number.</p>
          
          <h3 className="font-extrabold text-neutral-900">Data Usage</h3>
          <p>We use the information we collect to operate, maintain, and improve our services, as well as to communicate with you about updates, offers, and promotions.</p>
          
          <h3 className="font-extrabold text-neutral-900">Data Protection</h3>
          <p>We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.</p>
        </div>
      </div>
    </div>
  );
}
