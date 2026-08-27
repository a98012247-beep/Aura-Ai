import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Play, Mic2, Star, CheckCircle2, ArrowRight, Sparkles, Waves, Shield, Pause, Zap, Crown, Briefcase, Globe2, FileText, MousePointerClick, Download, Youtube, Podcast, BookOpen, Target, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { PRICING_PLANS } from '../lib/pricing';

export default function Home() {
  const [showSubscription, setShowSubscription] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handlePlay = (id: number) => {
    setPlayingId(playingId === id ? null : id);
  };

  const openPricing = () => {
    setShowSubscription(true);
  };

  const getPlanIcon = (id: string) => {
    switch (id) {
      case 'free': return <Star className="w-6 h-6 text-neutral-600" />;
      case 'starter': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'pro': return <Crown className="w-6 h-6 text-amber-600" />;
      case 'business': return <Briefcase className="w-6 h-6 text-rose-600" />;
      default: return <Star className="w-6 h-6 text-neutral-600" />;
    }
  };

  return (
    <div className="flex flex-col w-full relative bg-transparent">
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />

      {/* 1. HERO (Light/Glassmorphism) */}
      <section className="relative pt-12 pb-8 md:pt-16 md:pb-12 px-4 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        
        {/* Decorative 3D elements floating behind hero */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-[40px] opacity-30 animate-pulse"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full blur-[60px] opacity-20"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 text-purple-700 text-[10px] font-black uppercase tracking-widest shadow-[0_4px_16px_rgba(168,85,247,0.15),inset_0_1px_4px_rgba(255,255,255,0.7)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500 drop-shadow-md" />
          <span>The Next Generation of Voice AI</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-neutral-900 leading-[1.05] max-w-5xl drop-shadow-md"
        >
          The AI Voice That <br className="hidden md:block" /> <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 drop-shadow-[0_2px_12px_rgba(168,85,247,0.3)]">Sounds Real.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-sm md:text-base text-neutral-600 font-medium max-w-2xl leading-relaxed"
        >
          Create ultra-realistic AI voices for documentaries, podcasts, and videos. Clone voices instantly or generate long-form voiceovers from a single script.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button 
            onClick={() => navigate('/studio')}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white rounded-full text-sm font-bold shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_4px_8px_rgba(0,0,0,0.4)] transition-all flex items-center justify-center gap-2 border border-neutral-700"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('pricing-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3 bg-white/70 backdrop-blur-md hover:bg-white text-neutral-900 border border-white/80 rounded-full text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-inner transition-all flex items-center justify-center gap-2"
          >
            View Pricing
          </button>
        </motion.div>
      </section>

      {/* NEW: STATS BAR */}
      <section className="w-full bg-neutral-900 border-y border-neutral-800 py-6 relative z-10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
              <Mic2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-black text-lg">10,000+</div>
              <div className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Voiceovers</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-900/50 flex items-center justify-center border border-pink-500/30">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <div className="text-white font-black text-lg">500+</div>
              <div className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">AI Voices</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center border border-amber-500/30">
              <Globe2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-white font-black text-lg">50+</div>
              <div className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR VOICES */}
      <section className="py-12 md:py-16 relative w-full overflow-hidden bg-gradient-to-b from-transparent to-white/30 backdrop-blur-sm border-t border-white/50">
        <div className="max-w-6xl mx-auto px-4 text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 drop-shadow-sm">Premium <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Voices.</span></h2>
          <p className="mt-2 text-neutral-600 font-medium text-xs md:text-sm max-w-2xl mx-auto">
            Listen to our most popular AI voices, engineered for realism and emotion.
          </p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
            {[
              { name: 'Marcus - Deep Narration', style: 'Authoritative, Calm', gender: 'Male', accent: 'American' },
              { name: 'Sarah - Conversational', style: 'Warm, Engaging', gender: 'Female', accent: 'British' },
              { name: 'Elias - Storyteller', style: 'Expressive, Dynamic', gender: 'Male', accent: 'American' },
              { name: 'Elena - Professional', style: 'Clear, Trustworthy', gender: 'Female', accent: 'Australian' }
            ].map((voice, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[2rem] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,1)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                {idx === 0 && (
                   <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-amber-500 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-md border-b border-l border-amber-300">
                     Most Popular
                   </div>
                )}
                <div className="flex items-start justify-between mb-3 mt-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-400 group-hover:text-purple-600 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)]">
                    <Mic2 className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <button 
                    onClick={() => handlePlay(idx + 10)}
                    className="w-10 h-10 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] border border-neutral-700"
                  >
                    {playingId === idx + 10 ? <Pause className="w-4 h-4 fill-current drop-shadow-md" /> : <Play className="w-4 h-4 ml-0.5 fill-current drop-shadow-md" />}
                  </button>
                </div>
                <div className="flex-1 mt-2">
                  <h4 className="font-extrabold text-lg text-neutral-900 mb-1 line-clamp-1 drop-shadow-sm">{voice.name}</h4>
                  <p className="text-neutral-500 text-xs font-medium">{voice.style}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-lg text-[9px] font-bold text-neutral-600 uppercase tracking-wider shadow-[0_2px_4px_rgba(0,0,0,0.02)]">{voice.gender}</span>
                  <span className="px-2 py-0.5 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-lg text-[9px] font-bold text-neutral-600 uppercase tracking-wider shadow-[0_2px_4px_rgba(0,0,0,0.02)]">{voice.accent}</span>
                </div>
              </div>
            ))}
          </div>
      </section>

      {/* NEW: HOW IT WORKS */}
      <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto w-full bg-transparent">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 drop-shadow-sm">
            How It <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Works.</span>
          </h2>
          <p className="mt-2 text-neutral-600 font-medium text-xs md:text-sm max-w-2xl mx-auto">
            From script to studio-quality audio in seconds.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-neutral-200/60 -z-10 -translate-y-1/2"></div>
          
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative group">
            <div className="w-12 h-12 bg-white border border-neutral-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-extrabold mb-2 text-neutral-900">1. Write Script</h3>
            <p className="text-center text-neutral-500 font-medium text-xs">Paste or type your script into the editor.</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative group">
            <div className="w-12 h-12 bg-white border border-neutral-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-extrabold mb-2 text-neutral-900">2. Choose Voice</h3>
            <p className="text-center text-neutral-500 font-medium text-xs">Select from our premium AI voice library.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative group">
            <div className="w-12 h-12 bg-white border border-neutral-100 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-extrabold mb-2 text-neutral-900">3. Generate</h3>
            <p className="text-center text-neutral-500 font-medium text-xs">Instantly generate and download your audio.</p>
          </div>
        </div>
      </section>

      {/* 4. FEATURES (3D Panels) */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full bg-transparent">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 drop-shadow-sm">
            Everything you need for <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">voice generation.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-90"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-white to-neutral-50 border border-neutral-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
              <Waves className="w-5 h-5 drop-shadow-sm" />
            </div>
            <h3 className="text-sm font-extrabold mb-2 text-neutral-900 drop-shadow-sm">Ultra-Realistic</h3>
            <p className="text-neutral-500 font-medium leading-relaxed text-xs">Captures breath, pacing, and human emotion perfectly.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-90"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-white to-neutral-50 border border-neutral-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
              <Zap className="w-5 h-5 drop-shadow-sm" />
            </div>
            <h3 className="text-sm font-extrabold mb-2 text-neutral-900 drop-shadow-sm">Instant Generation</h3>
            <p className="text-neutral-500 font-medium leading-relaxed text-xs">From script to studio-quality audio in milliseconds.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-400 opacity-90"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-white to-neutral-50 border border-neutral-100 text-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
              <Sparkles className="w-5 h-5 drop-shadow-sm" />
            </div>
            <h3 className="text-sm font-extrabold mb-2 text-neutral-900 drop-shadow-sm">Voice Cloning</h3>
            <p className="text-neutral-500 font-medium leading-relaxed text-xs">Replicate any voice with just a 3-second audio sample.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400 opacity-90"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-white to-neutral-50 border border-neutral-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)]">
              <Shield className="w-5 h-5 drop-shadow-sm" />
            </div>
            <h3 className="text-sm font-extrabold mb-2 text-neutral-900 drop-shadow-sm">Commercial Rights</h3>
            <p className="text-neutral-500 font-medium leading-relaxed text-xs">Full ownership of your generated audio. No royalties.</p>
          </div>
        </div>
      </section>

      {/* NEW: USE CASES */}
      <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto w-full bg-transparent">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 drop-shadow-sm">
            Built for Every <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Creator.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
            <Youtube className="w-8 h-8 text-red-500 mb-4 drop-shadow-sm" />
            <h3 className="text-lg font-extrabold mb-2 text-neutral-900">YouTube Creators</h3>
            <p className="text-neutral-500 font-medium text-xs">Automate channel voiceovers.</p>
          </div>
          <div className="bg-gradient-to-br from-white/90 to-pink-50/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
            <Podcast className="w-8 h-8 text-pink-500 mb-4 drop-shadow-sm" />
            <h3 className="text-lg font-extrabold mb-2 text-neutral-900">Podcasters</h3>
            <p className="text-neutral-500 font-medium text-xs">Generate intros, ads & episodes.</p>
          </div>
          <div className="bg-gradient-to-br from-white/90 to-amber-50/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
            <BookOpen className="w-8 h-8 text-amber-500 mb-4 drop-shadow-sm" />
            <h3 className="text-lg font-extrabold mb-2 text-neutral-900">Audiobooks</h3>
            <p className="text-neutral-500 font-medium text-xs">Convert text to full books instantly.</p>
          </div>
          <div className="bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
            <Target className="w-8 h-8 text-emerald-500 mb-4 drop-shadow-sm" />
            <h3 className="text-lg font-extrabold mb-2 text-neutral-900">Marketers</h3>
            <p className="text-neutral-500 font-medium text-xs">Create scalable localized ad copy.</p>
          </div>
        </div>
      </section>

      {/* NEW: TESTIMONIALS */}
      <section className="py-12 md:py-16 w-full relative bg-neutral-900 border-y border-neutral-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-sm">
              Loved by <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Creators.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Awavox changed how I make videos. The voices sound so natural my audience thought I hired a real actor.", author: "Alex R.", role: "YouTuber" },
              { text: "Incredible quality and emotion. I generated an entire 5-hour audiobook in just a few clicks.", author: "Sarah M.", role: "Author" },
              { text: "The commercial rights being included is huge for our marketing agency. We use it for every ad campaign.", author: "David T.", role: "Creative Director" }
            ].map((testi, i) => (
              <div key={i} className="bg-neutral-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-neutral-700 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-70"></div>
                <Quote className="w-8 h-8 text-neutral-600 mb-4" />
                <p className="text-neutral-300 font-medium text-sm leading-relaxed mb-6">"{testi.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{testi.author}</div>
                    <div className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">{testi.role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section id="pricing-section" className="py-12 md:py-16 px-4 w-full relative">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 drop-shadow-sm">Simple, Transparent <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Pricing.</span></h2>
          <p className="mt-2 text-neutral-600 font-medium text-xs md:text-sm max-w-2xl mx-auto">
            Simple monthly subscriptions. Cancel anytime.
          </p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-end">
            {PRICING_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`bg-white/90 backdrop-blur-2xl border rounded-[2rem] p-5 flex flex-col relative transition-all duration-300 ${
                  plan.recommended 
                    ? 'border-amber-300/80 shadow-[0_16px_32px_rgba(245,158,11,0.15),inset_0_2px_4px_rgba(255,255,255,1)] md:-translate-y-3 lg:scale-105 z-20' 
                    : 'border-white shadow-[0_8px_16px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] z-10'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber-400 to-amber-500 text-white px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-[0_4px_8px_rgba(245,158,11,0.3)] whitespace-nowrap border border-amber-300">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4 mt-1">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] border ${plan.recommended ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : 'bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200'}`}>
                      {getPlanIcon(plan.id)}
                   </div>
                   <h3 className="text-base font-extrabold text-neutral-900 drop-shadow-sm">{plan.name}</h3>
                </div>
                
                <p className="text-neutral-500 text-[9px] font-black mb-1.5 tracking-wide uppercase">{plan.formattedCredits}</p>
                <div className="text-2xl font-black text-neutral-900 mb-0.5 drop-shadow-sm tracking-tight">{plan.formattedPrice}</div>
                <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-6">Per month</div>
                
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.slice(0, 3).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] font-bold text-neutral-700 leading-tight">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 drop-shadow-sm ${plan.recommended ? 'text-amber-500' : 'text-emerald-500'}`} /> 
                      {feat}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={plan.id === 'free' ? () => navigate('/studio') : openPricing} 
                  className={`w-full py-2.5 px-3 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 border ${
                    plan.recommended 
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] border-amber-400' 
                      : 'bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] border-neutral-700'
                  }`}
                >
                  {plan.id === 'free' ? 'Go to Studio' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
             <p className="text-neutral-500 font-bold text-xs bg-white/50 inline-block px-5 py-2 rounded-full backdrop-blur-sm border border-neutral-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">Have questions? Check our <a href="#faq-section" className="text-purple-600 font-extrabold hover:underline">FAQ</a>.</p>
          </div>
      </section>

      {/* 6. FAQ (Glassmorphism) */}
      <section id="faq-section" className="py-12 px-4 max-w-2xl mx-auto w-full bg-transparent">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 drop-shadow-sm">
            Frequently Asked <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Questions.</span>
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { q: "Can I use the generated audio for commercial projects?", a: "Yes, all our paid tiers include full commercial rights. You can use the audio in YouTube videos, podcasts, ads, and more." },
            { q: "How does the pricing work?", a: "We offer simple monthly subscriptions. Your character credits refresh every month, and you can cancel anytime." },
            { q: "Can I try before I buy?", a: "Yes! Our Free tier gives you 10,000 characters and access to our basic voices so you can test the quality." }
          ].map((faq, i) => (
            <div 
              key={i} 
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-[2rem] hover:border-purple-200/50 hover:shadow-[0_12px_24px_rgba(168,85,247,0.05),inset_0_2px_4px_rgba(255,255,255,1)] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.8)] cursor-pointer"
            >
              <div className="flex justify-between items-center gap-4">
                <h4 className="font-extrabold text-base text-neutral-900 drop-shadow-sm">{faq.q}</h4>
                <div className={`transform transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <motion.div 
                initial={false}
                animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0, marginTop: openFaq === i ? 12 : 0 }}
                className="overflow-hidden"
              >
                <p className="text-neutral-500 font-medium text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA / FOOTER */}
      <section className="py-12 md:py-16 px-4 max-w-4xl mx-auto w-full text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 drop-shadow-md relative z-10">
          Hear It. Then <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Own It.</span>
        </h2>
        <p className="mt-3 text-sm md:text-base text-neutral-600 font-medium max-w-2xl mx-auto relative z-10">
          Join thousands of creators using Awavox to bring their stories to life with ultra-realistic AI voices.
        </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 relative z-10">
            <button 
              onClick={() => navigate('/studio')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-b from-white to-neutral-200 hover:from-white hover:to-white text-neutral-900 rounded-xl text-sm font-black shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-inner transition-all flex items-center justify-center gap-2 border border-white"
            >
              Get Started Now <ArrowRight className="w-4 h-4 drop-shadow-sm" />
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('pricing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 bg-neutral-800/80 backdrop-blur-md hover:bg-neutral-700 text-white rounded-xl text-sm font-black shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-1 active:shadow-inner transition-all flex items-center justify-center gap-2 border border-neutral-700"
            >
              View Pricing
            </button>
          </div>
      </section>
    </div>
  );
}
