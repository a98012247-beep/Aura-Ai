import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sliders, Copy, Clapperboard, Play, Disc3, Loader2, Mic, UploadCloud, X, Zap } from 'lucide-react';
import { useSettingsStore, StorytellingMode, PRESET_PROFILES } from '../store/settings';
import { generateAudioChunk, fetchVoices, verifyVoiceAccess, cloneVoice, getAuthHeader } from '../services/elevenlabs';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { 
    apiKeys, addApiKey, removeApiKey, setActiveApiKey, 
    voiceSettings, updateVoiceSettings,
    cinematicSettings, updateCinematicSettings,
    activeProfileId, voiceProfiles, saveVoiceProfile, deleteVoiceProfile, applyVoiceProfile, resetToDefaultProfile, getActiveKey, updateApiKeyVoice, updateApiKeyResetDate
  } = useSettingsStore();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyProvider] = useState<'cartesia'>('cartesia');
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const [previewError, setPreviewError] = useState<string|null>(null);

  const [editingResetDaysId, setEditingResetDaysId] = useState<string | null>(null);
  const [tempResetDays, setTempResetDays] = useState<string>('');

  const [voicesMap, setVoicesMap] = useState<Record<string, any[]>>({});
  const [loadingVoicesMap, setLoadingVoicesMap] = useState<Record<string, boolean>>({});

  const [creditsMap, setCreditsMap] = useState<Record<string, {used: number, total: number, tier: string} | null>>({});

  const getRemainingDays = (resetDateMs?: number) => {
     if (!resetDateMs) return 30;
     let remainingMs = resetDateMs - Date.now();
     while (remainingMs < 0) {
        remainingMs += 30 * 24 * 60 * 60 * 1000;
     }
     return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  };
  const [loadingCreditsMap, setLoadingCreditsMap] = useState<Record<string, boolean>>({});

  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetKey, setCloneTargetKey] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [cloneSuccess, setCloneSuccess] = useState('');

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneTargetKey || !cloneName || cloneFiles.length === 0) return;
    
    setIsCloning(true);
    setCloneError('');
    setCloneSuccess('');
    
    try {
      const activeKeyObj = apiKeys.find(k => k.id === cloneTargetKey);
      if (!activeKeyObj) throw new Error("API Key not found");
      
      const newVoiceId = await cloneVoice(activeKeyObj.key, cloneName, cloneDesc, cloneFiles);
      setCloneSuccess(`Voice cloned successfully! ID: ${newVoiceId}`);
      
      // Auto refresh voices
      await handleFetchVoices(cloneTargetKey, activeKeyObj.key);
      
      setTimeout(() => {
        setShowCloneModal(false);
        setCloneName('');
        setCloneDesc('');
        setCloneFiles([]);
        setCloneSuccess('');
      }, 2000);
    } catch (err: any) {
      setCloneError(err.message || 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  };

  const handleFetchVoices = async (keyId: string, apiKey: string) => {
    setLoadingVoicesMap(prev => ({ ...prev, [keyId]: true }));
    try {
      const authHeaders = await getAuthHeader();
      const response = await fetch(`/api/cartesia/voices?apiKey=${encodeURIComponent(apiKey)}`, {
        headers: {
          ...authHeaders
        }
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const voices = (data || []).map((v: any) => ({ voice_id: v.id, name: v.name }));
      setVoicesMap(prev => ({ ...prev, [keyId]: voices }));
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to fetch voices. Please check the Cartesia API key.');
    } finally {
      setLoadingVoicesMap(prev => ({ ...prev, [keyId]: false }));
    }
  };

  const handleFetchCredits = async (keyId: string, apiKey: string) => {
    setLoadingCreditsMap(prev => ({...prev, [keyId]: true}));
    try {
      const { fetchSubscription } = await import('../services/elevenlabs');
      const data = await fetchSubscription(apiKey);
      setCreditsMap(prev => ({
        ...prev, 
        [keyId]: {
          used: data.character_count || 0,
          total: data.character_limit || 0,
          tier: data.tier || 'Cartesia API'
        }
      }));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingCreditsMap(prev => ({...prev, [keyId]: false}));
    }
  };

  useEffect(() => {
    apiKeys.forEach(k => {
      if (k.isValid) {
        if (!creditsMap[k.id] && !loadingCreditsMap[k.id]) {
          handleFetchCredits(k.id, k.key);
        }
      }
    });
  }, [apiKeys]);

  const handlePreviewVoice = async () => {
    if (!isPro) {
      setShowSubscription(true);
      return;
    }

    const key = getActiveKey();
    if (!key) {
       setPreviewError('No valid key available to generate preview.');
       return;
    }
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const hasVoice = await verifyVoiceAccess(key);
      if (!hasVoice) {
         throw new Error('The currently mapped voice ID is not available in this account.');
      }
      
      const script = "Donald Trump became one of the most recognized people on Earth. But long before politics... there was only ambition.";
      const buffer = await generateAudioChunk(script, key);
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      if (err.message && (err.message.includes('PRO_REQUIRED') || err.message.toLowerCase().includes('pro subscription'))) {
        setShowSubscription(true);
      } else {
        setPreviewError(err.message || 'Failed to generate preview audio.');
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyName.trim() && newKeyValue.trim()) {
      addApiKey(newKeyName.trim(), newKeyValue.trim(), newKeyProvider);
      setNewKeyName('');
      setNewKeyValue('');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    // Could add toast here but keeping it simple
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 md:px-6 py-6"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">Studio <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">Settings</span></h2>
            <p className="text-neutral-500 font-medium text-xs mt-1">
              Configure your voice profiles, cinematic settings, and account preferences for high-quality audio generation.
            </p>
          </div>
        </div>

        <div className="space-y-8 pb-12">

        {/* API Settings Toggle Control (Pro Only) */}
        {isPro && (
          <>
            <div className="bg-white/80 border border-neutral-200/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] rounded-3xl p-4 flex items-center justify-between transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_2px_8px_rgba(168,85,247,0.1)]">
                  <Key className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 drop-shadow-sm">API Settings</h3>
                  <p className="text-xs text-neutral-500 font-medium">Add and manage custom voice API profiles</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="px-5 py-2.5 rounded-xl text-xs font-black transition-all bg-white border border-neutral-200/80 text-neutral-700 hover:text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-inner"
              >
                Hide / Show
              </button>
            </div>

            {showApiSettings && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Add New Configuration */}
                <div className="bg-white/70 border border-white/60 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-neutral-900 drop-shadow-sm relative z-10">
                    <Plus className="w-6 h-6 text-purple-600 drop-shadow-sm" />
                    Add Profile
                  </h3>
                  
                  <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 relative z-10">
                     <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-purple-900 rounded-2xl px-5 py-3.5 text-sm font-black flex items-center justify-center shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_2px_8px_rgba(168,85,247,0.1)]">
                       Awavox AI
                     </div>
                     <input 
                       type="text" 
                       placeholder="Profile Name (e.g. Pro Key)"
                       value={newKeyName}
                       onChange={e => setNewKeyName(e.target.value)}
                       className="flex-1 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all placeholder:text-neutral-400 text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)]"
                       required
                     />
                     <input 
                       type="password" 
                       placeholder="Access Key..."
                       value={newKeyValue}
                       onChange={e => setNewKeyValue(e.target.value)}
                       className="flex-[2] bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all placeholder:text-neutral-400 placeholder:font-mono text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)]"
                       required
                     />
                     <button 
                       type="submit"
                       className="bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] shrink-0 whitespace-nowrap sm:w-auto w-full"
                     >
                       Save Profile
                     </button>
                  </form>
                </div>

                {/* Saved Configurations List */}
                <div className="space-y-5">
                  <h3 className="text-xl font-black flex items-center gap-2 text-neutral-900 drop-shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-purple-600 drop-shadow-sm" />
                    Active Configurations
                  </h3>

                  {apiKeys.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-neutral-200/80 bg-white/50 backdrop-blur-sm rounded-[2rem] text-neutral-500 font-bold text-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                       No API configurations found.
                    </div>
                  ) : (
                     <div className="grid gap-5">
                       {apiKeys.map(key => (
                         <div 
                           key={key.id} 
                           className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 p-5 sm:p-6 rounded-[2rem] border transition-all duration-300 backdrop-blur-2xl ${
                             key.isActive 
                               ? 'bg-white/90 border-purple-300 shadow-[0_8px_24px_rgba(168,85,247,0.15),inset_0_2px_4px_rgba(255,255,255,1)] ring-4 ring-purple-100/50 -translate-y-1' 
                               : 'bg-white/60 border-neutral-200/80 hover:bg-white/80 hover:border-neutral-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)]'
                           }`}
                         >
                           <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto overflow-hidden">
                             <button
                               onClick={() => setActiveApiKey(key.id)}
                               title="Set Active"
                               className={`w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 sm:mt-0 ${
                                 key.isActive 
                                   ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                                   : 'border-neutral-300 hover:border-neutral-400 bg-white shadow-inner'
                               }`}
                             >
                               {key.isActive && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />}
                             </button>
                             
                             <div className="min-w-0 flex-1">
                               <div className="flex flex-wrap items-center gap-2">
                                 <span className="font-black text-sm sm:text-base text-neutral-900 drop-shadow-sm">{key.name}</span>
                                 <span className="text-[10px] uppercase tracking-widest bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800 px-2.5 py-1 rounded-xl font-black border border-purple-200 shadow-sm">
                                   API Profile
                                 </span>
                                 {key.isActive ? (
                                   <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl font-black shadow-sm">
                                     Active
                                   </span>
                                 ) : (
                                   <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-white/60 text-neutral-500 border border-neutral-200/80 px-2.5 py-1 rounded-xl font-black shadow-sm">
                                     Inactive
                                   </span>
                                 )}
                                 {!key.isValid && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl font-black shadow-sm">
                                       <AlertCircle className="w-3 h-3" /> Failed
                                    </span>
                                 )}
                                 <div className="text-[10px] bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 px-3 py-1 rounded-xl font-black flex items-center gap-1.5 border border-amber-200 shadow-sm">
                                   <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                   {editingResetDaysId === key.id ? (
                                     <form onSubmit={(e) => {
                                       e.preventDefault();
                                       const days = parseInt(tempResetDays, 10);
                                       if (!isNaN(days) && days > 0) {
                                          updateApiKeyResetDate(key.id, Date.now() + days * 24 * 60 * 60 * 1000);
                                       }
                                       setEditingResetDaysId(null);
                                     }} className="flex items-center gap-1">
                                       <input 
                                         type="number" min="1" max="99"
                                         value={tempResetDays}
                                         onChange={e => setTempResetDays(e.target.value)}
                                         className="bg-white border border-amber-300 rounded px-1.5 w-12 text-center outline-none text-neutral-900 font-bold focus:ring-2 focus:ring-amber-200"
                                         autoFocus
                                         onBlur={() => setEditingResetDaysId(null)}
                                         title="Warning: Modifying this will change when credits are expected to reset."
                                       />
                                       <span>days</span>
                                     </form>
                                   ) : (
                                     <span 
                                       onClick={() => {
                                         setTempResetDays(getRemainingDays(key.resetDate).toString());
                                         setEditingResetDaysId(key.id);
                                       }}
                                       className="cursor-pointer hover:text-amber-900 transition-colors border-b border-dashed border-amber-400"
                                       title="Click to edit remaining days"
                                     >
                                       {getRemainingDays(key.resetDate)} days left
                                     </span>
                                   )}
                                 </div>
                               </div>
                               <div className="text-[11px] sm:text-xs text-neutral-500 font-mono mt-1.5 w-full truncate font-bold">
                                 ••••••••{key.key.slice(-6)}
                               </div>
                               {/* Voice Selection */}
                               <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-2 w-full">
                                 <Mic className="w-4 h-4 text-purple-600 drop-shadow-sm" />
                                 {voicesMap[key.id] ? (
                                   <select 
                                     className="bg-white/80 backdrop-blur-sm text-neutral-800 text-xs px-4 py-2 rounded-xl border border-neutral-200/80 w-full sm:w-auto max-w-[200px] sm:max-w-xs focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 font-bold shadow-[inset_0_1px_4px_rgba(0,0,0,0.02),0_2px_4px_rgba(255,255,255,1)]"
                                     value={key.voiceId || '92579402-6868-412e-b845-3efed0be7a9e'}
                                     onChange={(e) => {
                                       const v = voicesMap[key.id].find(v => v.voice_id === e.target.value);
                                       updateApiKeyVoice(key.id, e.target.value, v ? v.name : 'Awavox Voice');
                                     }}
                                   >
                                     <option value="92579402-6868-412e-b845-3efed0be7a9e">Jade - Steady Companion</option>
                                     <optgroup label="Available Voices">
                                       {voicesMap[key.id].map(v => (
                                         <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.voice_id})</option>
                                       ))}
                                     </optgroup>
                                   </select>
                                 ) : (
                                   <div className="flex items-center gap-3">
                                     <span className="text-xs text-neutral-700 font-black bg-neutral-100/50 px-3 py-1.5 rounded-xl border border-neutral-200/50">{key.voiceName || 'Jade - Steady Companion'}</span>
                                     <button
                                       onClick={() => handleFetchVoices(key.id, key.key)}
                                       disabled={loadingVoicesMap[key.id]}
                                       className="text-[10px] text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-xl transition-all border border-neutral-200/80 font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                     >
                                       {loadingVoicesMap[key.id] ? 'Loading...' : 'Select Voice'}
                                     </button>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>

                            <div className="flex items-center justify-end sm:justify-start gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => handleCopy(key.key)}
                                className="p-3 text-neutral-500 hover:text-neutral-900 transition-all rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                                title="Copy Key"
                              >
                                <Copy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              </button>
                              <button 
                                onClick={() => removeApiKey(key.id)}
                                className="p-3 text-rose-500 hover:text-rose-700 transition-all rounded-xl bg-white hover:bg-rose-50 border border-neutral-200/80 hover:border-rose-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                                title="Remove Key"
                              >
                                <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              </button>
                            </div>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}



        {/* Combined Voice & Cinematic Profiles */}
        <div className="space-y-5 pt-8 border-t border-neutral-200/60 mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-black flex items-center gap-2 text-neutral-900 drop-shadow-sm">
              <Clapperboard className="w-6 h-6 text-purple-600 drop-shadow-sm" />
              Voice Profile & Settings
            </h3>
            
            <div className="flex items-center gap-2.5 snap-x overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
               <button 
                 onClick={() => {
                   const name = prompt('Name your custom Voice Profile:');
                   if (name) saveVoiceProfile(name);
                 }}
                 className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-xs font-black text-white transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-inner shrink-0"
               >
                 Save Current
               </button>
               <button 
                 onClick={resetToDefaultProfile}
                 className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white text-xs font-black text-neutral-700 hover:text-neutral-900 transition-all border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] shrink-0"
               >
                 <RefreshCw className="w-3.5 h-3.5" />
                 Reset Def.
               </button>
            </div>
          </div>
          
          <div className="bg-white/70 border border-white/60 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] rounded-[2rem] p-6 md:p-8 space-y-10 relative overflow-hidden">
            <div className="relative z-10">
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest block mb-2.5">Active Voice Preset / Profile</label>
              <div className="flex items-center gap-3">
                <select
                  value={activeProfileId || 'custom'}
                  onChange={(e) => applyVoiceProfile(e.target.value)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm text-neutral-900 font-bold focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,1)]"
                >
                  <option value="custom" disabled className="text-neutral-500">Custom Settings (Unsaved)</option>
                  <optgroup label="Cinematic Presets">
                    {PRESET_PROFILES.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  {voiceProfiles.length > 0 && (
                    <optgroup label="Your Saved Profiles">
                      {voiceProfiles.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {activeProfileId && voiceProfiles.find(p => p.id === activeProfileId) && (
                   <button 
                     onClick={() => deleteVoiceProfile(activeProfileId)}
                     className="p-3.5 text-rose-500 hover:text-rose-700 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl transition-all hover:bg-rose-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.1)] hover:border-rose-200 shrink-0"
                     title="Delete Custom Profile"
      {/* Voice Cloning Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-3xl border border-white rounded-[2rem] w-full max-w-md p-8 relative shadow-[0_32px_64px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,1)]">
            <button 
              onClick={() => setShowCloneModal(false)}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-neutral-900 drop-shadow-sm">
              <UploadCloud className="w-6 h-6 text-purple-600 drop-shadow-sm" /> Clone Voice
            </h3>
            
            <form onSubmit={handleCloneSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Voice Name</label>
                <input 
                  type="text" 
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,1)]"
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Description (Optional)</label>
                <textarea 
                  value={cloneDesc}
                  onChange={e => setCloneDesc(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm h-28 resize-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,1)]"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Audio Samples (Max 10MB)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/mp4"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 25) {
                      setCloneError("Max 25 files allowed");
                    } else {
                      setCloneFiles(files);
                      setCloneError("");
                    }
                  }}
                  className="w-full text-sm text-neutral-500 font-medium file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-all cursor-pointer file:shadow-sm"
                  required
                />
              </div>
              
              {cloneError && <p className="text-xs text-rose-700 mt-2 bg-rose-50/80 backdrop-blur-sm p-4 rounded-xl border border-rose-200 font-bold shadow-sm">{cloneError}</p>}
              {cloneSuccess && <p className="text-xs text-emerald-700 mt-2 bg-emerald-50/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 font-bold shadow-sm">{cloneSuccess}</p>}
              
              <button 
                type="submit"
                disabled={isCloning || cloneFiles.length === 0}
                className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 text-white py-4 rounded-2xl text-sm font-black transition-all mt-8 disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isCloning ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 drop-shadow-sm" />}
                {isCloning ? 'Cloning...' : 'Clone Voice'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </motion.div>
  );
}
