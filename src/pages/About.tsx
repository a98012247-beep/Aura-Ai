import React from 'react';
import { Info } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 drop-shadow-sm flex items-center gap-3">
          <Info className="w-8 h-8 text-purple-500" />
          About Us
        </h1>
        <p className="mt-2 text-neutral-500 font-bold">Discover our mission and journey.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
        <div className="prose prose-neutral max-w-none text-neutral-700">
          <p>
            Welcome to Awavox AI Studio. We are dedicated to providing the most advanced, realistic, and expressive AI voices in the world. Our platform empowers creators, developers, and businesses to bring their content to life with stunning audio quality.
          </p>
          <p className="mt-4">
            Our mission is to break down the barriers of voice synthesis, making it accessible, intuitive, and seamlessly integrated into your workflow. Whether you're building a game, narrating an audiobook, or creating dynamic applications, Awavox is your perfect partner.
          </p>
        </div>
      </div>
    </div>
  );
}
