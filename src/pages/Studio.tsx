import React, { useEffect, useState } from 'react';
import { useGenerationStore } from '../store/generation';
import { Play, Download, Loader2, Disc3, RotateCcw, Mic, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettingsStore, PRESET_PROFILES } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

export default function StudioPage() {
  const { draftScript, updateDraftScript } = useProjectsStore();
  const text = draftScript;
  const setText = updateDraftScript;
  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);

  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';

  const { isGenerating, progress, error, finalAudioUrl, generate, currentChunk, totalChunks, statusText, reset } = useGenerationStore();

  useEffect(() => {
    if (error && (error.includes('PRO_REQUIRED') || error.toLowerCase().includes('pro subscription'))) {
      setShowSubscription(true);
    }
  }, [error]);
  const getActiveKey = useSettingsStore(state => state.getActiveKey);
  const apiKeys = useSettingsStore(state => state.apiKeys);
  const activeKeyData = apiKeys.find(k => k.key === getActiveKey());
  const activeVoiceName = activeKeyData?.voiceName || 'Default Aura Voice';
  const voiceProfiles = useSettingsStore(state => state.voiceProfiles);

  const safeString = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  const generateFilename = () => {
    if (!activeKeyData) return `aura-narration-${Date.now()}.mp3`;
    
    const profileName = PRESET_PROFILES.find(p => p.id === activeKeyData.activeProfileId)?.name 
      || voiceProfiles.find(p => p.id === activeKeyData.activeProfileId)?.name 
      || "Custom Profile";

    const vName = safeString(activeKeyData.voiceName || 'voice');
    const pName = safeString(profileName);
    const platformName = 'cartesia';
    const aName = safeString(activeKeyData.name || 'api');

    return `${vName}-${pName}-${platformName}-${aName}-${Date.now()}.mp3`;
  };

  const [activeCredits, setActiveCredits] = React.useState<{used: number, total: number, tier: string} | null>(null);

  useEffect(() => {
    async function loadCredits() {
       if (activeKeyData?.key) {
          try {
            const { fetchSubscription } = await import('../services/elevenlabs');
            const data = await fetchSubscription(activeKeyData.key);
            setActiveCredits({
               used: data.character_count || 0,
               total: data.character_limit || 0,
               tier: data.tier || 'Cartesia API'
            });
          } catch(e) {
            console.error('Failed to load active credits:', e);
          }
       } else {
          setActiveCredits(null);
       }
    }
    loadCredits();
  }, [activeKeyData?.key]);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { cinematicSettings } = useSettingsStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = cinematicSettings.speed;
    }
  }, [finalAudioUrl, cinematicSettings.speed]);

  const charCount = text.length;

  const handleGenerate = () => {
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
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">Awavox <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">Studio</span></h2>
            <p className="text-neutral-500 font-medium text-xs mt-1">
              Professional voice generation and cloning.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl rounded-[1.25rem] border border-white p-2.5 shadow-[0_8px_16px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden group w-full md:w-auto">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl pointer-events-none group-focus-within:bg-purple-400/20 transition-colors duration-700"></div>
            
            <div className="hidden lg:block border-r border-neutral-200/60 pr-4 pl-2 relative z-10">
              <h2 className="text-sm font-extrabold text-neutral-900 drop-shadow-sm">Bring Words, <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">To Life</span></h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-start gap-4 relative z-10 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]">
                  <Mic className="w-4 h-4 drop-shadow-sm" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-500 mb-0.5">Voice Profile</div>
                  <div className="font-extrabold text-neutral-900 text-xs drop-shadow-sm leading-none">{activeVoiceName}</div>
                  <div className="text-[9px] font-bold text-neutral-400 mt-0.5">High Quality TTS</div>
                </div>
              </div>
              <button 
                onClick={() => setIsVoicePickerOpen(true)}
                className="text-[10px] font-black text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-purple-100"
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
              <div className="bg-red-50/90 backdrop-blur-md border border-red-200/80 text-red-700 font-bold px-6 py-4 rounded-2xl text-sm shadow-[0_4px_12px_rgba(239,68,68,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {error}
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
            className="relative w-full max-w-md h-full bg-white border-l border-neutral-200 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900">Select Voice</h3>
                <p className="text-xs text-neutral-500 font-medium">Choose a voice for generation</p>
              </div>
              <button 
                onClick={() => setIsVoicePickerOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Fallback/Mock Voice List */}
              {[
                { id: '92579402-6868-412e-b845-3efed0be7a9e', name: 'Jade - Steady Companion' },
                { id: 'b7d50908-b17c-442d-ad8d-810c63997ed9', name: 'Dan - Deep Warm' },
                { id: '694f9389-aac1-45b6-b726-9d9369183238', name: 'Sarah - Bright Energetic' },
                { id: '11111111-1111-1111-1111-111111111111', name: 'Marcus - Authoritative' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    if (activeKeyData) {
                      useSettingsStore.getState().updateApiKeyVoice(activeKeyData.id, v.id, v.name);
                    }
                    setIsVoicePickerOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${activeKeyData?.voiceId === v.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-neutral-100 hover:border-purple-200 hover:bg-neutral-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeKeyData?.voiceId === v.id ? 'bg-purple-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-500'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-extrabold text-sm ${activeKeyData?.voiceId === v.id ? 'text-purple-900' : 'text-neutral-900'}`}>{v.name}</h4>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-0.5">High Quality</p>
                  </div>
                </button>
              ))}
              
              <div className="mt-8 text-center p-6 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed">
                <p className="text-xs text-neutral-500 font-medium mb-3">Want more voices?</p>
                <button 
                  onClick={() => window.location.href = '/voices'}
                  className="bg-white text-neutral-900 border border-neutral-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-50 shadow-sm transition-colors"
                >
                  Browse Voice Library
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
