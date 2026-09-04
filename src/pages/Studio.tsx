import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGenerationStore } from '../store/generation';
import { Play, Download, Loader2, Disc3, RotateCcw, Mic, Sparkles, Heart, List, LayoutGrid, X, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettingsStore, PRESET_PROFILES } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { useAuthStore } from '../store/auth';
import { useVoiceStore } from '../store/voices';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';
import { MASTER_CARTESIA_VOICES } from '../data/cartesiaVoices';

export default function StudioPage() {
  const navigate = useNavigate();
  const { draftScript, updateDraftScript } = useProjectsStore();
  const text = draftScript;
  const setText = updateDraftScript;
  const { user, memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const { voices: voicesData, fetchCartesiaVoices } = useVoiceStore();

  useEffect(() => {
    fetchCartesiaVoices();
  }, [fetchCartesiaVoices]);

  

  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';

  const { isGenerating, progress, error, finalAudioUrl, generate, currentChunk, totalChunks, statusText, reset } = useGenerationStore();

  useEffect(() => {
    if (error && (error.includes('PRO_REQUIRED') || error.toLowerCase().includes('pro subscription'))) {
      setShowSubscription(true);
    }
  }, [error]);

  const activeVoiceId = useSettingsStore(state => state.activeVoiceId);
  const activeVoiceName = useSettingsStore(state => state.activeVoiceName) || 'Default Aura Voice';
  const activeProfileId = useSettingsStore(state => state.activeProfileId);
  const voiceProfiles = useSettingsStore(state => state.voiceProfiles);

  const safeString = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const generateFilename = () => {
    const profileName = PRESET_PROFILES.find(p => p.id === activeProfileId)?.name
      || voiceProfiles.find(p => p.id === activeProfileId)?.name
      || "Custom Profile";
    const vName = safeString(activeVoiceName || 'voice');
    const pName = safeString(profileName);
    return `${vName}-${pName}-cartesia-${Date.now()}.mp3`;
  };

  const [activeCredits] = React.useState<{used: number, total: number, tier: string} | null>(null);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { cinematicSettings } = useSettingsStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = cinematicSettings.speed;
    }
  }, [finalAudioUrl, cinematicSettings.speed]);

  const charCount = text.length;

  const handleGenerate = () => {
    if (!user || user.uid === 'guest') {
      navigate('/account');
      return;
    }
    if (!isPro) {
      setShowSubscription(true);
      return;
    }
    generate(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col px-4 md:px-6 py-6"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
      
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">Awavox <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">Studio</span></h2>
            <p className="text-neutral-500 font-medium text-xs mt-1">
              Professional voice generation and cloning.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl rounded-[1rem] border border-white p-1.5 pl-1.5 pr-2.5 shadow-[0_8px_16px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden group w-full md:w-auto shrink-0">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl pointer-events-none group-focus-within:bg-purple-400/20 transition-colors duration-700"></div>
            
            <div className="flex items-center justify-between md:justify-start gap-4 relative z-10 w-full md:w-auto">
              <div className="flex items-center gap-2 pr-1">
                <div className="w-7 h-7 rounded-[0.4rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] shrink-0">
                  <Mic className="w-3.5 h-3.5 drop-shadow-sm" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-500 mb-0.5">Voice Profile</div>
                  <div className="font-extrabold text-neutral-900 text-[10px] drop-shadow-sm">{activeVoiceName}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsVoicePickerOpen(true)}
                className="text-[9px] font-black text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-all active:scale-95 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-purple-100 shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative w-full overflow-hidden z-10 space-y-4">
        
        {/* Editor Container */}
        <div className="flex-1 flex flex-col relative w-full p-4 md:p-8 overflow-hidden z-10">
          <div className="flex-1 bg-white rounded-[2rem] border border-neutral-200/80 shadow-[inset_0_4px_16px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.05)] relative flex flex-col overflow-hidden group">
            {/* Inner top shadow for depth */}
            <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none"></div>

            <textarea 
              placeholder="Type your script here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 w-full bg-transparent p-8 pb-32 text-neutral-800 font-medium placeholder:text-neutral-300 focus:outline-none transition-all resize-none leading-relaxed text-lg md:text-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-10 relative"
              spellCheck="false"
            />
            
            {/* Bottom Controls inside Editor */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-none">
               {/* Character Counter */}
               <div className="flex items-center gap-2 text-xs font-black text-neutral-400 bg-neutral-50/90 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)]">
                  <span className={charCount > (activeCredits?.total || 150000) ? 'text-red-500 drop-shadow-sm' : 'text-neutral-700'}>
                    {charCount.toLocaleString()}
                  </span>
                  <span>/</span>
                  <span>{activeCredits ? activeCredits.total.toLocaleString() : '150,000'} chars</span>
               </div>
               
               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating || charCount === 0 || (activeCredits && charCount > activeCredits.total)}
                 className="pointer-events-auto flex items-center justify-center gap-2 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white px-8 py-4 rounded-2xl text-base font-black shadow-[0_8px_20px_rgba(168,85,247,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(168,85,247,0.45),inset_0_2px_4px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] focus:ring-4 focus:ring-purple-300 focus:outline-none disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0 transition-all border border-purple-600"
               >
                 {isGenerating ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin text-white drop-shadow-sm" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <Disc3 className="w-5 h-5 text-purple-200 animate-spin-slow drop-shadow-sm" />
                     Generate Audio
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>

        {/* Status / Output Area */}
        <div className="shrink-0 p-4 md:p-8 pt-0 z-20">
           {error && (
              <div className="bg-red-50/90 backdrop-blur-md border border-red-200/80 text-red-700 font-bold px-6 py-4 rounded-2xl text-sm shadow-[0_4px_12px_rgba(239,68,68,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] flex flex-col items-start gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                  <span>{error.toLowerCase().includes('cartesia') || error.toLowerCase().includes('api') ? 'An error occurred during generation.' : error}</span>
                </div>
                <div className="text-xs text-red-600 ml-5">
                  Need help? <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-red-900">Contact support on WhatsApp</a>
                </div>
              </div>
           )}

           {isGenerating && (
             <div className="bg-white/80 border border-purple-200/50 p-6 rounded-[2rem] backdrop-blur-xl shadow-[0_12px_32px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-90"></div>
               <div className="flex justify-between text-xs font-black text-purple-900 mb-4 drop-shadow-sm">
                 <span>Processing audio synthesis</span>
                 <span>{progress}%</span>
               </div>
               <div className="h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200 shadow-inner">
                 <div 
                   className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)]" 
                   style={{ width: `${progress}%` }}
                 />
               </div>
               <p className="text-xs font-bold text-purple-600 mt-4 text-center tracking-wide drop-shadow-sm">
                  {statusText || 'Synthesizing ultra-realistic voice audio...'}
               </p>
             </div>
           )}

            {finalAudioUrl && !isGenerating && !error && (
             <div className="bg-white/80 border border-emerald-200/60 p-4 rounded-[2rem] backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4 shadow-[0_12px_32px_rgba(16,185,129,0.1),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-90"></div>
                <audio ref={audioRef} controls src={finalAudioUrl} className="w-full sm:flex-1 h-14 outline-none rounded-xl" />
                <a 
                  href={finalAudioUrl} 
                  download={generateFilename()}
                  className="flex w-full sm:w-auto justify-center items-center gap-2 px-8 py-4 bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white rounded-2xl text-sm font-black transition-all shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] border border-neutral-700 hover:-translate-y-1 active:translate-y-1 active:shadow-inner"
                >
                  <Download className="w-4 h-4 text-emerald-400 drop-shadow-sm" />
                  Save Audio
                </a>
             </div>
            )}
        </div>
      </div>
      </div>

      {/* Voice Picker Side Drawer */}
      {isVoicePickerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setIsVoicePickerOpen(false)}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm h-full bg-white border-l border-neutral-200 shadow-2xl flex flex-col rounded-l-[2rem] overflow-hidden"
          >
            {/* Header with Illustration */}
            <div className="relative p-6 border-b border-neutral-100 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 p-4 opacity-50">
                 <Mic className="w-16 h-16 text-purple-200" />
              </div>
              <div className="relative z-10 flex items-start justify-between pr-8">
                <div>
                  <h3 className="text-xl font-extrabold text-neutral-900 drop-shadow-sm flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> Select Voice
                  </h3>
                  <p className="text-xs text-neutral-500 font-bold mt-1">Choose a voice for generation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVoicePickerOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 bg-white/50 hover:bg-white rounded-lg transition-colors shadow-sm z-20"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
              {/* Favorites Section */}
              <div>
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Favorite Voices
                </h4>
                <div className="space-y-2">
                  {[
                    { id: '92579402-6868-412e-b845-3efed0be7a9e', name: 'Jade - Steady Companion' },
                    { id: 'b7d50908-b17c-442d-ad8d-810c63997ed9', name: 'Dan - Deep Warm' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        useSettingsStore.getState().setActiveVoice(v.id, v.name);
                        setIsVoicePickerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${activeVoiceId === v.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-neutral-100 hover:border-purple-200 hover:bg-purple-50/50'}`}
                    >
                      <div className="relative shrink-0">
                        <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${v.name}&backgroundColor=f3e8ff&mouth=smile,laughing`} alt={v.name} className="w-10 h-10 rounded-xl shadow-sm bg-purple-50 border border-purple-100/50" />
                        {activeVoiceId === v.id && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-extrabold text-xs truncate ${activeVoiceId === v.id ? 'text-purple-900' : 'text-neutral-900 group-hover:text-purple-700'}`}>{v.name}</h4>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-0.5">High Quality</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Voices Section */}
              <div>
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5 text-neutral-400" /> All Voices
                </h4>
                <div className="space-y-2">
                  {voicesData.slice(0, visibleCount).map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        useSettingsStore.getState().setActiveVoice(v.id, v.name);
                        setIsVoicePickerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${activeVoiceId === v.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-neutral-100 hover:border-purple-200 hover:bg-purple-50/50'}`}
                    >
                      <div className="relative shrink-0">
                        <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${v.name}&backgroundColor=f3e8ff&mouth=smile,laughing`} alt={v.name} className="w-10 h-10 rounded-xl shadow-sm bg-purple-50 border border-purple-100/50" />
                        {activeVoiceId === v.id && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-extrabold text-xs truncate ${activeVoiceId === v.id ? 'text-purple-900' : 'text-neutral-900 group-hover:text-purple-700'}`}>{v.name}</h4>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-0.5">High Quality</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {visibleCount < voicesData.length && (
                <div className="pt-4 mt-4 border-t border-neutral-100">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 24)}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-900 px-4 py-3 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
                  >
                    <span className="text-xs font-black">Load More</span>
                    <span className="text-[10px] text-neutral-400 font-bold">({voicesData.length - visibleCount} remaining)</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
