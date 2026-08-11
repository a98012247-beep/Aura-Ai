import React, { useEffect } from 'react';
import { useGenerationStore } from '../store/generation';
import { Play, Download, Loader2, Disc3, RotateCcw, Mic, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettingsStore, PRESET_PROFILES } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { motion } from 'motion/react';

export default function StudioPage() {
  const { draftScript, updateDraftScript } = useProjectsStore();
  const text = draftScript;
  const setText = updateDraftScript;

  const { isGenerating, progress, error, finalAudioUrl, generate, currentChunk, totalChunks, statusText, reset } = useGenerationStore();
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
    const platformName = safeString(activeKeyData.provider || 'elevenlabs');
    const aName = safeString(activeKeyData.name || 'api');

    return `${vName}-${pName}-${platformName}-${aName}-${Date.now()}.mp3`;
  };

  const [activeCredits, setActiveCredits] = React.useState<{used: number, total: number, tier: string} | null>(null);

  useEffect(() => {
    async function loadCredits() {
       if (activeKeyData?.key && (!activeKeyData.provider || activeKeyData.provider === 'elevenlabs')) {
          try {
            const { fetchSubscription } = await import('../services/elevenlabs');
            const data = await fetchSubscription(activeKeyData.key);
            setActiveCredits({
               used: data.character_count || 0,
               total: data.character_limit || 0,
               tier: data.tier || 'unknown'
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
    generate(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8"
    >
      
      {/* Header Area */}
      <div className="space-y-3 text-center md:text-left flex flex-col items-center md:items-start pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          Awavox AI Studio
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900">Bring Words, <span className="font-serif italic font-normal text-purple-600">To Life</span></h2>
        <p className="text-neutral-600 font-medium text-sm md:text-base max-w-xl leading-relaxed">
          Unlimited voice generation and cloning. Write or paste your script below to experience the next generation of voice AI.
        </p>
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 pt-2 text-xs font-semibold text-neutral-700">
           <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-neutral-200 rounded-full shadow-xs">
             <Mic className="w-3.5 h-3.5 text-purple-600" />
             <span className="text-neutral-900 font-bold">Active Voice: {activeVoiceName}</span>
           </div>
           {activeCredits && (
             <div className="flex flex-wrap items-center gap-2">
               <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-200 rounded-full shadow-xs text-blue-900">
                 <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
                 <span className="font-bold">{activeCredits.total ? `${Math.max(0, activeCredits.total - activeCredits.used).toLocaleString()} credits remaining` : 'Unlimited'}</span>
               </div>
               <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-amber-200 rounded-full shadow-xs text-amber-900 pointer-events-none">
                 <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.4)]"></span>
                 <span className="font-bold">
                   {(() => {
                     const resetDateMs = activeKeyData?.resetDate;
                     if (!resetDateMs) return 30;
                     let remainingMs = resetDateMs - Date.now();
                     while (remainingMs < 0) {
                        remainingMs += 30 * 24 * 60 * 60 * 1000;
                     }
                     return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                   })()} days left
                 </span>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative group flex-1 min-h-[45vh] flex flex-col">
        <div className="absolute inset-0 bg-white/90 rounded-3xl border border-neutral-200/80 backdrop-blur-3xl transition-all duration-500 pointer-events-none shadow-2xl"></div>
        
        <div className="flex-1 flex flex-col relative w-full p-1">
          <textarea 
            placeholder="Type your script here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full bg-transparent p-6 pb-20 md:p-8 md:pb-24 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none transition-all resize-none leading-relaxed text-base md:text-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            spellCheck="false"
          />
          
          {/* Desktop Generate Button */}
          <div className="hidden md:block absolute bottom-6 right-6 z-10 pointer-events-none">
             <button 
               onClick={handleGenerate}
               disabled={isGenerating || charCount === 0}
               className="pointer-events-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-3.5 rounded-full text-sm font-bold shadow-xl hover:scale-105 active:scale-95 focus:ring-2 focus:ring-neutral-400 focus:outline-none disabled:opacity-50 disabled:hover:scale-100 transition-all"
             >
               {isGenerating ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin text-white" />
                   Generating...
                 </>
               ) : (
                 <>
                   <Disc3 className="w-4 h-4 text-purple-400 animate-spin-slow" />
                   Generate Audio
                 </>
               )}
             </button>
          </div>
        </div>
        
        {/* Mobile Generate Button */}
        <div className="md:hidden mt-4 w-full pointer-events-none">
           <button 
             onClick={handleGenerate}
             disabled={isGenerating || charCount === 0}
             className="pointer-events-auto w-full flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-4 rounded-2xl text-[15px] font-bold shadow-lg hover:bg-neutral-800 transition-all"
           >
             {isGenerating ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
                 Generating...
               </>
             ) : (
               <>
                 <Disc3 className="w-5 h-5 text-purple-400" />
                 Generate Audio
               </>
             )}
           </button>
        </div>
      </div>

      {/* Status / Output Area */}
      <div className="min-h-[100px] flex flex-col justify-end pb-8">
         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-6 py-4 rounded-2xl text-sm backdrop-blur-md shadow-md">
              {error}
            </div>
         )}

         {isGenerating && (
           <div className="bg-white/95 border border-purple-200 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
             <div className="flex justify-between text-xs font-bold text-purple-900 mb-3">
               <span>Processing audio synthesis</span>
               <span>{progress}%</span>
             </div>
             <div className="h-2 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
               <div 
                 className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)]" 
                 style={{ width: `${progress}%` }}
               />
             </div>
             <p className="text-xs font-semibold text-purple-700 mt-4 text-center tracking-wide">
                {statusText || 'Synthesizing ultra-realistic voice audio...'}
             </p>
           </div>
         )}

          {finalAudioUrl && !isGenerating && !error && (
           <div className="bg-white/95 border border-emerald-200 p-4 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
              <audio ref={audioRef} controls src={finalAudioUrl} className="w-full sm:flex-1 h-12 outline-none rounded-xl" />
              <a 
                href={finalAudioUrl} 
                download={generateFilename()}
                className="flex w-full sm:w-auto justify-center items-center gap-2 px-7 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Save Audio
              </a>
           </div>
         )}
      </div>

    </motion.div>
  );
}
