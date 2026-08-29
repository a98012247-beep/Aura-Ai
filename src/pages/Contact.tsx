import React from 'react';
import { Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 drop-shadow-sm flex items-center gap-3">
          <Mail className="w-8 h-8 text-purple-500" />
          Contact Us
        </h1>
        <p className="mt-2 text-neutral-500 font-bold">We'd love to hear from you.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-1.5">Name</label>
            <input type="text" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none text-sm font-medium" placeholder="Your Name" />
          </div>
          <div>
            <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-1.5">Email</label>
            <input type="email" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none text-sm font-medium" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-1.5">Message</label>
            <textarea rows={4} className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none text-sm font-medium" placeholder="How can we help?"></textarea>
          </div>
          <button type="button" className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95">Send Message</button>
        </form>
      </div>
    </div>
  );
}
